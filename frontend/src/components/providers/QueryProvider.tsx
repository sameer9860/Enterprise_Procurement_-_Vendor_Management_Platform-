'use client'

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: any) => {
            if (error?.response?.status === 401) return
            if (error?.response?.status === 404) return
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: any) => {
            if (error?.response?.status === 401) return
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: (failureCount, error: any) => {
              if ([401, 403, 404].includes(error?.response?.status)) {
                return false
              }
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}