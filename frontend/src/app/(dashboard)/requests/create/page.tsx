'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  ShoppingCart,
} from 'lucide-react'
import { requestsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

const itemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  estimated_unit_price: z.coerce
    .number()
    .min(0.01, 'Price must be greater than 0'),
  specifications: z.string().optional(),
})

const requestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  estimated_budget: z.coerce
    .number()
    .min(1, 'Budget must be greater than 0'),
  items: z
    .array(itemSchema)
    .min(1, 'At least one item is required'),
})

type RequestForm = z.infer<typeof requestSchema>

export default function CreateRequestPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      items: [
        {
          item_name: '',
          quantity: 1,
          estimated_unit_price: 0,
          specifications: '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')

  const totalEstimated = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.estimated_unit_price) || 0
    return sum + qty * price
  }, 0)

  const { mutate: createRequest, isPending } = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: (data) => {
      toast.success('Purchase request created successfully!')
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      router.push(`/requests/${data.id}`)
    },
    onError: (error: any) => {
      const apiData = error.response?.data
      let message = 'Failed to create request'
      if (typeof apiData === 'string') {
        message = apiData
      } else if (apiData?.detail) {
        message = apiData.detail
      } else if (apiData?.message) {
        message = apiData.message
      } else if (apiData && typeof apiData === 'object') {
        const firstKey = Object.keys(apiData)[0]
        const val = apiData[firstKey]
        if (Array.isArray(val)) {
          message = `${firstKey}: ${val[0]}`
        } else if (typeof val === 'string') {
          message = `${firstKey}: ${val}`
        }
      }
      toast.error(message)
    },
  })

  const onSubmit = (data: RequestForm) => {
    createRequest(data)
  }

  return (
    <div>
      <PageHeader
        title="Create Purchase Request"
        description="Submit a new purchase request for approval"
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. 50 Dell Laptops for Engineering Team"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{' '}
                    <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Explain why this purchase is needed..."
                    rows={3}
                    {...register('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">
                    Estimated Budget ($){' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    {...register('estimated_budget')}
                  />
                  {errors.estimated_budget && (
                    <p className="text-red-500 text-sm">
                      {errors.estimated_budget.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Items{' '}
                  <span className="text-gray-400 font-normal text-sm">
                    ({fields.length})
                  </span>
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      item_name: '',
                      quantity: 1,
                      estimated_unit_price: 0,
                      specifications: '',
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.items?.root && (
                  <p className="text-red-500 text-sm">
                    {errors.items.root.message}
                  </p>
                )}

                {fields.map((field, index) => (
                  <div key={field.id}>
                    {index > 0 && (
                      <Separator className="mb-4" />
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          Item {index + 1}
                        </p>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Item Name *
                          </Label>
                          <Input
                            placeholder="e.g. Dell Latitude 5440"
                            {...register(`items.${index}.item_name`)}
                          />
                          {errors.items?.[index]?.item_name && (
                            <p className="text-red-500 text-xs">
                              {errors.items[index]?.item_name?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Specifications
                          </Label>
                          <Input
                            placeholder="e.g. 16GB RAM, i7"
                            {...register(
                              `items.${index}.specifications`
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Quantity *
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...register(`items.${index}.quantity`)}
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-red-500 text-xs">
                              {errors.items[index]?.quantity?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Unit Price ($) *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1000"
                            {...register(
                              `items.${index}.estimated_unit_price`
                            )}
                          />
                          {errors.items?.[index]
                            ?.estimated_unit_price && (
                            <p className="text-red-500 text-xs">
                              {
                                errors.items[index]
                                  ?.estimated_unit_price?.message
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Item subtotal */}
                      <div className="flex justify-end">
                        <p className="text-sm text-gray-500">
                          Subtotal:{' '}
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(
                              (Number(
                                watchedItems[index]?.quantity
                              ) || 0) *
                                (Number(
                                  watchedItems[index]
                                    ?.estimated_unit_price
                                ) || 0)
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Request Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Items</span>
                    <span className="font-medium">{fields.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Items Value
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totalEstimated)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Estimate</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(totalEstimated)}
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Your request will be sent to
                    your manager for approval after submission.
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
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}