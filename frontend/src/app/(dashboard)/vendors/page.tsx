'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Building2, Search, Filter, Star } from 'lucide-react'
import { vendorsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import RoleGuard from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const VENDOR_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Verification' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BLACKLISTED', label: 'Blacklisted' },
]

export default function VendorsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { search, status, page }],
    queryFn: () =>
      vendorsApi.list({
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page,
      }),
  })

  const { mutate: verifyVendor } = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number
      action: 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED'
    }) => vendorsApi.verify(id, action),
    onSuccess: (_, { action }) => {
      toast.success(`Vendor ${action.toLowerCase()} successfully`)
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
    onError: () => toast.error('Failed to update vendor status'),
  })

  return (
    <RoleGuard allowedRoles={['PROCUREMENT', 'ADMIN']}>
      <div>
        <PageHeader
          title="Vendors"
          description="Manage vendor profiles and verification"
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v)
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-0">
            {isLoading ? (
              <LoadingSpinner text="Loading vendors..." />
            ) : !data?.results || data.results.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No vendors found"
                description="Vendors will appear here once they register"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Company
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Location
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Categories
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Rating
                      </th>
                      <th className="py-4 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((vendor: any) => (
                      <tr
                        key={vendor.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {vendor.company_name?.[0] || 'V'}
                            </div>
                            <p className="font-medium">
                              {vendor.company_name}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 hidden md:table-cell">
                          {vendor.city}, {vendor.country}
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {vendor.category_names
                              ?.slice(0, 2)
                              .map((cat: string) => (
                                <Badge
                                  key={cat}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {cat}
                                </Badge>
                              ))}
                            {vendor.category_names?.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                +{vendor.category_names.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={vendor.status} />
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{vendor.rating}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/vendors/${vendor.id}`
                                )
                              }
                            >
                              View
                            </Button>
                            {vendor.status === 'PENDING' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  verifyVendor({
                                    id: vendor.id,
                                    action: 'ACTIVE',
                                  })
                                }
                              >
                                Verify
                              </Button>
                            )}
                            {vendor.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 border-orange-300"
                                onClick={() =>
                                  verifyVendor({
                                    id: vendor.id,
                                    action: 'SUSPENDED',
                                  })
                                }
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {data && data.count > 10 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-gray-500">
                      {data.count} vendors
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.previous}
                        onClick={() => setPage((p) => p - 1)}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
