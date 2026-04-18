import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  ExternalPartyResponse,
  ExternalPartyCreateRequest,
  ExternalPartyUpdateRequest,
} from '../types/api'

export async function listExternalParties(): Promise<ExternalPartyResponse[]> {
  return api.get<ExternalPartyResponse[]>(API_ROUTES.EXTERNAL_PARTIES)
}

export async function getExternalParty(id: number): Promise<ExternalPartyResponse> {
  return api.get<ExternalPartyResponse>(API_ROUTES.EXTERNAL_PARTY(id))
}

export async function createExternalParty(
  data: ExternalPartyCreateRequest
): Promise<ExternalPartyResponse> {
  return api.post<ExternalPartyResponse>(API_ROUTES.EXTERNAL_PARTIES, { external_party: data })
}

export async function updateExternalParty(
  id: number,
  data: ExternalPartyUpdateRequest
): Promise<ExternalPartyResponse> {
  return api.put<ExternalPartyResponse>(API_ROUTES.EXTERNAL_PARTY(id), { external_party: data })
}

export async function deleteExternalParty(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.EXTERNAL_PARTY(id))
}

export async function listExternalPartiesForPO(
  poId: number
): Promise<ExternalPartyResponse[]> {
  return api.get<ExternalPartyResponse[]>(API_ROUTES.EXTERNAL_PARTIES_FOR_PO(poId))
}

export async function exportExternalParties(): Promise<void> {
  return api.download(API_ROUTES.EXTERNAL_PARTIES_EXPORT)
}
