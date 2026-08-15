'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Gavel,
  Package,
  Receipt,
  Trophy,
  ArrowRight,
  FileText,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function VendorDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const bids = dashboard?.bids || {}
  const pos = dashboard?.purchase_orders || {}
  const invoices = dashboard?.invoices || {}

  return (
    <div>
      <PageHeader
        title={`Welcome, ${dashboard?.company_name || 'Vendor'}`}
        description={`Account Status: ${dashboard?.vendor_status || 'N/A'}`}
      >
        <Button onClick={() => router.push('/rfqs')}>
          <FileText className="w-4 h-4 mr-2" />
          Browse RFQs
        </Button>
      </PageHeader>

      {/* Bid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Bids"
          value={bids.total || 0}
          icon={Gavel}
          color="blue"
        />
        <StatsCard
          title="Bids Won"
          value={bids.won || 0}
          icon={Trophy}
          color="green"
          description={`${bids.win_rate || 0}% win rate`}
        />
        <StatsCard
          title="Active POs"
          value={pos.in_progress || 0}
          icon={Package}
          color="purple"
        />
        <StatsCard
          title="Total Earned"
          value={formatCurrency(invoices.total_earned || 0)}
          icon={DollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Purchase Orders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/purchase-orders')}
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: 'Pending Acknowledgment',
                  value: pos.pending_acknowledgment || 0,
                  color: 'text-yellow-600',
                  bg: 'bg-yellow-50',
                },
                {
                  label: 'In Progress',
                  value: pos.in_progress || 0,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Delivered',
                  value: pos.delivered || 0,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                },
                {
                  label: 'Total POs',
                  value: pos.total || 0,
                  color: 'text-gray-600',
                  bg: 'bg-gray-50',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-3 ${item.bg} rounded-lg`}
                >
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                  <span
                    className={`text-lg font-bold ${item.color}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Invoices</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/invoices')}
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: 'Submitted',
                  value: invoices.submitted || 0,
                  color: 'text-yellow-600',
                  bg: 'bg-yellow-50',
                },
                {
                  label: 'Approved',
                  value: invoices.approved || 0,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Paid',
                  value: invoices.paid || 0,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                },
                {
                  label: 'Total Invoices',
                  value: invoices.total || 0,
                  color: 'text-gray-600',
                  bg: 'bg-gray-50',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-3 ${item.bg} rounded-lg`}
                >
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                  <span
                    className={`text-lg font-bold ${item.color}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/rfqs')}
            >
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Browse Open RFQs
              {dashboard?.open_rfqs > 0 && (
                <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {dashboard?.open_rfqs}
                </span>
              )}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/purchase-orders')}
            >
              <Package className="w-4 h-4 mr-2 text-purple-500" />
              My Purchase Orders
              {pos.pending_acknowledgment > 0 && (
                <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pos.pending_acknowledgment} pending
                </span>
              )}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/invoices/submit')}
            >
              <Receipt className="w-4 h-4 mr-2 text-green-500" />
              Submit Invoice
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/vendors/profile')}
            >
              <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
              My Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
