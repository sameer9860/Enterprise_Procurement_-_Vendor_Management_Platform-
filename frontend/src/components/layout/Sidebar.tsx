'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X, Package2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigation } from '@/config/navigation'
import { useRBAC } from '@/hooks/useRBAC'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/auth'
import LogoutConfirmation from '@/components/shared/LogoutConfirmation'

interface SidebarProps {
  isOpen: boolean
  collapsed?: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { role } = useRBAC()
  const { logout, isLoggingOut } = useAuth()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const touchStartX = useRef<number>(0)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      if (deltaX < -60) onClose()
    }
    const sidebar = sidebarRef.current
    if (sidebar) {
      sidebar.addEventListener('touchstart', handleTouchStart)
      sidebar.addEventListener('touchend', handleTouchEnd)
    }
    return () => {
      if (sidebar) {
        sidebar.removeEventListener('touchstart', handleTouchStart)
        sidebar.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [onClose])

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
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-30 flex h-full flex-col border-r border-slate-200 bg-white shadow-sm',
          'transition-all duration-300 ease-in-out',
          // Mobile: full-width drawer
          'w-[17.5rem]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: static, width toggles
          'lg:static lg:z-auto lg:shadow-none',
          collapsed ? 'lg:w-16' : 'lg:w-[17.5rem]'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Logo header */}
          <div
            className={cn(
              'flex h-16 shrink-0 items-center border-b border-slate-100 transition-all duration-300',
              collapsed ? 'lg:justify-center lg:px-0 px-5 justify-between' : 'justify-between px-5'
            )}
          >
            <div className={cn('flex items-center gap-3', collapsed && 'lg:gap-0')}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Package2 className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  'transition-all duration-300 overflow-hidden',
                  collapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'w-auto opacity-100'
                )}
              >
                <p className="text-sm font-semibold tracking-tight text-slate-900 whitespace-nowrap">
                  Procurement
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap">
                  Platform
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              'flex-1 space-y-6 overflow-y-auto py-5 transition-all duration-300',
              collapsed ? 'lg:px-1.5 px-3' : 'px-3'
            )}
          >
            {filteredNavigation.map((group) => (
              <div key={group.title}>
                {/* Group label — fades out when collapsed on desktop */}
                <p
                  className={cn(
                    'mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 whitespace-nowrap overflow-hidden transition-all duration-300',
                    collapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:px-0' : 'opacity-100'
                  )}
                >
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          collapsed && 'lg:justify-center lg:px-0',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span
                          className={cn(
                            'transition-all duration-300 overflow-hidden whitespace-nowrap',
                            collapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'w-auto opacity-100'
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer sign-out */}
        <div
          className={cn(
            'shrink-0 border-t border-slate-100 bg-slate-50/80 p-4 transition-all duration-300',
            collapsed && 'lg:p-2'
          )}
        >
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            disabled={isLoggingOut}
            title={collapsed ? (isLoggingOut ? 'Signing out...' : 'Sign out') : undefined}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50',
              collapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-500" />
            <span
              className={cn(
                'transition-all duration-300 overflow-hidden whitespace-nowrap',
                collapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'w-auto opacity-100'
              )}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </button>
        </div>
      </aside>

      <LogoutConfirmation
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false)
          logout()
        }}
        isLoading={isLoggingOut}
      />
    </>
  )
}
