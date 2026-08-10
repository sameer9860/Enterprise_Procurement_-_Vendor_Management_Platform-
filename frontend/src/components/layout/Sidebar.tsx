'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation } from '@/config/navigation'
import { useRBAC } from '@/hooks/useRBAC'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/auth'
import { LayoutDashboard, LogOut } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const roleBadgeStyles: Record<string, string> = {
  EMPLOYEE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MANAGER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PROCUREMENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  FINANCE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  VENDOR: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ADMIN: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, role } = useRBAC()
  const { logout, isLoggingOut } = useAuth()

  const filteredNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        role ? item.roles.includes(role as UserRole) : false
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-30 transition-transform duration-300 flex flex-col justify-between',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Procurement</p>
                <p className="text-slate-400 text-xs">Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {filteredNavigation.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: User Info & Logout Button with Separator */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-3">
          {/* User profile details (Above) */}
          <div className="flex items-center space-x-3 px-1">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.username}
              </p>
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5',
                  roleBadgeStyles[user?.role || ''] || 'bg-slate-800 text-slate-400 border-slate-700'
                )}
              >
                {user?.role}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-slate-800/80 my-2" />

          {/* Logout button (Below) */}
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
