import { API_ROUTES } from '../config'
import { api } from './client'
import type { LoginRequest, LoginResponse, UserResponse } from '../types/api'
import { LoginError } from '../types/api'
import { storage } from '../lib/storage'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const result = await api.post<LoginResponse>(API_ROUTES.LOGIN, { user: credentials })

  // Store auth data on successful login
  if (result.token) {
    storage.setToken(result.token)
    // If id is null, we can't really call /users/:id later, so we just set it as null
    storage.setUserId(result.id || result.user_id || null)
  } else {
    // If we get here but have no token, the login actually failed
    // even if the response body claimed success
    throw new LoginError('Login failed: no authentication token received')
  }

  return result
}

export async function getCurrentUser(): Promise<UserResponse | null> {
  const userId = storage.getUserId()
  if (!userId) return null

  try {
    return await api.get<UserResponse>(API_ROUTES.USER(userId))
  } catch {
    return null
  }
}

export function logout(): void {
  storage.clearAuth()
}

export function isAuthenticated(): boolean {
  return !!storage.getToken()
}

export function getAuthUserId(): number | null {
  return storage.getUserId()
}
