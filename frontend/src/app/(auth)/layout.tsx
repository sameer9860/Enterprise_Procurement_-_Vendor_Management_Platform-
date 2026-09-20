import { ShieldCheck, ShoppingCart, Truck, FileCheck2 } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side — desktop only */}
        <div className="relative hidden overflow-hidden bg-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.05),transparent_30%)]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-16 text-slate-900">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl xl:mb-10 xl:h-16 xl:w-16">
                <ShoppingCart className="h-7 w-7 text-white xl:h-8 xl:w-8" />
              </div>

              <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
                Procurement Platform
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 xl:mt-6 xl:text-lg xl:leading-8">
                Streamline procurement, automate approvals, manage vendors,
                purchase orders, RFQs and invoices from one secure platform.
              </p>
            </div>

            <div className="grid gap-4 xl:gap-5">
              <Feature
                icon={<ShieldCheck className="h-5 w-5 text-white xl:h-6 xl:w-6" />}
                title="Secure Approval Workflow"
                description="Multi-level approval process with complete audit history."
              />

              <Feature
                icon={<Truck className="h-5 w-5 text-white xl:h-6 xl:w-6" />}
                title="Vendor Management"
                description="Centralized supplier information and procurement lifecycle."
              />

              <Feature
                icon={<FileCheck2 className="h-5 w-5 text-white xl:h-6 xl:w-6" />}
                title="Purchase Automation"
                description="RFQs, Purchase Orders, Goods Receipts and Invoice tracking."
              />
            </div>
          </div>
        </div>

        {/* Right Side — form */}
        <div className="flex min-h-screen items-start justify-center overflow-y-auto bg-slate-100 px-4 py-6 sm:items-center sm:px-6 sm:py-10 lg:px-10">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="mb-6 text-center sm:mb-8 lg:hidden">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg sm:mb-4 sm:h-16 sm:w-16 sm:rounded-2xl">
                <ShoppingCart className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Procurement Platform
              </h1>

              <p className="mt-1 text-sm text-slate-600 sm:mt-2 sm:text-base">
                Enterprise Procurement & Vendor Management
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md xl:gap-4 xl:p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 xl:h-12 xl:w-12">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  )
}
