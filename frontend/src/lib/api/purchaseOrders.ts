import api from '@/lib/axios'
import { PurchaseOrder, POList } from '@/types/procurement'
import { PaginatedResponse, TimelineEntry } from '@/types/common'

export interface POFilters {
  status?: string
  search?: string
  page?: number
}

export interface CreatePOData {
  bid_id: number
  delivery_address: string
  expected_delivery_date: string
  special_instructions?: string
}

export const purchaseOrdersApi = {
  list: async (
    filters?: POFilters
  ): Promise<PaginatedResponse<POList>> => {
    const response = await api.get('/procurement/purchase-orders/', {
      params: filters,
    })
    return response.data
  },

  get: async (id: number): Promise<PurchaseOrder> => {
    const response = await api.get(`/procurement/purchase-orders/${id}/`)
    return response.data
  },

  generate: async (data: CreatePOData): Promise<PurchaseOrder> => {
    const response = await api.post(
      '/procurement/purchase-orders/generate_po/',
      data
    )
    return response.data
  },

  sendToVendor: async (
    id: number
  ): Promise<{ message: string; sent_at: string }> => {
    const response = await api.post(
      `/procurement/purchase-orders/${id}/send_to_vendor/`
    )
    return response.data
  },

  acknowledge: async (
    id: number
  ): Promise<{ message: string }> => {
    const response = await api.post(
      `/procurement/purchase-orders/${id}/acknowledge/`
    )
    return response.data
  },

  updateStatus: async (
    id: number,
    status: string,
    notes?: string
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/purchase-orders/${id}/update_status/`,
      { status, notes }
    )
    return response.data
  },

  timeline: async (id: number): Promise<{
    po_number: string
    current_status: string
    timeline: TimelineEntry[]
  }> => {
    const response = await api.get(
      `/procurement/purchase-orders/${id}/timeline/`
    )
    return response.data
  },

  summary: async (): Promise<any> => {
    const response = await api.get(
      '/procurement/purchase-orders/summary/'
    )
    return response.data
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(
      `/procurement/purchase-orders/${id}/download_pdf/`,
      { responseType: 'blob' }
    )
    return response.data
  },

  getPdfUrl: async (id: number): Promise<{ download_url: string }> => {
    const response = await api.get(
      `/procurement/purchase-orders/${id}/get_pdf_url/`
    )
    return response.data
  },
}