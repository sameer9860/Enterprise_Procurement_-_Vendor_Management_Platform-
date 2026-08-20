'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Building2,
  Upload,
  FileText,
  Globe,
  MapPin,
} from 'lucide-react'
import { vendorsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import RoleGuard from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import { VendorDocument, VendorCategory } from '@/types/procurement'

const DOCUMENT_TYPES = [
  { value: 'REGISTRATION', label: 'Company Registration' },
  { value: 'TAX', label: 'Tax Certificate' },
  { value: 'LICENSE', label: 'Business License' },
  { value: 'OTHER', label: 'Other' },
]

export default function VendorProfilePage() {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('REGISTRATION')

  const { data: vendors, isLoading: loadingList } = useQuery({
    queryKey: ['my-vendor-list'],
    queryFn: () => vendorsApi.list(),
  })

  const listVendor = vendors?.results?.[0]

  const { data: vendor, isLoading: loadingDetail } = useQuery({
    queryKey: ['my-vendor-profile', listVendor?.id],
    queryFn: () => vendorsApi.get(listVendor!.id),
    enabled: !!listVendor?.id,
  })

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !vendor) return

    setUploading(true)
    try {
      await vendorsApi.uploadDocument(vendor.id, file, docType)
      toast.success('Document uploaded successfully')
      queryClient.invalidateQueries({
        queryKey: ['my-vendor-profile', vendor.id],
      })
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loadingList || loadingDetail)
    return <LoadingSpinner text="Loading vendor profile..." />

  if (!vendor) {
    return (
      <RoleGuard allowedRoles={['VENDOR']}>
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            No vendor profile found
          </p>
          <p className="text-gray-500 text-sm">
            Contact admin to set up your vendor profile.
          </p>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['VENDOR']}>
      <div>
        <PageHeader
          title="Vendor Profile"
          description={vendor.company_name}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    {vendor.company_name[0]}
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {vendor.company_name}
                    </p>
                    <StatusBadge
                      status={vendor.status}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Registration Number
                    </p>
                    <p className="font-medium">
                      {vendor.registration_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Rating
                    </p>
                    <p className="font-medium">
                      ⭐ {vendor.rating}
                    </p>
                  </div>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Address
                      </p>
                      <p className="font-medium">
                        {vendor.address}, {vendor.city},{' '}
                        {vendor.country}
                      </p>
                    </div>
                  </div>
                  {vendor.website && (
                    <div className="flex items-start gap-1">
                      <Globe className="w-3 h-3 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Website
                        </p>
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {vendor.categories && vendor.categories.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.categories.map((cat: VendorCategory) => (
                        <Badge key={cat.id} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents ({vendor.documents?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button
                      variant="outline"
                      disabled={uploading}
                      className="pointer-events-none"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleDocUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Document list */}
                {!vendor.documents?.length ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {vendor.documents.map((doc: VendorDocument) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">
                              {doc.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.document_type} •{' '}
                              {formatDateTime(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Sidebar */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <StatusBadge
                    status={vendor.status}
                    className="text-sm px-4 py-1.5"
                  />
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">
                      Account Email
                    </p>
                    <p className="font-medium">{vendor.user_email}</p>
                  </div>
                  {vendor.verified_at && (
                    <div>
                      <p className="text-xs text-gray-500">
                        Verified At
                      </p>
                      <p className="font-medium">
                        {formatDateTime(vendor.verified_at)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">
                      Member Since
                    </p>
                    <p className="font-medium">
                      {formatDateTime(vendor.created_at)}
                    </p>
                  </div>
                </div>

                {vendor.status === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      Your account is pending verification by the
                      procurement team. You will be notified once
                      verified.
                    </p>
                  </div>
                )}

                {vendor.status === 'SUSPENDED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-800">
                      Your account has been suspended. Contact admin
                      for more information.
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
