'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { rfqsApi, requestsApi } from '@/lib/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const rfqSchema = z.object({
  request_id: z.coerce.number().min(1, 'Select a purchase request'),
  deadline: z.string().min(1, 'Deadline is required'),
  description: z.string().optional(),
})

type RFQForm = z.infer<typeof rfqSchema>

interface CreateRFQDialogProps {
  open: boolean
  onClose: () => void
  preselectedRequestId?: number
}

export default function CreateRFQDialog({
  open,
  onClose,
  preselectedRequestId,
}: CreateRFQDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: approvedRequests } = useQuery({
    queryKey: ['requests', { status: 'APPROVED' }],
    queryFn: () =>
      requestsApi.list({ status: 'APPROVED', page_size: 100 }),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RFQForm>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      request_id: preselectedRequestId,
    },
  })

  const { mutate: createRFQ, isPending } = useMutation({
    mutationFn: rfqsApi.createFromRequest,
    onSuccess: (data: any) => {
      toast.success(`RFQ ${data.rfq_number} created successfully!`)
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      reset()
      onClose()
      router.push(`/rfqs/${data.id}`)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to create RFQ'
      )
    },
  })

  const onSubmit = (data: RFQForm) => {
    createRFQ(data)
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create RFQ</DialogTitle>
            <DialogDescription>
              Create a Request for Quotation from an approved
              purchase request. Vendors will be invited to submit bids.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Purchase Request */}
            <div className="space-y-2">
              <Label>
                Purchase Request{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={
                  preselectedRequestId?.toString()
                }
                onValueChange={(v) =>
                  setValue('request_id', Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approved request" />
                </SelectTrigger>
                <SelectContent>
                  {approvedRequests?.results?.map((req: any) => (
                    <SelectItem
                      key={req.id}
                      value={req.id.toString()}
                    >
                      <div>
                        <p className="font-medium">{req.title}</p>
                        <p className="text-xs text-gray-500">
                          {req.department_name} •{' '}
                          {req.estimated_budget}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.request_id && (
                <p className="text-red-500 text-sm">
                  {errors.request_id.message}
                </p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label>
                Bid Deadline{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                {...register('deadline')}
              />
              {errors.deadline && (
                <p className="text-red-500 text-sm">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Additional Instructions</Label>
              <Textarea
                placeholder="Any special instructions for vendors..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                All active vendors will be invited to submit bids.
                You can manage vendors after creation.
              </p>
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
                  Creating...
                </>
              ) : (
                'Create RFQ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
