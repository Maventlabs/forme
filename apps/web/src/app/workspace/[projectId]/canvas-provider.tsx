'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import type { CanvasDocument } from '@forme/design-ir'
import { createCanvasStore, type CanvasStoreState } from './canvas-store'

type CanvasStoreApi = ReturnType<typeof createCanvasStore>
const CanvasStoreContext = createContext<CanvasStoreApi | null>(null)

export function CanvasProvider({
  initialDocument,
  initialRevision,
  children,
}: {
  initialDocument: CanvasDocument
  initialRevision: number
  children: ReactNode
}) {
  const [store] = useState(() => createCanvasStore(initialDocument, initialRevision))
  return <CanvasStoreContext.Provider value={store}>{children}</CanvasStoreContext.Provider>
}

export function useCanvasStore<T>(selector: (state: CanvasStoreState) => T) {
  const store = useContext(CanvasStoreContext)
  if (!store) throw new Error('Canvas store must be used inside CanvasProvider')
  return useStore(store, selector)
}

export function useCanvasStoreApi() {
  const store = useContext(CanvasStoreContext)
  if (!store) throw new Error('Canvas store must be used inside CanvasProvider')
  return store
}
