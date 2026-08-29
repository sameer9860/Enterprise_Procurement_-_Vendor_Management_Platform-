import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'
import ColdStartBanner from '@/components/shared/ColdStartBanner'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              },
              success: {
                style: {
                  borderColor: '#bfdbfe',
                  color: '#1e40af',
                },
              },
              error: {
                style: {
                  borderColor: '#fecaca',
                  color: '#b91c1c',
                },
              },
            }}
          />
          <ColdStartBanner />
        </QueryProvider>
      </body>
    </html>
  )
}