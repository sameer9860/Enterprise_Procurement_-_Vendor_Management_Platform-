export type UserRole =
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'PROCUREMENT'
  | 'FINANCE'
  | 'VENDOR'
  | 'ADMIN'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  department: number | null
  department_name: string | null
  phone_number: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  role: UserRole
  department?: number
  phone_number?: string
}