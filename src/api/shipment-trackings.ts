import { api } from './client'
import type { ShipmentTracking, DelayAlert } from '../types/api'

export const shipmentTrackingsApi = {
  getByPo: async (poId: number) => {
    return api.get<ShipmentTracking>(`/api/v1/purchase_orders/${poId}/shipment_tracking`)
  },

  acknowledgeAlert: async (poId: number, alertId: number) => {
    return api.post<DelayAlert>(
      `/api/v1/purchase_orders/${poId}/shipment_tracking/delay_alerts/${alertId}/acknowledge`,
      {}
    )
  },

  getAllAlerts: async () => {
    return api.get<DelayAlert[]>('/api/v1/shipment_trackings/alerts')
  }
}
