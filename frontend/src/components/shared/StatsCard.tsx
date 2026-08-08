import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {value}
            </p>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1 font-medium',
                  trend.positive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
