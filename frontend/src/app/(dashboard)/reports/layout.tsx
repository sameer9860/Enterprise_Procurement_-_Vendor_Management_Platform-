'use client'

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import RoleGuard from '@/components/layout/RoleGuard'

const REPORT_TABS = [
  { label: 'Overview', href: '/reports' },
  { label: 'Spend', href: '/reports/spend' },
  { label: 'Vendors', href: '/reports/vendors' },
  { label: 'Downloads', href: '/reports/downloads' },
]

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <RoleGuard allowedRoles={['FINANCE', 'ADMIN', 'PROCUREMENT', 'MANAGER']}>
      <div>
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === tab.href
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {children}
      </div>
    </RoleGuard>
  )
}
