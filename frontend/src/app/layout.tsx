import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'
import ColdStartBanner from '@/components/shared/ColdStartBanner'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Procurement Platform',
  description: 'Enterprise Procurement & Vendor Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.className} antialiased selection:bg-blue-600 selection:text-white`}>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
          <ColdStartBanner />
        </QueryProvider>
      </body>
    </html>
  )
}