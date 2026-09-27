'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 }, mutations: { retry: 0 } } })
  }
  browserQueryClient ??= new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 }, mutations: { retry: 0 } } })
  return browserQueryClient
}

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}
