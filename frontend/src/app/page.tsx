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
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, logout, isLoggingOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
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
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
              <Package2 className="h-4.5 w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-900 leading-none mb-0.5">
                Procurement
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 leading-none">
                Platform
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
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
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-semibold px-4 h-9 text-xs sm:text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Go to Dashboard
                  </Button>
                </Link>

                {/* Signed-in User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex h-9 items-center gap-2 rounded-xl px-2.5 hover:bg-slate-100 transition-colors outline-none cursor-pointer border border-slate-200/90 bg-white shadow-2xs"
                    aria-expanded={isDropdownOpen}
                  >
                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden text-xs font-bold text-slate-700 sm:block max-w-[100px] truncate">
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
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold text-xs sm:text-sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-semibold px-4 h-9 text-xs sm:text-sm">
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
      <section className="relative pt-14 pb-16 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Clean typography & CTAs */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.16]">
                Streamline your next <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  procurement workflow.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                Procurement Platform connects enterprises with verified vendors. Manage purchase requisitions, compare competitive RFQ bids, generate POs, and track invoices all in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {user ? (
                  <>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 text-sm shadow-md shadow-blue-600/20">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/profile" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 bg-white hover:bg-slate-50 h-11 text-sm px-6 font-bold">
                        View Profile
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 text-sm shadow-md shadow-blue-600/20">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 bg-white hover:bg-slate-50 h-11 text-sm px-6 font-bold">
                        Register Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-5 pt-3 border-t border-slate-200/80 text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  100% Audit Logging
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Auto PO PDF Export
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Strict RBAC Rules
                </span>
              </div>
            </div>

            {/* Right Column: High-Speed CDN Image + Live Interactive Dashboard Card Fallback */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-xl bg-white border border-slate-200 shadow-xl p-2 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 rounded-md mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    app.procurement.internal
                  </span>
                </div>

                {!imageError ? (
                  <div className="relative rounded-md overflow-hidden border border-slate-200/80">
                    <img
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80"
                      alt="Procurement Platform Executive Dashboard"
                      onError={() => setImageError(true)}
                      className="w-full h-[320px] object-cover rounded-md"
                    />
                  </div>
                ) : (
                  /* Interactive UI Component Mockup Fallback if image ever fails to load */
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spend</p>
                        <p className="text-base font-extrabold text-slate-900">$1,420,000</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">RFQs Active</p>
                        <p className="text-base font-extrabold text-blue-600">18 Bids</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Approved POs</p>
                        <p className="text-base font-extrabold text-emerald-600">142 Issued</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Supplier Quotation Bids</span>
                        <span className="text-blue-600">Active Awarding</span>
                      </div>
                      <div className="space-y-1.5 text-xs font-medium">
                        <div className="flex justify-between items-center p-2 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <span>GlobalTech Corp — $185,000</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">Lowest Bid</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-slate-50 text-slate-700 border border-slate-200">
                          <span>Apex Solutions — $192,000</span>
                          <span className="text-[10px] font-medium text-slate-500">Evaluating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4 Feature Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-md text-left">
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

      {/* Features Grid Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600 mb-2">
              Core Platform Features
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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
                bg: 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100',
              },
              {
                icon: FileText,
                title: 'RFQ Broadcast & Bidding',
                description: 'Procurement teams publish RFQs to invited or public vendors to solicit competitive quotation proposals.',
                color: 'text-indigo-600',
                bg: 'bg-gradient-to-br from-indigo-50 to-purple-50/50 border-indigo-100',
              },
              {
                icon: Gavel,
                title: 'Bid Comparison & Awarding',
                description: 'Compare supplier bids side-by-side with lowest-price indicators and scoring matrix before awarding contracts.',
                color: 'text-purple-600',
                bg: 'bg-gradient-to-br from-purple-50 to-pink-50/50 border-purple-100',
              },
              {
                icon: Package,
                title: 'Purchase Order Generation',
                description: 'Generate legal Purchase Orders automatically with line item details, terms, and direct PDF downloads.',
                color: 'text-emerald-600',
                bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100',
              },
              {
                icon: Receipt,
                title: 'Invoice & Payment Tracking',
                description: 'Vendors upload invoices against active POs. Finance teams review line items, match limits, and record payments.',
                color: 'text-teal-600',
                bg: 'bg-gradient-to-br from-teal-50 to-cyan-50/50 border-teal-100',
              },
              {
                icon: Shield,
                title: 'Audit Logging & Compliance',
                description: 'Complete audit logging records every request, manager approval, status change, and payment transaction.',
                color: 'text-rose-600',
                bg: 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-100',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} border flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-5 h-5 ${feature.color} stroke-[2.2]`} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2.5">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Governance Section */}
      <section id="roles" className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600 mb-2">
              Role-Based Access
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {item.role}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Column Footer */}
      <footer id="about" className="mt-auto border-t border-slate-200 bg-white text-slate-600 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-200/80">
            {/* Column 1: About Us */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                  <Package2 className="h-4 w-4 stroke-[2.2]" />
                </div>
                <p className="text-base font-extrabold text-slate-900">
                  Procurement Platform
                </p>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Enterprise Procurement & Vendor Management System delivering transparent purchase workflows, competitive supplier bidding, automated purchase order creation, and audit-ready compliance.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
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
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">
                Modules
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
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

            {/* Column 4: Security & Specs */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">
                Security & Specs
              </h4>
              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                  Role-Based Access Control (RBAC)
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 stroke-[2.2]" />
                  JWT Auth & Encrypted Sessions
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
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
