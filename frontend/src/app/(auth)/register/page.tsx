'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authApi } from '@/lib/api'
import { UserRole } from '@/types/auth'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*]/,
      'Password must contain at least one special character'
    ),
  role: z.enum([
    'EMPLOYEE',
    'MANAGER',
    'PROCUREMENT',
    'FINANCE',
    'VENDOR',
  ] as const),
  phone_number: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

const roles: { value: RegisterForm['role']; label: string; description: string }[] = [
  {
    value: 'EMPLOYEE',
    label: 'Employee',
    description: 'Create purchase requests',
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Approve purchase requests',
  },
  {
    value: 'PROCUREMENT',
    label: 'Procurement Officer',
    description: 'Manage RFQs and POs',
  },
  {
    value: 'FINANCE',
    label: 'Finance Officer',
    description: 'Review invoices and payments',
  },
  {
    value: 'VENDOR',
    label: 'Vendor',
    description: 'Submit bids and invoices',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
      toast.success('Account created successfully! Please sign in.')
      router.push('/login')
    } catch (error: any) {
      const errors = error.response?.data
      if (errors) {
        const firstError = Object.values(errors)[0]
        if (Array.isArray(firstError)) {
          toast.error(firstError[0] as string)
        } else {
          toast.error('Registration failed. Please try again.')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Create account</CardTitle>
        <CardDescription className="text-slate-400">
          Register to access the procurement platform
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Choose a username"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-red-400 text-sm">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-slate-300">Role</Label>
            <Select
              onValueChange={(value) =>
                setValue('role', value as RegisterForm['role'])
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {roles.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    className="text-white hover:bg-slate-600"
                  >
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-slate-400">
                        {role.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-red-400 text-sm">{errors.role.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Must contain uppercase, lowercase, number and special character
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">
              Phone Number{' '}
              <span className="text-slate-500">(optional)</span>
            </Label>
            <Input
              id="phone"
              placeholder="+977 98XXXXXXXX"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              {...register('phone_number')}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-sm text-slate-400 text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}