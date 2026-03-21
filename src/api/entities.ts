import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  EntityResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
} from '../types/api'

export async function listEntities(): Promise<EntityResponse[]> {
  return api.get<EntityResponse[]>(API_ROUTES.ENTITIES)
}

export async function getEntity(id: number): Promise<EntityResponse> {
  return api.get<EntityResponse>(API_ROUTES.ENTITY(id))
}

export async function createEntity(
  data: EntityCreateRequest
): Promise<EntityResponse> {
  return api.post<EntityResponse>(API_ROUTES.ENTITIES, { entity: data })
}

export async function updateEntity(
  id: number,
  data: EntityUpdateRequest
): Promise<EntityResponse> {
  return api.put<EntityResponse>(API_ROUTES.ENTITY(id), { entity: data })
}

export async function deleteEntity(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.ENTITY(id))
}
