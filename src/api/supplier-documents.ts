/**
 * Supplier Documents API
 *
 * Public endpoints — no JWT Authorization header is sent.
 */
import { API_BASE_URL } from '../config'

export interface SupplierDocumentsDataResponse {
  purchase_order: {
    id: number
    po_number: string
    buyer_entity_name: string
    seller_entity_name: string
    current_state: string
    correction_notes?: string
  }
  action_key: string
  expires_at: string
}

export interface SupplierDocumentsSubmitRequest {
  token: string
  action_key: string
  comment?: string
  commercial_invoice?: File
  packing_list?: File
  dangerous_goods_declaration?: File
  certificate_of_origin?: File
  misc_shipment_documents?: File[]
}

export async function getSupplierDocumentsData(
  poId: number,
  token: string,
  actionKey: string
): Promise<SupplierDocumentsDataResponse> {
  const url = new URL(`${API_BASE_URL}/api/v1/public/supplier_documents/${poId}`)
  url.searchParams.set('token', token)
  url.searchParams.set('action_key', actionKey)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body?.error || 'Failed to load order details'
    throw new Error(message)
  }

  return body as SupplierDocumentsDataResponse
}

export async function submitSupplierDocuments(
  poId: number,
  payload: SupplierDocumentsSubmitRequest
): Promise<{ success: boolean; message: string; new_state: string }> {
  const formData = new FormData()
  formData.append('token', payload.token)
  formData.append('action_key', payload.action_key)
  if (payload.comment) formData.append('comment', payload.comment)
  
  if (payload.commercial_invoice) formData.append('commercial_invoice', payload.commercial_invoice)
  if (payload.packing_list) formData.append('packing_list', payload.packing_list)
  if (payload.dangerous_goods_declaration) formData.append('dangerous_goods_declaration', payload.dangerous_goods_declaration)
  if (payload.certificate_of_origin) formData.append('certificate_of_origin', payload.certificate_of_origin)
  
  if (payload.misc_shipment_documents) {
    payload.misc_shipment_documents.forEach((file) => {
      formData.append('misc_shipment_documents[]', file)
    })
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/public/supplier_documents/${poId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: formData,
  })

  const body = await response.json()

  if (!response.ok) {
    const message = body?.error || 'Submission failed'
    throw new Error(message)
  }

  return body
}
