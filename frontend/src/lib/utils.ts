import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

// shadcn/ui utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

// Format datetime
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy HH:mm')
}

// Format relative time
export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Format currency
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

// Get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Request statuses
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CHANGES_REQUESTED: 'bg-orange-100 text-orange-800',
    RFQ_CREATED: 'bg-blue-100 text-blue-800',
    VENDOR_SELECTED: 'bg-purple-100 text-purple-800',
    PO_GENERATED: 'bg-indigo-100 text-indigo-800',
    INVOICE_RECEIVED: 'bg-cyan-100 text-cyan-800',
    COMPLETED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-gray-100 text-gray-800',

    // PO statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACKNOWLEDGED: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    DELIVERED: 'bg-green-100 text-green-800',

    // Invoice statuses
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-200 text-green-900',

    // Vendor statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-orange-100 text-orange-800',
    BLACKLISTED: 'bg-red-100 text-red-800',

    // Bid statuses
    SHORTLISTED: 'bg-blue-100 text-blue-800',
    AWARDED: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Format status label
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

// Get role dashboard route
export function getRoleDashboardRoute(role: string): string {
  const routes: Record<string, string> = {
    EMPLOYEE: '/dashboard',
    MANAGER: '/dashboard',
    PROCUREMENT: '/dashboard',
    FINANCE: '/dashboard',
    VENDOR: '/dashboard',
    ADMIN: '/dashboard',
  }
  return routes[role] || '/dashboard'
}

// Truncate text
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}