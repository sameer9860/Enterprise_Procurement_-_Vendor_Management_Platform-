'use client'

// Placeholder for Day 19 — Submit Bid Dialog
// Will be fully implemented during the vendor bidding workflow phase.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SubmitBidDialogProps {
  open: boolean
  onClose: () => void
  rfq: any
}

export default function SubmitBidDialog({
  open,
  onClose,
  rfq,
}: SubmitBidDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Bid</DialogTitle>
          <DialogDescription>
            Submit your bid for {rfq?.rfq_number}. Full bidding form
            will be implemented in the vendor workflow phase.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center text-gray-500 text-sm">
          Bid submission form coming soon.
        </div>
      </DialogContent>
    </Dialog>
  )
}
