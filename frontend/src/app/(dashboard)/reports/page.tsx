'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { reportsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatsCard from '@/components/shared/StatsCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ReportsOverviewPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['spend-summary'],
    queryFn: () => reportsApi.spendSummary(),
  })

  const { data: monthly, isLoading: loadingMonthly } = useQuery({
    queryKey: ['spend-monthly'],
    queryFn: () => reportsApi.spendByMonth(),
  })

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: reportsApi.pipeline,
  })

  const monthlyChartData = monthly?.map((item) => ({
    month: item.month,
    spend: parseFloat(item.total_spend),
    transactions: item.transaction_count,
  }))

  const pipelineChartData = pipeline?.pipeline
    ? Object.entries(pipeline.pipeline).map(([status, data]) => ({
        status: status.replace('_', ' '),
        count: (data as any).count,
        budget: (data as any).total_budget,
      }))
    : []

  if (loadingSummary)
    return <LoadingSpinner text="Loading reports..." />

  return (
    <div>
      <PageHeader
        title="Reports Overview"
        description="Key procurement metrics and analytics"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Spend"
          value={formatCurrency(summary?.total_spend || '0')}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Transactions"
          value={summary?.total_transactions || 0}
          icon={ArrowUpDown}
          color="blue"
        />
        <StatsCard
          title="Average Transaction"
          value={formatCurrency(
            summary?.average_transaction || '0'
          )}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Largest Payment"
          value={formatCurrency(summary?.largest_payment || '0')}
          icon={BarChart3}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Spend Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <LoadingSpinner size="sm" />
            ) : !monthlyChartData?.length ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No payment data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: any) => [
                      formatCurrency(v),
                      'Spend',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Request Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pipelineChartData.length ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No pipeline data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 9 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Approval & Cycle Metrics */}
        {pipeline && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Process Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Avg Approval Time
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {pipeline.approval_turnaround
                      ?.average_approval_hours || 0}
                    h
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    Total Approvals
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {pipeline.approval_turnaround
                      ?.total_approvals || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    RFQ to PO Cycle
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {pipeline.rfq_to_po_cycle
                      ?.average_cycle_hours || 0}
                    h
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <p className="text-xs text-yellow-600 font-medium mb-1">
                    POs Analyzed
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {pipeline.rfq_to_po_cycle
                      ?.total_pos_analyzed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
