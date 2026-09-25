'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LogoutConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export default function LogoutConfirmation({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md border-0 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Warning Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          {/* Title and Description */}
          <div className="text-center">
            <DialogHeader className="border-0 p-0">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Logout
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-2 text-base text-slate-600">
              Are you sure you want to logout?
            </DialogDescription>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="mt-6 gap-3 sm:gap-3 flex justify-center sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-24"
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
