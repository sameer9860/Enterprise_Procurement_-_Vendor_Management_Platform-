'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Clock,
  Users,
  Package,
  Gavel,
  Lock,
} from 'lucide-react'
import { rfqsApi, bidsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { useRBAC } from '@/hooks/useRBAC'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SubmitBidDialog from '@/components/procurement/SubmitBidDialog'

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isProcurement, isAdmin, isVendor } = useRBAC()
  const id = Number(params.id)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [bidDialogOpen, setBidDialogOpen] = useState(false)

  const { data: rfq, isLoading } = useQuery({
    queryKey: ['rfq', id],
    queryFn: () => rfqsApi.get(id),
  })

  const { data: bids } = useQuery({
    queryKey: ['bids-compare', id],
    queryFn: () => bidsApi.compare(id),
    enabled: !!(isProcurement || isAdmin),
  })

  const { mutate: closeRFQ, isPending: isClosing } = useMutation({
    mutationFn: () => rfqsApi.close(id),
    onSuccess: () => {
      toast.success('RFQ closed successfully')
      queryClient.invalidateQueries({ queryKey: ['rfq', id] })
      setCloseDialogOpen(false)
    },
    onError: () => toast.error('Failed to close RFQ'),
  })

  if (isLoading) return <LoadingSpinner text="Loading RFQ..." />
  if (!rfq) return null

  const isOpen = rfq.status === 'OPEN'
  const isDeadlinePassed = new Date(rfq.deadline) < new Date()

  return (
    <div>
      <PageHeader
        title={rfq.rfq_number}
        description={rfq.title}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {isVendor && isOpen && (
          <Button onClick={() => setBidDialogOpen(true)}>
            <Gavel className="w-4 h-4 mr-2" />
            Submit Bid
          </Button>
        )}
        {(isProcurement || isAdmin) && isOpen && (
          <>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/bids?rfq_id=${id}`)
              }
            >
              <Gavel className="w-4 h-4 mr-2" />
              Compare Bids
            </Button>
            <Button
              variant="destructive"
              onClick={() => setCloseDialogOpen(true)}
            >
              <Lock className="w-4 h-4 mr-2" />
              Close RFQ
            </Button>
          </>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={rfq.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Deadline</p>
                  <p
                    className={`text-sm font-semibold ${
                      isDeadlinePassed && isOpen
                        ? 'text-red-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {formatDateTime(rfq.deadline)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Created By
                  </p>
                  <p className="text-sm font-semibold">
                    {rfq.created_by_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Created At
                  </p>
                  <p className="text-sm font-semibold">
                    {formatDate(rfq.created_at)}
                  </p>
                </div>
              </div>

              {rfq.description && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-gray-700">
                    {rfq.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Required Items ({rfq.items?.length || 0})
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
                        Est. Unit Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.items?.map((item: any) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bid summary for procurement */}
          {(isProcurement || isAdmin) && bids && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gavel className="w-4 h-4" />
                  Bids Received ({bids.statistics?.total_bids || 0})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/bids?rfq_id=${id}`)
                  }
                >
                  Compare Bids
                </Button>
              </CardHeader>
              <CardContent>
                {!bids.bids || bids.bids.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">
                    No bids submitted yet
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">
                          Lowest Bid
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(
                            bids.statistics.lowest_bid
                          )}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">
                          Average Bid
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(
                            bids.statistics.average_bid
                          )}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">
                          Highest Bid
                        </p>
                        <p className="text-lg font-bold text-orange-700">
                          {formatCurrency(
                            bids.statistics.highest_bid
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {bids.bids.slice(0, 3).map((bid: any) => (
                        <div
                          key={bid.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {bid.rank}
                            </span>
                            <div>
                              <p className="font-medium text-sm">
                                {bid.vendor_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {bid.delivery_days} days delivery
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {formatCurrency(bid.total_amount)}
                            </p>
                            <StatusBadge status={bid.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invited Vendors (
                {rfq.invited_vendor_names?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!rfq.invited_vendor_names || rfq.invited_vendor_names.length === 0 ? (
                <p className="text-sm text-gray-500">
                  All active vendors invited
                </p>
              ) : (
                <div className="space-y-2">
                  {rfq.invited_vendor_names.map((name: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {name[0]}
                      </div>
                      <span className="text-sm">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Purchase Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {rfq.purchase_request_title}
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 text-sm"
                onClick={() =>
                  router.push(
                    `/requests/${rfq.purchase_request}`
                  )
                }
              >
                View Request →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Close RFQ Dialog */}
      <Dialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close RFQ</DialogTitle>
            <DialogDescription>
              Closing this RFQ will stop accepting new bids. You
              can then select a winning bid and generate a PO. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => closeRFQ()}
              disabled={isClosing}
            >
              {isClosing ? 'Closing...' : 'Close RFQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Bid Dialog (vendors) */}
      {isVendor && rfq && (
        <SubmitBidDialog
          open={bidDialogOpen}
          onClose={() => setBidDialogOpen(false)}
          rfq={rfq}
        />
      )}
    </div>
  )
}
