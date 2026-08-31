'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Package2,
  Shield,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  FileText,
  Gavel,
  Package,
  Receipt,
  Sparkles,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, logout, isLoggingOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">
                Procurement
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">
                Platform
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              Role Access
            </a>
            <a href="#security" className="hover:text-blue-600 transition-colors">
              Security & Audit
            </a>
            <a href="#about" className="hover:text-blue-600 transition-colors">
              About Us
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-medium px-4 h-9 text-xs sm:text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Go to Dashboard
                  </Button>
                </Link>

                {/* Signed-in User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-slate-100 transition-colors outline-none cursor-pointer border border-slate-200 bg-white"
                    aria-expanded={isDropdownOpen}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden text-xs font-semibold text-slate-700 sm:block max-w-[100px] truncate">
                      {user.username}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.username}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {user.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <User className="h-4 w-4 text-purple-600" />
                        <span>Profile</span>
                      </Link>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          logout()
                        }}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" />
                        <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-medium px-5">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/60 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Enterprise Procurement & Vendor Management Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
            Streamline Requests, RFQs & Bidding in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              One Unified System
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Automate purchase requisitions, manager approvals, multi-vendor bid comparisons, PO generation, and invoice settlements with real-time audit logging and role-based governance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            {user ? (
              <>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 text-base shadow-xl shadow-blue-600/20">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/profile" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 bg-white hover:bg-slate-50 h-12 text-base px-8">
                    View Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 text-base shadow-xl shadow-blue-600/20">
                    Sign In to Platform
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 bg-white hover:bg-slate-50 h-12 text-base px-8">
                    Register Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-md text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">6 Modules</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Requisitions to Invoices</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">100% Audit</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Full Activity Traceability</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">RBAC Security</p>
              <p className="text-xs text-slate-500 font-medium mt-1">6 Strict User Roles</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">PDF Ready</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Auto PO Document Export</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
              Core Platform Features
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Designed for Speed, Governance & Cost Control
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: 'Purchase Requests & Approvals',
                description: 'Employees submit item requests with budget allocations. Department managers review and action approvals instantly.',
                color: 'text-blue-600',
                bg: 'bg-blue-50 border-blue-100',
              },
              {
                icon: FileText,
                title: 'RFQ Broadcast & Bidding',
                description: 'Procurement teams publish RFQs to invited or public vendors to solicit competitive quotation proposals.',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50 border-indigo-100',
              },
              {
                icon: Gavel,
                title: 'Bid Comparison & Awarding',
                description: 'Compare supplier bids side-by-side with lowest-price indicators and scoring matrix before awarding contracts.',
                color: 'text-purple-600',
                bg: 'bg-purple-50 border-purple-100',
              },
              {
                icon: Package,
                title: 'Purchase Order Generation',
                description: 'Generate legal Purchase Orders automatically with line item details, terms, and direct PDF downloads.',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-100',
              },
              {
                icon: Receipt,
                title: 'Invoice & Payment Tracking',
                description: 'Vendors upload invoices against active POs. Finance teams review line items, match limits, and record payments.',
                color: 'text-teal-600',
                bg: 'bg-teal-50 border-teal-100',
              },
              {
                icon: Shield,
                title: 'Audit Logging & Compliance',
                description: 'Complete audit logging records every request, manager approval, status change, and payment transaction.',
                color: 'text-rose-600',
                bg: 'bg-rose-50 border-rose-100',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} border flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Governance Section */}
      <section id="roles" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
              Role-Based Access
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Tailored Workflows for Every Role
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { role: 'EMPLOYEE', title: 'Employees', desc: 'Create purchase requisitions, track request progress, and manage items.' },
              { role: 'MANAGER', title: 'Department Managers', desc: 'Approve or reject team purchase requests and enforce department budgets.' },
              { role: 'PROCUREMENT', title: 'Procurement Specialists', desc: 'Publish RFQs, evaluate vendor bids, award contracts, and issue POs.' },
              { role: 'FINANCE', title: 'Finance & Accounting', desc: 'Verify incoming invoices, match PO balances, and disburse payments.' },
              { role: 'VENDOR', title: 'Verified Vendors', desc: 'Submit quotes on open RFQs, manage company profile, and submit invoices.' },
              { role: 'ADMIN', title: 'System Administrators', desc: 'Manage user access, verify vendor registrations, and audit system security.' },
            ].map((item) => (
              <div key={item.role} className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {item.role}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Column Footer */}
      <footer id="about" className="mt-auto border-t border-slate-200 bg-white text-slate-600 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200/80">
            {/* Column 1: About Us */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Package2 className="h-4 w-4" />
                </div>
                <p className="text-base font-bold text-slate-900">
                  Procurement Platform
                </p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enterprise Procurement & Vendor Management System delivering transparent purchase workflows, competitive supplier bidding, automated purchase order creation, and audit-ready compliance.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-xs font-medium">
                <li>
                  <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link href="/requests" className="hover:text-blue-600 transition-colors">
                    Purchase Requests
                  </Link>
                </li>
                <li>
                  <Link href="/rfqs" className="hover:text-blue-600 transition-colors">
                    RFQs & Bids
                  </Link>
                </li>
                <li>
                  <Link href="/purchase-orders" className="hover:text-blue-600 transition-colors">
                    Purchase Orders
                  </Link>
                </li>
                <li>
                  <Link href="/invoices" className="hover:text-blue-600 transition-colors">
                    Invoices & Payments
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Modules */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Modules
              </h4>
              <ul className="space-y-2.5 text-xs font-medium">
                <li>
                  <Link href="/approvals" className="hover:text-blue-600 transition-colors">
                    Manager Approvals
                  </Link>
                </li>
                <li>
                  <Link href="/bids" className="hover:text-blue-600 transition-colors">
                    Bid Comparison Matrix
                  </Link>
                </li>
                <li>
                  <Link href="/vendors" className="hover:text-blue-600 transition-colors">
                    Vendor Management
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-blue-600 transition-colors">
                    Spend Analytics & Reports
                  </Link>
                </li>
                <li>
                  <Link href="/audit" className="hover:text-blue-600 transition-colors">
                    Audit Activity Logs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Security & Support */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                Security & Specs
              </h4>
              <div className="space-y-2 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Role-Based Access Control (RBAC)
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  JWT Auth & Encrypted Sessions
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Automated Stream Audit Logging
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Credit Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>
              © {new Date().getFullYear()} Procurement Platform. All rights reserved.
            </p>
            <p className="text-slate-600">
              Developed by <strong className="font-bold text-slate-900">Samir Khatiwada</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
