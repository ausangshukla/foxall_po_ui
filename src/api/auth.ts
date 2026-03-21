import { API_ROUTES } from '../config'
import { api } from './client'
import type { LoginRequest, LoginResponse, UserResponse } from '../types/api'
import { storage } from '../lib/storage'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const result = await api.post<LoginResponse>(API_ROUTES.LOGIN, credentials)

  // Store auth data on successful login
  if (result.token) {
    storage.setToken(result.token)
    storage.setUserId(result.user_id)
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
