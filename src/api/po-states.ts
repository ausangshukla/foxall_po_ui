import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  PoStateResponse,
  PoStateCreateRequest,
  PoStateUpdateRequest,
} from '../types/api'

export async function listPoStates(): Promise<PoStateResponse[]> {
  return api.get<PoStateResponse[]>(API_ROUTES.PO_STATES)
}

export async function getPoState(id: number): Promise<PoStateResponse> {
  return api.get<PoStateResponse>(API_ROUTES.PO_STATE(id))
}

export async function createPoState(
  data: PoStateCreateRequest
): Promise<PoStateResponse> {
  return api.post<PoStateResponse>(API_ROUTES.PO_STATES, { po_state: data })
}

export async function updatePoState(
  id: number,
  data: PoStateUpdateRequest
): Promise<PoStateResponse> {
  return api.put<PoStateResponse>(API_ROUTES.PO_STATE(id), { po_state: data })
}

export async function deletePoState(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.PO_STATE(id))
}

export async function exportPoStates(): Promise<void> {
  return api.download(API_ROUTES.PO_STATES_EXPORT)
}
