'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FinanceDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const invoices = dashboard?.invoices || {}
  const thisMonth = dashboard?.this_month || {}

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        description="Manage invoices and payments"
      >
        <Button onClick={() => router.push('/invoices')}>
          View All Invoices
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Pending Review"
          value={
            (invoices.submitted || 0) +
            (invoices.under_review || 0)
          }
          icon={Clock}
          color="yellow"
          description="Require action"
        />
        <StatsCard
          title="Approved"
          value={invoices.approved || 0}
          icon={CheckCircle}
          color="blue"
          description="Ready for payment"
        />
        <StatsCard
          title="Overdue"
          value={invoices.overdue || 0}
          icon={AlertTriangle}
          color="red"
          description="Past due date"
        />
        <StatsCard
          title="Paid This Month"
          value={formatCurrency(thisMonth.total_paid || 0)}
          icon={DollarSign}
          color="green"
          description={`${thisMonth.payments_processed || 0} payments`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Invoice Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  status: 'SUBMITTED',
                  count: invoices.submitted || 0,
                  color: 'bg-yellow-500',
                },
                {
                  status: 'UNDER_REVIEW',
                  count: invoices.under_review || 0,
                  color: 'bg-blue-500',
                },
                {
                  status: 'APPROVED',
                  count: invoices.approved || 0,
                  color: 'bg-indigo-500',
                },
                {
                  status: 'PAID',
                  count: invoices.paid || 0,
                  color: 'bg-green-500',
                },
                {
                  status: 'REJECTED',
                  count: invoices.rejected || 0,
                  color: 'bg-red-500',
                },
              ].map((item) => {
                const total = Object.values(invoices).reduce(
                  (sum: number, v: any) =>
                    typeof v === 'number' ? sum + v : sum,
                  0
                )
                const pct =
                  total > 0
                    ? Math.round((item.count / total) * 100)
                    : 0
                return (
                  <div
                    key={item.status}
                    className="flex items-center gap-3"
                  >
                    <StatusBadge
                      status={item.status}
                      className="w-28 justify-center"
                    />
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Pending Action
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push('/invoices?status=SUBMITTED')
              }
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!dashboard?.recent_invoices || dashboard.recent_invoices.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">
                No pending invoices
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard.recent_invoices.map(
                  (invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        router.push(`/invoices/${invoice.id}`)
                      }
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <StatusBadge status={invoice.status} />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices Warning */}
        {invoices.overdue > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-base text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Invoices Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-3">
                {invoices.overdue} invoice(s) are past their due
                date and require immediate attention.
              </p>
              <p className="text-sm font-semibold text-red-700 mb-3">
                Overdue Amount:{' '}
                {formatCurrency(dashboard?.overdue_amount || 0)}
              </p>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() =>
                  router.push('/invoices?overdue=true')
                }
              >
                View Overdue Invoices
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 font-medium mb-1">
                  Payments Processed
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {thisMonth.payments_processed || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(thisMonth.total_paid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
