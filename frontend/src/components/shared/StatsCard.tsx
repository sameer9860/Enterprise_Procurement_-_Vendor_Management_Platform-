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
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  yellow: 'bg-amber-50 text-amber-600 ring-amber-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  purple: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
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
    <Card className="border-slate-200 shadow-sm ring-0">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  trend.positive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.positive ? '+' : '-'}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1',
              colorMap[color]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
