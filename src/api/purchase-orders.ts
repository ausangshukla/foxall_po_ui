import { API_ROUTES } from '../config'
import { api, apiRequest } from './client'
import type {
  PurchaseOrderResponse,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderSearchRequest,
  PurchaseOrderSearchMeta,
} from '../types/api'

export async function listPurchaseOrders(): Promise<PurchaseOrderResponse[]> {
  return api.get<PurchaseOrderResponse[]>(API_ROUTES.PURCHASE_ORDERS)
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
  return api.get<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDER(id))
}

export async function createPurchaseOrder(
  data: CreatePurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  return api.post<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDERS, { purchase_order: data })
}

export async function updatePurchaseOrder(
  id: number,
  data: UpdatePurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  return api.put<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDER(id), { purchase_order: data })
}

export async function deletePurchaseOrder(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.PURCHASE_ORDER(id))
}

export async function searchPurchaseOrders(
  params: PurchaseOrderSearchRequest
): Promise<{ data: PurchaseOrderResponse[]; meta: PurchaseOrderSearchMeta }> {
  const result = await apiRequest<PurchaseOrderResponse[], PurchaseOrderSearchMeta>(
    `${API_ROUTES.PURCHASE_ORDERS}/search`,
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    true
  )
  return result as { data: PurchaseOrderResponse[]; meta: PurchaseOrderSearchMeta }
}
