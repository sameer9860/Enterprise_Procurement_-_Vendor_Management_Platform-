'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  User,
  Building,
  DollarSign,
  Calendar,
  Package,
} from 'lucide-react'
import { requestsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import RoleGuard from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

const actionSchema = z.object({
  comments: z.string().optional(),
})

type ActionForm = z.infer<typeof actionSchema>

type ApprovalAction = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'

export default function ApprovalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = Number(params.id)

  const [activeAction, setActiveAction] =
    useState<ApprovalAction | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.get(id),
  })

  const { data: approvalHistory } = useQuery({
    queryKey: ['request-approvals', id],
    queryFn: () => requestsApi.approvalHistory(id),
  })

  const { register, handleSubmit, reset } = useForm<ActionForm>({
    resolver: zodResolver(actionSchema),
  })

  const { mutate: takeAction, isPending } = useMutation({
    mutationFn: ({
      action,
      comments,
    }: {
      action: ApprovalAction
      comments?: string
    }) => requestsApi.approveAction(id, action, comments),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['request', id] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      setDialogOpen(false)
      reset()
      router.push('/approvals')
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Action failed'
      )
    },
  })

  const handleAction = (action: ApprovalAction) => {
    setActiveAction(action)
    setDialogOpen(true)
  }

  const onSubmit = (data: ActionForm) => {
    if (!activeAction) return
    takeAction({ action: activeAction, comments: data.comments })
  }

  if (isLoading) return <LoadingSpinner text="Loading request..." />
  if (!request) return null

  const canTakeAction = request.status === 'PENDING_APPROVAL'

  const actionConfig = {
    APPROVED: {
      title: 'Approve Request',
      description: 'This will approve the purchase request and notify the requester.',
      buttonLabel: 'Confirm Approval',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
      icon: CheckCircle,
      iconClass: 'text-green-600',
    },
    REJECTED: {
      title: 'Reject Request',
      description: 'This will reject the request. Please provide a reason.',
      buttonLabel: 'Confirm Rejection',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
      icon: XCircle,
      iconClass: 'text-red-600',
    },
    CHANGES_REQUESTED: {
      title: 'Request Changes',
      description: 'Ask the requester to modify their request.',
      buttonLabel: 'Send Back for Changes',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: MessageSquare,
      iconClass: 'text-yellow-600',
    },
  }

  const currentConfig = activeAction
    ? actionConfig[activeAction]
    : null

  return (
    <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
      <div>
        <PageHeader
          title="Review Request"
          description={`Request #${request.id}`}
        >
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {request.title}
                    </h2>
                    {request.description && (
                      <p className="text-gray-600 mt-1 text-sm">
                        {request.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={request.status}
                    className="self-start sm:self-auto"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <User className="w-3 h-3" />
                      Requester
                    </div>
                    <p className="font-semibold text-sm">
                      {request.requester_name}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Building className="w-3 h-3" />
                      Department
                    </div>
                    <p className="font-semibold text-sm">
                      {request.department_name}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <DollarSign className="w-3 h-3" />
                      Budget
                    </div>
                    <p className="font-semibold text-sm text-blue-600">
                      {formatCurrency(request.estimated_budget)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3 h-3" />
                      Submitted
                    </div>
                    <p className="font-semibold text-sm">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Requested Items ({request.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 font-medium text-gray-500">
                          Item
                        </th>
                        <th className="text-left py-3 font-medium text-gray-500 hidden sm:table-cell">
                          Specifications
                        </th>
                        <th className="text-right py-3 font-medium text-gray-500">
                          Qty
                        </th>
                        <th className="text-right py-3 font-medium text-gray-500">
                          Unit Price
                        </th>
                        <th className="text-right py-3 font-medium text-gray-500">
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
                          <td className="py-3 text-gray-500 text-xs hidden sm:table-cell">
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
                          Total:
                        </td>
                        <td className="py-3 text-right font-bold text-blue-600 text-base">
                          {formatCurrency(request.estimated_budget)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Approval history */}
            {approvalHistory && approvalHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Previous Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvalHistory.map((approval) => (
                      <div
                        key={approval.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
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
                          <div className="flex justify-between">
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
                            <p className="text-sm text-gray-600 mt-2">
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

          {/* Action sidebar */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Take Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!canTakeAction ? (
                  <div className="text-center py-4">
                    <StatusBadge
                      status={request.status}
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      This request has already been actioned.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction('APPROVED')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() =>
                        handleAction('CHANGES_REQUESTED')
                      }
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleAction('REJECTED')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>

                    <Separator />

                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        The requester will be notified by email of
                        your decision.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {currentConfig && (
                    <currentConfig.icon
                      className={`w-5 h-5 ${currentConfig.iconClass}`}
                    />
                  )}
                  {currentConfig?.title}
                </DialogTitle>
                <DialogDescription>
                  {currentConfig?.description}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label htmlFor="comments">
                  Comments{' '}
                  {activeAction === 'REJECTED' && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Add a comment (optional for approval, required for rejection)..."
                  className="mt-2"
                  rows={3}
                  {...register('comments')}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={currentConfig?.buttonClass}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    currentConfig?.buttonLabel
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
