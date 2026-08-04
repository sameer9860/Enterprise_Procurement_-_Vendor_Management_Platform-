'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type FieldError, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Eye,
  EyeOff,
  Loader2,
  ShoppingCart,
  User,
  Lock,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

interface FloatingInputProps {
  id: keyof LoginForm
  label: string
  type?: string
  register: UseFormRegister<LoginForm>
  error?: FieldError
  icon: LucideIcon
  rightElement?: React.ReactNode
}

function FloatingInput({
  id,
  label,
  type = 'text',
  register,
  error,
  icon: Icon,
  rightElement,
}: FloatingInputProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-4 sm:h-5 sm:w-5" />

      <Input
        id={id}
        type={type}
        placeholder=" "
        autoComplete={id === 'password' ? 'current-password' : 'username'}
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

export default function LoginPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      const tokens = await authApi.login(data)

      setTokens(tokens)

      const user = await authApi.getProfile()

      setUser(user)

      toast.success(`Welcome back, ${user.username}!`)

      router.push('/dashboard')
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Invalid username or password'

      toast.error(message)
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
              Welcome Back
            </CardTitle>

            <CardDescription className="text-sm text-slate-500 sm:text-base">
              Sign in to continue to your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FloatingInput
              id="username"
              label="Username"
              icon={User}
              register={register}
              error={errors.username}
            />

            <FloatingInput
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              register={register}
              error={errors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              }
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Keep me signed in
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 sm:h-14"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 tracking-wider text-slate-400">
                  Secure Access
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600">
              No Account?{' '}
              <Link
                href="/register"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
