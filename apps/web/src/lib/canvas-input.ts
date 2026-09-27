import { z } from 'zod'
import {
  blockIdSchema,
  canvasDocumentSchema,
  nodeLayoutsSchema,
  nodePropsSchema,
  breakpointVisibilitySchema,
} from '@forme/design-ir'

export const createNodeInputSchema = z.object({
  projectId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  id: z.string().uuid(),
  blockId: blockIdSchema,
  customBlockId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  props: nodePropsSchema.optional(),
  layouts: nodeLayoutsSchema.optional(),
}).strict()

export const updateNodeInputSchema = z.object({
  projectId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  changes: z.object({
    label: z.string().trim().min(1).max(120).optional(),
    props: nodePropsSchema.optional(),
    layouts: nodeLayoutsSchema.optional(),
    visible: z.boolean().optional(),
    visibilityByBreakpoint: breakpointVisibilitySchema.optional(),
    styleRef: z.string().trim().max(120).nullable().optional(),
  }).strict().refine((changes) => Object.keys(changes).length > 0),
}).strict()

export const deleteNodeInputSchema = z.object({
  projectId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export const replaceCanvasInputSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  canvas: canvasDocumentSchema,
}).strict()

export const createCustomBlockInputSchema = z.object({
  id: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  nodeId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
}).strict()

export const instantiateCustomBlockInputSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  parentId: z.string().uuid().nullable().optional(),
  idMap: z.record(z.string().uuid(), z.string().uuid()),
}).strict()
