'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Clock,
  Gavel,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { reportsApi, rfqsApi, purchaseOrdersApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default function ProcurementDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  const { data: openRFQs } = useQuery({
    queryKey: ['rfqs', { status: 'OPEN', page: 1 }],
    queryFn: () => rfqsApi.list({ status: 'OPEN', page: 1 }),
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const rfqStats = dashboard?.rfqs || {}
  const poStats = dashboard?.purchase_orders || {}

  return (
    <div>
      <PageHeader
        title="Procurement Dashboard"
        description="Manage RFQs, bids and purchase orders"
      >
        <Button
          variant="outline"
          onClick={() => router.push('/rfqs')}
        >
          View RFQs
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </PageHeader>

      {/* Stats Row 1 — RFQ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatsCard
          title="Open RFQs"
          value={rfqStats.open || 0}
          icon={FileText}
          color="blue"
          description="Active for bidding"
        />
        <StatsCard
          title="Closing Soon"
          value={rfqStats.closing_soon || 0}
          icon={Clock}
          color="yellow"
          description="Within 3 days"
        />
        <StatsCard
          title="Bids Received"
          value={rfqStats.total_bids_received || 0}
          icon={Gavel}
          color="purple"
        />
        <StatsCard
          title="Overdue Deliveries"
          value={poStats.overdue_delivery || 0}
          icon={AlertTriangle}
          color="red"
          description="Past expected date"
        />
      </div>

      {/* Stats Row 2 — PO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Draft', value: poStats.draft || 0, color: 'bg-gray-100 text-gray-700' },
          { label: 'Sent', value: poStats.sent || 0, color: 'bg-blue-100 text-blue-700' },
          { label: 'Acknowledged', value: poStats.acknowledged || 0, color: 'bg-purple-100 text-purple-700' },
          { label: 'In Progress', value: poStats.in_progress || 0, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Delivered', value: poStats.delivered || 0, color: 'bg-green-100 text-green-700' },
          { label: 'Total POs', value: poStats.total || 0, color: 'bg-indigo-100 text-indigo-700' },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl p-4 ${item.color}`}
          >
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs font-medium mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open RFQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Open RFQs
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/rfqs')}
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!openRFQs?.results || openRFQs.results.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">
                No open RFQs
              </p>
            ) : (
              <div className="space-y-3">
                {openRFQs.results.slice(0, 5).map((rfq) => (
                  <div
                    key={rfq.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => router.push(`/rfqs/${rfq.id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {rfq.rfq_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {rfq.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {rfq.bid_count} bids
                      </p>
                      <p className="text-xs text-orange-500 font-medium">
                        Due {formatDate(rfq.deadline)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Request Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.requests_pipeline ? (
              <div className="space-y-2">
                {dashboard.requests_pipeline.map((item: any) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between"
                  >
                    <StatusBadge status={item.status} />
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (item.count /
                                Math.max(
                                  ...dashboard.requests_pipeline.map(
                                    (i: any) => i.count
                                  )
                                )) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-6">
                No data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
