'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Search } from 'lucide-react'
import { authApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import RoleGuard from '@/components/layout/RoleGuard'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: 'bg-green-100 text-green-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  PROCUREMENT: 'bg-purple-100 text-purple-700',
  FINANCE: 'bg-yellow-100 text-yellow-700',
  VENDOR: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
  })

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div>
        <PageHeader
          title="User Management"
          description="View and manage all platform users"
        />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                User Management
              </p>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Add a{' '}
                <code className="bg-gray-100 px-1 rounded">
                  GET /api/auth/users/
                </code>{' '}
                endpoint in Django to list all users here. The
                frontend is ready — just wire the API.
              </p>

              {/* Show current admin profile as demo */}
              {profile && (
                <div className="mt-8 max-w-sm mx-auto">
                  <p className="text-xs text-gray-400 mb-3">
                    Current Session
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-left">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {profile.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {profile.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {profile.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        ROLE_COLORS[profile.role] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {profile.role}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
