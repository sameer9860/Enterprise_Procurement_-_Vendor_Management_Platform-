'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  Package,
  Clock,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react'
import { purchaseOrdersApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useRBAC } from '@/hooks/useRBAC'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['ACKNOWLEDGED', 'CANCELLED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DELIVERED', 'CANCELLED'],
}

export default function PODetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isProcurement, isAdmin, isVendor } = useRBAC()
  const id = Number(params.id)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrdersApi.get(id),
  })

  const { data: timeline } = useQuery({
    queryKey: ['po-timeline', id],
    queryFn: () => purchaseOrdersApi.timeline(id),
    enabled: !!id,
  })

  const { mutate: sendToVendor, isPending: isSending } = useMutation({
    mutationFn: () => purchaseOrdersApi.sendToVendor(id),
    onSuccess: () => {
      toast.success('PO sent to vendor successfully')
      queryClient.invalidateQueries({
        queryKey: ['purchase-order', id],
      })
    },
    onError: () => toast.error('Failed to send PO'),
  })

  const { mutate: acknowledge, isPending: isAcknowledging } =
    useMutation({
      mutationFn: () => purchaseOrdersApi.acknowledge(id),
      onSuccess: () => {
        toast.success('PO acknowledged successfully')
        queryClient.invalidateQueries({
          queryKey: ['purchase-order', id],
        })
      },
      onError: (error: any) =>
        toast.error(
          error.response?.data?.error || 'Failed to acknowledge'
        ),
    })

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: (status: string) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated successfully')
      queryClient.invalidateQueries({
        queryKey: ['purchase-order', id],
      })
      queryClient.invalidateQueries({
        queryKey: ['po-timeline', id],
      })
      setStatusDialogOpen(false)
    },
    onError: (error: any) =>
      toast.error(
        error.response?.data?.error || 'Failed to update status'
      ),
  })

  const handleDownloadPDF = async () => {
    try {
      const blob = await purchaseOrdersApi.downloadPdf(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${po?.po_number}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  if (isLoading) return <LoadingSpinner text="Loading PO..." />
  if (!po) return null

  const availableTransitions =
    STATUS_TRANSITIONS[po.status] || []
  const canSend =
    (isProcurement || isAdmin) && po.status === 'DRAFT'
  const canAcknowledge = isVendor && po.status === 'SENT'
  const canUpdateStatus =
    (isProcurement || isAdmin) && availableTransitions.length > 0

  return (
    <div>
      <PageHeader
        title={po.po_number}
        description={po.purchase_request_title}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        {canSend && (
          <Button
            onClick={() => sendToVendor()}
            disabled={isSending}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send to Vendor'}
          </Button>
        )}
        {canAcknowledge && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => acknowledge()}
            disabled={isAcknowledging}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isAcknowledging ? 'Acknowledging...' : 'Acknowledge PO'}
          </Button>
        )}
        {canUpdateStatus && (
          <Button
            variant="outline"
            onClick={() => setStatusDialogOpen(true)}
          >
            Update Status
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Building className="w-3 h-3" />
                  Vendor
                </div>
                <p className="font-semibold text-sm">
                  {po.vendor_name}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Package className="w-3 h-3" />
                  Total
                </div>
                <p className="font-semibold text-sm text-blue-600">
                  {formatCurrency(po.total_amount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  Expected Delivery
                </div>
                <p className="font-semibold text-sm">
                  {formatDate(po.expected_delivery_date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3" />
                  Created
                </div>
                <p className="font-semibold text-sm">
                  {formatDate(po.created_at)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Delivery Address
                </p>
                <p className="text-sm">{po.delivery_address}</p>
              </div>
              {po.special_instructions && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Special Instructions
                  </p>
                  <p className="text-sm text-gray-700">
                    {po.special_instructions}
                  </p>
                </div>
              )}
              {po.sent_at && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Sent to Vendor
                  </p>
                  <p className="text-sm">
                    {formatDateTime(po.sent_at)}
                  </p>
                </div>
              )}
              {po.acknowledged_at && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Acknowledged At
                  </p>
                  <p className="text-sm">
                    {formatDateTime(po.acknowledged_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Order Items ({po.items?.length || 0})
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
                        Specs
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
                    {po.items?.map((item: any) => (
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
                        colSpan={4}
                        className="py-3 text-right font-semibold"
                      >
                        Total:
                      </td>
                      <td className="py-3 text-right font-bold text-blue-600 text-lg">
                        {formatCurrency(po.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PO Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <StatusBadge
                  status={po.status}
                  className="text-sm px-4 py-1.5"
                />
              </div>
              <Separator />
              <div className="space-y-3">
                {[
                  'DRAFT',
                  'SENT',
                  'ACKNOWLEDGED',
                  'IN_PROGRESS',
                  'DELIVERED',
                ].map((step, index) => {
                  const steps = [
                    'DRAFT',
                    'SENT',
                    'ACKNOWLEDGED',
                    'IN_PROGRESS',
                    'DELIVERED',
                  ]
                  const currentIdx = steps.indexOf(po.status)
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
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {timeline && timeline.timeline && timeline.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Activity Timeline
                </CardTitle>
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

      {/* Update Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update PO Status</DialogTitle>
            <DialogDescription>
              Current status: {po.status}. Select the new status.
            </DialogDescription>
          </DialogHeader>
          <Select
            onValueChange={(v) => {
              if (typeof v === 'string') setNewStatus(v)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {availableTransitions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => newStatus && updateStatus(newStatus)}
              disabled={!newStatus || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
