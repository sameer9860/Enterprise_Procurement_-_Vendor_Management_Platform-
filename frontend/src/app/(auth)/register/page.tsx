'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, type FieldError, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
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

const registerSchema = z
  .object({
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
    confirm_password: z.string().min(1, 'Please confirm your password'),
    role: z.enum([
      'EMPLOYEE',
      'MANAGER',
      'PROCUREMENT',
      'FINANCE',
      'VENDOR',
    ] as const),
    phone_number: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const roles: {
  value: RegisterForm['role']
  label: string
  description: string
}[] = [
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

interface FloatingInputProps {
  id: keyof RegisterForm
  label: string
  type?: string
  register: UseFormRegister<RegisterForm>
  error?: FieldError
  icon: LucideIcon
  autoComplete?: string
  rightElement?: React.ReactNode
}

function FloatingInput({
  id,
  label,
  type = 'text',
  register,
  error,
  icon: Icon,
  autoComplete,
  rightElement,
}: FloatingInputProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4 sm:h-5 sm:w-5" />

      <Input
        id={id}
        type={type}
        placeholder=" "
        autoComplete={autoComplete}
        {...register(id)}
        className={`
          peer h-12 rounded-xl border bg-white pl-10 pr-4 pt-5 pb-1.5 text-base shadow-sm transition-all duration-200
          sm:h-14 sm:pl-12 sm:pt-6 sm:pb-2 sm:text-sm
          focus:border-blue-600 focus:ring-4 focus:ring-blue-100
          ${rightElement ? 'pr-11 sm:pr-12' : ''}
          ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300'
          }
        `}
      />

      <label
        htmlFor={id}
        className="
          absolute left-10 top-3 origin-[0] -translate-y-2.5 scale-75
          transform bg-white px-1 text-slate-500 duration-200
          sm:left-12 sm:top-4 sm:-translate-y-3
          peer-placeholder-shown:translate-y-0
          peer-placeholder-shown:scale-100
          peer-focus:-translate-y-2.5
          peer-focus:scale-75
          peer-focus:text-blue-600
          sm:peer-focus:-translate-y-3
        "
      >
        {label}
      </label>

      {rightElement && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 sm:right-4">
          {rightElement}
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-600 sm:mt-2 sm:text-sm"
        >
          {error.message}
        </motion.p>
      )}
    </div>
  )
}

function PasswordToggle({
  show,
  onToggle,
  label,
}: {
  show: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-slate-500 transition hover:text-slate-700"
      aria-label={label}
    >
      {show ? (
        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </button>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [roleSelected, setRoleSelected] = useState(false)

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
      const { confirm_password: _, ...payload } = data
      await authApi.register(payload)
      toast.success('Account created successfully! Please sign in.')
      router.push('/login')
    } catch (error: any) {
      const apiErrors = error.response?.data
      if (apiErrors) {
        const firstError = Object.values(apiErrors)[0]
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
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-xl sm:rounded-3xl sm:shadow-2xl">
        <CardHeader className="space-y-3 px-4 pt-6 pb-2 sm:space-y-4 sm:px-6 sm:pt-8">
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl"
          >
            <ShoppingCart className="h-6 w-6 text-white sm:h-8 sm:w-8" />
          </motion.div>

          <div className="space-y-1 text-center sm:space-y-2">
            <CardTitle className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 sm:text-base">
              Register to access the procurement platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5"
          >
            <FloatingInput
              id="username"
              label="Username"
              icon={User}
              autoComplete="username"
              register={register}
              error={errors.username}
            />

            <FloatingInput
              id="email"
              label="Email"
              type="email"
              icon={Mail}
              autoComplete="email"
              register={register}
              error={errors.email}
            />

            {/* Floating role select */}
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4 sm:h-5 sm:w-5" />

              <Select
                onValueChange={(value) => {
                  setRoleSelected(true)
                  setValue('role', value as RegisterForm['role'], {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger
                  className={`
                    peer h-12 w-full rounded-xl border bg-white pl-10 pr-10 pt-5 pb-1.5 text-base shadow-sm
                    sm:h-14 sm:pl-12 sm:pt-6 sm:pb-2 sm:text-sm
                    focus:border-blue-600 focus:ring-4 focus:ring-blue-100
                    ${
                      errors.role
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-300'
                    }
                  `}
                >
                  <SelectValue placeholder=" " />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="py-0.5">
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-slate-500">
                          {role.description}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label
                className={`
                  pointer-events-none absolute left-10 top-3 origin-[0] -translate-y-2.5 scale-75
                  transform bg-white px-1 text-slate-500 duration-200
                  sm:left-12 sm:top-4 sm:-translate-y-3
                  ${
                    roleSelected
                      ? '-translate-y-2.5 scale-75 text-blue-600 sm:-translate-y-3'
                      : 'translate-y-0 scale-100'
                  }
                `}
              >
                Role
              </label>

              {errors.role && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 sm:mt-2 sm:text-sm"
                >
                  {errors.role.message}
                </motion.p>
              )}
            </div>

            <FloatingInput
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              autoComplete="new-password"
              register={register}
              error={errors.password}
              rightElement={
                <PasswordToggle
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  label={showPassword ? 'Hide password' : 'Show password'}
                />
              }
            />

            <FloatingInput
              id="confirm_password"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              icon={Lock}
              autoComplete="new-password"
              register={register}
              error={errors.confirm_password}
              rightElement={
                <PasswordToggle
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                />
              }
            />

            <FloatingInput
              id="phone_number"
              label="Phone Number (optional)"
              type="tel"
              icon={Phone}
              autoComplete="tel"
              register={register}
              error={errors.phone_number}
            />

            <p className="text-xs text-slate-500">
              Password must contain uppercase, lowercase, number and special
              character
            </p>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 sm:h-14"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </motion.div>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
