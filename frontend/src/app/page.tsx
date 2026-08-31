'use client'

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
  Users,
  Building2,
  Lock,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">
                Procurement
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
                Platform
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Role Access
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 font-medium px-5">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400 mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise Procurement & Vendor Management Solution
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
            Streamline Requests, RFQs & Vendor Payments in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              One Unified System
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            End-to-end procurement automation for modern enterprises. Handle purchase requests, manager approvals, multi-vendor bid comparisons, PO generation, and invoice settlements with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 h-12 text-base shadow-xl shadow-blue-600/25">
                Access Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-900 hover:text-white h-12 text-base px-8">
                Register New Account
              </Button>
            </Link>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">6 Modules</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Requests to Invoices</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">100% Audit</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Complete Log Traceability</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">RBAC Powered</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Strict Role Security</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">PDF Ready</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Auto PO Document Export</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
              Core Platform Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Built for Speed, Governance & Financial Control
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: 'Purchase Requests & Approvals',
                description: 'Employees submit structured items and budget requests. Department managers receive notifications and action approvals in real-time.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: FileText,
                title: 'RFQ Management',
                description: 'Procurement teams issue Requests for Quotations directly to verified vendors or broadcast open bidding opportunities.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Gavel,
                title: 'Bid Comparison & Awarding',
                description: 'Compare multi-vendor price bids side-by-side with lowest-price highlights and score rankings before awarding contracts.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Package,
                title: 'Purchase Order Generation',
                description: 'Instantly generate binding Purchase Orders with automated line items, terms, and auto-compiled WeasyPrint PDF downloads.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Receipt,
                title: 'Invoicing & Payments',
                description: 'Vendors upload invoices directly. Finance teams review line items, match against PO limits, and record payment settlements.',
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10',
              },
              {
                icon: Shield,
                title: 'Audit Trail & Compliance',
                description: 'Every single system action, approval step, status change, and payment execution is permanently recorded in audit logs.',
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Based Access Section */}
      <section id="roles" className="py-20 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">
              Role-Based Governance
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Tailored Dashboards for Every Stakeholder
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { role: 'EMPLOYEE', title: 'Employees', desc: 'Create purchase requisitions, track approval status, and view request history.' },
              { role: 'MANAGER', title: 'Department Managers', desc: 'Review team purchase requests, verify budget limits, and grant approvals.' },
              { role: 'PROCUREMENT', title: 'Procurement Specialists', desc: 'Issue RFQs, evaluate vendor bids, award contracts, and issue Purchase Orders.' },
              { role: 'FINANCE', title: 'Finance & Accounting', desc: 'Verify incoming invoices, track payment schedules, and disburse settlements.' },
              { role: 'VENDOR', title: 'Verified Vendors', desc: 'Submit quotes on open RFQs, manage company profile, and upload invoices.' },
              { role: 'ADMIN', title: 'System Administrators', desc: 'Manage user roles, verify vendor accounts, and audit platform security.' },
            ].map((item) => (
              <div key={item.role} className="p-6 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-blue-400 tracking-wider">
                    {item.role}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Package2 className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Enterprise Procurement & Vendor Management Platform
            </p>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Procurement Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
