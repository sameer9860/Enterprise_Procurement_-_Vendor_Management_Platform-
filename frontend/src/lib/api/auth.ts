import api from '@/lib/axios'
import { LoginCredentials, RegisterData, AuthTokens, User, UserRole } from '@/types/auth'

export interface AdminUserListItem {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  department?: number
  department_name?: string
  phone_number?: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
}

export interface PaginatedUsersResponse {
  count: number
  next: string | null
  previous: string | null
  results: AdminUserListItem[]
}

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

  listUsers: async (params?: {
    search?: string
    role?: string
    is_active?: string
    page?: number
  }): Promise<PaginatedUsersResponse> => {
    const response = await api.get('/auth/users/', { params })
    return response.data
  },

  updateUser: async (
    id: number,
    data: Partial<AdminUserListItem>
  ): Promise<AdminUserListItem> => {
    const response = await api.patch(`/auth/users/${id}/`, data)
    return response.data
  },
}