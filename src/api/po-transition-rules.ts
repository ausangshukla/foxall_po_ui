import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  PoTransitionRuleResponse,
  PoTransitionRuleCreateRequest,
  PoTransitionRuleUpdateRequest,
} from '../types/api'

export async function listPoTransitionRules(): Promise<PoTransitionRuleResponse[]> {
  return api.get<PoTransitionRuleResponse[]>(API_ROUTES.PO_TRANSITION_RULES)
}

export async function getPoTransitionRule(id: number): Promise<PoTransitionRuleResponse> {
  return api.get<PoTransitionRuleResponse>(API_ROUTES.PO_TRANSITION_RULE(id))
}

export async function createPoTransitionRule(
  data: PoTransitionRuleCreateRequest
): Promise<PoTransitionRuleResponse> {
  return api.post<PoTransitionRuleResponse>(API_ROUTES.PO_TRANSITION_RULES, { po_transition_rule: data })
}

export async function updatePoTransitionRule(
  id: number,
  data: PoTransitionRuleUpdateRequest
): Promise<PoTransitionRuleResponse> {
  return api.put<PoTransitionRuleResponse>(API_ROUTES.PO_TRANSITION_RULE(id), { po_transition_rule: data })
}

export async function deletePoTransitionRule(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.PO_TRANSITION_RULE(id))
}
