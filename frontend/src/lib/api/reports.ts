import api from '@/lib/axios'
import {
  SpendSummary,
  DepartmentSpend,
  MonthlySpend,
  VendorPerformance,
  PipelineSummary,
  DashboardData,
} from '@/types/reports'

export interface DateRangeParams {
  start_date?: string
  end_date?: string
  year?: number
}

export const reportsApi = {
  dashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/reports/dashboard/')
    return response.data
  },

  spendSummary: async (
    params?: DateRangeParams
  ): Promise<SpendSummary> => {
    const response = await api.get('/reports/spend/summary/', {
      params,
    })
    return response.data
  },

  spendByDepartment: async (
    params?: DateRangeParams
  ): Promise<DepartmentSpend[]> => {
    const response = await api.get('/reports/spend/by-department/', {
      params,
    })
    return response.data
  },

  spendByMonth: async (
    params?: DateRangeParams
  ): Promise<MonthlySpend[]> => {
    const response = await api.get('/reports/spend/by-month/', { params })
    return response.data
  },

  spendByQuarter: async (
    params?: DateRangeParams
  ): Promise<MonthlySpend[]> => {
    const response = await api.get('/reports/spend/by-quarter/', { params })
    return response.data
  },

  vendorPerformance: async (
    params?: DateRangeParams
  ): Promise<VendorPerformance[]> => {
    const response = await api.get('/reports/vendors/performance/', {
      params,
    })
    return response.data
  },

  pipeline: async (): Promise<PipelineSummary> => {
    const response = await api.get('/reports/pipeline/')
    return response.data
  },

  invoiceReport: async (): Promise<any> => {
    const response = await api.get('/reports/invoices/')
    return response.data
  },

  overdueInvoices: async (): Promise<any> => {
    const response = await api.get('/reports/invoices/overdue/')
    return response.data
  },

  downloadSpendExcel: async (): Promise<Blob> => {
    const response = await api.get('/reports/download/spend/excel/', {
      responseType: 'blob',
    })
    return response.data
  },

  downloadSpendPdf: async (): Promise<Blob> => {
    const response = await api.get('/reports/download/spend/pdf/', {
      responseType: 'blob',
    })
    return response.data
  },

  downloadVendorExcel: async (): Promise<Blob> => {
    const response = await api.get('/reports/download/vendors/excel/', {
      responseType: 'blob',
    })
    return response.data
  },

  generateSpendReport: async (
    params?: DateRangeParams
  ): Promise<{ message: string; task_id: string }> => {
    const response = await api.post('/reports/generate/spend/', params)
    return response.data
  },

  taskStatus: async (
    taskId: string
  ): Promise<{ status: string; result: any }> => {
    const response = await api.get(`/reports/tasks/${taskId}/`)
    return response.data
  },
}