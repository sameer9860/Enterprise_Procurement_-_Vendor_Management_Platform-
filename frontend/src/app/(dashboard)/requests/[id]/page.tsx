'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Clock,
  User,
  Building,
  DollarSign,
  Package,
  Download,
  RotateCcw,
} from 'lucide-react'
import { requestsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { useRBAC } from '@/hooks/useRBAC'

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isEmployee } = useRBAC()
  const id = Number(params.id)

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.get(id),
  })

  const { data: approvalHistory } = useQuery({
    queryKey: ['request-approvals', id],
    queryFn: () => requestsApi.approvalHistory(id),
    enabled: !!id,
  })

  const { mutate: resubmit, isPending } = useMutation({
    mutationFn: () => requestsApi.resubmit(id),
    onSuccess: () => {
      toast.success('Request resubmitted for approval')
      queryClient.invalidateQueries({ queryKey: ['request', id] })
    },
    onError: () => toast.error('Failed to resubmit request'),
  })

  if (isLoading) return <LoadingSpinner text="Loading request..." />
  if (!request) return null

  const canResubmit =
    isEmployee && request.status === 'CHANGES_REQUESTED'

  return (
    <div>
      <PageHeader
        title={request.title}
        description={`Request #${request.id}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {canResubmit && (
          <Button onClick={() => resubmit()} disabled={isPending}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Resubmit
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">Requester</span>
                </div>
                <p className="font-semibold text-sm">
                  {request.requester_name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="text-xs">Department</span>
                </div>
                <p className="font-semibold text-sm">
                  {request.department_name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Budget</span>
                </div>
                <p className="font-semibold text-sm">
                  {formatCurrency(request.estimated_budget)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Submitted</span>
                </div>
                <p className="font-semibold text-sm">
                  {formatDate(request.created_at)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {request.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {request.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Items ({request.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-medium">
                        Item
                      </th>
                      <th className="text-left py-3 text-gray-500 font-medium hidden sm:table-cell">
                        Specifications
                      </th>
                      <th className="text-right py-3 text-gray-500 font-medium">
                        Qty
                      </th>
                      <th className="text-right py-3 text-gray-500 font-medium">
                        Unit Price
                      </th>
                      <th className="text-right py-3 text-gray-500 font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50"
                      >
                        <td className="py-3 font-medium">
                          {item.item_name}
                        </td>
                        <td className="py-3 text-gray-500 hidden sm:table-cell">
                          {item.specifications || '—'}
                        </td>
                        <td className="py-3 text-right">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(item.estimated_unit_price)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(item.estimated_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 text-right font-semibold"
                      >
                        Total Estimated:
                      </td>
                      <td className="py-3 text-right font-bold text-blue-600">
                        {formatCurrency(request.estimated_budget)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          {approvalHistory && approvalHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Approval History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvalHistory.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex items-start space-x-3"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          approval.action === 'APPROVED'
                            ? 'bg-green-500'
                            : approval.action === 'REJECTED'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {approval.approver_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(approval.created_at)}
                          </p>
                        </div>
                        <StatusBadge
                          status={approval.action}
                          className="mt-1"
                        />
                        {approval.comments && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded p-2">
                            {approval.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">
                Request Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <StatusBadge
                  status={request.status}
                  className="text-sm px-4 py-1.5"
                />
              </div>

              <Separator />

              {/* Status Timeline */}
              <div className="space-y-3">
                {[
                  { label: 'Submitted', status: 'PENDING_APPROVAL' },
                  { label: 'Approved', status: 'APPROVED' },
                  { label: 'RFQ Created', status: 'RFQ_CREATED' },
                  {
                    label: 'Vendor Selected',
                    status: 'VENDOR_SELECTED',
                  },
                  { label: 'PO Generated', status: 'PO_GENERATED' },
                  {
                    label: 'Invoice Received',
                    status: 'INVOICE_RECEIVED',
                  },
                  { label: 'Completed', status: 'COMPLETED' },
                ].map((step, index) => {
                  const allStatuses = [
                    'PENDING_APPROVAL',
                    'APPROVED',
                    'RFQ_CREATED',
                    'VENDOR_SELECTED',
                    'PO_GENERATED',
                    'INVOICE_RECEIVED',
                    'COMPLETED',
                  ]
                  const currentIndex = allStatuses.indexOf(
                    request.status
                  )
                  const stepIndex = allStatuses.indexOf(step.status)
                  const isCompleted = stepIndex < currentIndex
                  const isCurrent = stepIndex === currentIndex
                  const isRejected =
                    request.status === 'REJECTED' && stepIndex === 0

                  return (
                    <div
                      key={step.status}
                      className="flex items-center space-x-3"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <p
                        className={`text-sm ${
                          isCurrent
                            ? 'font-semibold text-blue-600'
                            : isCompleted
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  )
                })}

                {request.status === 'REJECTED' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                      ✕
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      Rejected
                    </p>
                  </div>
                )}

                {request.status === 'CANCELLED' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold">
                      —
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      Cancelled
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Created: {formatDateTime(request.created_at)}
                </p>
                <p>
                  Updated: {formatDateTime(request.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}