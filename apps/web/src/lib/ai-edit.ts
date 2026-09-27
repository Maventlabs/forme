import { z } from 'zod'
import { parseCanvasDocument, updateNode, type CanvasDocument } from '@forme/design-ir'

export const aiEditOperationsSchema = z.object({
  operations: z.array(z.object({
    op: z.literal('setNodeText'),
    text: z.string().trim().min(1).max(2_000),
  }).strict()).length(1),
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
          op: { type: 'STRING', enum: ['setNodeText'] },
          text: { type: 'STRING' },
        },
        required: ['op', 'text'],
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
        type: 'object',
        additionalProperties: false,
        properties: {
          op: { type: 'string', enum: ['setNodeText'] },
          text: { type: 'string', minLength: 1, maxLength: 2_000 },
        },
        required: ['op', 'text'],
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

export function isAIEditableNodeType(type: string) {
  return type === 'heading' || type === 'text' || type === 'paragraph' || type === 'button'
}

export function applyScopedAIEdit(documentInput: unknown, targetNodeId: string, operations: AIEditOperations): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const target = document.nodes[targetNodeId]
  if (!target) throw new Error('AI_TARGET_NODE_NOT_FOUND')
  if (!isAIEditableNodeType(target.type)) throw new Error('AI_TARGET_NODE_NOT_TEXT_EDITABLE')
  const operation = operations.operations[0]
  if (!operation) throw new Error('AI_OUTPUT_EMPTY')

  return updateNode(document, targetNodeId, {
    props: { ...target.props, text: operation.text },
  })
}
