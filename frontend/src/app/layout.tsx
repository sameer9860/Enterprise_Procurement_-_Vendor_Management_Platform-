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
                background: '#1a1a1a',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#166534',
                },
              },
              error: {
                style: {
                  background: '#991b1b',
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