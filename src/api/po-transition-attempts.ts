import type { ApiResponse, PoTransitionAttemptResponse, PoTransitionAttemptSearchMeta } from '../types/api'
import { api } from './client'

export const poTransitionAttemptApi = {
  /**
   * Get transition attempts for a purchase order
   * @param purchaseOrderId Purchase Order ID
   * @param params Pagination and search params
   * @returns List of transition attempts
   */
  getByPurchaseOrder: async (
    purchaseOrderId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<ApiResponse<PoTransitionAttemptResponse[], PoTransitionAttemptSearchMeta>> => {
    const queryParams = new URLSearchParams()
    queryParams.append('purchase_order_id', purchaseOrderId.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())

    const response = await api.requestFull<PoTransitionAttemptResponse[], PoTransitionAttemptSearchMeta>(
      `/api/v1/po_transition_attempts?${queryParams.toString()}`
    )
    return response
  },

  /**
   * Get a single transition attempt
   * @param id Transition Attempt ID
   * @returns Transition attempt details
   */
  getById: async (id: number): Promise<PoTransitionAttemptResponse> => {
    const response = await api.get<PoTransitionAttemptResponse>(`/api/v1/po_transition_attempts/${id}`)
    return response
  },
}

export default poTransitionAttemptApi
