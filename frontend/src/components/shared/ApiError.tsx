import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApiErrorProps {
  error: Error | null
  onRetry?: () => void
  title?: string
}

function getErrorMessage(error: Error | null): {
  title: string
  message: string
  icon: typeof AlertTriangle
} {
  if (!error) {
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred.',
      icon: AlertTriangle,
    }
  }

  const status = (error as any)?.response?.status

  if (typeof window !== 'undefined' && !navigator.onLine) {
    return {
      title: 'No Internet Connection',
      message: 'Check your connection and try again.',
      icon: WifiOff,
    }
  }

  if (status === 401) {
    return {
      title: 'Session Expired',
      message: 'Please log in again to continue.',
      icon: AlertTriangle,
    }
  }

  if (status === 403) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to view this.',
      icon: AlertTriangle,
    }
  }

  if (status === 404) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      icon: AlertTriangle,
    }
  }

  if (status >= 500) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error. Try again later.',
      icon: AlertTriangle,
    }
  }

  return {
    title: 'Error',
    message:
      (error as any)?.response?.data?.detail ||
      (error as any)?.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.',
    icon: AlertTriangle,
  }
}

export default function ApiError({
  error,
  onRetry,
  title,
}: ApiErrorProps) {
  const config = getErrorMessage(error)
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-full mb-4">
        <Icon className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {config.message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}
