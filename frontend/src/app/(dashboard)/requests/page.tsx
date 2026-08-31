'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Search, ShoppingCart, Clock, Filter } from 'lucide-react'
import { requestsApi } from '@/lib/api/requests'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import RoleGuard from '@/components/layout/RoleGuard'
import { TableSkeleton } from '@/components/shared/Skeletons'
import ApiError from '@/components/shared/ApiError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, timeAgo } from '@/lib/utils'

const ALL_STATUSES = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'RFQ Created', value: 'RFQ_CREATED' },
  { label: 'PO Issued', value: 'PO_ISSUED' },
  { label: 'Completed', value: 'COMPLETED' },
]

export default function PurchaseRequestsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase-requests', { search, statusFilter, page }],
    queryFn: () =>
      requestsApi.list({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
      }),
  })

  return (
    <RoleGuard allowedRoles={['EMPLOYEE', 'MANAGER', 'PROCUREMENT', 'ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Requests"
          description="View and track purchase requests across the organization"
        >
          <div className="flex items-center gap-3">
            {data && (
              <Badge variant="outline" className="text-sm px-3 py-1 font-medium bg-white">
                {data.count} Total
              </Badge>
            )}
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={() => router.push('/requests/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </PageHeader>

        {/* Toolbar */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search requests by title or requester..."
                  className="pl-9 bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="w-full sm:w-56">
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((st) => (
                      <SelectItem key={st.value} value={st.value}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : error ? (
              <div className="p-6">
                <ApiError error={error as Error} onRetry={refetch} />
              </div>
            ) : !data?.results || data.results.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No purchase requests found"
                description="No requests match your current search or status filter."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.results.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    onClick={() => router.push(`/requests/${req.id}`)}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-slate-900 text-base hover:text-blue-600 transition-colors">
                          {req.title}
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap font-medium">
                        <span>Requester: <strong className="text-slate-700">{req.requester_name}</strong></span>
                        <span>Department: <strong className="text-slate-700">{req.department_name}</strong></span>
                        <span>Items: <strong className="text-slate-700">{req.item_count}</strong></span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {timeAgo(req.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Budget</p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(req.estimated_budget)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.count > 10 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {data.results.length} of {data.count} requests
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
