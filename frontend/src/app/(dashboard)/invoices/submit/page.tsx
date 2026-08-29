'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, ArrowLeft, Upload } from 'lucide-react'
import { invoicesApi, purchaseOrdersApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
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
import { formatCurrency } from '@/lib/utils'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0.01),
})

const invoiceSchema = z.object({
  purchase_order_id: z.coerce.number().min(1, 'Select a PO'),
  amount: z.coerce.number().optional(),
  invoice_date: z.string().min(1, 'Invoice date required'),
  due_date: z.string().min(1, 'Due date required'),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
})

type InvoiceForm = z.infer<typeof invoiceSchema>

export default function SubmitInvoicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  const { data: myPOs } = useQuery({
    queryKey: ['my-pos-for-invoice'],
    queryFn: () =>
      purchaseOrdersApi.list({
        status: 'ACKNOWLEDGED',
        page_size: 100,
      } as any),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items') || []
  const calculatedTotal = watchedItems.reduce(
    (sum, item) =>
      sum +
      (Number(item?.unit_price) || 0) *
        (Number(item?.quantity) || 0),
    0
  )

  const { mutate: submitInvoice, isPending } = useMutation({
    mutationFn: async (data: InvoiceForm & { amount: number }) => {
      const invoice = await invoicesApi.submit(data)
      if (invoiceFile) {
        await invoicesApi.uploadFile(invoice.id, invoiceFile)
      }
      return invoice
    },
    onSuccess: (invoice: any) => {
      toast.success(
        `Invoice ${invoice.invoice_number || ''} submitted!`
      )
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      router.push(`/invoices/${invoice.id}`)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || 'Failed to submit invoice'
      )
    },
  })

  const onSubmit = (data: InvoiceForm) => {
    const finalAmount = calculatedTotal > 0 ? calculatedTotal : Number(data.amount) || 0
    if (finalAmount <= 0) {
      toast.error('Please enter a total amount or add item prices')
      return
    }
    submitInvoice({ ...data, amount: finalAmount })
  }

  return (
    <RoleGuard allowedRoles={['VENDOR']}>
      <div>
        <PageHeader
          title="Submit Invoice"
          description="Submit an invoice for a completed purchase order"
        >
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </PageHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* PO Selection */}
                  <div className="space-y-2">
                    <Label>
                      Purchase Order{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(v) => {
                        if (v) setValue('purchase_order_id', Number(v))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a purchase order" />
                      </SelectTrigger>
                      <SelectContent>
                        {myPOs?.results?.map((po: any) => (
                          <SelectItem
                            key={po.id}
                            value={po.id.toString()}
                          >
                            <div>
                              <p className="font-medium">
                                {po.po_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {po.purchase_request_title} —{' '}
                                {formatCurrency(po.total_amount)}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purchase_order_id && (
                      <p className="text-red-500 text-sm">
                        {errors.purchase_order_id.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Invoice Date{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register('invoice_date')}
                      />
                      {errors.invoice_date && (
                        <p className="text-red-500 text-sm">
                          {errors.invoice_date.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Due Date{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        {...register('due_date')}
                      />
                      {errors.due_date && (
                        <p className="text-red-500 text-sm">
                          {errors.due_date.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={
                        calculatedTotal > 0
                          ? calculatedTotal.toString()
                          : 'Enter amount or add items below'
                      }
                      {...register('amount')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Payment terms, bank details, or any notes..."
                      rows={3}
                      {...register('notes')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Invoice Items{' '}
                    <span className="text-gray-400 font-normal text-sm">
                      (optional)
                    </span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        description: '',
                        quantity: 1,
                        unit_price: 0,
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No items added. You can add line items or just
                      enter the total amount above.
                    </p>
                  ) : (
                    fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium">
                            Item {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 h-6 w-6 p-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-1">
                            <Label className="text-xs">
                              Description
                            </Label>
                            <Input
                              placeholder="Item description"
                              {...register(
                                `items.${index}.description`
                              )}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              {...register(
                                `items.${index}.quantity`
                              )}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">
                              Unit Price
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(
                                `items.${index}.unit_price`
                              )}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-right mt-2 text-gray-500">
                          Subtotal:{' '}
                          <span className="font-semibold">
                            {formatCurrency(
                              (Number(
                                watchedItems[index]?.unit_price
                              ) || 0) *
                                (Number(
                                  watchedItems[index]?.quantity
                                ) || 0)
                            )}
                          </span>
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Invoice File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    {invoiceFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-600">
                          {invoiceFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(invoiceFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          Upload invoice PDF or image
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, JPEG, PNG up to 10MB
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setInvoiceFile(file)
                      }}
                    />
                  </label>
                </CardContent>
              </Card>
            </div>

            {/* Summary sidebar */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.length > 0 && (
                    <>
                      <div className="space-y-1">
                        {watchedItems.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-gray-500 truncate">
                              {item?.description || `Item ${i + 1}`}
                            </span>
                            <span>
                              {formatCurrency(
                                (Number(item?.unit_price) || 0) *
                                  (Number(item?.quantity) || 0)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-blue-600">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> Your invoice will be
                      reviewed by the finance team before payment is
                      processed.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Invoice'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </RoleGuard>
  )
}
