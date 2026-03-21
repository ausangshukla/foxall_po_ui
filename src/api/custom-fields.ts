import { API_ROUTES } from '../config'
import { api } from './client'
import type { CustomFieldDefinition } from '../types/api'

export async function getCustomFieldDefinitions(
  modelName: string
): Promise<CustomFieldDefinition[]> {
  return api.get<CustomFieldDefinition[]>(
    `${API_ROUTES.CUSTOM_FIELD_DEFINITIONS}?model_name=${modelName}`
  )
}
