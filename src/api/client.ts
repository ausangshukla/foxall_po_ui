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
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

  // Parse the response body
  let body: ApiResponse<T>
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

  // Handle error responses
  if (body.error) {
    const { code, message } = body.error

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
  if (body.data === null) {
    throw new ApiError('NULL_DATA', 'Response data is null')
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
}

export { storage }
