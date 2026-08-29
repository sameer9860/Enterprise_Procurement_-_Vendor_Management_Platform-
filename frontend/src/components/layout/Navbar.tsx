'use client'

import { Menu, LogOut, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useRBAC } from '@/hooks/useRBAC'
import Link from 'next/link'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, isLoggingOut } = useAuth()
  const { user } = useRBAC()

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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-10 gap-2 rounded-lg px-2 hover:bg-slate-100"
              />
            }
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {user?.username}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-semibold text-slate-900">{user?.username}</p>
              <p className="text-xs font-normal text-slate-500">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link
                href="/profile"
                className="flex w-full cursor-pointer items-center"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
