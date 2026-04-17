import { api } from './client'
import type { FreightBooking, FreightBookingRate } from '../types/api'

export interface BookingDraftResponse {
  booking: FreightBooking | null
  recommendation: {
    transport_mode: string
    container_type: string | null
    rationale: string
  }
  purchase_order: {
    id: number
    origin_city_port: string
    total_cbm: number
    total_gross_weight: number
  }
}

export const freightBookingsApi = {
  list: async (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : ''
    return api.get<FreightBooking[]>(`/api/v1/freight_bookings${query}`)
  },

  getDraft: async (poId: number) => {
    return api.get<BookingDraftResponse>(`/api/v1/purchase_orders/${poId}/booking_draft`)
  },

  getRates: async (poId: number, params: { transport_mode: string; container_type?: string; destination_port?: string }) => {
    return api.post<FreightBookingRate[]>(`/api/v1/purchase_orders/${poId}/booking_draft/rates`, params)
  },

  create: async (poId: number, data: Partial<FreightBooking>) => {
    return api.post<FreightBooking>(`/api/v1/purchase_orders/${poId}/freight_bookings`, {
      freight_booking: data
    })
  },

  get: async (poId: number, bookingId: number) => {
    return api.get<FreightBooking>(`/api/v1/purchase_orders/${poId}/freight_bookings/${bookingId}`)
  },

  update: async (poId: number, bookingId: number, data: Partial<FreightBooking>) => {
    return api.put<FreightBooking>(`/api/v1/purchase_orders/${poId}/freight_bookings/${bookingId}`, {
      freight_booking: data
    })
  },

  delete: async (poId: number, bookingId: number) => {
    await api.delete(`/api/v1/purchase_orders/${poId}/freight_bookings/${bookingId}`)
  }
}
