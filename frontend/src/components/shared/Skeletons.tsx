import { cn } from '@/lib/utils'

function SkeletonBox({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-slate-700 rounded',
        className
      )}
    />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-100 dark:border-slate-800">
        {[40, 25, 15, 12, 8].map((w, i) => (
          <SkeletonBox
            key={i}
            className="h-4"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          {[40, 25, 15, 12, 8].map((w, j) => (
            <SkeletonBox
              key={j}
              className="h-4"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 space-y-3">
      <SkeletonBox className="h-5 w-1/3" />
      <SkeletonBox className="h-8 w-1/2" />
      <SkeletonBox className="h-4 w-2/3" />
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-xl">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-8 w-16" />
          <SkeletonBox className="h-3 w-32" />
        </div>
        <SkeletonBox className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <SkeletonBox className="h-5 w-32" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonBox className="h-4 w-1/2" />
              <SkeletonBox className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <SkeletonBox className="h-5 w-32" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonBox className="h-4 w-2/3" />
              <SkeletonBox className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-64" />
          <SkeletonBox className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-24 rounded-lg" />
          <SkeletonBox className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <SkeletonBox className="h-5 w-32" />
        <TableSkeleton rows={4} />
      </div>
    </div>
  )
}
