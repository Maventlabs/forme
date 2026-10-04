import { blocksById } from '@forme/design-ir'

// Client-safe AI scope predicates. Kept free of node:crypto/zod so the
// workspace Composer can share the exact same scope rules as the server
// without pulling server-only modules into the browser bundle.

const textEditableTypes = ['heading', 'text', 'paragraph', 'button']

export function isAIEditableNodeType(type: string) {
  return textEditableTypes.includes(type)
}

export function isAIContainerNodeType(type: string) {
  const definition = blocksById[type as keyof typeof blocksById]
  return definition !== undefined && definition.acceptsChildren
}

/**
 * A node may be an AI target when it is either text-editable (setNodeText)
 * or able to contain children (appendChild). Precise per-operation validation
 * happens server-side in `applyScopedAIEdit`.
 */
export function isAIScopedEditTarget(node: { type: string }) {
  return isAIEditableNodeType(node.type) || isAIContainerNodeType(node.type)
}