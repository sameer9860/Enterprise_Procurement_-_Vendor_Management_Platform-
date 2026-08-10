'use client'

import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface NavbarProps {
  onMenuClick: () => void
}

const roleBadgeColors: Record<string, string> = {
  EMPLOYEE: 'bg-green-500',
  MANAGER: 'bg-blue-500',
  PROCUREMENT: 'bg-purple-500',
  FINANCE: 'bg-yellow-500',
  VENDOR: 'bg-orange-500',
  ADMIN: 'bg-red-500',
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, isLoggingOut } = useAuth()
  const { user } = useRBAC()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left — hamburger menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Right — user menu */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Role badge */}
        <div
          className={`hidden sm:flex items-center px-3 py-1 rounded-full text-white text-xs font-semibold ${
            roleBadgeColors[user?.role || ''] || 'bg-gray-500'
          }`}
        >
          {user?.role}
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-gray-100"
              />
            }
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium">
              {user?.username}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-xs text-gray-500 font-normal">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="flex items-center w-full cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
