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
        className="sm:max-w-[480px] border border-slate-300 bg-white p-0 shadow-[0_8px_30px_rgba(15,23,42,0.15)] [&>div]:!block"
      >
        <div className="px-8 pt-8 pb-7">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <DialogHeader className="border-0 p-0 text-left">
                <DialogTitle className="text-[18px] font-normal text-slate-800">
                  Logout
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          <DialogDescription className="text-base font-normal leading-relaxed text-slate-700">
            Are you sure you want to logout from Procurement Platform
          </DialogDescription>
        </div>

        <div className="border-t border-slate-200 px-8 py-5">
          <DialogFooter className="flex justify-end gap-4 sm:justify-end sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 min-w-[110px] rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="h-10 min-w-[110px] rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
