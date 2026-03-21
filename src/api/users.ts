import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types/api'

export async function listUsers(): Promise<UserResponse[]> {
  return api.get<UserResponse[]>(API_ROUTES.USERS)
}

export async function getUser(id: number): Promise<UserResponse> {
  return api.get<UserResponse>(API_ROUTES.USER(id))
}

export async function createUser(
  data: CreateUserRequest
): Promise<UserResponse> {
  return api.post<UserResponse>(API_ROUTES.USERS, { user: data })
}

export async function updateUser(
  id: number,
  data: UpdateUserRequest
): Promise<UserResponse> {
  return api.put<UserResponse>(API_ROUTES.USER(id), { user: data })
}

export async function deleteUser(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.USER(id))
}
