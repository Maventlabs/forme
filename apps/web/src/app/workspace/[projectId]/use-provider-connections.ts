'use client'

import { useQuery } from '@tanstack/react-query'
import type { ProviderConnectionSummary } from '@/lib/provider-types'

export type ProviderConnectionsResponse = { connections: ProviderConnectionSummary[] }

export const providerConnectionsQueryKey = ['provider-connections'] as const

async function fetchProviderConnections({ signal }: { signal: AbortSignal }): Promise<ProviderConnectionsResponse> {
  const response = await fetch('/api/providers', { signal })
  if (!response.ok) throw new Error(response.status === 401 ? 'UNAUTHORIZED' : 'PROVIDERS_UNAVAILABLE')
  return await response.json() as ProviderConnectionsResponse
}

export function useProviderConnections() {
  return useQuery({
    queryKey: providerConnectionsQueryKey,
    queryFn: fetchProviderConnections,
    staleTime: 30_000,
    retry: 0,
  })
}
