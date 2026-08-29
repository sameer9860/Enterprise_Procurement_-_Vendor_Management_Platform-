'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut, User, ChevronDown, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRBAC } from '@/hooks/useRBAC'
import Link from 'next/link'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, isLoggingOut } = useAuth()
  const { user } = useRBAC()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-slate-500">Welcome back</p>
          <p className="text-base font-semibold text-slate-900">
            {user?.username || 'User'}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 sm:flex">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {user?.role}
          </span>
        </div>

        {/* User Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-slate-100 transition-colors outline-none cursor-pointer"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {user?.username}
            </span>
            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 sm:block transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-slate-950/5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-500" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <User className="h-4 w-4 text-slate-500" />
                <span>Profile</span>
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
