import api from '@/lib/axios'
import { LoginCredentials, RegisterData, AuthTokens, User } from '@/types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register/', data)
    return response.data
  },

  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh })
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch('/auth/profile/', data)
    return response.data
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post('/auth/login/refresh/', { refresh })
    return response.data
  },
}