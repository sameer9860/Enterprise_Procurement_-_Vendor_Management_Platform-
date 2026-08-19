import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export default function ResponsiveTable({
  children,
  className,
}: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto -mx-4 sm:mx-0',
        className
      )}
    >
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
