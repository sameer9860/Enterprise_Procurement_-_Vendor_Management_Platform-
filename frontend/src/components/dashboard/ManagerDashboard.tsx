'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Clock,
  Users,
  ShoppingCart,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ManagerDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const pending = dashboard?.pending_approvals || 0
  const deptStats = dashboard?.department_requests || {}
  const recentPending = dashboard?.recent_pending || []

  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        description={`Department: ${dashboard?.department || 'N/A'}`}
      >
        <Button onClick={() => router.push('/approvals')}>
          View Approvals
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Pending Approvals"
          value={pending}
          icon={Clock}
          color="yellow"
          description="Require your action"
        />
        <StatsCard
          title="Total Requests"
          value={deptStats.total || 0}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="This Month"
          value={deptStats.this_month || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Total Budget Requested"
          value={formatCurrency(deptStats.total_budget_requested || 0)}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Pending approvals table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Pending Approvals
            {pending > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pending}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/approvals')}
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentPending.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              No pending approvals
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">
                      Title
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">
                      Budget
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">
                      Date
                    </th>
                    <th className="py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {recentPending.map((req: any) => (
                    <tr
                      key={req.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 font-medium">
                        {req.title}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {formatCurrency(req.estimated_budget)}
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/approvals/${req.id}`)
                          }
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
