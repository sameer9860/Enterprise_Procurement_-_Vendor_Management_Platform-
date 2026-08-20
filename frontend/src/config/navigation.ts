import { UserRole } from '@/types/auth'
import {
  LayoutDashboard,
  ShoppingCart,
  CheckSquare,
  FileText,
  Gavel,
  Package,
  Receipt,
  Users,
  BarChart3,
  Shield,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  badge?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['EMPLOYEE', 'MANAGER', 'PROCUREMENT', 'FINANCE', 'VENDOR', 'ADMIN'],
      },
    ],
  },
  {
    title: 'Procurement',
    items: [
      {
        label: 'My Requests',
        href: '/requests',
        icon: ShoppingCart,
        roles: ['EMPLOYEE', 'MANAGER', 'PROCUREMENT', 'ADMIN'],
      },
      {
        label: 'Approvals',
        href: '/approvals',
        icon: CheckSquare,
        roles: ['MANAGER', 'ADMIN'],
      },
      {
        label: 'RFQs',
        href: '/rfqs',
        icon: FileText,
        roles: ['PROCUREMENT', 'ADMIN', 'VENDOR', 'MANAGER'],
      },
      {
        label: 'My Bids',
        href: '/bids/my-bids',
        icon: Gavel,
        roles: ['VENDOR'],
      },
      {
        label: 'Bid Comparison',
        href: '/bids',
        icon: Gavel,
        roles: ['PROCUREMENT', 'ADMIN'],
      },
      {
        label: 'Purchase Orders',
        href: '/purchase-orders',
        icon: Package,
        roles: ['PROCUREMENT', 'ADMIN', 'VENDOR', 'MANAGER', 'FINANCE'],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Invoices',
        href: '/invoices',
        icon: Receipt,
        roles: ['FINANCE', 'ADMIN', 'VENDOR', 'PROCUREMENT'],
      },
    ],
  },
  {
    title: 'Vendors',
    items: [
      {
        label: 'Vendors',
        href: '/vendors',
        icon: Building2,
        roles: ['PROCUREMENT', 'ADMIN'],
      },
      {
        label: 'My Profile',
        href: '/vendors/profile',
        icon: Building2,
        roles: ['VENDOR'],
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['FINANCE', 'ADMIN', 'PROCUREMENT', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        href: '/admin',
        icon: Users,
        roles: ['ADMIN'],
      },
      {
        label: 'Audit Logs',
        href: '/audit',
        icon: Shield,
        roles: ['ADMIN'],
      },
    ],
  },
]
