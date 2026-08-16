'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Receipt, Search, Filter, Plus } from 'lucide-react'
import { invoicesApi } from '@/lib/api'
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
import { useRBAC } from '@/hooks/useRBAC'

const INVOICE_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PAID', label: 'Paid' },
]

export default function InvoicesPage() {
  const router = useRouter()
  const { isVendor } = useRBAC()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search, status, page }],
    queryFn: () =>
      invoicesApi.list({
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        page,
      }),
  })

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={
          isVendor
            ? 'Manage your submitted invoices'
            : 'Review and process vendor invoices'
        }
      >
        {isVendor && (
          <Button onClick={() => router.push('/invoices/submit')}>
            <Plus className="w-4 h-4 mr-2" />
            Submit Invoice
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
                placeholder="Search by invoice number or vendor..."
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
                {INVOICE_STATUSES.map((s) => (
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
            <LoadingSpinner text="Loading invoices..." />
          ) : !data?.results || data.results.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description={
                isVendor
                  ? 'Submit your first invoice for a completed PO'
                  : 'No invoices to review at the moment'
              }
              action={
                isVendor
                  ? {
                      label: 'Submit Invoice',
                      onClick: () =>
                        router.push('/invoices/submit'),
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
                        Invoice #
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        Vendor
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden md:table-cell">
                        PO
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-gray-500 font-medium hidden lg:table-cell">
                        Due Date
                      </th>
                      <th className="py-4 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((invoice: any) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}`)
                        }
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-blue-600">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(invoice.submitted_at)}
                          </p>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <p className="font-medium">
                            {invoice.vendor_name}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-gray-600 hidden md:table-cell">
                          {invoice.po_number}
                        </td>
                        <td className="py-4 px-4 font-medium hidden lg:table-cell">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td
                          className={`py-4 px-4 hidden lg:table-cell ${
                            new Date(invoice.due_date) < new Date() &&
                            invoice.status !== 'PAID'
                              ? 'text-red-500 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(
                                `/invoices/${invoice.id}`
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
              </div>

              {/* Pagination */}
              {data && data.count > 10 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    {data.count} invoices
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
