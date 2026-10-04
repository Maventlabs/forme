import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import {
  blockIdSchema,
  blocksById,
  createNodeFromBlock,
  insertNode,
  parseCanvasDocument,
  updateNode,
  type CanvasDocument,
} from '@forme/design-ir'
import { isAIEditableNodeType, isAIContainerNodeType, isAIScopedEditTarget } from './ai-scope'

export { isAIEditableNodeType, isAIContainerNodeType, isAIScopedEditTarget }

// Allowlisted, server-targeted Design IR operations.
// The model never chooses a target node id: the target is always the node the
// user selected, and the server applies the operation to that node only.
const setNodeTextOperationSchema = z.object({
  op: z.literal('setNodeText'),
  text: z.string().trim().min(1).max(2_000),
}).strict()

const appendChildOperationSchema = z.object({
  op: z.literal('appendChild'),
  blockId: blockIdSchema,
  label: z.string().trim().min(1).max(120).optional(),
  text: z.string().trim().min(1).max(2_000).optional(),
}).strict()

export const aiEditOperationsSchema = z.object({
  operations: z.array(z.discriminatedUnion('op', [setNodeTextOperationSchema, appendChildOperationSchema])).length(1),
}).strict()

export type AIEditOperations = z.infer<typeof aiEditOperationsSchema>

export const geminiAIEditResponseSchema = {
  type: 'OBJECT',
  properties: {
    operations: {
      type: 'ARRAY',
      minItems: 1,
      maxItems: 1,
      items: {
        type: 'OBJECT',
        properties: {
          op: { type: 'STRING', enum: ['setNodeText', 'appendChild'] },
          text: { type: 'STRING' },
          blockId: { type: 'STRING', enum: blockIdSchema.options },
          label: { type: 'STRING' },
        },
        required: ['op'],
      },
    },
  },
  required: ['operations'],
}

export const aiEditOperationsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    operations: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              op: { type: 'string', enum: ['setNodeText'] },
              text: { type: 'string', minLength: 1, maxLength: 2000 },
            },
            required: ['op', 'text'],
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              op: { type: 'string', enum: ['appendChild'] },
              blockId: { type: 'string', enum: blockIdSchema.options },
              label: { type: 'string', minLength: 1, maxLength: 120 },
              text: { type: 'string', minLength: 1, maxLength: 2000 },
            },
            required: ['op', 'blockId'],
          },
        ],
      },
    },
  },
  required: ['operations'],
} as const

export function parseAIEditOperations(text: string): AIEditOperations {
  let output: unknown
  try {
    output = JSON.parse(text)
  } catch {
    throw new Error('AI_OUTPUT_INVALID_JSON')
  }
  const parsed = aiEditOperationsSchema.safeParse(output)
  if (!parsed.success) throw new Error('AI_OUTPUT_INVALID_SCHEMA')
  return parsed.data
}

export function applyScopedAIEdit(documentInput: unknown, targetNodeId: string, operations: AIEditOperations): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const target = document.nodes[targetNodeId]
  if (!target) throw new Error('AI_TARGET_NODE_NOT_FOUND')
  const operation = operations.operations[0]
  if (!operation) throw new Error('AI_OUTPUT_EMPTY')

  if (operation.op === 'setNodeText') {
    if (!isAIEditableNodeType(target.type)) throw new Error('AI_TARGET_NODE_NOT_TEXT_EDITABLE')
    return updateNode(document, targetNodeId, {
      props: { ...target.props, text: operation.text },
    })
  }

  const parentDefinition = blocksById[target.blockId as keyof typeof blocksById]
  if (!parentDefinition?.acceptsChildren) throw new Error('AI_TARGET_NODE_NOT_A_CONTAINER')

  // Node identity is always generated server-side, so the model can never
  // target or name nodes and can never write outside the authorized scope.
  const child = createNodeFromBlock(operation.blockId, {
    id: randomUUID(),
    parentId: targetNodeId,
    ...(operation.label ? { label: operation.label } : {}),
    ...(operation.text ? { props: { text: operation.text } } : {}),
  })
  return insertNode(document, child)
}