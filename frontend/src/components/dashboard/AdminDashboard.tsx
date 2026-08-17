'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Users,
  Building2,
  ShoppingCart,
  Package,
  Receipt,
  DollarSign,
  AlertTriangle,
  Shield,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function AdminDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const overview = dashboard?.system_overview || {}
  const financial = dashboard?.financial_summary || {}
  const pipeline = dashboard?.pipeline_health || []

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="System overview and management"
      >
        <Button
          variant="outline"
          onClick={() => router.push('/audit')}
        >
          <Shield className="w-4 h-4 mr-2" />
          Audit Logs
        </Button>
      </PageHeader>

      {/* System Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={overview.total_users || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Active Vendors"
          value={overview.active_vendors || 0}
          icon={Building2}
          color="green"
        />
        <StatsCard
          title="Total Requests"
          value={overview.total_requests || 0}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="Total POs"
          value={overview.total_pos || 0}
          icon={Package}
          color="yellow"
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">
                  Total Spend
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(financial.total_spend || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-yellow-600 font-medium">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(
                    financial.pending_invoice_value || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">
                  Overdue Invoices
                </p>
                <p className="text-2xl font-bold text-red-700">
                  {financial.overdue_invoices || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Request Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">
                No data
              </p>
            ) : (
              <div className="space-y-2">
                {pipeline.map((item: any) => {
                  const max = Math.max(
                    ...pipeline.map((i: any) => i.count)
                  )
                  return (
                    <div
                      key={item.status}
                      className="flex items-center gap-3"
                    >
                      <StatusBadge
                        status={item.status}
                        className="w-36 justify-center text-xs"
                      />
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              max > 0
                                ? (item.count / max) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-6 text-right">
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: 'Verify Pending Vendors',
                description: `${overview.pending_vendor_verification || 0} vendors awaiting verification`,
                icon: Building2,
                href: '/vendors?status=PENDING',
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                urgent:
                  (overview.pending_vendor_verification || 0) > 0,
              },
              {
                label: 'View All Users',
                description: `${overview.total_users || 0} registered users`,
                icon: Users,
                href: '/admin',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                urgent: false,
              },
              {
                label: 'Audit Logs',
                description: 'Monitor all system activity',
                icon: Shield,
                href: '/audit',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                urgent: false,
              },
              {
                label: 'Reports',
                description: 'View spend and vendor analytics',
                icon: Receipt,
                href: '/reports',
                color: 'text-green-600',
                bg: 'bg-green-50',
                urgent: false,
              },
            ].map((action) => (
              <div
                key={action.href}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${action.bg} ${
                  action.urgent ? 'ring-2 ring-yellow-400' : ''
                }`}
                onClick={() => router.push(action.href)}
              >
                <div className="flex items-center gap-3">
                  <action.icon
                    className={`w-5 h-5 ${action.color}`}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
