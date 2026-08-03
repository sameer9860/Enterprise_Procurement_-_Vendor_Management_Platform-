import api from '@/lib/axios'
import { Vendor, VendorList, VendorCategory } from '@/types/procurement'
import { PaginatedResponse } from '@/types/common'

export interface VendorFilters {
  status?: string
  search?: string
  page?: number
}

export interface CreateVendorData {
  company_name: string
  registration_number: string
  address: string
  city: string
  country: string
  website?: string
  tax_number?: string
  category_ids?: number[]
}

export const vendorsApi = {
  list: async (
    filters?: VendorFilters
  ): Promise<PaginatedResponse<VendorList>> => {
    const response = await api.get('/procurement/vendors/', {
      params: filters,
    })
    return response.data
  },

  get: async (id: number): Promise<Vendor> => {
    const response = await api.get(`/procurement/vendors/${id}/`)
    return response.data
  },

  create: async (data: CreateVendorData): Promise<Vendor> => {
    const response = await api.post('/procurement/vendors/', data)
    return response.data
  },

  update: async (
    id: number,
    data: Partial<CreateVendorData>
  ): Promise<Vendor> => {
    const response = await api.patch(`/procurement/vendors/${id}/`, data)
    return response.data
  },

  verify: async (
    id: number,
    action: 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED',
    comments?: string
  ): Promise<{ message: string; status: string }> => {
    const response = await api.post(
      `/procurement/vendors/${id}/verify_vendor/`,
      { action, comments }
    )
    return response.data
  },

  activeVendors: async (): Promise<VendorList[]> => {
    const response = await api.get('/procurement/vendors/active_vendors/')
    return response.data
  },

  uploadDocument: async (
    id: number,
    file: File,
    documentType: string
  ): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    const response = await api.post(
      `/procurement/vendors/${id}/upload_document/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  categories: async (): Promise<VendorCategory[]> => {
    const response = await api.get('/procurement/vendor-categories/')
    return response.data
  },
}