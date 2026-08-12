'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
} from 'lucide-react'
import { rfqsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
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
import { formatDate } from '@/lib/utils'
import { useRBAC } from '@/hooks/useRBAC'
import CreateRFQDialog from '@/components/procurement/CreateRFQDialog'

const RFQ_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function RFQsPage() {
  const router = useRouter()
  const { isProcurement, isAdmin } = useRBAC()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', { search, status, page }],
    queryFn: () =>
      rfqsApi.list({
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page,
      }),
  })

  return (
    <div>
      <PageHeader
        title="Request for Quotations"
        description="Manage vendor bidding and RFQs"
      >
        {(isProcurement || isAdmin) && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create RFQ
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search RFQs..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v) {
                  setStatus(v)
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RFQ_STATUSES.map((s) => (
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
            <LoadingSpinner text="Loading RFQs..." />
          ) : !data?.results || data.results.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No RFQs found"
              description={
                isProcurement || isAdmin
                  ? 'Create an RFQ from an approved purchase request'
                  : 'No RFQs available for you at the moment'
              }
              action={
                isProcurement || isAdmin
                  ? {
                      label: 'Create RFQ',
                      onClick: () => setCreateDialogOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        RFQ Number
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Title
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Deadline
                      </th>
                      <th className="text-center py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Bids
                      </th>
                      <th className="py-4 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((rfq) => (
                      <tr
                        key={rfq.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/rfqs/${rfq.id}`)
                        }
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-blue-600">
                            {rfq.rfq_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 md:hidden">
                            {rfq.title}
                          </p>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <p className="font-medium">{rfq.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {rfq.purchase_request_title}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={rfq.status} />
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span
                              className={
                                new Date(rfq.deadline) < new Date()
                                  ? 'text-red-500 font-medium'
                                  : 'text-gray-600'
                              }
                            >
                              {formatDate(rfq.deadline)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center hidden md:table-cell">
                          <Badge variant="secondary">
                            {rfq.bid_count}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/rfqs/${rfq.id}`)
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.count > 10 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    {data.count} total RFQs
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
            </>
          )}
        </CardContent>
      </Card>

      <CreateRFQDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  )
}
