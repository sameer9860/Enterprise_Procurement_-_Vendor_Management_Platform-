'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Search, Filter } from 'lucide-react'
import { auditApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
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
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CHANGES_REQUESTED: 'bg-yellow-100 text-yellow-700',
  SUBMIT_BID: 'bg-purple-100 text-purple-700',
  AWARD_BID: 'bg-indigo-100 text-indigo-700',
  GENERATE_PO: 'bg-blue-100 text-blue-700',
  SEND_PO: 'bg-cyan-100 text-cyan-700',
  ACKNOWLEDGE_PO: 'bg-teal-100 text-teal-700',
  SUBMIT_INVOICE: 'bg-orange-100 text-orange-700',
  INVOICE_PAID: 'bg-green-100 text-green-700',
  CREATE_VENDOR: 'bg-purple-100 text-purple-700',
  VENDOR_ACTIVE: 'bg-green-100 text-green-700',
  VENDOR_SUSPENDED: 'bg-red-100 text-red-700',
}

const MODEL_NAMES = [
  { value: 'ALL', label: 'All Models' },
  { value: 'PurchaseRequest', label: 'Purchase Request' },
  { value: 'RFQ', label: 'RFQ' },
  { value: 'Bid', label: 'Bid' },
  { value: 'PurchaseOrder', label: 'Purchase Order' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Vendor', label: 'Vendor' },
]

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [modelName, setModelName] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { modelName, page }],
    queryFn: () =>
      auditApi.list({
        model_name:
          modelName === 'ALL' ? undefined : modelName,
        page,
      }),
  })

  const filteredResults = data?.results?.filter(
    (log: any) =>
      !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      log.object_repr
        ?.toLowerCase()
        .includes(search.toLowerCase())
  )

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div>
        <PageHeader
          title="Audit Logs"
          description="Complete trail of all system actions"
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by action, user or object..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={modelName}
                onValueChange={(v) => {
                  if (v) {
                    setModelName(v)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_NAMES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardContent className="pt-0">
            {isLoading ? (
              <LoadingSpinner text="Loading audit logs..." />
            ) : !filteredResults || filteredResults.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No audit logs found"
                description="System activity will appear here"
              />
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {filteredResults.map((log: any) => (
                    <div
                      key={log.id}
                      className="py-4 px-4 hover:bg-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Action badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              ACTION_COLORS[log.action] ||
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {log.action?.replace(/_/g, ' ')}
                          </span>

                          {/* Model */}
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {log.model_name}
                          </Badge>

                          {/* Object */}
                          <span className="text-sm text-gray-700 font-medium">
                            {log.object_repr}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>

                      {/* User + IP */}
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {log.user_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-xs text-gray-500">
                            {log.user_name}
                          </span>
                        </div>
                        {log.ip_address && (
                          <span className="text-xs text-gray-400">
                            IP: {log.ip_address}
                          </span>
                        )}
                        {log.object_id && (
                          <span className="text-xs text-gray-400">
                            ID: #{log.object_id}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      {log.details &&
                        Object.keys(log.details).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(log.details).map(
                              ([key, val]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  <span className="font-medium">
                                    {key}:
                                  </span>
                                  <span>
                                    {String(val).slice(0, 40)}
                                  </span>
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data && data.count > 10 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-gray-500">
                      {data.count} total logs
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
    </RoleGuard>
  )
}
