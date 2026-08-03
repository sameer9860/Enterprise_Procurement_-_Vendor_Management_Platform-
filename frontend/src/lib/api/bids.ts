import api from '@/lib/axios'
import { Bid, BidComparison } from '@/types/procurement'
import { PaginatedResponse } from '@/types/common'

export interface BidFilters {
  status?: string
  page?: number
}

export interface CreateBidData {
  rfq: number
  total_amount: number
  delivery_days: number
  validity_days?: number
  notes?: string
  items: {
    rfq_item: number
    unit_price: number
    quantity: number
  }[]
}

export interface BidComparisonResponse {
  rfq_number: string
  rfq_title: string
  estimated_budget: string
  deadline: string
  status: string
  statistics: {
    total_bids: number
    lowest_bid: string
    highest_bid: string
    average_bid: string
  }
  bids: BidComparison[]
}

export const bidsApi = {
  list: async (
    filters?: BidFilters
  ): Promise<PaginatedResponse<Bid>> => {
    const response = await api.get('/procurement/bids/', { params: filters })
    return response.data
  },

  get: async (id: number): Promise<Bid> => {
    const response = await api.get(`/procurement/bids/${id}/`)
    return response.data
  },

  create: async (data: CreateBidData): Promise<Bid> => {
    const response = await api.post('/procurement/bids/', data)
    return response.data
  },

  compare: async (
    rfqId: number
  ): Promise<BidComparisonResponse> => {
    const response = await api.get('/procurement/bids/compare/', {
      params: { rfq_id: rfqId },
    })
    return response.data
  },

  shortlist: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.post(`/procurement/bids/${id}/shortlist/`)
    return response.data
  },

  reject: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.post(`/procurement/bids/${id}/reject_bid/`)
    return response.data
  },

  award: async (
    id: number
  ): Promise<{ message: string; vendor: string; awarded_amount: string }> => {
    const response = await api.post(`/procurement/bids/${id}/award_bid/`)
    return response.data
  },
}