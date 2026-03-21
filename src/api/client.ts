import { API_BASE_URL } from '../config'
import type { ApiResponse } from '../types/api'
import {
  ApiError,
  AuthError,
  ForbiddenError,
  LoginError,
  ValidationError,
} from '../types/api'
import { storage } from '../lib/storage'
import { isTokenExpired } from '../lib/jwt'

// Custom error for auth events
export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required')
    this.name = 'AuthRequiredError'
  }
}

// Event emitter for auth events
type AuthEventListener = () => void
const authListeners: AuthEventListener[] = []

export function onAuthRequired(listener: AuthEventListener): () => void {
  authListeners.push(listener)
  return () => {
    const index = authListeners.indexOf(listener)
    if (index > -1) {
      authListeners.splice(index, 1)
    }
  }
}

function notifyAuthRequired(): void {
  authListeners.forEach(listener => listener())
}

// ============================================
// Base API Request Function
// ============================================
export async function apiRequest<T, M = unknown>(
  endpoint: string,
  options?: RequestInit,
  returnFull?: false
): Promise<T>;
export async function apiRequest<T, M = unknown>(
  endpoint: string,
  options: RequestInit,
  returnFull: true
): Promise<ApiResponse<T, M>>;
export async function apiRequest<T, M = unknown>(
  endpoint: string,
  options: RequestInit = {},
  returnFull: boolean = false
): Promise<T | ApiResponse<T, M>> {
  const url = `${API_BASE_URL}${endpoint}`

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  // Add auth token if available
  const token = storage.getToken()
  if (token) {
    // Check if token is expired before making request
    if (isTokenExpired(token)) {
      storage.clearAuth()
      notifyAuthRequired()
      throw new AuthError('Session expired')
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Capture Authorization header (for devise-jwt login)
  const authHeader = response.headers.get('Authorization')
  let tokenFromHeader: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenFromHeader = authHeader.substring(7)
  }

  // Parse the response body
  let body: ApiResponse<T, M>
  try {
    body = await response.json()
  } catch {
    // Handle non-JSON responses (e.g., HTML error pages from the server)
    if (response.status === 401) {
      if (token) {
        storage.clearAuth()
        notifyAuthRequired()
      }
      throw new AuthError('Session expired or invalid')
    }
    throw new ApiError('PARSE_ERROR', `Failed to parse server response (HTTP ${response.status})`)
  }

  // If token is in header, inject it into data for login responses
  if (tokenFromHeader && body.data) {
    // @ts-ignore
    body.data.token = tokenFromHeader
    // Also if it's a login response from devise, we might need to map user.id to user_id
    // Check for id even if it's null (it should be set if available)
    // We'll trust the server that it's a login response
    if (Object.prototype.hasOwnProperty.call(body.data, 'id') && !Object.prototype.hasOwnProperty.call(body.data, 'user_id')) {
      // @ts-ignore
      body.data.user_id = body.data.id
    }
  }

  // Handle error responses
  const hasError = !response.ok || body.error || (body as any).errors || (body.status && body.status.code >= 400)
  if (hasError) {
    let code = 'UNKNOWN_ERROR'
    let message = 'An unexpected error occurred'
    const errorBody = body.error || (body as any).errors || body.status

    // Prioritize HTTP status code for determining error type
    if (response.status === 401) code = 'UNAUTHORIZED'
    else if (response.status === 403) code = 'FORBIDDEN'
    else if (response.status === 404) code = 'NOT_FOUND'
    else if (response.status === 422) code = 'VALIDATION_ERROR'

    if (typeof errorBody === 'string') {
      message = errorBody
    } else if (errorBody && typeof errorBody === 'object') {
      // If it's a Rails-style errors object (e.g., { email: ["is invalid"] })
      if (!(errorBody as any).code && !(errorBody as any).message) {
        code = 'VALIDATION_ERROR'
        message = Object.entries(errorBody)
          .map(([field, msgs]) => `${field} ${(msgs as string[]).join(', ')}`)
          .join('; ')
      } else {
        // Only use the body's code if it's actually an error code
        const bodyCode = (errorBody as any).code?.toString()
        if (bodyCode && bodyCode !== '200' && bodyCode !== '0') {
          code = bodyCode
        }
        
        // If the body has a message, use it unless it's misleading (like "Logged in successfully" on a 422)
        const bodyMessage = (errorBody as any).message
        if (bodyMessage && !(response.status === 422 && bodyMessage.includes('successfully'))) {
          message = bodyMessage
        } else if (response.status === 422) {
          message = 'Invalid credentials or validation error'
        }
      }
    } else if (response.status === 422) {
      message = 'Unprocessable Content'
    }

    // Map certain endpoints to specific error types
    if (endpoint.includes('/login') && (code === 'VALIDATION_ERROR' || response.status === 422)) {
      code = 'LOGIN_FAILED'
      message = 'Invalid email or password'
    }

    switch (code) {
      case 'UNAUTHORIZED':
        // Token expired or invalid
        if (token) {
          storage.clearAuth()
          notifyAuthRequired()
        }
        throw new AuthError(message)

      case 'FORBIDDEN':
        throw new ForbiddenError(message)

      case 'LOGIN_FAILED':
        throw new LoginError(message)

      case 'VALIDATION_ERROR':
        throw new ValidationError(message)

      case 'NOT_FOUND':
        throw new ApiError(code, message)

      default:
        throw new ApiError(code, message)
    }
  }

  // Return the data
  if (body.data === null && !returnFull) {
    throw new ApiError('NULL_DATA', 'Response data is null')
  }

  if (returnFull) {
    return body as ApiResponse<T, M>
  }

  return body.data as T
}

// ============================================
// Convenience Methods
// ============================================
export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),

  // For when you need the whole envelope (like for pagination meta)
  requestFull: <T, M = any>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T, M>(endpoint, options, true),
}

export { storage }
