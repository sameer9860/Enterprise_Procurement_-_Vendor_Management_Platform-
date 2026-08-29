'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { bidsApi } from '@/lib/api'
import { RFQ } from '@/types/procurement'
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
import { formatCurrency } from '@/lib/utils'

const bidItemSchema = z.object({
  rfq_item: z.number(),
  unit_price: z.coerce.number().min(0.01, 'Price required'),
  quantity: z.coerce.number().min(1, 'Quantity required'),
})

const bidSchema = z.object({
  total_amount: z.coerce.number().optional(),
  delivery_days: z.coerce.number().min(1, 'Delivery days required'),
  validity_days: z.coerce.number().min(1),
  notes: z.string().optional(),
  items: z.array(bidItemSchema).min(1),
})

type BidForm = z.infer<typeof bidSchema>

interface SubmitBidDialogProps {
  open: boolean
  onClose: () => void
  rfq: RFQ
}

export default function SubmitBidDialog({
  open,
  onClose,
  rfq,
}: SubmitBidDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      validity_days: 30,
      items: rfq?.items?.map((item) => ({
        rfq_item: item.id,
        unit_price: parseFloat(item.estimated_unit_price),
        quantity: item.quantity,
      })) || [],
    },
  })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const calculatedTotal = (watchedItems || []).reduce((sum, item) => {
    return (
      sum +
      (Number(item?.unit_price) || 0) *
        (Number(item?.quantity) || 0)
    )
  }, 0)

  const { mutate: submitBid, isPending } = useMutation({
    mutationFn: (data: BidForm & { total_amount: number }) =>
      bidsApi.create({ rfq: rfq.id, ...data }),
    onSuccess: () => {
      toast.success('Bid submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to submit bid'
      )
    },
  })

  const onSubmit = (data: BidForm) => {
    submitBid({ ...data, total_amount: calculatedTotal })
  }

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Submit Bid</DialogTitle>
            <DialogDescription>
              {rfq?.rfq_number} — {rfq?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Items */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Bid Items
              </p>
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const rfqItem = rfq?.items?.find(
                    (i) => i.id === field.rfq_item
                  )
                  return (
                    <div
                      key={field.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <p className="font-medium text-sm mb-2">
                        {rfqItem?.item_name}
                        <span className="text-gray-500 font-normal ml-2">
                          (Required: {rfqItem?.quantity})
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">
                            Unit Price ($)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(
                              `items.${index}.unit_price`
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity`)}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-right">
                        Subtotal:{' '}
                        <span className="font-semibold">
                          {formatCurrency(
                            (Number(
                              watchedItems?.[index]?.unit_price
                            ) || 0) *
                              (Number(
                                watchedItems?.[index]?.quantity
                              ) || 0)
                          )}
                        </span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-semibold">Total Bid Amount</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>

            {/* Delivery & Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Delivery Days{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="14"
                  {...register('delivery_days')}
                />
                {errors.delivery_days && (
                  <p className="text-red-500 text-xs">
                    {errors.delivery_days.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Validity Days</Label>
                <Input
                  type="number"
                  min="1"
                  defaultValue={30}
                  {...register('validity_days')}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes / Terms</Label>
              <Textarea
                placeholder="Any additional terms, warranty information, or notes..."
                rows={3}
                {...register('notes')}
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
                  Submitting...
                </>
              ) : (
                `Submit Bid — ${formatCurrency(calculatedTotal)}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
