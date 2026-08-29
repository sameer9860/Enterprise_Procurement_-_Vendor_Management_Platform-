'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Gavel,
  Trophy,
  TrendingDown,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react'
import { bidsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import RoleGuard from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { useState, Suspense } from 'react'
import GeneratePODialog from '@/components/procurement/GeneratePODialog'

function BidsCompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const rfqId = Number(searchParams.get('rfq_id'))

  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null)
  const [poDialogOpen, setPoDialogOpen] = useState(false)
  const [awardedBidId, setAwardedBidId] = useState<number | null>(null)

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['bids-compare', rfqId],
    queryFn: () => bidsApi.compare(rfqId),
    enabled: !!rfqId,
  })

  const { mutate: shortlistBid } = useMutation({
    mutationFn: (bidId: number) => bidsApi.shortlist(bidId),
    onSuccess: () => {
      toast.success('Bid shortlisted')
      queryClient.invalidateQueries({
        queryKey: ['bids-compare', rfqId],
      })
    },
  })

  const { mutate: rejectBid } = useMutation({
    mutationFn: (bidId: number) => bidsApi.reject(bidId),
    onSuccess: () => {
      toast.success('Bid rejected')
      queryClient.invalidateQueries({
        queryKey: ['bids-compare', rfqId],
      })
    },
  })

  const { mutate: awardBid, isPending: isAwarding } = useMutation({
    mutationFn: (bidId: number) => bidsApi.award(bidId),
    onSuccess: (data: any, bidId: number) => {
      toast.success(`Bid awarded to ${data.vendor}!`)
      queryClient.invalidateQueries({
        queryKey: ['bids-compare', rfqId],
      })
      setAwardDialogOpen(false)
      setAwardedBidId(bidId)
      setPoDialogOpen(true)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to award bid')
    },
  })

  if (!rfqId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No RFQ selected. Please select an RFQ to compare bids.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push('/rfqs')}
        >
          Go to RFQs
        </Button>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner text="Loading bids..." />

  return (
    <div>
      <PageHeader
        title="Bid Comparison"
        description={`RFQ: ${comparison?.rfq_number || ''}`}
      >
        <Button
          variant="outline"
          onClick={() => router.push(`/rfqs/${rfqId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to RFQ
        </Button>
      </PageHeader>

      {/* RFQ Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">RFQ Title</p>
              <p className="font-semibold text-sm">
                {comparison?.rfq_title}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Estimated Budget
              </p>
              <p className="font-semibold text-sm text-blue-600">
                {formatCurrency(
                  comparison?.estimated_budget || '0'
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">RFQ Status</p>
              <StatusBadge
                status={comparison?.status || ''}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Bids</p>
              <p className="font-semibold text-sm">
                {comparison?.statistics?.total_bids || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {comparison?.statistics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingDown className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Lowest Bid</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(comparison.statistics.lowest_bid)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Gavel className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Average Bid</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(comparison.statistics.average_bid)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Highest Bid</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(comparison.statistics.highest_bid)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bids */}
      {!comparison?.bids?.length ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Gavel className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bids submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {comparison.bids.map((bid: any) => (
            <Card
              key={bid.id}
              className={`relative ${
                bid.rank === 1
                  ? 'ring-2 ring-green-400'
                  : ''
              }`}
            >
              {bid.rank === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Lowest Price
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {bid.vendor_name}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">
                        {bid.vendor_rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      #{bid.rank}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center py-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    Total Bid Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bid.total_amount)}
                  </p>
                  {parseFloat(
                    bid.savings_vs_budget?.percentage || '0'
                  ) > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      {bid.savings_vs_budget.percentage}% below
                      budget
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Delivery
                    </span>
                    <span className="font-medium">
                      {bid.delivery_days} days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Validity
                    </span>
                    <span className="font-medium">
                      {bid.validity_days} days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <StatusBadge status={bid.status} />
                  </div>
                </div>

                {/* Items */}
                {bid.items?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      BID ITEMS
                    </p>
                    <div className="space-y-1">
                      {bid.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-gray-600">
                            {item.rfq_item_name} x
                            {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bid.notes && (
                  <p className="text-xs text-gray-500 italic">
                    {bid.notes}
                  </p>
                )}

                {/* Actions */}
                {comparison.status === 'CLOSED' &&
                  bid.status !== 'REJECTED' &&
                  bid.status !== 'AWARDED' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedBidId(bid.id)
                          setAwardDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Award
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600"
                        onClick={() =>
                          shortlistBid(bid.id)
                        }
                      >
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => rejectBid(bid.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                {bid.status === 'AWARDED' && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Awarded
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Award Dialog */}
      <Dialog
        open={awardDialogOpen}
        onOpenChange={setAwardDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Bid</DialogTitle>
            <DialogDescription>
              This will award the bid to the selected vendor.
              All other bids will be automatically rejected. A
              Purchase Order will be generated next.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAwardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedBidId) awardBid(selectedBidId)
              }}
              disabled={isAwarding}
            >
              {isAwarding ? 'Awarding...' : 'Confirm Award'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate PO Dialog */}
      {awardedBidId && (
        <GeneratePODialog
          open={poDialogOpen}
          onClose={() => setPoDialogOpen(false)}
          bidId={awardedBidId}
        />
      )}
    </div>
  )
}

export default function BidsPage() {
  return (
    <RoleGuard allowedRoles={['PROCUREMENT', 'ADMIN', 'MANAGER']}>
      <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
        <BidsCompareContent />
      </Suspense>
    </RoleGuard>
  )
}
