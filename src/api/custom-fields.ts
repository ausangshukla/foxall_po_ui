import { API_ROUTES } from '../config'
import { api } from './client'
import type { CustomFieldDefinition } from '../types/api'

export async function getCustomFieldDefinitions(
  modelName: string,
  tag?: string
): Promise<CustomFieldDefinition[]> {
  const url = tag
    ? `${API_ROUTES.CUSTOM_FIELD_DEFINITIONS}?model_name=${modelName}&tag=${tag}`
    : `${API_ROUTES.CUSTOM_FIELD_DEFINITIONS}?model_name=${modelName}`
  return api.get<CustomFieldDefinition[]>(url)
}
