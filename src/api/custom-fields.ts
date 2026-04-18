import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  CustomFieldDefinition,
  CustomFieldDefinitionCreateRequest,
  CustomFieldDefinitionUpdateRequest,
} from '../types/api'

export async function listCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  return api.get<CustomFieldDefinition[]>(API_ROUTES.CUSTOM_FIELD_DEFINITIONS)
}

export async function getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition> {
  return api.get<CustomFieldDefinition>(API_ROUTES.CUSTOM_FIELD_DEFINITION(id))
}

export async function createCustomFieldDefinition(
  data: CustomFieldDefinitionCreateRequest
): Promise<CustomFieldDefinition> {
  return api.post<CustomFieldDefinition>(API_ROUTES.CUSTOM_FIELD_DEFINITIONS, {
    custom_field_definition: data,
  })
}

export async function updateCustomFieldDefinition(
  id: number,
  data: CustomFieldDefinitionUpdateRequest
): Promise<CustomFieldDefinition> {
  return api.put<CustomFieldDefinition>(API_ROUTES.CUSTOM_FIELD_DEFINITION(id), {
    custom_field_definition: data,
  })
}

export async function deleteCustomFieldDefinition(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.CUSTOM_FIELD_DEFINITION(id))
}

export async function getCustomFieldDefinitions(
  resourceName: string,
  tag?: string
): Promise<CustomFieldDefinition[]> {
  const url = tag
    ? `${API_ROUTES.CUSTOM_FIELD_DEFINITIONS}?resource_name=${resourceName}&tag=${tag}`
    : `${API_ROUTES.CUSTOM_FIELD_DEFINITIONS}?resource_name=${resourceName}`
  return api.get<CustomFieldDefinition[]>(url)
}

export async function exportCustomFieldDefinitions(): Promise<void> {
  return api.download(API_ROUTES.CUSTOM_FIELD_DEFINITIONS_EXPORT)
}
