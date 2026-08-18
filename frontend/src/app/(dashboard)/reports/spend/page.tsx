'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const PIE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export default function SpendReportPage() {
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [year, setYear] = useState(currentYear)

  const params = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }

  const { data: deptSpend, isLoading: loadingDept } = useQuery({
    queryKey: ['spend-dept', params],
    queryFn: () => reportsApi.spendByDepartment(params),
  })

  const { data: quarterly, isLoading: loadingQtr } = useQuery({
    queryKey: ['spend-quarterly', year],
    queryFn: () => reportsApi.spendByQuarter({ year }),
  })

  const deptChartData = deptSpend?.map((d) => ({
    name: d.department_name,
    spend: parseFloat(d.total_spend),
    transactions: d.transaction_count,
  }))

  const quarterlyData = quarterly?.map((q) => ({
    quarter: q.month,
    spend: parseFloat(q.total_spend),
  }))

  return (
    <div>
      <PageHeader
        title="Spend Analysis"
        description="Detailed spending breakdown by department and period"
      />

      {/* Date filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
            >
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department Spend Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Spend by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDept ? (
              <LoadingSpinner size="sm" />
            ) : !deptChartData?.length ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No spend data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={deptChartData}
                    dataKey="spend"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {deptChartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          PIE_COLORS[index % PIE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quarterly Bar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Quarterly Spend
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setYear((y) => y - 1)}
                >
                  ‹
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {year}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    setYear((y) =>
                      Math.min(y + 1, currentYear)
                    )
                  }
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingQtr ? (
              <LoadingSpinner size="sm" />
            ) : !quarterlyData?.length ? (
              <p className="text-center text-gray-500 text-sm py-8">
                No data for {year}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      `$${(v / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(v: any) => [
                      formatCurrency(v),
                      'Spend',
                    ]}
                  />
                  <Bar
                    dataKey="spend"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Department Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!deptChartData?.length ? (
            <p className="text-center text-gray-500 text-sm py-8">
              No department spend data
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">
                      Department
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">
                      Total Spend
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">
                      Transactions
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">
                      Avg/Transaction
                    </th>
                    <th className="py-3 px-2 font-medium text-gray-500">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deptSpend?.map((dept, index) => {
                    const total = deptSpend.reduce(
                      (sum, d) =>
                        sum + parseFloat(d.total_spend),
                      0
                    )
                    const pct =
                      total > 0
                        ? (
                            (parseFloat(dept.total_spend) /
                              total) *
                            100
                          ).toFixed(1)
                        : '0'
                    return (
                      <tr
                        key={dept.department_name}
                        className="border-b border-gray-50"
                      >
                        <td className="py-3 px-2 font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[
                                    index % PIE_COLORS.length
                                  ],
                              }}
                            />
                            {dept.department_name}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatCurrency(dept.total_spend)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {dept.transaction_count}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {formatCurrency(dept.average_spend)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    PIE_COLORS[
                                      index % PIE_COLORS.length
                                    ],
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
