import { API_ROUTES } from '../config'
import { api } from './client'
import type {
  PurchaseOrderLineItemResponse,
  CreatePurchaseOrderLineItemRequest,
  UpdatePurchaseOrderLineItemRequest,
} from '../types/api'

export async function listPurchaseOrderLineItems(
  poId: number
): Promise<PurchaseOrderLineItemResponse[]> {
  return api.get<PurchaseOrderLineItemResponse[]>(
    API_ROUTES.PURCHASE_ORDER_LINE_ITEMS(poId)
  )
}

export async function createPurchaseOrderLineItem(
  poId: number,
  data: CreatePurchaseOrderLineItemRequest
): Promise<PurchaseOrderLineItemResponse> {
  const body = { purchase_order_line_item: { ...data, purchase_order_id: poId } }
  return api.post<PurchaseOrderLineItemResponse>(
    API_ROUTES.PURCHASE_ORDER_LINE_ITEMS(poId),
    body
  )
}

export async function updatePurchaseOrderLineItem(
  poId: number,
  id: number,
  data: UpdatePurchaseOrderLineItemRequest
): Promise<PurchaseOrderLineItemResponse> {
  const body = { purchase_order_line_item: data }
  return api.put<PurchaseOrderLineItemResponse>(
    API_ROUTES.PURCHASE_ORDER_LINE_ITEM(poId, id),
    body
  )
}

export async function deletePurchaseOrderLineItem(
  poId: number,
  id: number
): Promise<void> {
  return api.delete<void>(API_ROUTES.PURCHASE_ORDER_LINE_ITEM(poId, id))
}
