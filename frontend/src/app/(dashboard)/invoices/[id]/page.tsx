'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  DollarSign,
  Building,
  Package,
  Loader2,
} from 'lucide-react'
import { invoicesApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
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
import { useRBAC } from '@/hooks/useRBAC'

const reviewSchema = z.object({
  rejection_reason: z.string().optional(),
})

type ReviewForm = z.infer<typeof reviewSchema>
type ReviewAction = 'APPROVE' | 'REJECT' | 'UNDER_REVIEW'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isFinance, isAdmin } = useRBAC()
  const id = Number(params.id)

  const [reviewAction, setReviewAction] =
    useState<ReviewAction | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id),
  })

  const { data: timeline } = useQuery({
    queryKey: ['invoice-timeline', id],
    queryFn: () => invoicesApi.timeline(id),
    enabled: !!id,
  })

  const { register, handleSubmit, reset } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
  })

  const { mutate: markUnderReview, isPending: isMarking } =
    useMutation({
      mutationFn: () => invoicesApi.markUnderReview(id),
      onSuccess: () => {
        toast.success('Invoice marked as under review')
        queryClient.invalidateQueries({
          queryKey: ['invoice', id],
        })
      },
    })

  const { mutate: reviewInvoice, isPending: isReviewing } =
    useMutation({
      mutationFn: ({
        action,
        rejection_reason,
      }: {
        action: ReviewAction
        rejection_reason?: string
      }) =>
        invoicesApi.review(id, action, rejection_reason),
      onSuccess: (data) => {
        toast.success(data.message)
        queryClient.invalidateQueries({
          queryKey: ['invoice', id],
        })
        queryClient.invalidateQueries({
          queryKey: ['invoice-timeline', id],
        })
        setReviewDialogOpen(false)
        reset()
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || 'Action failed'
        )
      },
    })

  const handleDownloadFile = async () => {
    try {
      const { download_url } = await invoicesApi.getFileUrl(id)
      window.open(download_url, '_blank')
    } catch {
      toast.error('Failed to get download link')
    }
  }

  const onSubmitReview = (data: ReviewForm) => {
    if (!reviewAction) return
    reviewInvoice({
      action: reviewAction,
      rejection_reason: data.rejection_reason,
    })
  }

  if (isLoading) return <LoadingSpinner text="Loading invoice..." />
  if (!invoice) return null

  const canReview =
    (isFinance || isAdmin) &&
    ['SUBMITTED', 'UNDER_REVIEW'].includes(invoice.status)
  const canMarkUnderReview =
    (isFinance || isAdmin) && invoice.status === 'SUBMITTED'
  const canRecordPayment =
    (isFinance || isAdmin) && invoice.status === 'APPROVED' && !invoice.payment

  const actionConfig = {
    APPROVE: {
      title: 'Approve Invoice',
      description: 'Approve this invoice for payment processing.',
      buttonClass: 'bg-green-600 hover:bg-green-700',
      buttonLabel: 'Confirm Approval',
    },
    REJECT: {
      title: 'Reject Invoice',
      description: 'Reject this invoice. A reason is required.',
      buttonClass: 'bg-red-600 hover:bg-red-700',
      buttonLabel: 'Confirm Rejection',
    },
    UNDER_REVIEW: {
      title: 'Mark Under Review',
      description: 'Mark this invoice as under review.',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
      buttonLabel: 'Confirm',
    },
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoice_number}
        description={`PO: ${invoice.po_number}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {invoice.file_url && (
          <Button variant="outline" onClick={handleDownloadFile}>
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
        )}
        {canMarkUnderReview && (
          <Button
            variant="outline"
            onClick={() => markUnderReview()}
            disabled={isMarking}
          >
            <Eye className="w-4 h-4 mr-2" />
            Mark Under Review
          </Button>
        )}
        {canReview && (
          <>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setReviewAction('APPROVE')
                setReviewDialogOpen(true)
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setReviewAction('REJECT')
                setReviewDialogOpen(true)
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </>
        )}
        {canRecordPayment && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => router.push(`/invoices/${id}/payment`)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Building className="w-3 h-3" />
                  Vendor
                </div>
                <p className="font-semibold text-sm">
                  {invoice.vendor_name}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <DollarSign className="w-3 h-3" />
                  Amount
                </div>
                <p className="font-semibold text-sm text-blue-600">
                  {formatCurrency(invoice.amount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3" />
                  Invoice Date
                </div>
                <p className="font-semibold text-sm">
                  {formatDate(invoice.invoice_date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div
                  className={`flex items-center gap-1 text-xs mb-1 ${
                    new Date(invoice.due_date) < new Date() &&
                    invoice.status !== 'PAID'
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Due Date
                </div>
                <p
                  className={`font-semibold text-sm ${
                    new Date(invoice.due_date) < new Date() &&
                    invoice.status !== 'PAID'
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {formatDate(invoice.due_date)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rejection reason */}
          {invoice.rejection_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-600">
                  {invoice.rejection_reason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          {invoice.items && invoice.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 font-medium text-gray-500">
                          Description
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
                      {invoice.items.map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50"
                        >
                          <td className="py-3">
                            {item.description}
                          </td>
                          <td className="py-3 text-right">
                            {item.quantity}
                          </td>
                          <td className="py-3 text-right">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan={3}
                          className="py-3 text-right font-semibold"
                        >
                          Total:
                        </td>
                        <td className="py-3 text-right font-bold text-blue-600">
                          {formatCurrency(invoice.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment details */}
          {invoice.payment && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Payment Recorded
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-green-600">
                      Amount Paid
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(invoice.payment.amount_paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Method</p>
                    <p className="font-semibold">
                      {invoice.payment.payment_method?.replace(
                        '_',
                        ' '
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">
                      Reference
                    </p>
                    <p className="font-semibold">
                      {invoice.payment.payment_reference || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">
                      Payment Date
                    </p>
                    <p className="font-semibold">
                      {formatDate(invoice.payment.payment_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <StatusBadge
                  status={invoice.status}
                  className="text-sm px-4 py-1.5"
                />
              </div>
              <Separator />
              <div className="space-y-3">
                {[
                  'SUBMITTED',
                  'UNDER_REVIEW',
                  'APPROVED',
                  'PAID',
                ].map((step, index) => {
                  const steps = [
                    'SUBMITTED',
                    'UNDER_REVIEW',
                    'APPROVED',
                    'PAID',
                  ]
                  const currentIdx = steps.indexOf(
                    invoice.status
                  )
                  const stepIdx = steps.indexOf(step)
                  const done = stepIdx < currentIdx
                  const current = stepIdx === currentIdx
                  return (
                    <div
                      key={step}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          done
                            ? 'bg-green-500 text-white'
                            : current
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {done ? '✓' : index + 1}
                      </div>
                      <p
                        className={`text-sm ${
                          current
                            ? 'font-semibold text-blue-600'
                            : done
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.replace('_', ' ')}
                      </p>
                    </div>
                  )
                })}
                {invoice.status === 'REJECTED' && (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                      ✕
                    </div>
                    <p className="text-sm font-semibold text-red-600">
                      Rejected
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Submitted:{' '}
                  {formatDateTime(invoice.submitted_at)}
                </p>
                {invoice.reviewed_at && (
                  <p>
                    Reviewed:{' '}
                    {formatDateTime(invoice.reviewed_at)} by{' '}
                    {invoice.reviewed_by_name}
                  </p>
                )}
                {invoice.approved_at && (
                  <p>
                    Approved:{' '}
                    {formatDateTime(invoice.approved_at)} by{' '}
                    {invoice.approved_by_name}
                  </p>
                )}
                {invoice.paid_at && (
                  <p>
                    Paid: {formatDateTime(invoice.paid_at)} by{' '}
                    {invoice.paid_by_name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          {timeline && timeline.timeline && timeline.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeline.timeline.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2"
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium">
                          {entry.action?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.performed_by} •{' '}
                          {formatDateTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmitReview)}>
            <DialogHeader>
              <DialogTitle>
                {reviewAction
                  ? actionConfig[reviewAction].title
                  : ''}
              </DialogTitle>
              <DialogDescription>
                {reviewAction
                  ? actionConfig[reviewAction].description
                  : ''}
              </DialogDescription>
            </DialogHeader>

            {reviewAction === 'REJECT' && (
              <div className="py-4">
                <Label>
                  Rejection Reason{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  className="mt-2"
                  placeholder="Explain why this invoice is being rejected..."
                  rows={3}
                  {...register('rejection_reason')}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReviewDialogOpen(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={
                  reviewAction
                    ? actionConfig[reviewAction].buttonClass
                    : ''
                }
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : reviewAction ? (
                  actionConfig[reviewAction].buttonLabel
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
