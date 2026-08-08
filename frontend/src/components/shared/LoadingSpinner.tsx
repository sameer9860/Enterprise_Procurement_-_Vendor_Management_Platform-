import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8',
        className
      )}
    >
      <Loader2
        className={cn('animate-spin text-blue-500', sizeMap[size])}
      />
      {text && (
        <p className="mt-3 text-sm text-gray-500">{text}</p>
      )}
    </div>
  )
}
