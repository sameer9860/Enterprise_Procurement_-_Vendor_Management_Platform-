import api from '@/lib/axios'
import { Invoice, InvoiceList } from '@/types/procurement'
import { PaginatedResponse, TimelineEntry } from '@/types/common'

export interface InvoiceFilters {
  status?: string
  search?: string
  page?: number
  overdue?: boolean
}

export interface SubmitInvoiceData {
  purchase_order_id: number
  amount: number
  invoice_date: string
  due_date: string
  notes?: string
  items?: {
    description: string
    quantity: number
    unit_price: number
  }[]
}

export interface RecordPaymentData {
  amount_paid: number
  payment_method: string
  payment_reference?: string
  payment_date: string
  notes?: string
}

export const invoicesApi = {
  list: async (
    filters?: InvoiceFilters
  ): Promise<PaginatedResponse<InvoiceList>> => {
    const response = await api.get('/procurement/invoices/', {
      params: filters,
    })
    return response.data
  },

  get: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/procurement/invoices/${id}/`)
    return response.data
  },

  submit: async (data: SubmitInvoiceData): Promise<Invoice> => {
    const response = await api.post(
      '/procurement/invoices/submit_invoice/',
      data
    )
    return response.data
  },

  uploadFile: async (id: number, file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(
      `/procurement/invoices/${id}/upload_invoice_file/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  getFileUrl: async (
    id: number
  ): Promise<{ download_url: string }> => {
    const response = await api.get(
      `/procurement/invoices/${id}/get_invoice_file_url/`
    )
    return response.data
  },

  markUnderReview: async (
    id: number
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/invoices/${id}/mark_under_review/`
    )
    return response.data
  },

  review: async (
    id: number,
    action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW',
    rejection_reason?: string
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/invoices/${id}/review_invoice/`,
      { action, rejection_reason }
    )
    return response.data
  },

  recordPayment: async (
    id: number,
    data: RecordPaymentData
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/invoices/${id}/record_payment/`,
      data
    )
    return response.data
  },

  timeline: async (id: number): Promise<{
    invoice_number: string
    current_status: string
    timeline: TimelineEntry[]
  }> => {
    const response = await api.get(
      `/procurement/invoices/${id}/timeline/`
    )
    return response.data
  },

  summary: async (): Promise<any> => {
    const response = await api.get('/procurement/invoices/summary/')
    return response.data
  },
}