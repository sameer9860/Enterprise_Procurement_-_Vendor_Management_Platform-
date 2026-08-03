import api from '@/lib/axios'
import {
  PurchaseRequest,
  PurchaseRequestList,
  Approval,
} from '@/types/procurement'
import { PaginatedResponse } from '@/types/common'

export interface RequestFilters {
  status?: string
  search?: string
  page?: number
  page_size?: number
  ordering?: string
  min_budget?: number
  max_budget?: number
}

export interface CreateRequestData {
  title: string
  description?: string
  estimated_budget: number
  items: {
    item_name: string
    quantity: number
    estimated_unit_price: number
    specifications?: string
  }[]
}

export const requestsApi = {
  list: async (
    filters?: RequestFilters
  ): Promise<PaginatedResponse<PurchaseRequestList>> => {
    const response = await api.get('/procurement/requests/', {
      params: filters,
    })
    return response.data
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get(`/procurement/requests/${id}/`)
    return response.data
  },

  create: async (data: CreateRequestData): Promise<PurchaseRequest> => {
    const response = await api.post('/procurement/requests/', data)
    return response.data
  },

  update: async (
    id: number,
    data: Partial<CreateRequestData>
  ): Promise<PurchaseRequest> => {
    const response = await api.patch(`/procurement/requests/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/procurement/requests/${id}/`)
  },

  approveAction: async (
    id: number,
    action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    comments?: string
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/requests/${id}/approve_action/`,
      { action, comments }
    )
    return response.data
  },

  resubmit: async (
    id: number,
    data?: Partial<CreateRequestData>
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/requests/${id}/resubmit/`,
      data || {}
    )
    return response.data
  },

  approvalHistory: async (id: number): Promise<Approval[]> => {
    const response = await api.get(
      `/procurement/requests/${id}/approval_history/`
    )
    return response.data
  },
}