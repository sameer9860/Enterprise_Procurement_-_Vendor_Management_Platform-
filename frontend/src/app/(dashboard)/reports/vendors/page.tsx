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
} from 'recharts'
import { reportsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Star, Trophy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function VendorPerformancePage() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendor-performance'],
    queryFn: () => reportsApi.vendorPerformance(),
  })

  const topVendors = vendors?.slice(0, 5) || []

  const winRateData = topVendors.map((v) => ({
    name:
      v.company_name.length > 12
        ? v.company_name.slice(0, 12) + '...'
        : v.company_name,
    winRate: v.win_rate_percent,
    deliveryRate: v.delivery_rate_percent,
  }))

  const spendData = topVendors.map((v) => ({
    name:
      v.company_name.length > 12
        ? v.company_name.slice(0, 12) + '...'
        : v.company_name,
    spend: v.total_invoiced_amount,
  }))

  if (isLoading)
    return <LoadingSpinner text="Loading vendor reports..." />

  return (
    <div>
      <PageHeader
        title="Vendor Performance"
        description="Compare and analyze vendor performance metrics"
      />

      {!vendors?.length ? (
        <EmptyState
          icon={Building2}
          title="No vendor data"
          description="Vendor performance data will appear after bids are awarded and orders completed"
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Win Rate vs Delivery Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Win Rate vs Delivery Rate (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={winRateData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v: any) => `${v}%`}
                    />
                    <Bar
                      dataKey="winRate"
                      name="Win Rate"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="deliveryRate"
                      name="Delivery Rate"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Total Spend per Vendor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Total Invoiced Amount (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={spendData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        `$${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(v: any) =>
                        formatCurrency(v)
                      }
                    />
                    <Bar
                      dataKey="spend"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                All Vendor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-3 font-medium text-gray-500">
                        Rank
                      </th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500">
                        Vendor
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">
                        Bids
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">
                        Win Rate
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 hidden lg:table-cell">
                        Delivery Rate
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 hidden md:table-cell">
                        Rating
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">
                        Total Invoiced
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors?.map((vendor, index) => (
                      <tr
                        key={vendor.vendor_id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {index === 0 ? (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <span className="text-gray-400 font-medium">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {vendor.company_name[0]}
                            </div>
                            <div>
                              <p className="font-medium">
                                {vendor.company_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {vendor.city}, {vendor.country}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right hidden md:table-cell">
                          <span>
                            {vendor.awarded_bids}/
                            {vendor.total_bids}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{
                                  width: `${vendor.win_rate_percent}%`,
                                }}
                              />
                            </div>
                            <span className="font-medium">
                              {vendor.win_rate_percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right hidden lg:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{
                                  width: `${vendor.delivery_rate_percent}%`,
                                }}
                              />
                            </div>
                            <span className="font-medium">
                              {vendor.delivery_rate_percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{vendor.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {formatCurrency(
                            vendor.total_invoiced_amount
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
