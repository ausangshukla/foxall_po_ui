import { API_ROUTES } from '../config'
import { api } from './client'
import type { FreightContractRate } from '../types/api'

export const freightContractRatesApi = {
  list: async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<FreightContractRate[]>(`${API_ROUTES.FREIGHT_CONTRACT_RATES}${query}`)
  },

  get: async (id: number) => {
    return api.get<FreightContractRate>(`${API_ROUTES.FREIGHT_CONTRACT_RATES}/${id}`)
  },

  create: async (data: Partial<FreightContractRate>) => {
    return api.post<FreightContractRate>(API_ROUTES.FREIGHT_CONTRACT_RATES, {
      freight_contract_rate: data
    })
  },

  update: async (id: number, data: Partial<FreightContractRate>) => {
    return api.put<FreightContractRate>(`${API_ROUTES.FREIGHT_CONTRACT_RATES}/${id}`, {
      freight_contract_rate: data
    })
  },

  delete: async (id: number) => {
    await api.delete(`${API_ROUTES.FREIGHT_CONTRACT_RATES}/${id}`)
  },

  export: async (params?: Record<string, any>) => {
    let url = API_ROUTES.FREIGHT_CONTRACT_RATES_EXPORT
    if (params) {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value.toString())
        }
      })
      const queryString = query.toString()
      if (queryString) url += `?${queryString}`
    }
    return api.download(url)
  }
}
