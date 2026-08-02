export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  message?: string
  [key: string]: any
}

export interface AuditLog {
  id: number
  user: number
  user_name: string
  action: string
  model_name: string
  object_id: number
  object_repr: string
  details: Record<string, any>
  ip_address: string
  timestamp: string
}

export interface Department {
  id: number
  name: string
  budget: string
  manager: number | null
}

export interface TimelineEntry {
  action: string
  performed_by: string
  role: string
  details: Record<string, any>
  timestamp: string
}