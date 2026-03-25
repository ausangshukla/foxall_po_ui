import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  NotificationRuleResponse,
  NotificationRuleCreateRequest,
  NotificationRuleUpdateRequest,
} from '../types/api'

export async function listNotificationRules(): Promise<NotificationRuleResponse[]> {
  return api.get<NotificationRuleResponse[]>(API_ROUTES.NOTIFICATION_RULES)
}

export async function getNotificationRule(id: number): Promise<NotificationRuleResponse> {
  return api.get<NotificationRuleResponse>(API_ROUTES.NOTIFICATION_RULE(id))
}

export async function createNotificationRule(
  data: NotificationRuleCreateRequest
): Promise<NotificationRuleResponse> {
  return api.post<NotificationRuleResponse>(API_ROUTES.NOTIFICATION_RULES, { notification_rule: data })
}

export async function updateNotificationRule(
  id: number,
  data: NotificationRuleUpdateRequest
): Promise<NotificationRuleResponse> {
  return api.put<NotificationRuleResponse>(API_ROUTES.NOTIFICATION_RULE(id), { notification_rule: data })
}

export async function deleteNotificationRule(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.NOTIFICATION_RULE(id))
}
