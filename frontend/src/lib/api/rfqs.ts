import api from '@/lib/axios'
import { RFQ, RFQList } from '@/types/procurement'
import { PaginatedResponse } from '@/types/common'

export interface RFQFilters {
  status?: string
  search?: string
  page?: number
}

export interface CreateRFQData {
  request_id: number
  deadline: string
  description?: string
  vendor_ids?: number[]
}

export const rfqsApi = {
  list: async (
    filters?: RFQFilters
  ): Promise<PaginatedResponse<RFQList>> => {
    const response = await api.get('/procurement/rfqs/', { params: filters })
    return response.data
  },

  get: async (id: number): Promise<RFQ> => {
    const response = await api.get(`/procurement/rfqs/${id}/`)
    return response.data
  },

  createFromRequest: async (
    data: CreateRFQData
  ): Promise<RFQ> => {
    const response = await api.post(
      '/procurement/rfqs/create_from_request/',
      data
    )
    return response.data
  },

  close: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.post(`/procurement/rfqs/${id}/close_rfq/`)
    return response.data
  },

  awardedBid: async (id: number): Promise<any> => {
    const response = await api.get(`/procurement/rfqs/${id}/awarded_bid/`)
    return response.data
  },
}