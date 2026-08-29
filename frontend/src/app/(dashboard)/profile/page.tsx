'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, Shield } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const profileSchema = z.object({
  email: z.string().email('Invalid email'),
  phone_number: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      phone_number: user?.phone_number || '',
    },
  })

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      setUser(data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const onSubmit = (data: ProfileForm) => updateProfile(data)

  const roleDescriptions: Record<string, string> = {
    EMPLOYEE: 'Can create purchase requests',
    MANAGER: 'Can approve/reject purchase requests',
    PROCUREMENT: 'Manages RFQs, vendors, and purchase orders',
    FINANCE: 'Reviews invoices and records payments',
    VENDOR: 'Submits bids and invoices',
    ADMIN: 'Full system access and management',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your account information"
      />

      <div className="space-y-6">
        {/* Account Info (read only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{user?.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {user?.role}
                  </span>
                </div>
                {user?.role && roleDescriptions[user.role] && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {roleDescriptions[user.role]}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Username
                </p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="font-medium">{user?.role}</p>
              </div>
              {user?.department_name && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Department
                  </p>
                  <p className="font-medium">
                    {user.department_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editable Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Phone Number{' '}
                  <span className="text-gray-400">(optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="+977 98XXXXXXXX"
                    {...register('phone_number')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || !isDirty}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
