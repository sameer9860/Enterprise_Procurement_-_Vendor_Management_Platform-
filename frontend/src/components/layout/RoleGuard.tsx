'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRBAC } from '@/hooks/useRBAC'
import { UserRole } from '@/types/auth'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const router = useRouter()
  const { user, hasRole } = useRBAC()

  useEffect(() => {
    if (user && !hasRole(...allowedRoles)) {
      router.push('/dashboard')
    }
  }, [user, allowedRoles, hasRole, router])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!hasRole(...allowedRoles)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-semibold text-gray-700">Access Denied</p>
        <p className="text-sm text-gray-500 mt-1">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
