# TECH-STACK.md — FORME by Mavent

> Technical source of truth for the FORME implementation stack.
>
> This file defines which technologies are used, where they are used, and the architectural boundaries between them.
>
> `FORME-DESIGN.md` controls visual/interaction rules.  
> `FORME-PRD.md` controls product scope and behavior.  
> `AGENTS.md` controls execution discipline.  
> `SESSION.md` controls mutable execution state/evidence.  
> `TECH-STACK.md` controls the implementation stack and technical architecture.
>
> Do not silently replace a technology in this file with another framework/library. If a replacement is genuinely necessary, document the reason and update this file first.

---

## 1. Architecture Summary

FORME uses a **React/Next.js frontend + TypeScript backend + dedicated asynchronous worker** architecture.

```text
Browser
  │
  ▼
Next.js Web App
  ├─ Marketing / Landing
  ├─ Auth / Dashboard
  ├─ Workspace
  └─ BFF / REST Route Handlers
       │
       ├──────────────► Neon PostgreSQL
       │
       ├──────────────► S3-compatible Storage
       │
       └──────────────► Redis / BullMQ
                             │
                             ▼
                        Node.js Worker
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         AI Providers     Export Jobs    Future Crawler
```

Core principle: **do not start with microservices.**

Initial production architecture:

```text
apps/web
apps/worker
```

with shared packages for canonical contracts.

---

## 2. Monorepo

Use:
- `pnpm`
- `Turborepo`

Recommended structure:

```text
forme/
├── apps/
│   ├── web/
│   │   └── Next.js
│   └── worker/
│       └── Node.js + BullMQ
├── packages/
│   ├── design-ir/
│   ├── canvas/
│   ├── ai/
│   ├── db/
│   ├── auth/
│   ├── ui/
│   ├── validation/
│   └── shared/
├── FORME-DESIGN.md
├── FORME-PRD.md
├── AGENTS.md
├── SESSION.md
├── TECH-STACK.md
├── pnpm-workspace.yaml
└── turbo.json
```

Do not create packages merely to make the repository look modular. A package must have a real shared boundary.

---

## 3. Frontend

Use:
- React
- Next.js App Router
- TypeScript

FORME has two different frontend workloads:

```text
Marketing
→ SEO
→ server/static rendering
→ lower interactivity

Workspace
→ client-heavy
→ selection state
→ drag/resize
→ infinite canvas
→ AI interaction
```

Use Server Components where they naturally help marketing/dashboard pages.

The interactive workspace is client-heavy and may use dedicated client boundaries.

Do not force the Canvas itself into a Server Component architecture.

---

## 4. Styling & Design System

Use:
- Tailwind CSS v4
- CSS custom properties / design tokens
- `FORME-DESIGN.md` as visual source of truth

Global values such as colors, typography, spacing, radius, workspace surfaces, and motion values must be centralized.

Do not spread repeated raw design values across unrelated components.

---

## 5. UI Primitives & Icons

### UI primitives
Use **Radix Primitives** where accessible behavior is useful.

Do not allow a component kit to determine the FORME visual language.

### Icons
- Lucide React — standard application UI
- Simple Icons / Devicon / official assets — provider/technology branding

No emoji icons.

---

## 6. Client State

Use:
- **Zustand** for editor/client interaction state
- **TanStack Query** for remote/server state

### Zustand owns

```text
selectedNodeIds
hoveredNodeId
activeTool
activeBreakpoint
viewport.x
viewport.y
viewport.zoom
dragging
resizing
history
temporary composer context
```

### TanStack Query owns

```text
projects
pages
saved page documents
assets
provider connections
model catalog
generation jobs
share state
export state
```

Do not mirror all server data permanently into Zustand.

---

## 7. Canvas Architecture

FORME must use a **custom DOM-based semantic canvas**.

Do not use a bitmap `<canvas>` graphics engine as the canonical document renderer.

Do not make React Flow, tldraw, Fabric.js, or Konva the core document model.

FORME is a semantic interface-layout editor, not:
- a node graph;
- a freehand whiteboard;
- a vector illustration application.

Recommended rendering model:

```text
Design IR
   ↓
Semantic Node Renderer
   ↓
DOM
   ↓
CSS Grid / Flexbox / layout primitives
```

---

## 8. Canvas Interaction

Use:
- React pointer events
- browser Pointer Events
- `dnd-kit` where its primitives are useful
- custom resize/selection behavior where required

Required editor behavior includes:
- selection
- drag
- resize
- reordering
- frame movement
- zoom
- pan
- snap
- multi-selection when implemented
- keyboard operations

Do not adopt a third-party editor abstraction if it forces FORME into an incompatible object model.

---

## 9. Design IR

`packages/design-ir` is one of the most important packages in the repository.

It is the canonical shared representation for:
- Canvas
- persistence
- AI Composer
- responsive frames
- presets
- DESIGN.md context
- exports
- future crawler
- future MCP

Conceptual contract:

```ts
interface DesignNode {
  id: string
  type: NodeType
  label: string
  parentId?: string
  children: string[]
  props: NodeProps
  layouts: {
    desktop?: LayoutProps
    tablet?: LayoutProps
    mobile?: LayoutProps
  }
  visible: boolean
}
```

Exact schema may evolve during implementation, but all systems must converge on one canonical IR.

Do not maintain independent incompatible schemas for Canvas, AI, persistence, and MCP.

---

## 10. Block / Node Model

A **Block** is a reusable template.

A **Node** is an instantiated semantic object in a page.

Examples:

```text
Hero
Navbar
Heading
Paragraph
Image
GIF
Button
Input
Card
Container
Stack
Grid
Footer
```

The AI layer must operate on semantic nodes rather than screen pixels.

---

## 11. Responsive Architecture

Default widths:

```text
Desktop 1440px
Tablet   768px
Mobile   390px
```

One node identity persists across breakpoints.

Breakpoint-specific properties may override:
- width
- height
- position
- order
- alignment
- visibility
- spacing

Do not duplicate semantic content solely to represent another breakpoint.

---

## 12. Database

Use:
- **Neon PostgreSQL**
- **Drizzle ORM**

Why:
- relational project metadata
- JSONB support
- serverless-friendly Postgres
- direct SQL control
- suitable for structured design documents and revision metadata

Do not introduce another primary application database without an explicit architecture decision.

---

## 13. Persistence Model

Prefer a hybrid relational/document model.

Relational tables should handle entities such as:

```text
users
projects
pages
assets
provider_connections
model_cache
generation_jobs
share_links
exports
```

The active page design may be persisted as a versioned JSONB document.

Phase 3's first production slice keeps the single active canvas document on `projects.canvas` with a monotonic `canvas_revision`. `packages/design-ir` is the canonical validated representation used by the editor and API; node instances are not stored in a second relational model. The `page_documents` shape below remains the extension path for multi-page/revision history and must be introduced through a data-preserving migration before page management is activated. Node and document writes carry `expectedRevision`; stale writes return `409` and do not overwrite newer data.

Example:

```text
page_documents
├── id
├── page_id
├── revision
├── document JSONB
└── updated_at
```

Conceptual document:

```json
{
  "schemaVersion": 1,
  "nodes": {},
  "rootIds": [],
  "breakpoints": {},
  "customBlocks": {},
  "designContextRef": null
}
```

`customBlocks` stores reusable subtree templates. Placed instances receive new node ids and retain a `customBlockId` reference; templates are snapshots and do not mutate when source instances change.

---

## 14. Autosave & Revision Control

Canvas edits happen immediately in local application state.

Use a debounced/batched persistence strategy rather than writing every pointer movement directly to Postgres.

Conceptual flow:

```text
Canvas interaction
      ↓
local state
      ↓
debounce / batch
      ↓
save page revision
      ↓
Neon
```

Use optimistic revision checks where appropriate:

```text
expectedRevision: 42
→ save
→ revision: 43
```

A stale write must not silently overwrite a newer revision.

---

## 15. Undo / Redo

Prefer an operation/command history.

Concept:

```text
operation
inverseOperation
```

Examples:
- create node
- delete node
- resize node
- move node
- update layout
- reorder node
- change property

This same operation model should be reusable by AI Composer actions where practical.

Avoid storing enormous full-document snapshots for every pointer movement.

---

## 16. Backend HTTP Layer

Use:
- Next.js Route Handlers as the initial BFF/API layer
- REST-style JSON contracts
- Zod validation
- OpenAPI documentation where valuable

Do not default to tRPC as the primary contract.

Reason: FORME will eventually have multiple consumers:
- Web
- Worker
- MCP
- possibly CLI
- integrations

Stable HTTP contracts are preferable.

---

## 17. Validation

Use:
- **Zod**
- JSON Schema where an external/tool contract needs it

Validate at every trust boundary:
- API request
- AI output
- uploaded metadata
- Design IR mutations
- provider model normalization
- DESIGN.md parsing
- future MCP arguments/results

---

## 18. Authentication

Use:
- **Better Auth**
- Drizzle-backed persistence on Neon

Required methods:
- Google
- GitHub
- Email + Password

Do not implement custom authentication primitives from scratch unless a documented blocker requires it.

Every project/page/asset/share action must validate ownership or granted permission server-side.

---

## 19. Object Storage

Use an **S3-compatible object store**.

Store:
- images
- GIFs
- uploaded references
- document attachments
- generated export artifacts

Prefer direct browser upload through presigned URLs when appropriate:

```text
Browser
  ↓
request signed upload
  ↓
Object Storage
  ↓
save metadata in Neon
```

The exact S3-compatible provider may be selected based on deployment/billing constraints without changing the storage abstraction.

---

## 20. AI Layer

Use:
- **AI SDK Core** where it reduces provider-specific boilerplate
- a custom **FORME Provider Adapter Layer**

The product must not scatter provider SDK calls throughout UI/backend code.

Recommended package:

```text
packages/ai/
```

Conceptual interface:

```ts
interface FormeAIProvider {
  validateCredentials(): Promise<ProviderValidationResult>
  listModels(): Promise<ModelInfo[]>
  generateDesign(
    request: DesignGenerationRequest
  ): Promise<DesignGenerationResult>
}
```

Provider adapters may include:

```text
openai
anthropic
gemini
qwen
glm
mimo
grok
kimi
deepseek
minimax
muse
openai-compatible
```

Ignix remains Coming Soon until its actual provider boundary exists.

### Initial provider implementation (2026-09-26)

- The reusable `FormeProviderAdapter` contract and first `google-gemini` adapter currently live in `apps/web/src/lib/provider-types.ts`, `provider-adapters.ts`, and `gemini-provider.ts`; promote the adapter package to `packages/ai/` when another runtime consumes it.
- Gemini uses the official REST `models.list` and `models.generateContent` endpoints with `x-goog-api-key`; model IDs/capabilities come only from live responses.
- User credentials are encrypted in `provider_connections` with AES-256-GCM, a unique 96-bit nonce, authenticated owner/provider/key-id data, and a dedicated base64url 256-bit `PROVIDER_SECRET_ENCRYPTION_KEY`. Key IDs and an optional previous-key ring allow re-encryption windows. Plaintext keys are never returned or logged.
- `model_cache` holds normalized provider metadata only. `ai_generation_jobs` keeps an HMAC request fingerprint and bounded status metadata, not raw prompts or provider output.

---

## 21. Live Model Discovery

Do not maintain a permanent hardcoded model catalog.

Flow:

```text
user connects provider
      ↓
validate credential
      ↓
fetch models when provider supports discovery
      ↓
normalize capabilities
      ↓
cache
      ↓
Composer model selector
```

For providers that do not expose an equivalent model-list API, the adapter may implement a provider-specific strategy.

Cache rows are unique by `(connection_id, model_id)` and are replaced transactionally only after a fresh provider response validates. A failed refresh leaves the previous cache intact.

---

## 22. AI Output Contract

AI must not return arbitrary React/HTML as the canonical Canvas result.

Preferred flow:

```text
AI
 ↓
structured output
 ↓
Zod validation
 ↓
Design IR operations
 ↓
transaction/apply
 ↓
Canvas rerender
```

Example:

```json
{
  "operations": [
    {
      "op": "updateLayout",
      "nodeId": "hero-01",
      "breakpoint": "desktop",
      "changes": {
        "paddingTop": 64,
        "paddingBottom": 64
      }
    }
  ]
}
```

This supports:
- scoped edits
- validation
- undo
- auditing
- smaller prompts
- fewer unintended changes

The first persisted Gemini operation is deliberately narrow: `setNodeText` on the server-selected text-capable node only. Model output cannot choose a target node or return HTML; Zod validates the operation before an atomic project-revision + generation-job transaction commits it. Expand the operation union only with similarly scoped, validated Design IR actions.

---

## 23. Background Jobs

Use:
- **Redis**
- **BullMQ**
- dedicated Node.js worker

Initial job categories:

```text
forme-generation
forme-export
forme-crawler   # future
```

Do not create a queue per user.

The worker handles:
- AI generation
- long provider calls
- exports
- future crawling
- expensive processing

---

## 24. Worker Deployment

Do not rely on short-lived serverless functions for persistent BullMQ workers.

Deploy the worker as a long-lived process/container.

Suitable categories:
- Railway
- Fly.io
- VPS/container host

Web application deployment may remain on Vercel.

---

## 25. Animation

Use:
- **Motion** for normal React UI transitions/interactions
- **GSAP** selectively for complex marketing sequences or scroll choreography

Do not use both libraries for the same simple interaction without a strong reason.

Respect `prefers-reduced-motion`.

Animation behavior must follow `FORME-DESIGN.md`.

---

## 26. Future Website Crawler

Crawler is not part of the current P0 implementation.

When activated later, it belongs in the worker layer.

Expected conceptual pipeline:

```text
URL
 ↓
URL validation
 ↓
SSRF protection
 ↓
Scrapling / crawler
 ↓
DOM/content extraction
 ↓
design analysis
 ↓
normalized structure
 ↓
Design IR
```

Crawler requirements:
- no private-network access
- safe redirects
- no pixel-perfect cloning
- no copying proprietary assets as output
- result remains semantic/editable

---

## 27. Future MCP

MCP is implemented only after these contracts stabilize:
- Design IR
- Block/Node schema
- responsive model
- Design Context
- project/page read semantics

Initial MCP should be read-only.

Do not design MCP first and then force the editor schema around it.

---

## 28. Testing Stack

Expected coverage categories:

### Unit
- Design IR
- layout transformations
- provider normalization
- parser logic
- pure operations

### Integration
- Neon persistence
- Better Auth
- uploads
- provider connection
- model discovery
- generation jobs
- share/export

### Contract
- provider adapters
- AI structured output
- Design IR schema
- future MCP

### E2E
Use deterministic Node.js/TypeScript scripts under `apps/web/scripts/e2e`, invoked by `pnpm e2e:production`. Scripts must target an explicit production-build, staging, or production URL; exercise real HTTP/API and durable provider/database boundaries; assert success, failure, recovery, access isolation, reload/read-back; set timeouts; redact secrets; return non-zero on failure; and clean only records created by that run when safe. Browser automation is excluded unless the user explicitly reauthorizes it. When an interaction cannot be meaningfully verified without a browser, record that limitation and verify the production HTTP/durable boundary instead.

Core journey:

```text
Auth
→ Create Project
→ Open Workspace
→ Add Blocks
→ Save
→ Reload
→ Responsive Override
→ Connect Provider
→ Fetch Model
→ AI Edit Scoped Node
→ Apply Preset / DESIGN.md
→ Share / Export
```

---

## 29. Observability

Use:
- Sentry
- structured application logs
- provider/job metrics

Track:
- generation duration
- success/failure
- retries
- queue duration
- provider latency
- export result
- persistence errors

Never log:
- raw API keys
- private file contents
- complete prompts unnecessarily
- raw DESIGN.md content unnecessarily

---

## 30. Security Requirements

Minimum:
- server-side authorization
- Zod input validation
- encrypted provider credentials
- secrets never returned plaintext
- upload type/size validation
- rate limiting
- CSRF/session protections as required
- XSS-safe rendering
- dependency vulnerability review
- SSRF protection before crawler activation

Provider credentials must not live in:
- browser localStorage
- analytics payloads
- SESSION.md
- client logs

---

## 31. Deployment Topology

### Temporary hosting decision (2026-09-26)

Netlify is approved as a temporary host while the owner prepares self-hosting. This changes the web hosting destination only; Next.js, Neon, Drizzle, Better Auth, and the planned worker boundary stay unchanged. The longer-term destination is owner-operated infrastructure. Netlify support has been checked for the current Next.js App Router and Route Handler use.

The current app does not yet use Redis, BullMQ, QStash, an S3 object store, or a deployed worker. Do not provision those services or add environment variables until their application integration is implemented. Keep provider API keys per-user and encrypted; a global Gemini key is used by local E2E only.

For deployment setup, environment names, known limitations, and the readiness estimate, see `NETLIFY-DEPLOY.md`.

Current temporary deployment topology:

```text
Internet
   │
   ▼
Netlify / Next.js adapter
   │
   ▼
Next.js web app + route handlers ─────► Neon PostgreSQL
   │
   └──────────────────────────────────► User-configured AI provider
```

This is the only topology currently implemented for deployment preparation. Redis, BullMQ, object storage, and a worker remain planned and must not be provisioned for this slice.

Longer-term target topology after the corresponding application integrations exist:

```text
                     Internet
                         │
                         ▼
                  Owner-operated web host
                        │
                  Next.js Web App
                  /      │       \
                 /       │        \
              Neon      Redis    S3-Compatible
               │          │
               │          ▼
               │       BullMQ
               │          │
               └──────► Worker
                          │
                          ▼
                     AI Providers
```

---

## 32. Technology Decision Table

| Layer | Choice |
|---|---|
| Frontend | React + Next.js App Router + TypeScript |
| Styling | Tailwind CSS v4 + CSS variables |
| UI primitives | Radix Primitives |
| UI icons | Lucide React |
| Brand/provider icons | Simple Icons / Devicon / official assets |
| Client editor state | Zustand |
| Server state | TanStack Query |
| Canvas | Custom DOM semantic canvas |
| Drag/drop | dnd-kit + Pointer Events |
| Animation | Motion; GSAP selectively |
| Backend HTTP | Next.js Route Handlers |
| API style | REST JSON + Zod + OpenAPI where useful |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Storage | S3-compatible object storage |
| AI abstraction | AI SDK Core + FORME provider adapters |
| Async jobs | Redis + BullMQ |
| Worker | Node.js / TypeScript |
| Validation | Zod / JSON Schema |
| Monitoring | Sentry + structured logs |
| Monorepo | pnpm + Turborepo |
| Web deploy | Vercel |
| Worker deploy | Railway / Fly.io / VPS/container |

---

## 33. Hard Technical Rules

The agent MUST NOT:
- replace React/Next.js without explicit architecture approval
- use a generic raster/vector canvas as the canonical FORME editor
- allow AI-generated JSX/HTML to become canonical Design IR
- hardcode the provider model catalog permanently
- put every piece of server data into Zustand
- write every drag pointer movement directly to Postgres
- implement custom auth when Better Auth satisfies the requirement
- run persistent BullMQ workers as short-lived serverless functions
- introduce microservices for the initial build
- start MCP before the core schemas stabilize
- introduce a second primary database without documented approval
- bypass validation on AI-generated operations

---

## 34. Preferred Implementation Order

Technical dependency order:

```text
1. Monorepo / global configuration
2. Design tokens and shared UI foundations
3. Database / Drizzle foundation
4. Better Auth
5. Design IR
6. Workspace shell
7. Canvas renderer
8. Block/Node operations
9. Persistence / revisions
10. Responsive model
11. Object storage
12. Provider abstraction
13. Live model discovery
14. AI Composer structured operations
15. Redis / BullMQ worker path
16. Presets / DESIGN.md context
17. Share / Export
18. QA / Security / Observability
19. P1 crawler
20. MCP
```

This is a technical dependency order, not a replacement for the product phases in `FORME-PRD.md`.

---

## 35. Agent Rule

Before making a technical architecture change:

1. inspect the existing repository;
2. check this file;
3. reuse the current approved stack where possible;
4. verify that the proposed change solves a real blocker;
5. update `TECH-STACK.md` if the decision changes;
6. record the decision/evidence in `SESSION.md`.

Do not silently drift from this architecture.
