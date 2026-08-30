'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, UserCheck, UserX, Filter } from 'lucide-react'
import { authApi, AdminUserListItem } from '@/lib/api/auth'
import PageHeader from '@/components/shared/PageHeader'
import RoleGuard from '@/components/layout/RoleGuard'
import EmptyState from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/Skeletons'
import ApiError from '@/components/shared/ApiError'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { UserRole } from '@/types/auth'

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCUREMENT: 'bg-purple-50 text-purple-700 border-purple-200',
  FINANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  VENDOR: 'bg-orange-50 text-orange-700 border-orange-200',
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
}

const ALL_ROLES: UserRole[] = ['EMPLOYEE', 'MANAGER', 'PROCUREMENT', 'FINANCE', 'VENDOR', 'ADMIN']

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', { search, roleFilter, statusFilter, page }],
    queryFn: () =>
      authApi.listUsers({
        search: search || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        is_active: statusFilter !== 'ALL' ? (statusFilter === 'ACTIVE' ? 'true' : 'false') : undefined,
        page,
      }),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUserListItem> }) =>
      authApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user')
    },
  })

  const handleRoleChange = (userId: number, newRole: UserRole) => {
    updateUserMutation.mutate({ id: userId, data: { role: newRole } })
  }

  const handleToggleActive = (user: AdminUserListItem) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    })
  }

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="View, manage, and update platform user access and roles"
        >
          {data && (
            <Badge variant="outline" className="text-sm px-3 py-1 font-medium">
              <Users className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              {data.count} Total Users
            </Badge>
          )}
        </PageHeader>

        {/* Filter Toolbar */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by username, email or name..."
                  className="pl-9 bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-40">
                  <Select
                    value={roleFilter}
                    onValueChange={(val) => {
                      setRoleFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-36">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={6} />
              </div>
            ) : error ? (
              <div className="p-6">
                <ApiError error={error as Error} onRetry={refetch} />
              </div>
            ) : !data?.results || data.results.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try adjusting your search query or filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Joined</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.results.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                              {user.username[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {user.username}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole as UserRole)}
                          >
                            <SelectTrigger
                              className={`h-8 w-36 border font-medium text-xs rounded-full px-3 ${
                                ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                          {user.department_name || '—'}
                        </td>

                        <td className="px-6 py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={user.is_active ? 'outline' : 'default'}
                            size="sm"
                            className={user.is_active ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                            onClick={() => handleToggleActive(user)}
                            disabled={updateUserMutation.isPending}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="w-3.5 h-3.5 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {data && data.count > 10 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {data.results.length} of {data.count} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.previous}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data.next}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
