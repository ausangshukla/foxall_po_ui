import { API_ROUTES } from '../config'
import { api } from './client'
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
  return api.post<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDERS, data)
}

export async function updatePurchaseOrder(
  id: number,
  data: UpdatePurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  return api.put<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDER(id), data)
}

export async function deletePurchaseOrder(id: number): Promise<string> {
  return api.delete<string>(API_ROUTES.PURCHASE_ORDER(id))
}

export async function searchPurchaseOrders(
  params: PurchaseOrderSearchRequest
): Promise<{ data: PurchaseOrderResponse[]; meta: PurchaseOrderSearchMeta }> {
  return api.post<{ data: PurchaseOrderResponse[]; meta: PurchaseOrderSearchMeta }>(
    `${API_ROUTES.PURCHASE_ORDERS}/search`,
    params
  )
}
