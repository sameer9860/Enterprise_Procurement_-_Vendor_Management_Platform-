'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { reportsApi, requestsApi } from '@/lib/api'
import StatsCard from '@/components/shared/StatsCard'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function EmployeeDashboard() {
  const router = useRouter()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  })

  const { data: recentRequests } = useQuery({
    queryKey: ['requests', { page: 1, page_size: 5 }],
    queryFn: () => requestsApi.list({ page: 1, page_size: 5 }),
  })

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />

  const stats = dashboard?.my_requests || {}

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        description="Overview of your purchase requests"
      >
        <Button onClick={() => router.push('/requests/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Requests"
          value={stats.total || 0}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pending || 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Approved"
          value={stats.approved || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected || 0}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Requests</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/requests')}
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {!recentRequests?.results || recentRequests.results.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No requests yet</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => router.push('/requests/create')}
              >
                Create your first request
              </Button>
            </div>
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
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">
                      Date
                    </th>
                    <th className="py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.results.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {req.title}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {formatCurrency(req.estimated_budget)}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/requests/${req.id}`)
                          }
                        >
                          View
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
