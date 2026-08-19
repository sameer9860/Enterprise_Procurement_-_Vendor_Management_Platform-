interface StatsGridProps {
  children: React.ReactNode
  cols?: 2 | 3 | 4
}

const colsMap = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
}

export default function StatsGrid({
  children,
  cols = 4,
}: StatsGridProps) {
  return (
    <div className={`grid ${colsMap[cols]} gap-4`}>
      {children}
    </div>
  )
}
