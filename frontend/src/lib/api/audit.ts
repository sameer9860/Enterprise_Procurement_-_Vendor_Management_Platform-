import api from '@/lib/axios'
import { AuditLog } from '@/types/common'
import { PaginatedResponse } from '@/types/common'

export interface AuditFilters {
  action?: string
  model_name?: string
  user?: number
  page?: number
}

export const auditApi = {
  list: async (
    filters?: AuditFilters
  ): Promise<PaginatedResponse<AuditLog>> => {
    const response = await api.get('/audit/logs/', { params: filters })
    return response.data
  },
}
