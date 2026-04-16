import { api } from './client'
import type { FreightContractRate } from '../types/api'

export const freightContractRatesApi = {
  list: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<FreightContractRate[]>(`/api/v1/freight_contract_rates${query}`)
  },

  get: async (id: number) => {
    return api.get<FreightContractRate>(`/api/v1/freight_contract_rates/${id}`)
  },

  create: async (data: Partial<FreightContractRate>) => {
    return api.post<FreightContractRate>('/api/v1/freight_contract_rates', {
      freight_contract_rate: data
    })
  },

  update: async (id: number, data: Partial<FreightContractRate>) => {
    return api.put<FreightContractRate>(`/api/v1/freight_contract_rates/${id}`, {
      freight_contract_rate: data
    })
  },

  delete: async (id: number) => {
    await api.delete(`/api/v1/freight_contract_rates/${id}`)
  }
}
