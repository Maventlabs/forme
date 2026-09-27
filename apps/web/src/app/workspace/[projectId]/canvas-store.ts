import { createStore } from 'zustand/vanilla'
import {
  createCustomBlockFromNode,
  createNodeFromBlock,
  duplicateNode as duplicateCanvasNode,
  instantiateCustomBlock as instantiateCanvasCustomBlock,
  insertNode,
  removeNode,
  reorderNode as reorderCanvasNode,
  updateNode,
  type BlockId,
  type CanvasDocument,
  type DesignNode,
} from '@forme/design-ir'

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict'

export type NodeChanges = Partial<Pick<DesignNode, 'label' | 'props' | 'layouts' | 'visible' | 'visibilityByBreakpoint' | 'styleRef'>>

export type CanvasOperation =
  | { id: string; kind: 'create'; node: DesignNode }
  | { id: string; kind: 'update'; nodeId: string; changes: NodeChanges }
  | { id: string; kind: 'delete'; nodeId: string }
  | { id: string; kind: 'create-custom-block'; blockId: string; nodeId: string; name: string }
  | { id: string; kind: 'instantiate-custom-block'; customBlockId: string; parentId: string | null; idMap: Record<string, string> }
  | { id: string; kind: 'replace'; document: CanvasDocument }

export type CanvasStoreState = {
  document: CanvasDocument
  revision: number
  selectedNodeIds: string[]
  hoveredNodeId: string | null
  activeTool: 'select' | 'text'
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile'
  viewport: { x: number; y: number; zoom: number }
  draggingNodeId: string | null
  resizingNodeId: string | null
  operations: CanvasOperation[]
  saveState: SaveState
  saveError: string | null
  past: CanvasDocument[]
  future: CanvasDocument[]
  selectNode: (nodeId: string | null) => void
  setHoveredNode: (nodeId: string | null) => void
  setActiveTool: (tool: 'select' | 'text') => void
  setBreakpoint: (breakpoint: CanvasStoreState['activeBreakpoint']) => void
  setViewport: (viewport: CanvasStoreState['viewport']) => void
  setDraggingNode: (nodeId: string | null) => void
  setResizingNode: (nodeId: string | null) => void
  addBlock: (blockId: BlockId, position?: { x: number; y: number }, parentId?: string | null, breakpoint?: CanvasStoreState['activeBreakpoint']) => string
  editNode: (nodeId: string, changes: NodeChanges) => void
  deleteNode: (nodeId: string) => void
  undo: () => void
  redo: () => void
  duplicateNode: (nodeId: string) => string | null
  reorderNode: (nodeId: string, direction: -1 | 1) => void
  saveNodeAsCustomBlock: (nodeId: string, name: string) => string
  instantiateCustomBlock: (customBlockId: string, parentId?: string | null) => string
  markSaving: (operationId: string) => void
  completeOperation: (operationId: string, revision: number) => void
  failOperation: (operationId: string, status: 'error' | 'conflict', message: string) => void
  retrySave: () => void
  resetFromServer: (document: CanvasDocument, revision: number) => void
}

export function createCanvasStore(initialDocument: CanvasDocument, initialRevision: number) {
  return createStore<CanvasStoreState>()((set, get) => ({
    document: initialDocument,
    revision: initialRevision,
    selectedNodeIds: [],
    hoveredNodeId: null,
    activeTool: 'select',
    activeBreakpoint: 'desktop',
    viewport: { x: 0, y: 0, zoom: 0.65 },
    draggingNodeId: null,
    resizingNodeId: null,
    operations: [],
    saveState: 'saved',
    saveError: null,
    past: [],
    future: [],
    selectNode: (nodeId) => set({ selectedNodeIds: nodeId ? [nodeId] : [] }),
    setHoveredNode: (hoveredNodeId) => set({ hoveredNodeId }),
    setActiveTool: (activeTool) => set({ activeTool }),
    setBreakpoint: (activeBreakpoint) => set({ activeBreakpoint }),
    setViewport: (viewport) => set({ viewport }),
    setDraggingNode: (draggingNodeId) => set({ draggingNodeId }),
    setResizingNode: (resizingNodeId) => set({ resizingNodeId }),
    addBlock: (blockId, position, parentId = null, breakpoint = 'desktop') => {
      const state = get()
      const id = globalThis.crypto.randomUUID()
      const parentOrder = parentId ? state.document.nodes[parentId]?.children.length : state.document.rootIds.length
      const order = parentOrder ?? 0
      const node = createNodeFromBlock(blockId, { id, parentId })
      const activeLayout = node.layouts[breakpoint] ?? node.layouts.desktop
      const nextLayouts = {
        ...node.layouts,
        [breakpoint]: {
          ...activeLayout,
          order,
          ...(position && parentId === null ? { mode: 'absolute' as const, x: position.x, y: position.y } : {}),
        },
      }
      const positionedNode = { ...node, layouts: nextLayouts }
      const document = insertNode(state.document, positionedNode)
      set({
        document,
        selectedNodeIds: [id],
        activeTool: 'select',
        operations: [...state.operations, { id: globalThis.crypto.randomUUID(), kind: 'create', node: positionedNode }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
      return id
    },
    editNode: (nodeId, changes) => {
      const state = get()
      const document = updateNode(state.document, nodeId, changes)
      set({
        document,
        operations: [...state.operations, { id: globalThis.crypto.randomUUID(), kind: 'update', nodeId, changes }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
    },
    deleteNode: (nodeId) => {
      const state = get()
      const document = removeNode(state.document, nodeId)
      set({
        document,
        selectedNodeIds: state.selectedNodeIds.filter((id) => document.nodes[id]),
        operations: [...state.operations, { id: globalThis.crypto.randomUUID(), kind: 'delete', nodeId }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
    },
    duplicateNode: (nodeId) => {
      const state = get()
      const result = duplicateCanvasNode(state.document, nodeId)
      const insertedIds: string[] = []
      const collect = (id: string) => {
        const node = result.document.nodes[id]
        if (!node) return
        insertedIds.push(id)
        node.children.forEach(collect)
      }
      collect(result.nodeId)
      const operations: CanvasOperation[] = insertedIds.map((id) => ({
        id: globalThis.crypto.randomUUID(),
        kind: 'create',
        node: result.document.nodes[id]!,
      }))
      set({
        document: result.document,
        selectedNodeIds: [result.nodeId],
        operations: [...state.operations, ...operations],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
      return result.nodeId
    },
    reorderNode: (nodeId, direction) => {
      const state = get()
      const document = reorderCanvasNode(state.document, nodeId, direction)
      if (document === state.document) return
      set({
        document,
        operations: [...state.operations, { id: globalThis.crypto.randomUUID(), kind: 'replace', document }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
    },
    saveNodeAsCustomBlock: (nodeId, name) => {
      const state = get()
      const blockId = globalThis.crypto.randomUUID()
      const result = createCustomBlockFromNode(state.document, nodeId, name, blockId)
      set({
        document: result.document,
        operations: [...state.operations, {
          id: globalThis.crypto.randomUUID(),
          kind: 'create-custom-block',
          blockId,
          nodeId,
          name: result.block.name,
        }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
      return blockId
    },
    instantiateCustomBlock: (customBlockId, parentId = null) => {
      const state = get()
      const block = state.document.customBlocks[customBlockId]
      if (!block) throw new Error('CUSTOM_BLOCK_NOT_FOUND')
      const idMap = Object.fromEntries(Object.keys(block.nodes).map((id) => [id, globalThis.crypto.randomUUID()]))
      const result = instantiateCanvasCustomBlock(state.document, customBlockId, { idMap, parentId })
      set({
        document: result.document,
        selectedNodeIds: [result.nodeId],
        activeTool: 'select',
        operations: [...state.operations, {
          id: globalThis.crypto.randomUUID(),
          kind: 'instantiate-custom-block',
          customBlockId,
          parentId,
          idMap: result.idMap,
        }],
        saveState: 'dirty',
        saveError: null,
        past: [...state.past.slice(-49), state.document],
        future: [],
      })
      return result.nodeId
    },
    undo: () => {
      const state = get()
      if (state.past.length === 0 || state.operations.length > 0) return
      const document = state.past[state.past.length - 1]
      set({
        document,
        past: state.past.slice(0, -1),
        future: [...state.future, state.document],
        operations: [{ id: globalThis.crypto.randomUUID(), kind: 'replace', document }],
        saveState: 'dirty',
        saveError: null,
        selectedNodeIds: state.selectedNodeIds.filter((id) => document.nodes[id]),
      })
    },
    redo: () => {
      const state = get()
      if (state.future.length === 0 || state.operations.length > 0) return
      const document = state.future[state.future.length - 1]
      set({
        document,
        future: state.future.slice(0, -1),
        past: [...state.past, state.document].slice(-50),
        operations: [{ id: globalThis.crypto.randomUUID(), kind: 'replace', document }],
        saveState: 'dirty',
        saveError: null,
        selectedNodeIds: state.selectedNodeIds.filter((id) => document.nodes[id]),
      })
    },
    markSaving: (operationId) => {
      if (get().operations[0]?.id === operationId) set({ saveState: 'saving', saveError: null })
    },
    completeOperation: (operationId, revision) => {
      const state = get()
      if (state.operations[0]?.id !== operationId) return
      const operations = state.operations.slice(1)
      set({ revision, operations, saveState: operations.length ? 'dirty' : 'saved', saveError: null })
    },
    failOperation: (operationId, saveState, saveError) => {
      if (get().operations[0]?.id === operationId) set({ saveState, saveError })
    },
    retrySave: () => {
      if (get().operations.length) set({ saveState: 'dirty', saveError: null })
    },
    resetFromServer: (document, revision) => set({
      document,
      revision,
      operations: [],
      selectedNodeIds: [],
      past: [],
      future: [],
      saveState: 'saved',
      saveError: null,
    }),
  }))
}
