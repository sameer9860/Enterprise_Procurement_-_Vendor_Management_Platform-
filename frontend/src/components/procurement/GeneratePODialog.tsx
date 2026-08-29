'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'
import { purchaseOrdersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const poSchema = z.object({
  delivery_address: z
    .string()
    .min(10, 'Please enter a full delivery address'),
  expected_delivery_date: z
    .string()
    .min(1, 'Delivery date is required'),
  special_instructions: z.string().optional(),
})

type POForm = z.infer<typeof poSchema>

interface GeneratePODialogProps {
  open: boolean
  onClose: () => void
  bidId: number
}

export default function GeneratePODialog({
  open,
  onClose,
  bidId,
}: GeneratePODialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<POForm>({
    resolver: zodResolver(poSchema),
  })

  const { mutate: generatePO, isPending } = useMutation({
    mutationFn: (data: POForm) =>
      purchaseOrdersApi.generate({ bid_id: bidId, ...data }),
    onSuccess: (po: any) => {
      toast.success(`PO ${po.po_number} generated successfully!`)
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders'],
      })
      reset()
      onClose()
      router.push(`/purchase-orders/${po.id}`)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to generate PO'
      )
    },
  })

  const onSubmit = (data: POForm) => generatePO(data)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Generate Purchase Order
            </DialogTitle>
            <DialogDescription>
              Fill in the delivery details to generate a Purchase
              Order for the awarded vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Delivery Address{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Full delivery address including city and postal code"
                rows={3}
                {...register('delivery_address')}
              />
              {errors.delivery_address && (
                <p className="text-red-500 text-sm">
                  {errors.delivery_address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Expected Delivery Date{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                min={
                  new Date().toISOString().split('T')[0]
                }
                {...register('expected_delivery_date')}
              />
              {errors.expected_delivery_date && (
                <p className="text-red-500 text-sm">
                  {errors.expected_delivery_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Textarea
                placeholder="Any special handling, packaging, or delivery instructions..."
                rows={2}
                {...register('special_instructions')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onClose()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate PO'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
