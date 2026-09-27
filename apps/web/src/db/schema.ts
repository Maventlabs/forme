import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { createEmptyCanvasDocument, type CanvasDocument } from '@forme/design-ir'
import type { ProviderModel } from '@/lib/provider-types'

const createdAt = (name = 'created_at') => timestamp(name, { withTimezone: true }).defaultNow().notNull()
const updatedAt = (name = 'updated_at') => timestamp(name, { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [index('session_user_id_idx').on(table.userId)])

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('account_user_id_idx').on(table.userId),
  uniqueIndex('account_provider_account_id_unique').on(table.providerId, table.accountId),
])

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('verification_identifier_idx').on(table.identifier)])

const emptyCanvasJson = JSON.stringify(createEmptyCanvasDocument()).replace(/'/g, "''")

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  canvas: jsonb('canvas').$type<CanvasDocument>().notNull().default(sql.raw(`'${emptyCanvasJson}'::jsonb`)),
  canvasRevision: integer('canvas_revision').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index('projects_owner_updated_at_idx').on(table.userId, table.updatedAt)])

export const providerConnections = pgTable('provider_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  encryptedSecret: text('encrypted_secret'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  validationAttempts: integer('validation_attempts').default(0).notNull(),
  validationWindowStartedAt: createdAt('validation_window_started_at'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('provider_connections_user_provider_unique').on(table.userId, table.provider),
])

export const modelCache = pgTable('model_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  connectionId: uuid('connection_id').notNull().references(() => providerConnections.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description').notNull().default(''),
  inputTokenLimit: integer('input_token_limit'),
  outputTokenLimit: integer('output_token_limit'),
  capabilities: jsonb('capabilities').$type<ProviderModel['capabilities']>().notNull(),
  syncedAt: createdAt('synced_at'),
}, (table) => [
  uniqueIndex('model_cache_connection_model_unique').on(table.connectionId, table.modelId),
])

export const aiGenerationJobs = pgTable('ai_generation_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').notNull(),
  idempotencyKey: uuid('idempotency_key').notNull(),
  requestHash: text('request_hash').notNull(),
  provider: text('provider').notNull(),
  modelId: text('model_id').notNull(),
  status: text('status').$type<'running' | 'succeeded' | 'failed' | 'unknown'>().notNull(),
  resultRevision: integer('result_revision'),
  errorCode: text('error_code'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('ai_generation_jobs_user_idempotency_unique').on(table.userId, table.idempotencyKey),
  uniqueIndex('ai_generation_jobs_one_running_per_user_unique').on(table.userId).where(sql`${table.status} = 'running'`),
  index('ai_generation_jobs_user_created_at_idx').on(table.userId, table.createdAt),
  index('ai_generation_jobs_project_created_at_idx').on(table.projectId, table.createdAt),
  check('ai_generation_jobs_status_check', sql`${table.status} in ('running', 'succeeded', 'failed', 'unknown')`),
])

export const schema = { user, session, account, verification, projects, providerConnections, modelCache, aiGenerationJobs }
