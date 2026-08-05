import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types/auth'

export function useRBAC() {
  const { user } = useAuthStore()

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isEmployee = hasRole('EMPLOYEE')
  const isManager = hasRole('MANAGER')
  const isProcurement = hasRole('PROCUREMENT')
  const isFinance = hasRole('FINANCE')
  const isVendor = hasRole('VENDOR')
  const isAdmin = hasRole('ADMIN')
  const isManagerOrAdmin = hasRole('MANAGER', 'ADMIN')
  const isProcurementOrAdmin = hasRole('PROCUREMENT', 'ADMIN')
  const isFinanceOrAdmin = hasRole('FINANCE', 'ADMIN')

  return {
    user,
    role: user?.role,
    hasRole,
    isEmployee,
    isManager,
    isProcurement,
    isFinance,
    isVendor,
    isAdmin,
    isManagerOrAdmin,
    isProcurementOrAdmin,
    isFinanceOrAdmin,
  }
}
