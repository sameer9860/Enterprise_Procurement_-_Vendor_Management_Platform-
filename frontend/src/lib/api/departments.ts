import api from '@/lib/axios'
import { Department } from '@/types/common'

export const departmentsApi = {
  list: async (): Promise<Department[]> => {
    const response = await api.get('/auth/departments/')
    return response.data
  },
}