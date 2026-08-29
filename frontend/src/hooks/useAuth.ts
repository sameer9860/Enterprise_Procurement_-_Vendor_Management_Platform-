import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { LoginCredentials } from '@/types/auth'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, setUser, setTokens, logout } = useAuthStore()

  // Fetch profile on mount if token exists but no user in store
  const { data: profileData, isSuccess, isError, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: !!Cookies.get('access_token') && !user,
    retry: false,
  })

  useEffect(() => {
    if (isSuccess && profileData) {
      setUser(profileData)
    }
  }, [isSuccess, profileData, setUser])

  useEffect(() => {
    if (isError) {
      logout()
      router.push('/login')
    }
  }, [isError, logout, router])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokens = await authApi.login(credentials)
      setTokens(tokens)
      const profile = await authApi.getProfile()
      return { tokens, profile }
    },
    onSuccess: ({ profile }) => {
      setUser(profile)
      toast.success(`Welcome back, ${profile.username}!`)
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Invalid credentials'
      )
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refresh = Cookies.get('refresh_token')
      if (refresh) {
        await authApi.logout(refresh)
      }
    },
    onSettled: () => {
      logout()
      queryClient.clear()
      router.push('/login')
      toast.success('Logged out successfully')
    },
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}