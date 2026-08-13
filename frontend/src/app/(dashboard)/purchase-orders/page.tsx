'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Package, Search, Filter } from 'lucide-react'
import { purchaseOrdersApi } from '@/lib/api'
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
import { formatCurrency, formatDate } from '@/lib/utils'

const PO_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', { search, status, page }],
    queryFn: () =>
      purchaseOrdersApi.list({
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page,
      }),
  })

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Track and manage purchase orders"
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by PO number or vendor..."
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
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PO_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <LoadingSpinner text="Loading purchase orders..." />
          ) : !data?.results || data.results.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No purchase orders"
              description="Purchase orders will appear here once generated from awarded bids"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        PO Number
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Vendor
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Delivery Date
                      </th>
                      <th className="py-4 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((po: any) => (
                      <tr
                        key={po.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/purchase-orders/${po.id}`)
                        }
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-blue-600">
                            {po.po_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {po.purchase_request_title}
                          </p>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <p className="font-medium">
                            {po.vendor_name}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-medium hidden lg:table-cell">
                          {formatCurrency(po.total_amount)}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell text-gray-600">
                          {formatDate(po.expected_delivery_date)}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(
                                `/purchase-orders/${po.id}`
                              )
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data && data.count > 10 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-gray-500">
                      {data.count} purchase orders
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
