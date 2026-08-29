'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { invoicesApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import RoleGuard from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'

const paymentSchema = z.object({
  amount_paid: z.coerce.number().min(0.01, 'Amount required'),
  payment_method: z.enum([
    'BANK_TRANSFER',
    'CHEQUE',
    'ONLINE',
    'CASH',
  ]),
  payment_reference: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date required'),
  notes: z.string().optional(),
})

type PaymentForm = z.infer<typeof paymentSchema>

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online Payment' },
  { value: 'CASH', label: 'Cash' },
]

export default function RecordPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = Number(params.id)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount_paid: invoice
        ? parseFloat(invoice.amount)
        : undefined,
      payment_date: new Date().toISOString().split('T')[0],
    },
  })

  const { mutate: recordPayment, isPending } = useMutation({
    mutationFn: (data: PaymentForm) =>
      invoicesApi.recordPayment(id, data),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Payment recorded successfully!')
      queryClient.invalidateQueries({
        queryKey: ['invoice', id],
      })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      router.push(`/invoices/${id}`)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to record payment'
      )
    },
  })

  if (isLoading) return <LoadingSpinner text="Loading invoice..." />
  if (!invoice) return null

  if (invoice.status !== 'APPROVED') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          This invoice must be APPROVED before recording payment.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/invoices/${id}`)}
        >
          Back to Invoice
        </Button>
      </div>
    )
  }

  const onSubmit = (data: PaymentForm) => recordPayment(data)

  return (
    <RoleGuard allowedRoles={['FINANCE', 'ADMIN']}>
      <div>
        <PageHeader
          title="Record Payment"
          description={`Invoice: ${invoice.invoice_number}`}
        >
          <Button
            variant="outline"
            onClick={() => router.push(`/invoices/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>
                      Amount Paid ($){' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-9"
                        defaultValue={invoice.amount}
                        {...register('amount_paid')}
                      />
                    </div>
                    {errors.amount_paid && (
                      <p className="text-red-500 text-sm">
                        {errors.amount_paid.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Invoice amount:{' '}
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>
                      Payment Method{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(v) => {
                        if (v) {
                          setValue(
                            'payment_method',
                            v as PaymentForm['payment_method']
                          )
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem
                            key={method.value}
                            value={method.value}
                          >
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.payment_method && (
                      <p className="text-red-500 text-sm">
                        {errors.payment_method.message}
                      </p>
                    )}
                  </div>

                  {/* Reference */}
                  <div className="space-y-2">
                    <Label>
                      Payment Reference / Transaction ID
                    </Label>
                    <Input
                      placeholder="e.g. TXN-2026-001"
                      {...register('payment_reference')}
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label>
                      Payment Date{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register('payment_date')}
                    />
                    {errors.payment_date && (
                      <p className="text-red-500 text-sm">
                        {errors.payment_date.message}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Any additional notes about this payment..."
                      rows={3}
                      {...register('notes')}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Record Payment —{' '}
                        {formatCurrency(invoice.amount)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Invoice Number
                  </p>
                  <p className="font-semibold">
                    {invoice.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vendor</p>
                  <p className="font-semibold">
                    {invoice.vendor_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Purchase Order
                  </p>
                  <p className="font-semibold">
                    {invoice.po_number}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-gray-500">
                    Invoice Date
                  </p>
                  <p className="font-semibold">
                    {formatDate(invoice.invoice_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-semibold">
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Status
                  </p>
                  <StatusBadge status={invoice.status} />
                </div>

                {invoice.approved_by_name && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-700">
                      Approved by{' '}
                      <strong>{invoice.approved_by_name}</strong> on{' '}
                      {formatDate(invoice.approved_at!)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
