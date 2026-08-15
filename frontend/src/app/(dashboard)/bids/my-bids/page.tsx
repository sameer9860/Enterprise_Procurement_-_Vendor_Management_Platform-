'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Gavel, Filter } from 'lucide-react'
import { bidsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const BID_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'AWARDED', label: 'Awarded' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function MyBidsPage() {
  const router = useRouter()
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['my-bids', { status, page }],
    queryFn: () =>
      bidsApi.list({
        status: status === 'ALL' ? undefined : status,
        page,
      }),
  })

  return (
    <div>
      <PageHeader
        title="My Bids"
        description="Track all your submitted bids"
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
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
              {BID_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <LoadingSpinner text="Loading bids..." />
          ) : !data?.results || data.results.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No bids yet"
              description="Submit bids on open RFQs to get started"
              action={{
                label: 'Browse RFQs',
                onClick: () => router.push('/rfqs'),
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        RFQ
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Delivery
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Submitted
                      </th>
                      <th className="py-4 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((bid: any) => (
                      <tr
                        key={bid.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-blue-600">
                            {bid.rfq_number}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-medium hidden md:table-cell">
                          {formatCurrency(bid.total_amount)}
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell text-gray-600">
                          {bid.delivery_days} days
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={bid.status} />
                        </td>
                        <td className="py-4 px-4 text-gray-500 hidden md:table-cell">
                          {formatDateTime(bid.submitted_at)}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/rfqs/${bid.rfq}`)
                            }
                          >
                            View RFQ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.count > 10 && (
                <div className="flex justify-between items-center px-4 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    {data.count} total bids
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
    </div>
  )
}
