'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { CheckSquare, Search, Clock } from 'lucide-react'
import { requestsApi } from '@/lib/api'
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
import { formatCurrency, timeAgo } from '@/lib/utils'

export default function ApprovalsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['approvals', { search, page }],
    queryFn: () =>
      requestsApi.list({
        status: 'PENDING_APPROVAL',
        search: search || undefined,
        page,
      }),
  })

  return (
    <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
      <div>
        <PageHeader
          title="Pending Approvals"
          description="Review and action purchase requests from your team"
        >
          {data && (
            <Badge variant="secondary" className="text-sm">
              {data.count} pending
            </Badge>
          )}
        </PageHeader>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardContent className="pt-0">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : error ? (
              <ApiError error={error as Error} onRetry={refetch} />
            ) : !data?.results || data.results.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No pending approvals"
                description="All requests have been reviewed"
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.results.map((req) => (
                  <div
                    key={req.id}
                    className="py-4 px-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() =>
                      router.push(`/approvals/${req.id}`)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {req.title}
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span>By {req.requester_name}</span>
                        <span>{req.department_name}</span>
                        <span>{req.item_count} items</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(req.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(req.estimated_budget)}
                      </p>
                      <Button size="sm" className="mt-1">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.count > 10 && (
              <div className="flex items-center justify-between px-4 py-4 border-t dark:border-slate-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.count} pending requests
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
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
