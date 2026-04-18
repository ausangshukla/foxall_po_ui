import { API_ROUTES } from '../config'
import { api, apiRequest } from './client'
import type {
  PurchaseOrderResponse,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderSearchRequest,
  PurchaseOrderSearchMeta,
  PurchaseOrderAvailableActionsResponse,
  PurchaseOrderTransitionRequest,
  PurchaseOrderTransitionResponse,
  PurchaseOrderTransitionAttemptsResponse,
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
  const body = data instanceof FormData ? data : { purchase_order: data }
  return api.post<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDERS, body)
}

export async function updatePurchaseOrder(
  id: number,
  data: UpdatePurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  // Use POST with _method=PATCH for multipart updates to avoid common server-side issues with PUT + Files
  if (data instanceof FormData) {
    if (!data.has('_method')) {
      data.append('_method', 'PATCH');
    }
    return api.post<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDER(id), data)
  }
  
  const body = { purchase_order: data }
  return api.put<PurchaseOrderResponse>(API_ROUTES.PURCHASE_ORDER(id), body)
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

export async function getPurchaseOrderAvailableActions(id: number): Promise<PurchaseOrderAvailableActionsResponse> {
  return api.get<PurchaseOrderAvailableActionsResponse>(API_ROUTES.PURCHASE_ORDER_AVAILABLE_ACTIONS(id))
}

export async function transitionPurchaseOrder(
  id: number,
  data: PurchaseOrderTransitionRequest
): Promise<PurchaseOrderTransitionResponse> {
  return api.post<PurchaseOrderTransitionResponse>(API_ROUTES.PURCHASE_ORDER_TRANSITION(id), data)
}

export async function getPurchaseOrderTransitionAttempts(id: number): Promise<PurchaseOrderTransitionAttemptsResponse> {
  return api.get<PurchaseOrderTransitionAttemptsResponse>(API_ROUTES.PURCHASE_ORDER_TRANSITION_ATTEMPTS(id))
}

export async function exportPurchaseOrders(params?: Record<string, any>): Promise<void> {
  let url = API_ROUTES.PURCHASE_ORDERS_EXPORT
  if (params) {
    const query = new URLSearchParams()
    
    const appendParam = (prefix: string, value: any) => {
      if (value === undefined || value === null || value === '') return

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          appendParam(`${prefix}[${index}]`, item)
        })
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([k, v]) => {
          appendParam(`${prefix}[${k}]`, v)
        })
      } else {
        query.append(prefix, value.toString())
      }
    }

    Object.entries(params).forEach(([key, value]) => {
      appendParam(key, value)
    })
    
    const queryString = query.toString()
    if (queryString) url += `?${queryString}`
  }
  return api.download(url)
}
