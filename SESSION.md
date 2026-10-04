# SESSION.md — FORME by Mavent

> This is the mutable execution ledger for the current FORME build.
>
> `DESIGN.md` defines the visual/interaction contract.  
> `prd.md` defines what must be built.  
> `AGENTS.md` defines how work must be executed.  
> `SESSION.md` records what is currently happening, what has been verified, what is blocked, and what happens next.
>
> Update this file after every task or phase. Do not erase historical evidence; append new evidence and update the current state.

---

## Current State

| Field | Value |
|---|---|
| Product | FORME — by Mavent |
| Current phase | Phase 5 — AI Composer + Provider Layer (core P0 backend batch in progress) |
| Current task | Provider/Composer core + presets/DESIGN.md + export/share + storage abstraction all verified end-to-end; next is the security/observability hardening pass, then UI surfaces, then final frontend redesign |
| Priority | High/P0 |
| Execution mode | Production breadth pass; backend/durable behavior before frontend polish |
| Status | Fresh controlled production E2E PASS with real Gemini: build-identity gate, unique port/run id, scoped setNodeText, scoped appendChild (1 server-named child, rev 3→5), foreign scope 404, stale revision 409, idempotent replay, provider-timeout failure with no partial mutation + bounded-retry recovery through the real provider. |
| Next action | Security/observability hardening pass, then build the UI surfaces for presets, DESIGN.md, assets, share and export, then run the final frontend redesign. |
| Last verified commit | 5eb760e — netlify.toml secrets-scan + ignore fix, pushed; `main` in sync; live site https://forme-apps.netlify.app rebuilding |
| Last verified environment | Windows workspace, Node 24.9.0, pnpm 11.17.0, Next.js 16.3.6; Git repo `Maventlabs/forme`, branch `main` in sync with `origin/main`; isolated Neon `forme-dev`; fresh controlled production E2E PASS (build-identity gated, unique port/run id) against a locally started production server |
| Last updated | 2026-09-26 |

> **Mandatory Pre-P0 override:** before executing the current Phase 1 visual task, complete the `Brand Asset Preparation Gate` below. Phase 1 may continue immediately after the logo extraction ledger is verified. This override does not erase the existing Phase 1 plan; it inserts a required asset-preflight step in front of it.

---

## Execution Rules

- Before any P0 visual implementation, complete the Brand Asset Preparation Gate using `forme_logo_assets_master_sheet.png.png` and record actual extracted assets in the Logo Asset Extraction Ledger.

- Read `DESIGN.md`, `prd.md`, `AGENTS.md`, and this file before working.
- Follow production breadth-first order for all `High/P0` features.
- Continue automatically after a phase passes its acceptance and verification gates.
- Do not repeat completed E2E runs unless source, config, provider, environment, failure state, or release gate changed.
- A local adapter, isolated unit test, compile, typecheck, or build is prework, not completion.
- Never claim a provider, MCP, skill, deployment, or E2E result unless it was actually used and verified.
- For visual work, perform the required reference pass before implementing a major section or major workspace interaction.
- Record exact references/tools/skills used for that task.
- Coming Soon features must remain explicitly non-working; do not simulate success.
- If a final image/screenshot is unavailable, use a searchable `PLACEHOLDER_ASSET` note and continue the layout implementation.
- MCP implementation must remain deferred until the Canvas/Node/Design Context contracts are stable.

---

## Canonical Visual Reference URLs

> `DESIGN.md` remains the primary visual reference source of truth. This list is duplicated here only as an execution convenience so agents can immediately record which references were actually inspected for each task. If this list ever conflicts with `DESIGN.md`, follow `DESIGN.md` and update this section.

- Refero — https://refero.design/
- Awwwards — https://www.awwwards.com/
- Behance — https://www.behance.net/
- Dribbble — https://dribbble.com/
- Pinterest — https://www.pinterest.com/
- Rootly — https://rootly.com/
- Retool — https://retool.com/
- ElevenLabs — https://elevenlabs.io/
- Raycast — https://www.raycast.com/
- Melius — https://www.melius.com/
- Linear — https://linear.app/
- Framer — https://www.framer.com/

### Reference Usage Rule

For each major landing section or major workspace interaction:

1. inspect at least 2–4 references that are genuinely relevant;
2. record the exact URLs actually opened/used in the `Reference Research Ledger`;
3. note the tool/skill/MCP used;
4. summarize what was learned: composition, hierarchy, interaction, motion, spacing, product visualization, or content density;
5. choose one adapted direction for FORME;
6. never copy branding, proprietary assets, copywriting, or layout pixel-for-pixel;
7. do not mark a visual task complete if the required reference pass has not been recorded.

Do not populate the ledger with sources that were merely listed in the documentation but were not actually inspected during implementation.

---

## Current Product Decisions

These decisions are already approved and should be treated as current unless explicitly superseded.

### Brand & Visual System

- Landing page is fixed light theme and remains predominantly white.
- Primary brand color is FORME Crimson `#7D070B`.
- Exactly two optional alternate CTA fills are allowed:
  - Deep Crimson `#5B090C`
  - Signal Crimson `#A30A10`
- Crimson variants are alternatives, not a combined palette.
- No pink, berry, rose, magenta, mauve, or softened-maroon direction.
- Dark workspace is fully neutral grayscale; no crimson/maroon/red brand tint in dark workspace chrome.
- Primary font: Instrument Sans.
- Measurement/technical font: Geist Mono.
- UI icons: Lucide React.
- Provider/technology logos: Simple Icons, Devicon, or official supplied assets.
- Emoji are not allowed as UI icons or decoration.
- Decorative gradients, glow, generic AI sparkle language, excessive pills, and card-everywhere layouts are prohibited.
- Hero minimum height is `100svh`.
- Navbar is wide at top and smoothly contracts into a compact floating navbar on scroll.
- Product visuals should carry more explanatory weight than marketing copy.

### Logo Asset Source & Usage

- Canonical production extraction source: `forme_logo_assets_master_sheet.png.png`.
- The master sheet is already the approved no-background asset sheet; required production variants must be manually cropped/extracted from it.
- `forme_brand_identity_master_board.png` is presentation/reference material, not the preferred production extraction source.
- Main/primary landing logo must come from the master sheet.
- App icon/favicon must use the existing approved app-icon artwork in the master sheet.
- Dark workspace branding must use the approved white logo/mark, keeping workspace chrome neutral.
- `forme_logo_mark_white.png` may be reused only if it matches the white variant in the master sheet.
- Do not redesign, regenerate, auto-trace, distort, recolor arbitrarily, or rebuild the logo with CSS.
- Record every extracted production asset and its path in the Logo Asset Extraction Ledger.

### Landing Structure

Approved high-level sequence:

1. Navbar
2. Hero
3. Product Proof / Workspace
4. Block Wireframing
5. AI Composer
6. Presets + DESIGN.md
7. BYOM / Providers
8. Workflow / Handoff
9. Pricing
10. Closing CTA + Footer

Each major section requires a reference pass before implementation.

### Workspace Structure

- Left rail with FORME branding and primary workspace navigation.
- Infinite canvas in the center.
- Floating AI Composer inside the canvas.
- Floating Block/Tool Dock inside the canvas.
- Right area order:
  1. Profile
  2. Share
  3. Export
  4. Inspector
- Profile control is rectangular with modest rounding, not a large pill.
- Mouse Pointer/Select and Text tools must always remain directly visible in the floating tool dock.

### Wireframe / Block System

- Block = reusable template.
- Node = placed block instance.
- Wireframes are grayscale.
- Lighter gray represents deeper/background structure.
- Darker gray represents nearer/content-level blocks.
- Block types are differentiated through shape, icon, border, label, placeholder pattern, and hierarchy rather than arbitrary colors.
- Default layout approach is flow/stack/grid.
- Absolute positioning is opt-in.
- Default frame widths:
  - Desktop 1440px
  - Tablet 768px
  - Mobile 390px
- One semantic node identity persists across breakpoints.

### AI Composer

Composer is inside the canvas and supports:
- `+` attachments
- `/` commands
- `@` scoped mentions
- Preset selector
- Model selector
- Send action

AI edits must respect scoped context and must not silently rewrite unrelated pages/nodes.

### Provider Connections

Approved provider/company entries:

1. Meta / Muse
2. OpenAI
3. Anthropic / Claude
4. Google / Gemini
5. Alibaba / Qwen
6. Z.ai / GLM
7. Xiaomi / MiMo
8. xAI / Grok
9. Moonshot AI / Kimi
10. DeepSeek
11. MiniMax
12. Ignix — Coming Soon

Additional connector:
- OpenAI-Compatible with Base URL + API Key

Model lists are fetched dynamically after provider connection and credential validation.

### DESIGN.md Feature

Current release:
- upload DESIGN.md;
- paste DESIGN.md;
- manually write/edit DESIGN.md;
- parse/apply context.

Coming Soon:
- automatic DESIGN.md generation.

### Website Crawling

- Crawl-to-wireframe is Coming Soon for the current release.
- Future crawler must extract structure/principles rather than pixel-clone websites.
- SSRF protection is mandatory before activation.

### MCP

- MCP is deferred until the end of the core product build.
- Initial MCP should be read-only.
- MCP must not be stabilized against an unstable Node/Canvas schema.

---

## Completion Evidence

### DOC-001 — Product documentation baseline

| Field | Value |
|---|---|
| Priority | High/P0 |
| Status | Prework |
| Provider/boundary | Documentation artifacts only; no runtime provider involved |
| Environment | Not applicable |
| Skills used | None recorded in repository execution yet |
| MCP tools used | None |
| Commands | None recorded in repository execution yet |
| E2E path | Not applicable |
| Persistence evidence | Documentation files prepared externally; repository placement not yet verified |
| Failure/recovery evidence | Not applicable |
| Timestamp | 2026-09-24T23:31:00+07:00 |

**Evidence:**
- `DESIGN.md` prepared as FORME visual source of truth.
- `prd.md` prepared as FORME v0.2 product requirements.
- `AGENTS.md` prepared as FORME execution contract.
- `SESSION.md` initialized with current state and approved decisions.

**Notes:**
- These files are prepared but must still be inspected inside the actual repository before development evidence can be considered verified.
- No production code, provider connection, E2E journey, deployment, or durable persistence has been verified yet.

---

## Phase Ledger

### Phase 0 — Brand Asset Preparation (Pre-P0 Mandatory Gate)

**Priority:** Pre-P0 prerequisite  
**Mode:** Asset preflight / verification  
**Status:** Verified 2026-09-25 under the explicit deterministic-cleanup/white-mask product decision; only variants needed by first production slice extracted

- [x] Locate `public/forme_logo_assets_master_sheet.png.png`
- [x] Inspect master-sheet transparency and available variants
- [x] Extract/crop primary landing logo required by first slice
- [x] Extract/crop white logo/mark for dark workspace from identical cleaned red-symbol alpha mask
- [x] Extract/crop approved light app icon from the sheet
- [x] Do not reuse `forme_logo_mark_white.png` without a match; bypassed because its edge/interior artifacts do not match clean symbol mask
- [x] Preserve geometry, spacing, original retained alpha edges, and aspect ratio
- [x] Place exports in `apps/web/public/brand/forme/` (real Next.js production asset path)
- [x] Record every source → output mapping in the Logo Asset Extraction Ledger
- [x] Verify no asset was redesigned/regenerated/auto-traced
- [x] Mark this gate Verified before Phase 1 visual implementation continues

**Phase completion gate:**  
All brand assets needed by the first P0 slice exist in the real production asset path, each is traceable to `forme_logo_assets_master_sheet.png.png`, dark workspace has an approved white mark, app icon is sourced from the existing sheet, and the extraction ledger below is complete.

### Phase 1 — Design Contract + Landing

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** Verified 2026-09-26 against the production build for the landing/browser scope. The older checklist below is marked from observed evidence; no auth/project persistence is claimed.

Planned tasks:

- [x] Inspect repository structure and current production frontend path
- [x] Verify framework/package versions before modifying code
- [x] Read actual root docs (`FORME-DESIGN.md`, `FORME-PRD.md`, `TECH-STACK.md`, `AGENTS.md`, `SESSION.md`); no legacy `DESIGN.md`/`prd.md` duplicates
- [x] Implement global typography/color/radius/spacing tokens
- [x] Implement reusable `PLACEHOLDER_ASSET` treatment and note convention
- [x] Reference pass for Navbar
- [x] Build Navbar + morph behavior
- [x] Reference pass for Hero
- [x] Build 100svh Hero with fully visible responsive preview
- [x] Reference pass for Product Proof
- [x] Build Product Proof / Workspace section
- [x] Reference pass for Block Wireframing section
- [x] Build Blocks / AI Composer / DESIGN.md scroll narrative
- [x] Reference pass for AI Composer section
- [x] Build interactive local preview controls; no provider success simulated
- [x] Reference pass for Presets + DESIGN.md section
- [x] Build design-direction preview and Coming Soon generation state
- [x] Reference pass for Provider section
- [x] Build illustrative BYOM/provider status surface
- [x] Reference pass for Workflow section
- [x] Build four workflow cards
- [x] Reference pass for Pricing
- [x] Build three monthly USD price proposals; checkout stays off
- [x] Reference pass for Closing CTA/Footer
- [x] Build closing CTA, Mavent placeholders, FAQ, grouped footer
- [x] Add page/section transition system
- [x] Add `prefers-reduced-motion`
- [x] Responsive pass at 320, 390, 768, 1024, 1440 CSS px
- [x] Landing keyboard/touch/focus/reduced-motion pass (manual browser evidence below)
- [x] Production browser verification for Phase 1 marketing route and local preview behavior

2026-09-25 steering: expand the landing with a post-hero ecosystem marquee, a fully visible honest interactive preview, GSAP scroll-linked Blocks/Composer/Design Direction, asymmetric interactive feature atlas, four workflow cards, three proposed monthly subscription cards, Mavent portfolio page, FAQ, refined closing/footer, and page-level Workspace/DESIGN.md/Crawler/Login navigation. Original unchecked checklist is retained until completion evidence exists.

**Phase completion gate:**  
The complete landing journey renders and behaves correctly through the production frontend path, all 10 major sections follow `DESIGN.md`, major visual work has recorded reference evidence, motion has reduced-motion support, missing imagery uses documented placeholders, and there are no dead/fake interactions.

---

### Phase 2 — Auth + Project Shell

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** Core email/password + owner-scoped project and requested post-login hub acceptance gates verified; Google/GitHub need OAuth client credentials; optional light canvas theme remains deferred

- [ ] Google authentication — blocked on client credentials
- [ ] GitHub authentication — blocked on client credentials
- [x] Email/password authentication
- [x] Session persistence
- [x] Project dashboard
- [x] Create project
- [x] Open recent project
- [x] Workspace shell
- [x] Dark-first theme
- [ ] Optional light workspace mode
- [x] Left rail
- [x] Profile / Share / Export shell
- [x] Inspector shell
- [x] Authorization checks

**Phase completion gate:**  
A real authenticated user can create, reopen, and access only their own project through the configured auth/database boundary.

**Core gate evidence:** `pnpm e2e:production` passed through the production Next.js HTTP path and isolated Neon `forme-dev`; the broader phase remains open for OAuth credentials and optional light-workspace work.

**2026-09-26 hub refinement:** after signup/login, `/projects` is the product hub with Workspace, Generator, and Cloning navigation. Workspace cards reflect the owner’s persisted canvas summary; Generator/Cloning remain explicit non-working Coming Soon routes. Auth/API/SSR checks are recorded in the `FORME-HUB-01` E2E row below.

---

### Phase 3 — Block/Node Schema + Canvas

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** Core schema, node API, custom block save/reuse, revisioned JSONB persistence, workspace renderer, and SSR visible state are verified. UI-only gestures remain unverified by policy; Phase 3 is not marked complete.

- [x] Canonical Block/Node schema
- [x] Node validation
- [ ] Infinite canvas — pan/zoom code exists; pointer behavior is UI-only and unverified by script
- [x] Floating tool dock
- [x] Select/Text always visible in server-rendered workspace
- [x] Primitive block catalog
- [x] UI block catalog
- [x] Section template catalog
- [x] Custom block authoring/reuse
- [ ] Drag-to-place — implemented; pointer interaction remains UI-only/unverified
- [ ] Select/move/resize/delete/duplicate — operations/Inspector exist; UI gesture path remains UI-only/unverified
- [ ] Layers — rendered; pointer interactions remain UI-only/unverified
- [ ] Inspector — rendered; editable fields use production mutation APIs but UI path is not scripted
- [x] Undo/redo state + versioned document replacement logic; store/unit and API path verified
- [x] Persistence
- [x] Reload/recovery

**Phase completion gate:**  
A manual semantic wireframe can be created, persisted, reloaded, and edited without losing node identity or hierarchy.

**Current evidence boundary:** authenticated production HTTP E2E creates and edits a nested semantic node, snapshots/reuses a custom block with fresh identities, reads the document back from PostgreSQL, verifies server-rendered workspace output, checks revision conflict/replay, and deletes nested subtrees without orphans. Script-only E2E cannot prove pointer, visual, or keyboard UI gestures; those remain explicitly unverified.

---

### Phase 4 — Responsive Wireframe

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** In progress — the stable Design IR carries one node identity and per-breakpoint layout slots; implementing responsive views and override controls

- [ ] Desktop frame
- [ ] Tablet frame
- [ ] Mobile frame
- [ ] Shared semantic identity
- [ ] Per-breakpoint layout overrides
- [ ] Side-by-side preview
- [ ] Grayscale depth renderer
- [ ] Image placeholder
- [ ] GIF placeholder
- [ ] Asset replacement notes
- [ ] Breakpoint persistence

**Phase completion gate:**  
The same node identity can render and persist independent layout behavior across Desktop/Tablet/Mobile without cross-breakpoint corruption.

---

### Phase 5 — AI Composer + Provider Layer

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** Initial real Gemini connection → model discovery/cache → scoped text edit vertical slice verified; remaining Composer operations, attachment flows, and provider adapters are still open.

- [x] Floating Composer in canvas with Gemini connection and live Model selector
- [ ] `+` attachments
- [ ] `/` commands
- [x] `@node` scope follows the selected semantic node; page/component/file scopes remain open
- [x] Provider connection UI — Google Gemini vertical slice; additional providers remain open
- [x] Reusable provider adapter contract with Gemini implementation; add adapters incrementally
- [x] Credential validation and AES-256-GCM encrypted server-side storage
- [x] Live Gemini model discovery
- [x] Model normalization/cache from live provider response
- [x] Composer model selector populated only from cached live models
- [x] Selection-aware text-node edit with strict Design IR operation validation and revisioned Neon persistence
- [x] Invalid-key → valid credential recovery, idempotency replay, owner isolation
- [ ] Controlled provider-timeout/unknown-outcome recovery E2E
- [ ] Scoped semantic node creation/restructure operations

**Phase completion gate:**  
At least one real connected provider can fetch models and perform a scoped node create/edit through the production Composer path, with persistence and real failure handling verified.

---

### Phase 6 — Presets + DESIGN.md

**Priority:** High/P0  
**Mode:** Breadth pass  
**Status:** Not started

- [ ] Minimum 10 presets
- [ ] Apply preset before wireframe
- [ ] Apply preset after wireframe
- [ ] Upload DESIGN.md
- [ ] Paste DESIGN.md
- [ ] Manual DESIGN.md editor
- [ ] Parse DESIGN.md rules
- [ ] Apply project design context
- [ ] Preserve semantic structure
- [ ] Automatic generation shown only as Coming Soon

**Phase completion gate:**  
Preset and manual DESIGN.md context can alter the project presentation/AI context without destroying semantic structure.

---

### Phase 7 — Share, Export & Hardening

**Priority:** High/P0  
**Mode:** Depth pass  
**Status:** Not started

- [ ] Read-only share link
- [ ] Share permission validation
- [ ] Real export path
- [ ] Export validation
- [ ] Keyboard pass
- [ ] Accessibility pass
- [ ] Performance profiling
- [ ] Empty/error/retry/recovery states
- [ ] Durable loading state
- [ ] Browser/device QA

**Phase completion gate:**  
Share and export are real, permission-safe, and match current project state; core P0 product journeys are stable.

---

### Phase QA — Testing & Verification

**Priority:** High/P0  
**Mode:** QA  
**Status:** Not started

Required:
- [ ] Unit
- [ ] Integration
- [ ] Provider contract
- [ ] Node schema contract
- [ ] E2E
- [ ] Failure/recovery
- [ ] Persistence
- [ ] Responsive
- [ ] Accessibility
- [ ] No dead/fake interaction
- [ ] Evidence recorded below

---

### Phase Security

**Priority:** High/P0  
**Mode:** Security  
**Status:** Not started

Required:
- [ ] XSS/input validation
- [ ] Auth/session validation
- [ ] Project ownership
- [ ] Encrypted provider credentials
- [ ] Secret redaction
- [ ] Upload validation
- [ ] Rate limiting
- [ ] Dependency scan
- [ ] Share authorization
- [ ] Analytics/privacy review
- [ ] SSRF protection before crawler activation

---

### Phase 8 — P1 Extensions

**Priority:** Medium/P1  
**Mode:** Breadth pass  
**Status:** Not started

- [ ] AnyMD → FORME handoff
- [ ] Website crawler implementation
- [ ] Crawl → semantic wireframe
- [ ] MCP read-only package
- [ ] MCP scoped token/revocation
- [ ] MCP contract tests
- [ ] Ignix provider activation only after real backend/provider exists

---

## E2E Retest Ledger

| Journey | Environment | Commit | Result | Retest when |
|---|---|---|---|---|
| Phase 1: landing → local workspace preview, route navigation, responsive preview controls, marquee pause/resume, sticky scroll story, FAQ | Local production `next start -p 3100`, 2026-09-26; no Git commit | No Git repository | Pass for static marketing/temporary preview scope; not an authentication/project-persistence journey | Retest on source/config/environment/release-gate changes |
| Phase 2: signup/session → invalid login + recovery → create/project read-back/reload → workspace reopen → second-user denial → sign-out → cleanup | Local production build `http://localhost:3100` + real Neon `forme-dev` PostgreSQL, 2026-09-26; no Git commit | No Git repository | PASS via `pnpm e2e:production`; Node fetch + PostgreSQL; test-run accounts/projects cleaned | Retest on source/config/provider/environment/failure/release-gate changes |
| Phase 3: nested node create/edit/layout → custom block snapshot/reuse → versioned canvas replacement/replay → workspace SSR → owner isolation → subtree cleanup | Local production build `http://localhost:3100` + real Neon `forme-dev` PostgreSQL, 2026-09-26; no Git commit | No Git repository | PASS via `pnpm e2e:production`; Node fetch + PostgreSQL; script-created accounts/projects/custom instances cleaned | Retest on source/config/provider/environment/failure/release-gate changes |
| FORME-HUB-01: signup/login session → `/projects` Workspace hub → persisted canvas preview → Generator/Cloning Coming Soon → responsive override read-back → owner isolation → sign-out → cleanup | Fresh local production build `http://localhost:3101` with matching `BETTER_AUTH_URL`/`E2E_BASE_URL` + real Neon `forme-dev`, 2026-09-26; no Git commit | No Git repository | PASS via `pnpm e2e:production`; persisted project preview reflects 2 saved nodes; Coming Soon pages expose no forms; all test records cleaned. First attempt used the pre-build server on 3100 and failed because it did not expose `nodeCount`; rerunning the same built source on a fresh server port passed. | Retest on source/config/provider/environment/failure/release-gate changes |
| FORME-GEMINI-01: invalid key → encrypted Gemini connection → live model discovery/cache → scoped AI edit → revision/read-back/workspace reload → idempotent replay → owner isolation → disconnect/cleanup | Fresh local production build `http://localhost:3101` with matching auth/E2E origin + real Neon `forme-dev` + validated Gemini API key, 2026-09-26; no Git commit | No Git repository | PASS via `pnpm e2e:production`: invalid credential rejected without storing it; 61 provider models returned, 44 normalized as `generateContent`; dynamically selected model completed one heading-text edit; Neon revision advanced to 3, sentinel node remained unchanged, idempotent replay did not increment revision, response/cache contained no plaintext key, account-scoped cleanup passed. Initial stale models returned 404/503; E2E selected a current live `-latest` lightweight model and the production path passed. | Retest on source/config/provider/environment/failure/release-gate changes |

Do not add a passing result without actual browser/provider/durable-boundary evidence.

Do not rerun a passing journey unless its listed retest condition is met.

---

## Reference Research Ledger

Use this table for major visual implementation work.

`References inspected` must contain the exact source names that were actually opened.  
`Exact URLs used` must contain the actual URLs visited for that task, not the entire canonical list.

| Task / Section | References inspected | Exact URLs used | Tools / Skills | What was learned | Chosen FORME direction | Evidence |
|---|---|---|---|---|---|---|
| Phase 2 workspace shell | Linear, Retool; Refero screen search unavailable (`NO_SUBSCRIPTION`) | https://linear.app/ ; https://retool.com/ | Firecrawl scrape; Refero MCP attempted; `FORME-DESIGN.md` workspace anatomy | Linear compact list hierarchy; Retool dark split-workspace regions and visible working surface | Neutral, dark-owned-project shell: compact rail, persisted canvas frame, right Profile → Share → Export → Inspector; future editor tools explicitly deferred | Firecrawl returned HTTP 200 for both approved reference URLs on 2026-09-26; no source assets/copy reused |
| Navbar | Raycast, Linear, ElevenLabs | https://www.raycast.com/ ; https://linear.app/ ; https://elevenlabs.io/ | read-only reference sub-agent, live page retrieval | Raycast bounded scrolled bar; Linear restrained links; ElevenLabs clear actions | Short page-level navigation with wide-to-compact CSS morph; honest Coming Soon routes | Sub-agent returned actual opened URLs 2026-09-25 |
| Hero | ElevenLabs, Linear, Retool, Framer | https://elevenlabs.io/ ; https://linear.app/ ; https://retool.com/ ; https://www.framer.com/ | read-only reference sub-agents | Sparse copy and immediate builder proof | White 100svh-min hero with dark, clickable but explicitly local preview | Live browser visit and prior read-only reference pass |
| Product Proof | Retool, Framer | https://retool.com/ ; https://www.framer.com/ | read-only reference sub-agent / Firecrawl | Product interface carries explanation, result stays editable | One large semantic workspace stage | Source screenshot QA pending latest build |
| Block Wireframing | Framer, Melius | https://www.framer.com/ ; https://www.melius.com/ | read-only reference sub-agent / live browser | Editable artifact plus labeled canvas composition | Blocks step in persistent scroll narrative | Source QA pending |
| AI Composer | Framer, Retool, Linear | https://www.framer.com/ ; https://retool.com/ ; https://linear.app/ | read-only reference sub-agent | Contextual request and visible result | Composer instruction typing in sticky stage; no fake provider call | Source QA pending |
| Presets + DESIGN.md | Framer, Melius | https://www.framer.com/ ; https://www.melius.com/ | read-only reference sub-agent | Compare treatment while retaining structure | Third state of same semantic stage; auto-generation stays Coming Soon | Source QA pending |
| Providers | Raycast, Retool, Melius | https://www.raycast.com/ ; https://retool.com/ ; https://www.melius.com/ | read-only reference sub-agent | Tool workflow > logo wall | Compact illustrative connection surface; models gated on real validation | Source QA pending |
| Workflow | Linear, Rootly, Retool | https://linear.app/ ; https://rootly.com/ ; https://retool.com/ | read-only reference sub-agent | Product states and capability bands | Four distinct cards describing the artifact's progression | Source QA pending |
| Pricing | Melius, Retool, Raycast, Rootly; Visily/Figma/Lovable/v0 pricing | https://www.melius.com/ ; https://retool.com/ ; https://www.raycast.com/ ; https://rootly.com/ ; https://www.visily.ai/pricing/ ; https://www.figma.com/pricing/ ; https://lovable.dev/pricing ; https://v0.app/pricing | read-only reference/pricing sub-agent | Comparable observed $14–$30 editor/tool entry points, billing qualifications vary | Solo $5/Maker $10/Studio $19 USD editor/month **proposals only**, no checkout | Pricing research dated 2026-09-25; detailed qualifications in execution record |
| Closing CTA/Footer | Linear, Rootly, Raycast | https://linear.app/ ; https://rootly.com/ ; https://www.raycast.com/ | read-only reference sub-agent | Single clear close and grouped real links | Asymmetric closing artifact and multi-column footer | Source QA pending |
| Post-hero marquee / feature atlas | Melius, Framer, Rootly | https://www.melius.com/ ; https://www.framer.com/ ; https://rootly.com/ | live-browser reference sub-agent; Magic UI/21st/ReactBits/ui-layouts metadata/source inspection | Melius strip at hero foot + sticky showcase; Framer varied cell spans; Rootly distinct product bands | Examples-not-customers mark strip + semantic-node atlas with Flow/Stack toggle | Refero MCP search returned NO_SUBSCRIPTION; no Refero content used |
| Post-login product hub | Linear, Retool; Refero screen/style search unavailable (`NO_SUBSCRIPTION`) | https://linear.app/ ; https://retool.com/ | Firecrawl scrape; Refero MCP attempted; `FORME-DESIGN.md`; `frontend-design`, `frontend-ui-engineering`, `responsive-design` | Linear’s restrained navigation/metadata hierarchy; Retool’s product-sized project previews | Collapsible three-destination rail; previews from persisted semantic canvas nodes; static theme-adaptive small wave only on Workspace; Generator/Cloning remain Coming Soon | Both approved URLs returned HTTP 200 on 2026-09-26; user supplied Figma-like placement cue, no proprietary assets/copy/layout reused |

### Example Entry Format

```text
Task / Section: Hero
References inspected: ElevenLabs, Retool, Framer
Exact URLs used:
- https://elevenlabs.io/
- https://retool.com/
- https://www.framer.com/
Tools / Skills: [actual tools used only]
What was learned: sparse copy, product-first composition, editable-canvas product proof
Chosen FORME direction: 100svh white hero with dominant dark workspace visual
Evidence: [screenshot/log/note/reference capture]
```

The example above is a format example only. Do not treat it as completed implementation evidence.

---

## Placeholder Asset Ledger

Use `PLACEHOLDER_ASSET` in the code and record unresolved assets here.

| Asset ID | Section / Component | Ideal asset | Ratio / Size | Status |
|---|---|---|---|---|
| HERO-01 | Hero workspace stage | Genuine dark FORME editor with Composer editing Hero + Desktop/Mobile frames; current stage is an honestly labeled DOM preview | 16:10 preferred | Pending real editor capture; `PLACEHOLDER_ASSET` in `apps/web/src/app/page.tsx` |
| PROOF-01 | Product Proof | Real dark FORME workspace capture with semantic canvas/inspector/Composer | 16:10 preferred | Pending real editor capture; `PLACEHOLDER_ASSET` in `apps/web/src/app/landing-sections.tsx` |
| PORTFOLIO-01 | Mavent products page | Verified official screenshots for FORME, Vulpix Mavent, Ignix, AnyMD, Moxa and official destination URLs | 16:10 for each | Pending owner assets/URLs; visible neutral placeholders and disabled site-link buttons |

Do not remove a placeholder from this ledger until the final asset is actually present and verified.

---

## Logo Asset Extraction Ledger

`forme_logo_assets_master_sheet.png.png` is the canonical source of truth.

Do not mark an entry Verified until the actual extracted file exists in the production asset path and has been visually checked against the source sheet.

| Variant | Canonical source | Output path | Intended use | Status | Verification note |
|---|---|---|---|---|---|
| Primary/main logo | `public/forme_logo_assets_master_sheet.png.png` | `apps/web/public/brand/forme/forme-logo-primary.png` | Landing/light surfaces | Verified extraction | Source crop (64,68,662,244), 598×176, alpha bbox (4,4,594,172); direct original pixels retained wherever source alpha ≥64 |
| Symbol only | `public/forme_logo_assets_master_sheet.png.png` | `apps/web/public/brand/forme/forme-logo-symbol.png` | Compact branding and source mask for white mark | Verified extraction | Source crop (65,70,254,244), 189×174, alpha bbox (3,2,187,170) |
| Wordmark only | `forme_logo_assets_master_sheet.png.png` | Not extracted | Not needed for first slice | Deferred, not required | No unused asset created |
| Horizontal lockup | `forme_logo_assets_master_sheet.png.png` | Not extracted | Not needed for first slice | Deferred, not required | No unused asset created |
| Stacked lockup | `forme_logo_assets_master_sheet.png.png` | Not extracted | Not needed for first slice | Deferred, not required | No unused asset created |
| White logo/mark | Cleaned red-symbol alpha mask from canonical sheet | `apps/web/public/brand/forme/forme-logo-mark-white.png` | Dark workspace branding | Verified derived export | 189×174, alpha bbox (3,2,187,170); alpha bytes identical to red symbol; all visible RGB pure white |
| Light app icon | `public/forme_logo_assets_master_sheet.png.png` | `apps/web/public/brand/forme/forme-app-icon-light.png` | App icon/favicon | Verified extraction | Approved existing light-tile treatment, source crop (1001,307,1194,501), 193×194, alpha bbox (4,4,189,190) |
| Dark app icon | `forme_logo_assets_master_sheet.png.png` | Not extracted | Not needed for first slice | Deferred, not required | Approved light icon selected |

### 2026-09-25 — Pre-P0 inspection (not extraction)

- Opened `public/forme_logo_assets_master_sheet.png.png` (1536×1024 RGBA). The sheet visually contains several logos/icons but also a black-to-red/gray presentation background, broad red/white glows and shadows extending around the marks. Its alpha ranges 0–254; a rectangular crop includes composited treatment rather than a clean transparent lockup. This contradicts the documented claim that the canonical sheet is a no-background production extraction sheet.
- Primary dark-wordmark/crimson-symbol lockup is visible upper-left; light/dark app-icon tiles are visible middle-right. Their clean transparent edges cannot be verified by cropping this composite, so no production export was created.
- White wordmarks in the sheet appear paired with crimson symbols; no all-white standalone symbol was identifiable. `public/forme_logo_mark_white.png` (1254×1254 RGBA) exists but has visible scattered edge/interior artifacts; matching it against a white symbol in the sheet is impossible without that source variant. Do not approve it by assumption.
- `public/forme_brand_identity_master_board.png` (1536×1024 RGB) labels the variants but is a flattened presentation board and cannot substitute for the canonical source.
- This is a real logo-provenance pause gate under `AGENTS.md` §5A/§25 and `FORME-DESIGN.md` §7A. Do not remove backgrounds, redraw, recolor, auto-trace, or use presentation crops as verified production branding.
- Output created: none. Visual use: none. Production path: none. Verification: failed for clean alpha/white-mark provenance. Inspected by main agent and independent read-only logo-analysis sub-agent.

### 2026-09-25 — Product decision and successful deterministic extraction

- Explicit user decision supersedes the earlier pause: the sheet remains canonical, but local deterministic cleanup of halo/splatter/background outside artwork and deriving a white mark from the exact cleaned red-symbol alpha mask are approved. Updated `FORME-DESIGN.md`, `FORME-PRD.md`, and `AGENTS.md` before extraction. Earlier blocked finding above is retained as historical evidence, not the current state.
- Reproducible source: `extract_forme_assets.py` using Pillow 12.0.0. Source regions: primary `(55,55,680,250)`, symbol `(65,70,254,245)`, light app icon `(995,302,1195,503)`; retain original RGBA within two pixels of pixels with alpha ≥64, zero alpha outside this envelope, crop to resulting content bounds plus four pixels safe padding. No resizing, tracing, synthetic shape, or change to retained source pixels. Final absolute crop bounds and output dimensions are in the ledger above.
- Ran `python extract_forme_assets.py` successfully. Reopened all four PNGs: alpha minimum 0 / maximum 254; nonempty alpha bboxes recorded above; every retained source pixel with alpha ≥64 is identical. Red/white symbol alpha byte-for-byte identical; white visible RGB is `(255,255,255)` only. Viewed all four assets and the white mark on neutral `#262626` temporary verification background (`C:/Users/USER/AppData/Local/Temp/opencode/forme-white-qa.png`) against the canonical source. Primary wordmark is intended for light surfaces; white mark is legible on dark. No production asset background added.
- `public/forme_logo_mark_white.png` was intentionally ignored: observed splatter/interior damage and no verified matching clean white artwork in sheet; new white mark instead shares exact verified red-symbol alpha geometry. Light app-icon variant selected directly from the sheet. Output paths are production-served `apps/web/public/brand/forme/`; future `apps/web` bootstrap must retain them.

### Asset Extraction Evidence

Record actual extraction evidence here during execution:

```text
Source inspected:
Output created:
Variant:
Production path:
Transparency verified:
Geometry/proportion verified:
Used in:
Tool/command:
Timestamp:
```

Do not fill this block with assumed evidence before the repository assets are actually inspected.

## Provider Verification Ledger

| Provider | Credential configured | Validation | Model discovery | Generation | Last verified |
|---|---|---|---|---|---|
| Meta / Muse | No evidence yet | Not run | Not run | Not run | — |
| OpenAI | No evidence yet | Not run | Not run | Not run | — |
| Anthropic / Claude | No evidence yet | Not run | Not run | Not run | — |
| Google / Gemini | Yes (`GEMINI_API_KEY` plus dedicated local encryption key; values withheld) | PASS — real `models.list`; invalid key rejected | PASS — 61 returned; 44 normalized as `generateContent` and cached | PASS — dynamically selected live Gemini Flash Lite model completed scoped text edit; Neon persistence, reload, revision, idempotent replay, owner isolation verified | 2026-09-26 |
| Alibaba / Qwen | No evidence yet | Not run | Not run | Not run | — |
| Z.ai / GLM | No evidence yet | Not run | Not run | Not run | — |
| Xiaomi / MiMo | No evidence yet | Not run | Not run | Not run | — |
| xAI / Grok | No evidence yet | Not run | Not run | Not run | — |
| Moonshot AI / Kimi | No evidence yet | Not run | Not run | Not run | — |
| DeepSeek | No evidence yet | Not run | Not run | Not run | — |
| MiniMax | No evidence yet | Not run | Not run | Not run | — |
| OpenAI-Compatible | No evidence yet | Not run | Not run | Not run | — |
| Ignix | Coming Soon | Disabled by product decision | — | — | — |

---

## Observability Evidence

| Metric/event | Definition | Source | Window/timezone | Consent | Result |
|---|---|---|---|---|---|
| DAU | Distinct active `actor_key` per UTC day | Not implemented | UTC day | Required | Not available |
| MAU | Distinct active `actor_key` in rolling 30 days | Not implemented | Rolling 30 days UTC | Required | Not available |
| Traffic | Page views and unique actors | Not implemented | Pending | Required | Not available |
| Activation | User reaches first saved wireframe | Not implemented | Pending | Required | Not available |
| AI generation reliability | Success/failure/retry/p95 | Not implemented | Pending | Required | Not available |
| Time-to-first-wireframe | Project created → first persisted semantic wireframe | Not implemented | Pending | Required | Not available |

Local synthetic fixtures may validate schemas and queries but must never be reported as production traffic or MAU/DAU.

---

## Decisions And Blockers

### Decisions

- **2026-09-25 — Logo asset source contract:** `forme_logo_assets_master_sheet.png.png` is the canonical production extraction source; dark workspace uses the approved white mark, app icons come from the sheet, and logo extraction is a mandatory Pre-P0 gate.

- **2026-09-24 — Reference source contract:** Canonical visual reference URLs are listed in `DESIGN.md` and mirrored in `SESSION.md` for execution convenience; the ledger must record only URLs actually inspected per task.
- **2026-09-24 — Brand direction:** Landing uses white-dominant Crimson Red identity with primary `#7D070B`; two alternate CTA fills only: `#5B090C` and `#A30A10`.
- **2026-09-24 — Dark workspace:** Full neutral grayscale; no crimson/maroon/red brand tint.
- **2026-09-24 — Typography:** Instrument Sans + Geist Mono.
- **2026-09-24 — Icon policy:** Lucide React for UI; Simple Icons/Devicon/official assets for provider branding; no emoji.
- **2026-09-24 — AI Composer:** Floating inside the canvas.
- **2026-09-24 — Tool dock:** Floating inside canvas; Select and Text remain directly visible.
- **2026-09-24 — Wireframe:** Semantic block/node model, grayscale hierarchy, one identity across breakpoints.
- **2026-09-24 — DESIGN.md:** Upload/paste/manual editing active; generation Coming Soon.
- **2026-09-24 — Crawler:** UI may show Coming Soon; real crawl-to-wireframe deferred.
- **2026-09-24 — MCP:** Deferred until core workspace schema stabilizes.
- **2026-09-24 — Provider model list:** Must be fetched live after credential validation; do not hardcode as permanent catalog.
- **2026-09-24 — Placeholder assets:** Missing imagery must not block implementation; use documented neutral placeholders with replacement notes.
- **2026-09-26 — Mavent products page:** product descriptions and official URLs beyond the FORME internal page wait for owner-provided sources; keep neutral placeholders and disabled external links, do not use search-derived guesses.
- **2026-09-26 — Post-login hub:** successful signup/login lands at `/projects`, now Workspace; authenticated slide navigation exposes Workspace, Generator, and Cloning. Workspace previews summarize persisted semantic nodes only; Generator/Cloning remain non-working Coming Soon routes. The Workspace background uses static, small, low-contrast waves in dark/light neutral themes.

### Blockers

- **Historical Pre-P0 blocker (resolved 2026-09-25):** canonical sheet was composited, then explicit deterministic cleanup/white-mask decision and extraction evidence resolved the gate.
- **Resolved 2026-09-25:** user explicitly approved deterministic raster cleanup and identical-alpha white-mark derivation. Extraction/visual checks in the ledger above verify Phase 0; earlier concern retained for provenance, not an active blocker.
- Repository inspection (2026-09-26): pnpm/Turborepo/Next app now exists under `apps/web`, source docs named `FORME-DESIGN.md` and `FORME-PRD.md`; no test suite configured. No Git repository at root/parent so status/diff/commit unavailable.
- Provider credentials are not yet verified; this becomes a valid pause gate only when Phase 5 reaches real provider integration.
- Final Ignix backend/provider connection does not exist yet by product decision; Ignix remains Coming Soon.
- **Phase 1 nonblocking:** three monthly prices are USD proposals, not approved checkout terms; no paid activation. `/login`, `/design-md`, and `/crawl` are honest status routes; workspace preview is local-only, no project/auth/provider persistence claimed.
- **Phase 2 environment:** Google/GitHub OAuth client credentials remain unavailable. `DATABASE_URL` and a generated `BETTER_AUTH_SECRET` exist only in ignored `apps/web/.env.local`; secrets are not recorded here. Existing Neon project `Mavent` was not modified; FORME uses isolated `forme-dev`.
- **E2E browser policy (2026-09-26):** production E2E is script-based only under `apps/web/scripts/e2e`, run with `pnpm e2e:production`. Do not use/add Playwright unless the user explicitly reauthorizes it. HTTP scripts cannot replace screen-reader/responsive visual QA; track that limitation and keep durable API verification.
- **Post-login hub visual QA:** the drawer slide/focus loop, wave rendering, dark/light appearance, and narrow viewport layout have no browser automation evidence; the production HTTP E2E verifies route content, ownership, persistence, and Coming Soon boundaries only.

---

## Files Changed / Prepared

- `FORME-DESIGN.md` — FORME visual and interaction source of truth; confirmed present 2026-09-25 (older ledger calls it `DESIGN.md`).
- `FORME-PRD.md` — FORME v0.2 requirements; confirmed present 2026-09-25 (older ledger calls it `prd.md`).
- `TECH-STACK.md` — technical architecture source of truth; confirmed present 2026-09-25.
- `AGENTS.md` — FORME execution contract; prepared.
- `SESSION.md` — initialized with current product decisions and execution ledger.
- `apps/web/src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`, and generated `drizzle/0000_dizzy_pet_avengers.sql` — Better Auth and projects schema/migration.
- `apps/web/src/lib/auth.ts`, `auth-client.ts`, `server-session.ts`, `src/app/api/auth/[...all]/route.ts` — Better Auth, session, and route integration.
- `apps/web/src/app/api/projects/**`, `src/app/projects/**`, `src/app/workspace/[projectId]/**`, `src/app/login/**` — private project API/dashboard/workspace shell and email/password UI.
- 2026-09-26 authenticated hub refinement: `apps/web/src/app/hub-shell.tsx`, `hub-shell.module.css`, `hub-feature.tsx`, `hub-feature.module.css`, `projects/project-card.tsx`, updated project hub/API, `/generator`, `/cloning`, and `src/lib/project-preview.ts` + test.
- `apps/web/scripts/e2e/auth-projects.ts` — extends production HTTP E2E for the hub navigation, owner-only canvas preview summary, Coming Soon routes, and sign-out protection.
- `apps/web/scripts/e2e/auth-projects.ts`, root/app package scripts, `apps/web/.env.example` — reusable script-based production E2E and local environment template.
- `TECH-STACK.md`, `AGENTS.md` — script-based E2E contract; Playwright requires explicit reauthorization.
- `NETLIFY-DEPLOY.md`, `docs/decisions/0001-temporary-netlify-host.md` — temporary hosting plan, current 50% readiness estimate, environment-variable guidance, and temporary Netlify decision.
- `apps/web/.env.example` — local template with required runtime keys, migration-only direct DB URL, and E2E-only values documented. Existing ignored `apps/web/.env.local` was not read or overwritten.

**Repository verification:** root source docs are present; Phase 1 production route journey, Phase 2 email/password/project E2E, Phase 3 persistence, responsive API-boundary checks, and Phase 5 Gemini scoped-edit E2E are recorded above. Phase 2 Google/GitHub OAuth remains unavailable and unimplemented; it is not required for the current email/password login path.

### 2026-09-25 execution record

| Field | Evidence |
|---|---|
| Phase/task/status | Phase 0 logo asset preflight; blocked on canonical clean source; Phase 1 not started |
| Provider/durable boundary | Local supplied image files only; no runtime/database/provider configured |
| Skills used | `using-superpowers`, `brainstorming` (preflight only; existing PRD/stack defines direction), `ponytail`, `planning-and-task-breakdown` |
| MCP/tools used | `read`, `glob`, `bash`, `task` (2 independent read-only sub-agents), `supermemory` (no saved matches), `todowrite`, `apply_patch` |
| Commands | `git status --short --branch` at project root → fatal: not a git repository. Root/parent Git lookup by repo-inspection sub-agent also negative. No build/test commands available |
| Git/status/diff | None: neither root nor checked parent is a Git repository; no commit or diff baseline |
| E2E path/result | Not run: application and production frontend path do not exist; Phase 0 asset verification cannot be asserted as runtime E2E |
| Persistence/failure/recovery | No runtime persistence. Failure: sheet composite and white-variant absence prevent clean crop; recovery requires clean approved source asset, then repeat visual/alpha/provenance verification |
| Reference research | Not performed: no major landing section/workspace interaction implemented; supplied `docs/reference/` screenshots were inventoried only |
| Sub-agents | `explore` — read-only repository inventory; `general` — read-only master-sheet and standalone-asset inspection. Neither edited files |
| Files changed | `SESSION.md` only (this evidence/blocker update). No production asset or code created |
| Decision | Do not silently substitute master-board imagery or unverified white convenience export; keep Phase 0 open |
| Next action | User supplies clean canonical layered/transparent master including white mark (or approves updating provenance contract for official exports); extract exact needed variants, verify, then initialize agreed Next.js/pnpm/Turborepo production path and Phase 1 tokens |

### 2026-09-25 Phase 1 in-progress record (latest steering)

| Field | Evidence |
|---|---|
| Product decision | User requested a proprietary product with 3 monthly subscription cards, minimum 9 sections, full visible/clickable hero preview, post-hero leftward marquee, scroll-linked Blocks/Composer/Design Direction, asymmetric animated atlas, four workflow cards, Mavent products page, FAQ, richer footer/nav. Updated `FORME-DESIGN.md` and `FORME-PRD.md` before pricing/UI revision. Generated prices `$5/$10/$19` USD per editor/month are explicitly proposed and no checkout exists |
| Production boundary | `apps/web` Next.js 16.3.6 App Router/React 19.3.0, Tailwind 4.3.3, pnpm 11.17.0, Turborepo 2.11.4; extracted PNGs in app `public`. `apps/worker`, Neon, Better Auth, provider adapters deferred to their true phase/dependencies |
| Skills/tools | `frontend-design`, `frontend-ui-engineering`, `pnpm`, `turborepo`, `incremental-implementation`, `verification-before-completion`, `debugging-and-error-recovery`, `gsap-core`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `agent-browser` (CLI unavailable, used Playwright MCP). Next Devtools MCP, bundled Next.js 16.3.6 docs, Context7 Simple Icons docs, Magic UI marquee source, ReactBits scroll-reveal source (not copied: global trigger cleanup unsafe), 21st metadata (no code retrieval), ui-layouts marquee source, shadcn registry lookup, Refero search (NO_SUBSCRIPTION), Firecrawl search (socket failure), Playwright browser, `apply_patch`/`read`/`grep`/`glob`/`bash` |
| Sub-agents | `general` read-only 4 canonical Navbar/Hero references; `explore` read-only bootstrap versions; two `general` read-only product/closing reference groups; two `general` read-only pricing comparison and Melius marquee/sticky live inspection. Main owns files/SESSION/completion decisions |
| Commands/results | `pnpm install` initially failed pnpm 11 strict lifecycle approval for `unrs-resolver`; narrowly set `allowBuilds.unrs-resolver: true`, retry passed. `pnpm --filter @forme/web build` passed before latest redesign (not final evidence). `typecheck` initially failed nonexistent `SiOpenai`, replaced with verified `SiVercel` export; latest `pnpm --filter @forme/web typecheck` and `lint` passed before most recent CSS/content edits. Next Devtools compilation issues empty at that checkpoint |
| Browser evidence so far | Dev `http://localhost:3101/`: 11 main regions (hero, marquee, proof, narrative, atlas, providers, workflow, pricing, collection, FAQ, close), 3 proposed price cards, 5 FAQ details. At desktop 1920×935 and scrollY 400, hero preview rect top ≈81/bottom ≈641, entirely visible; scrolling morphs nav 1408×72 → 990×60. Clicking Text adds visible `New text block`, inspector changes to Text; selecting Mobile displays 390 breakpoint. At mobile 390×844, page scrollWidth ≤ viewport. Latest post-change production build and full route/reduced-motion/keyboard verification are still pending |
| Persistence/failure/recovery | Landing preview is intentionally temporary local interaction, not a saved project; reset control is present; auth/AI/share/export controls in illustration are noninteractive labels. No server persistence claim. Broken `SiOpenai` import and pnpm policy failure were corrected; remaining visual QA ongoing |
| Reference result | Melius live `https://www.melius.com/`: post-hero leftward logo carousel and sticky multi-state showcase; reduced motion stops movement. Adapted as clearly labeled ecosystem examples (not customers/partners) + semantic scroll stage. Framer/Rootly live pages informed varied product evidence. Pricing comparison exact URLs and qualifications in reference ledger above |
| Files touched | Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.gitignore`; `apps/web` manifests/configs, global tokens, logo assets, landing/pages/components/CSS; `FORME-DESIGN.md`, `FORME-PRD.md`, `AGENTS.md` asset exception, `SESSION.md`, `extract_forme_assets.py` |
| Next action | Finish current desktop/mobile/reduced-motion E2E and route QA; fix defects; run fresh build/lint/typecheck; record final evidence before checking any Phase 1 task |

### 2026-09-26 recovery and execution record

| Field | Evidence |
|---|---|
| Recovery & VCS | Read `SESSION.md` first, then relevant sections of all 4 source docs; inspected app/routes/configs/assets. `git status --short --branch` -> not a Git repository. No Git diff/history available. No unit/integration/E2E suite or test config exists. |
| Phase 1 production checks | `pnpm lint`, `pnpm typecheck`, `pnpm build` passed after the latest Mavent placeholder component/copy. Next built 12 static app routes. Production server on localhost:3100; browser console error count 0. |
| Production route smoke | HEAD 200 for `/`, `/workspace`, `/product`, `/workflow`, `/pricing`, `/design-md`, `/crawl`, `/login`, `/mavent-products`, `/privacy`, `/about`, and primary/white/app-icon PNG paths. |
| Responsive and main visual | 320×800: hero stage x20,y515,w270,h196; caption ends y763; no horizontal overflow; six external preview touch controls 40.8×44. 390×844: full preview/caption fit viewport; touch targets >24. 768×1024: canvas right 526, mobile frame right 505 (no inspector overlap). 1024×768: hero stage y401–661, caption y673–690. 1440×900: stage y475–825, caption y837–854. |
| Interactions | Production CTA goes to `/workspace`; mobile Menu open at 320px has all links inside viewport, Tab focuses first item at x49; preview Add Text shows a temporary node and reload removes it (explicit local-only behavior); marquee Pause/Resume toggles CSS running→paused→running; FAQ disclosure opens; desktop story scroll selects Direct with sticky stage top=115. |
| Reduced motion/focus | Production `prefers-reduced-motion: reduce`: marquee animation `none`, hero content visible, no hidden-from pre-animation state. Dark-workspace focus ring is 2px neutral `rgb(242,242,242)` (rather than crimson). Hover translations explicitly disabled under reduce. |
| Mavent directory | Owner asked to defer descriptions and outbound URLs. Firecrawl/Apify searches could not reliably identify Vulpix/Moxa/etc.; AnyMD candidate was intentionally not used. Latest portfolio uses reusable `PlaceholderAsset`, supplied names, disabled pending URLs; verified production DOM has no external links and no guessed product positioning. |
| Phase 2 Neon read-only discovery | No `.env*`, DB URL, Better Auth secret, or OAuth client vars. Existing `Mavent` Neon production + `mcp-migration...` branches include `neon_auth` and app tables; none will be modified. A new isolated Neon project `forme-dev` created in `aws-ap-southeast-1` using the Mavent org. First create attempt with `suspend_timeout_seconds` was rejected by account policy (HTTP 412); retry without that optional override succeeded. No credentials fetched or written locally yet. |
| Sub-agents | `lysandra-creative` read-only visual/responsive/a11y review; `lucienne-engineering` read-only product-truth/security review; main agent integrated findings. |
| Skills/tools | `using-superpowers`, `session-guard`, `ponytail`, `accessibility-compliance`, `responsive-design`, `neon`, `neon-postgres`, `auth-implementation-patterns`, `security-and-hardening`, `context7`; Next Devtools MCP (server 3101 was stopped during recovery), Neon MCP, Playwright MCP, Firecrawl search, Apify RAG browser, `read`, `glob`, `grep`, `bash`, `apply_patch`, `todowrite`, `supermemory`. Context7 resolver for Better Auth/Drizzle remains pending. |
| Files changed since last ledger | Landing/CSS for responsive preview/nav/focus/marquee, workspace preview and carousel controls, Mavent portfolio wording and reusable placeholder component, source truth docs for owner-provided portfolio copy, plus `SESSION.md`. No production database or auth code changed. |
| Next action | Inspect the isolated `forme-dev` branch/database/role; read current Better Auth, Drizzle, and Neon integration docs; configure a private ignored local database URL; implement email/password → session → owned-project create/reload/unauthorized denial. Add Google/GitHub only when OAuth client credentials are available. |

### 2026-09-26 Phase 2 vertical slice and script E2E

| Field | Evidence |
|---|---|
| Status | Core email/password + private project path verified; Phase 2 parent remains open for Google/GitHub credentials and optional light mode. |
| Production boundary | Next.js 16.3.6 production build served at `http://localhost:3100`; Better Auth 1.7.6 + Drizzle 0.45.3; actual isolated Neon `forme-dev` PostgreSQL branch/database. No deployed staging/production URL was available for this run. |
| Database/persistence | `drizzle-kit generate` + `drizzle-kit migrate` applied to the isolated database; Neon table read-back confirmed `user`, `session`, `account`, `verification`, `projects`, and migration ledger. HTTP E2E confirmed session row and project owner id in PostgreSQL. |
| Script E2E | `pnpm e2e:production` PASS: signup/session read-back; invalid password rejected then correct login succeeds; invalid project payload rejected; create/read-back/reload/reopen; real DB owner/session rows; second-user list isolation + hidden project/workspace; sign-out/anonymous denial; generated accounts/projects cleaned. Node fetch + parameterized PostgreSQL verification only; no Playwright in this E2E. |
| Failure/recovery | Attempt on port 3110 was rejected by Better Auth `INVALID_ORIGIN` because configured local origin is 3100; reran on declared port 3100. First script run showed sign-out request construction failure and a cleanup client typing issue; sent the optional JSON body, used one PostgreSQL transaction client, and the focused rerun passed. |
| UI-only limitation | The script verifies login/session/API/workspace HTTP and durable data, not responsive layout, focus traversal, or screen-reader output. Manual UI inspection before the script-only instruction is not counted as E2E evidence; do not use browser automation again without explicit reauthorization. |
| Verification commands | `pnpm install --frozen-lockfile`; `pnpm --filter @forme/web db:generate`; `pnpm --filter @forme/web db:migrate`; `pnpm --filter @forme/web test` (4 passed); `pnpm --filter @forme/web typecheck`; `pnpm --filter @forme/web lint`; `pnpm --filter @forme/web build`; `pnpm e2e:production` (PASS after recovery). |
| Skills/MCP/tools | `neon-postgres`, `auth-implementation-patterns`, `security-and-hardening`, `incremental-implementation`, `frontend-ui-engineering`, `nextjs-app-router-patterns`, `test-driven-development`, `systematic-debugging`, `debugging-and-error-recovery`, `pnpm`; Neon MCP; Context7 Better Auth/Drizzle; bundled Next.js 16.3.6 docs; Firecrawl (Linear/Retool approved references); Refero MCP returned `NO_SUBSCRIPTION`; Node/TypeScript E2E script. |
| Cleanup | E2E script removed its unique run-created users, sessions, verification artifacts, and projects. Earlier manual synthetic QA account/project also removed from isolated `forme-dev`; no secrets or test passwords recorded here. |
| Files | Auth/client/session modules; Drizzle schema/config/migration; auth/project routes; login, projects, workspace-shell UI; project input tests; E2E runner; root/app package scripts; `.env.example`; `AGENTS.md`, `TECH-STACK.md`, and `SESSION.md`. |
| Next action | Start Phase 3: canonical Block/Node schema and first persisted canvas slice. Keep missing OAuth client credentials as a separate blocker. |

### 2026-09-26 Phase 3 semantic canvas + custom block evidence

| Field | Evidence |
|---|---|
| Status | Canonical Design IR, revisioned JSONB canvas, node operations, reusable custom blocks, and server-rendered editor implemented. UI-only pointer/focus behavior remains unverified under the script-only policy; Phase 3 remains open for interaction hardening and follow-up tasks. |
| Durable boundary | Production Next.js build at `http://localhost:3100`; real Better Auth + Neon `forme-dev` database. `projects.canvas` and `canvas_revision` are the single current canvas source of truth. |
| Script E2E | `pnpm e2e:production` PASS: nested container/heading creation; node label/content/desktop layout edit; tablet/mobile override preservation; stale write conflict + valid retry; malformed canvas rejection; custom block snapshot/save/reuse with fresh node identities; full-document save replay; project reload/SSR canvas render; PostgreSQL owner/revision/read-back; cross-account node/custom-block denial; subtree deletion and idempotent retry; cleanup. |
| Unit/state | `pnpm --filter @forme/web test` PASS (17 tests): catalog coverage, schema graph validity/orphan rejection, breakpoint override preservation, insert/update/remove/duplicate/reorder/custom-block operations, scoped store undo/redo and save queue, project input and UUID validation. |
| Build/type/lint | `pnpm --filter @forme/web build`, `typecheck`, and `lint` PASS after the editor integration. |
| UI-only limitation | Production HTTP E2E verifies server-rendered Select/Text, Layers, Inspector, block catalog and persisted node text, but cannot exercise drag/drop, pan/zoom, keyboard shortcuts, inspector form submission, or screen-reader behavior. No browser automation used after the explicit prohibition. |
| Failure/recovery | E2E empty-state check initially matched serialized custom-block template data in the RSC payload; assertion was narrowed to the rendered `Blank canvas` state, and the focused rerun passed. Earlier origin mismatch on a noncanonical port and sign-out body issue are preserved in the Phase 2 record. |
| References | Reused already inspected approved references: `https://linear.app/` (compact list/properties hierarchy) and `https://retool.com/` (dark builder with distinct work surface); Refero remained unavailable (`NO_SUBSCRIPTION`). |
| Files | `packages/design-ir/**`; `apps/web/src/db/schema.ts`, `src/lib/canvas-*`, `src/lib/http-json.ts`, node/project/block API routes, workspace canvas provider/store/renderer/editor/CSS, unit tests, E2E script, migrations, `.env.example`, root/app scripts, `FORME-PRD.md`, `TECH-STACK.md`, `AGENTS.md`, and `SESSION.md`. |
| Blockers / next | Google/GitHub OAuth client secrets are still missing but independent of canvas. Next: add responsive Desktop/Tablet/Mobile controls and side-by-side preview against the stable identity-preserving layout schema; keep actual browser-only behavior limitations explicit. |

---

### 2026-09-26 — Post-login product hub refinement

| Field | Evidence |
|---|---|
| Status / scope | Implemented the authenticated `/projects` hub requested by the user. Login/signup redirect destination stays `/projects`; the page now presents Workspace, Generator, and Cloning through a collapsible desktop / sliding mobile menu. |
| Visual references | Firecrawl retrieved the approved `https://linear.app/` and `https://retool.com/` pages (HTTP 200). Linear informed compact navigation and metadata hierarchy; Retool informed product-preview scale. Refero screen/style search was attempted and returned `NO_SUBSCRIPTION`. The user’s Figma-like placement was a direction cue; no exact artwork/layout was copied. |
| Durable boundary | Better Auth session + isolated Neon `forme-dev` PostgreSQL. `/api/projects` computes bounded previews from the owner-filtered `projects.canvas` JSONB; only node count/kind/depth are sent to cards, no canvas text or full canvas document. |
| Honest feature boundaries | Generator and Cloning are authenticated pages with explicit Coming Soon copy and no forms/input paths. Generator notes automatic DESIGN.md generation is unavailable; cloning does not accept or process URLs. |
| Theme/accessibility | Hub-only dark/light token mapping; dark chrome remains neutral. Workspace gets a static tiled low-contrast wave mask. Menu includes keyboard Escape, focus entry/return, focus loop and reduced-motion transition removal. |
| Skills/tools | `using-superpowers`, `brainstorming`, `frontend-ui-engineering`, `frontend-design`, `incremental-implementation`, `test-driven-development`, `accessibility-compliance`, `responsive-design`, `ponytail`, `vercel-react-best-practices`, `interaction-design`, `design-system-patterns`, `ai-debt-detector`, `verification-before-completion`; Next.js 16.3.6 bundled docs; Firecrawl scrape; Refero search (unavailable); `nextjs_index` attempted, no MCP server on configured production port; Node.js/TypeScript production E2E. `supermemory` search returned no saved match. No browser automation used. |
| Verification | `pnpm --filter @forme/web typecheck` PASS; `pnpm --filter @forme/web lint` exit 0 with one existing unused `WheelEvent` warning in `canvas-editor.tsx`; `pnpm --filter @forme/web test` PASS (20/20); `pnpm --filter @forme/web build` PASS, including dynamic `/generator` and `/cloning`; `pnpm e2e:production` PASS on a fresh local production server at `http://localhost:3101` + Neon `forme-dev`. |
| E2E coverage | Signup/session and invalid-login recovery; owner project create/list/reload; empty project preview; persisted two-node canvas preview on API + server-rendered hub; all three nav destinations; Generator/Cloning Coming Soon with no form; cross-account isolation; responsive breakpoint override persistence; subtree cleanup; sign-out and anonymous hub/editor route protection. E2E-created users/projects were cleaned. |
| Failure/recovery | First E2E rerun against the pre-existing `next start -p 3100` process failed because its in-memory build predated the new project-list response and returned no `nodeCount`. Confirmed the process/port, started the current production build on 3101 with matching temporary auth/E2E origins, and reran successfully. The 3101 process was stopped after the run; the pre-existing 3100 process was not altered. |
| Credential state | `GEMINI_API_KEY` was non-empty and validated read-only against Google’s official `models.list`: HTTP success, 61 models listed, 44 support `generateContent`. Key value was never printed. A new 256-bit `PROVIDER_SECRET_ENCRYPTION_KEY` was generated directly into ignored `apps/web/.env.local`; its value was not printed. No provider connection/model cache/generation code exists yet. |
| Files changed | `FORME-PRD.md`, `FORME-DESIGN.md`, `SESSION.md`; hub shell/theme/CSS, feature page/CSS, project cards and project client/page/CSS, `/generator`, `/cloning`, project summary API/helper/test, app test script, and production E2E script. No schema migration or provider write occurred. |
| UI-only limitation | HTTP E2E cannot prove the drawer animation/focus trap, rendered wave appearance, dark/light colors, 320–760px sizing, or theme switch. Record these as visual/keyboard limitations under the no-browser policy; don't claim their runtime appearance was verified. |
| Next action | Implement encrypted Gemini connection/model discovery and a scoped structured canvas edit, then verify real persistence/failure/recovery with the production E2E script. |

### 2026-09-26 — Gemini provider + scoped Composer vertical slice

| Field | Evidence |
|---|---|
| Status / scope | Verified the first reusable provider adapter (`google-gemini`): owner-scoped credential connect/disconnect, live model discovery/cache, model selector inside the canvas Composer, and one strict `setNodeText` Design IR operation scoped to the selected node. Additional operations/providers remain incomplete. |
| Provider boundary | Real Gemini Developer API using `x-goog-api-key` header; official endpoints `GET /v1beta/models` and `POST /v1beta/models/{model}:generateContent`. Read-only credential check: 61 models returned, 44 normalized with `generateContent`. Production E2E dynamically selected a live lightweight/latest model; model ID was not hardcoded. |
| Credential protection | Generated a CSPRNG 256-bit base64url `PROVIDER_SECRET_ENCRYPTION_KEY` directly in ignored `apps/web/.env.local`; value was never printed or saved to this ledger. AES-256-GCM envelopes include version/key ID, fresh 96-bit nonce, 128-bit tag, and owner/provider AAD. Optional prior-key ring supports key-id lookup. Provider keys are never returned or logged. |
| Persistence | Drizzle migration `0002_sweet_tusk.sql` applied to isolated Neon `forme-dev` via the direct unpooled URL. `provider_connections` stores only encrypted credentials; `model_cache` stores normalized metadata; `ai_generation_jobs` stores status/idempotency HMAC/result revision but no raw prompt/output. Canvas + job completion use one transaction and optimistic `canvas_revision` check. |
| Structured scope | Gemini receives only the selected node’s type/label/text and the user instruction. Response uses JSON `responseSchema`, then strict Zod parsing. The current allowlisted operation has no model-controlled target ID; server applies its text only to the selected node, preserving all other node IDs/values/layouts. |
| Failure/recovery | Live E2E rejected an invalid Gemini key without storing it or echoing it, then connected with the valid key; invalid model ID was rejected; same successful idempotency key replayed without another revision; disconnect cleared ciphertext and model cache. Provider timeout/unknown-outcome recovery is implemented as a status boundary but has not been forced in E2E. |
| Production E2E | `pnpm e2e:production` PASS against a fresh local production build at `http://localhost:3101`, Better Auth, real Gemini API, and isolated Neon `forme-dev`. The runner created unique user/project/heading/sentinel nodes, verified encrypted DB storage (decrypt only inside the script), live model list/cache, one real generation, target text mutation, unchanged sentinel/root order, revision 3, API + workspace read-back, job replay/status, other-user denial, disconnect/cache cleanup, and user/project cleanup. No key or prompt was printed. |
| Failure/recovery history | First AI requests against provider-returned legacy aliases produced safe model-not-found/503 responses. The E2E selector was tightened to prefer a generation-capable lightweight `-latest` model from that live response; final real generation and Neon read-back passed. The app retains an explicit unavailable-model error instead of silently falling back. |
| Verification commands | `pnpm --filter @forme/web db:generate` PASS after removing a duplicated partial-index declaration; `pnpm --filter @forme/web db:migrate` PASS using `DATABASE_URL_UNPOOLED`; `pnpm --filter @forme/web typecheck` PASS; `pnpm --filter @forme/web lint` PASS; `pnpm --filter @forme/web test` PASS (28/28); `pnpm --filter @forme/web build` PASS; final `pnpm e2e:production` PASS with `E2E_REQUIRE_GEMINI=true`. A PostgreSQL client SSL-mode deprecation warning was emitted by `pg-connection-string`; no credential values were logged. |
| Tools/skills | Official Google AI docs via Firebase Developer Knowledge; Context7 Drizzle ORM docs; 3 read-only subagents (Gemini API contract, security review, E2E coverage); Neon MCP/project history + local Drizzle migration; `security-and-hardening`, `secrets-management`, `postgresql-table-design`, `neon`, `neon-postgres`, `api-and-interface-design`, `test-driven-development`, `ai-debt-detector`; Node/TypeScript script E2E. No browser automation. |
| Files changed | Provider adapter/types/registry, AES-GCM/keyring helper + tests, Zod operation/input schemas + tests, connection/model-cache/job persistence services and APIs, Composer/Gemini connection UI/CSS, Drizzle schema/migration/journal/snapshot, `.env.example`/ignored local secrets, E2E script/test runner, `TECH-STACK.md`, and `SESSION.md`. |
| UI-only limitation | Production HTTP E2E does not verify rendered menu/model selector layout, keyboard focus, or animation; do not claim those browser-only details were visually QA’d. |
| Exact next action | Add one bounded scoped `appendChild` operation under a selected container. Keep the model target server-bound, validate block types/child counts, preserve existing nodes, commit using the same optimistic revision transaction, then test with the real configured Gemini provider. |

---

## Handoff

- **Pre-P0:** verified; no repeat extraction needed.

- **Current state:** Phase 1 verified; Phase 2 email/password auth/private projects/post-login hub passed; Phase 3 canonical canvas/custom-block persistence passed; responsive overrides are verified at the API/durable boundary; Phase 5 Gemini text-edit vertical slice is verified. Temporary Netlify hosting is documented but not deployed. Approximate full public launch readiness: 50% by the ten-slice rubric in `NETLIFY-DEPLOY.md`.
- **Verified:** production E2E confirms live Gemini models, encrypted credential persistence, scoped structured text edit, revision 3 Neon read-back, unchanged sentinel node, idempotency replay without a second revision, invalid-key recovery, owner isolation, disconnect/cache cleanup, and test-data cleanup.
- **Remaining blockers/limitations:** no Netlify site/deploy exists; public launch requires a clean production Neon database/branch and owner-entered production secrets. Google/GitHub OAuth is not implemented but is optional for email/password. UI-only Composer/menu/theme/wave behavior remains unverified under the no-browser policy. Attachments need storage integration; provider-timeout recovery has not been forced in E2E; presets/`DESIGN.md`, share/export, release-grade security/observability, and several canvas gestures remain open.
- **Exact next action:** run fresh production build + full `pnpm e2e:production` (Gemini required bila diminta; OpenAI-Compatible bila env disediakan), lalu scoped `appendChild` + timeout recovery. Owner menyiapkan DB production + domain Netlify secara paralel; tidak memblokir E2E isolated.

### 2026-09-27 — Canonical BYOK provider layer + README/netlify batch

| Field | Evidence |
|---|---|
| Status / task | Finished the in-progress provider batch from prior logs: canonical `ProviderId` union (12 aktif, Ignix excluded), encrypted JSON credential envelope (apiKey + baseUrl/modelId, backward-compatible dengan row Gemini lama), status model (`discovered`/`validated` via `structured-output`), adapter Anthropic + 10 Chat-Completions profile + custom OpenAI-Compatible (plural `/v1/chat/completions`, normalisasi anti `/v1/v1`, DNS pinning + TLS hostname check), route `validate-model`, guard origin+JSON di semua mutasi, Composer/UI provider generik. |
| Provider/durable boundary | Real Neon `forme-dev` schema unchanged (no migration); AES-256-GCM + key-id ring unchanged; no plaintext in responses (existing E2E assertions retained). Gemini = reference adapter dengan evidence real sebelumnya; 11 adapter lain = implemented / credential verification pending. |
| Verification | `tsx --test` 8 file provider/AI: **31/31 PASS**; full `pnpm test`: **51/51 PASS**; `typecheck` PASS (tsconfig target ES2020, BigInt via constructor); `lint` PASS; `next build` PASS (17 route dinamis incl. `validate-model` baru). Full `pnpm e2e:production` belum di-rerun — dijadwalkan di fresh controlled build berikutnya. |
| Docs/ops | `README.md` baru (logo, shields, tech stack, status demo, diagram mermaid, env placeholder, proprietary license; tanpa key); `netlify.toml` baru (root base, pnpm build, publish `.next`, Node 24, ignore docs-only, security headers; tanpa secret); `.gitignore` diperketat (env/keys/coverage/`.netlify`). |
| Files changed | `provider-types.ts`, `provider-input.ts` + test, `gemini-provider.ts` + test, `anthropic-provider.ts` + test, `chat-completions-provider.ts` + test (3 ekspektasi diperbaiki), `provider-adapters.ts`, `provider-service.ts`, `http-json.ts` + test, `provider-url.ts` (BigInt ctor), `provider-url.test.ts` (type fix), connect/sync/generate routes, `validate-model/route.ts` (new), `ai-composer.tsx`, `provider-connections.tsx` (new), `use-provider-connections` reuse, `package.json` test script, `tsconfig.json` target, `README.md`, `netlify.toml`, `.gitignore`, `SESSION.md`. |
| Tools/skills | `using-superpowers`, `brainstorming` (bounded path), `ponytail`, `incremental-implementation`, `test-driven-development`, `api-and-interface-design`, `security-and-hardening`, `neon-postgres`, `nextjs-app-router-patterns`, `ai-debt-detector`, `verification-before-completion`, `documentation-and-adrs`; 4 sub-agent read-only (provider-contract research, BYOK security review, E2E coverage, SSRF helper + test). No browser automation. |
| Blockers | Kredensial real untuk 11 provider non-Gemini belum tersedia (expected); `E2E_OPENAI_COMPATIBLE_*` opsional bila owner menyediakan; public deploy tetap menunggu DB production + domain + env final. |
| Next action | Fresh production build + `pnpm e2e:production` (wajib Gemini bila `E2E_REQUIRE_GEMINI=true`); lalu scoped `appendChild`, timeout recovery, dan P0 lanjutan sesuai dependency order. |

### 2026-09-27 — S3-compatible storage abstraction + asset persistence (P0 batch)

| Field | Evidence |
|---|---|
| Scope | Vendor-neutral `FormeObjectStorage` contract + S3-compatible SigV4 implementation (presigned PUT, HEAD, DELETE) with no new dependency, plus `assets` persistence, presigned upload preparation, real confirmation, and deletion. |
| Safety | MIME allowlist (PNG/JPEG/WebP/GIF/markdown/text/JSON); active content (`image/svg+xml`) rejected by default; per-kind size caps; object keys are **server-generated** from owner/project/asset ids so they can never contain traversal or user filenames; uploaded filenames sanitized before being stored as metadata; non-HTTPS endpoints rejected outside localhost; secret access key never appears in presigned URLs. |
| Honesty boundary | With no `S3_*` credentials configured, `getObjectStorage()` returns `null` and the API answers `503 STORAGE_UNAVAILABLE`. **No in-memory fake store is substituted and no metadata row is written**, so an asset can never be listed as ready when it does not exist in durable storage. |
| Database | Migration `0004_motionless_ronan.sql` adds `assets` (owner FK, unique object key, status `pending`/`ready`/`failed`, sha256, placeholder note). Applied to isolated Neon `forme-dev`. |
| Tests | `typecheck` PASS, `lint` PASS, `pnpm --filter @forme/web test` **81/81** PASS (6 storage tests cover allowlist, traversal-free keys, filename sanitisation, config validation, deterministic SigV4 signatures with no secret leakage, and the honest null-storage behaviour). |
| Production E2E | PASS. Asset journey asserts anonymous denial, disallowed type rejection, active-content rejection, oversize rejection, and — because no durable storage credential exists yet — that the flow reports `STORAGE_UNAVAILABLE`, lists zero assets, and never fakes an upload. The durable-storage branch of the journey (presigned URL, content-type pinning, confirmation, cross-user confirm/delete denial, owner delete) is implemented and will execute automatically once `S3_*` variables are provided. |
| Provider verification state | Unchanged: Gemini fully verified; all other providers implemented / credential verification pending. |
| Remaining P0 | Real S3 credential verification (blocked on owner credential); asset/preset/share/export UI surfaces; security/observability hardening (rate limiting on remaining endpoints, structured logs, dependency scan); final frontend redesign. |
| Next action | Security/observability hardening pass, then UI surfaces for the new durable capabilities, then final frontend redesign. |

### 2026-09-27 — DESIGN.md context, curated presets, export, and read-only share (P0 batch)

| Field | Evidence |
|---|---|
| Scope | New P0 durable slices: curated presets (10, code-owned product content), manual `DESIGN.md` context (paste/upload/manual), real export artifacts (Design IR JSON + grayscale SVG), and revocable read-only share links. All committed through the existing optimistic-revision persistence path. |
| Presets / DESIGN.md safety | `design-apply.ts` writes **presentation only** (spacing/gap per breakpoint + `styleRef`). Structural fingerprint (ids, blockId/type, parent/children, root order, visibility, props) is asserted identical before/after in both unit tests and production E2E. Tokens are written as absolute depth-derived values, so applying the same preset twice is idempotent. `DESIGN.md` parsing is line-anchored, range-clamped, note-bounded, and never executes document content. Automatic generation stays Coming Soon. |
| Export | `GET /api/projects/:id/export?format=json|svg&breakpoint=…` builds a **real artifact** from persisted state: parseable Design IR JSON, and an SVG wireframe that is grayscale-only (asserted: no `#7D070B`) with XML-escaped node text so project content cannot inject markup. Owner-scoped; other users get 404. |
| Share | `POST/GET /api/projects/:id/shares`, `DELETE …/shares/:shareId`, public read-only `GET /api/share/:token`. Token is 32 random bytes, returned exactly once; only a SHA-256 hash is persisted (asserted). Expiry + revoke both enforced. Public view exposes **only** name + canvas — asserted to never expose owner identity or provider data. |
| Database | Migration `0003_next_mongoose.sql` adds `design_contexts` (unique active context per project) and `share_links` (unique token hash) with owner FKs and cascade delete. Applied to isolated Neon `forme-dev`. `getOwnedProjectCanvas` now also selects `name` (required by export); ownership semantics unchanged. |
| Tests | `typecheck` PASS, `lint` PASS, `pnpm --filter @forme/web test` **75/75** PASS. |
| Production E2E | PASS via `pnpm e2e:production` (build-identity gated, unique port/run id): all prior journeys plus preset listing (≥10), unknown-preset 404, preset apply with unchanged structure and preserved content, `DESIGN.md` without rules rejected 422, real DESIGN.md parse + apply + durable `design_contexts` row, stale-revision 409, JSON export content/type assertions, SVG export containing persisted nodes and no brand color, invalid format 422, cross-user export/share denial 404, share token entropy + hash-only persistence, anonymous read-only resolution with no owner/provider leakage, revoke → 404, full cleanup. |
| Remaining P0 | S3-compatible storage abstraction + real upload persistence; remaining security/observability hardening; UI surfaces for presets/context/share/export; final frontend redesign. |
| Next action | Implement the storage abstraction and asset persistence, then security/observability pass. |

### 2026-09-27 — Git reconciliation + controlled E2E + scoped appendChild + timeout recovery

| Field | Evidence |
|---|---|
| Reconciliation | Repository IS a Git repository with `origin/main`; current state row corrected (previously "no Git repository"). Historical ledger lines describing the pre-2026-09-27 state are retained as history, not current state. `main` == `origin/main` at this batch's start. |
| Stale-build fix (real bug) | `pnpm e2e:production` used to accept any `E2E_BASE_URL`, which previously caused a stale-server false failure. New orchestrator `scripts/e2e/run-production-e2e.ts`: fresh `next build` → read `.next/BUILD_ID` → start `next start` on a unique free port with a unique run id → poll new `/api/health` → assert served build id matches the fresh build → run journeys → always shut down. Mismatch fails loudly. Journeys no longer auto-run on import (duplicate-run bug fixed). |
| Scoped `appendChild` | Allowlisted op added beside `setNodeText` (`ai-edit.ts`). Server binds the parent to the selected node and generates the child id server-side, so the model can never target/name nodes. Uses Design IR `insertNode`, which enforces `acceptsChildren` and appends deterministically. Persisted through the existing optimistic-revision transaction. Client-safe scope predicates extracted to `ai-scope.ts` (keeps `node:crypto` out of the browser bundle). Unit/contract coverage: valid append, invalid parent, foreign/out-of-scope target, malformed op, unknown block id, ordering, no-mutation-on-failure. |
| Timeout recovery | New `provider-retry.ts`: bounded retry (max 3 attempts, capped exponential backoff + jitter) that retries ONLY `PROVIDER_TIMEOUT`/`PROVIDER_UNAVAILABLE`; credential, rate-limit, model-not-found, request-rejected and schema errors are terminal and never retried. Wired into Gemini generation. Mutation still happens only after a validated operation, so a failed call cannot half-apply. |
| Production E2E | PASS via `pnpm e2e:production` with `E2E_REQUIRE_GEMINI=true`: signup/session, invalid-login recovery, hub + Coming Soon boundaries, nested nodes/custom blocks/revision retry, cross-account isolation, subtree deletion, Gemini invalid-credential rejection, encrypted credential at rest (44 live models), scoped setNodeText with read-back, scoped `appendChild` (exactly one child, revision 3→5, foreign scope 404, stale revision 409, idempotent replay, Neon read-back), provider timeout → `PROVIDER_TIMEOUT` 504 with **no canvas mutation** and a recoverable job row, then a bounded retry that **actually succeeds through the real provider**, disconnect/cache cleanup, sign-out, full cleanup. |
| Honest fault-injection boundary | Timeout evidence uses a deterministic, env-gated fault (`FORME_E2E_PROVIDER_FAULTS`, only set by the orchestrator when real-provider verification is requested). The injected fault fails an attempt; the retry performs a **real** Gemini call. No provider success is ever faked. Production deployments cannot enable it. |
| Tests | `typecheck` PASS, `lint` PASS, `pnpm --filter @forme/web test` 64/64 PASS. |
| Provider verification state | Google Gemini: implemented + credential verified + live model discovery verified + real generation verified. OpenAI, Anthropic/Claude, Meta/Muse, Alibaba Qwen, Z.ai GLM, Xiaomi MiMo, xAI Grok, Moonshot Kimi, DeepSeek, MiniMax, OpenAI-Compatible: implemented / credential verification pending (no credential available; never claimed as PASS). Ignix: Coming Soon. |
| Next action | Manual `DESIGN.md` context + curated presets (real persistence, structure-preserving apply), then read-only share + real export artifact, then S3-compatible storage abstraction. |

### 2026-09-27 — Netlify secrets-scan + ignore fix (via netlify.toml)

| Field | Evidence |
|---|---|
| Root causes | (1) Netlify secret scanning flagged `E2E_BASE_URL`/`BETTER_AUTH_URL` values (`localhost`/site URL, bukan secret) yang terdokumentasi di code/docs → build gagal. (2) Commit SESSION-only ter-cancel oleh ignore command — by design; (3) `netlify.toml` ada di ignore list sehingga config fix tidak memicu rebuild. |
| Fix | `netlify.toml`: `SECRETS_SCAN_OMIT_KEYS = "E2E_BASE_URL, BETTER_AUTH_URL"` (format comma-separated sesuai docs; real secrets tetap di-scan); `netlify.toml` dikeluarkan dari ignore paths agar config fix selalu rebuild; TOML divalidasi (`TOML VALID`). |
| Verification | `python tomllib` parse PASS. Build/deploy verification menunggu Netlify (commit ini menyentuh `netlify.toml` → build jalan). |
| Still recommended (Netlify UI, opsional) | Hapus `E2E_*` dan `DATABASE_URL_UNPOOLED` dari site env (tidak dibutuhkan runtime production). |
| Next action | Pantau deploy Netlify hijau; verifikasi `/robots.txt`, `/sitemap.xml`, dan meta verifikasi di view-source; klik Verify di Search Console. |

### 2026-09-27 — Sitemap/robots SEO + redeploy to forme-apps.netlify.app

| Field | Evidence |
|---|---|
| Scope | `app/sitemap.ts` (11 halaman publik, prioritas + changefreq), `app/robots.ts` (allow `/`, disallow `/api/ /projects /generator /cloning /workspace/`, Sitemap absolut), `lib/site-url.ts` (kanonis via `SITE_URL` → `BETTER_AUTH_URL` → localhost fallback; never-throw agar build aman) + test, `.env.example` (`SITE_URL` opsional terdokumentasi). Private routes + API sengaja tidak di-index. |
| Verification | `typecheck` PASS; `lint` PASS; full `pnpm test` 52/52 PASS; production `next build` PASS dengan route `○ /robots.txt` dan `○ /sitemap.xml`. |
| Git/deploy | Commit `0e10088`, push `d409bad..0e10088 main -> main`, sinkron. Netlify redeploy otomatis dari `main` ke https://forme-apps.netlify.app. |
| Action required (owner, Netlify UI) | Set `BETTER_AUTH_URL=https://forme-apps.netlify.app` (wajib untuk auth + kanonis sitemap) dan 4 runtime vars lain, lalu redeploy bila env baru ditambahkan. Opsional: `SITE_URL` bila kanonis SEO ingin dipisah dari auth origin. Verifikasi: buka `/robots.txt`, `/sitemap.xml`, daftarkan properti di Search Console + submit sitemap. |
| Next action | Konfirmasi deploy hijau di Netlify; fresh production build + full `pnpm e2e:production`; lalu scoped `appendChild` + timeout recovery. |

### 2026-09-27 — Netlify build fix (lazy auth) + recommit

| Field | Evidence |
|---|---|
| Root cause | `src/lib/auth.ts` threw `BETTER_AUTH_SECRET is required in production` at module scope; `next build` page-data collection imports route modules → build exit 2 on Netlify. |
| Fix | `getAuth()` lazy + cached init; `[...all]/route.ts` resolves handlers per request; `server-session.ts` calls `getAuth()` at request time. Fail-fast secret validation preserved for real requests; static/landing build no longer blocked. |
| Verification | `typecheck` PASS; `lint` PASS; `scripts/build-env-safety.ts` PASS (import without secrets does not throw; `getAuth()` throws the exact secret error); full `pnpm test` 51/51 PASS; local production `next build` PASS. No `.env.local` read or staged. |
| Git | Commit `d409bad`, fast-forward push `91f7d39..d409bad main -> main`; remote `origin/main` = local. |
| Still required on Netlify | Set 5 runtime vars in UI (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PROVIDER_SECRET_ENCRYPTION_KEY`, `PROVIDER_SECRET_ENCRYPTION_KEY_ID`), then redeploy/bersihkan cache bila perlu. Tanpa itu build lolos tapi request auth akan 500 fail-fast. |
| Next action | Redeploy Netlify; fresh production build + full `pnpm e2e:production`; lalu scoped `appendChild` + timeout recovery. |

### 2026-09-27 — Readiness report + initial GitHub push

| Field | Evidence |
|---|---|
| Readiness | ~55% production-ready (backend/durable behavior, pre-UI-polish). Rubric 10 slice: landing 90, auth/projects 80, canvas persistence 75, responsive boundary 50, provider/Composer 65, presets/DESIGN.md 0, storage 0, share/export 0, QA/security/observability 30, deploy/ops 20. Full E2E rerun after provider batch still pending; final FE redesign explicitly deferred. |
| Git | `git init` di repo root; `.env.local` verified ignored (`check-ignore` → `.gitignore:18:.env.*`); secret scan clean (no `AIza`/`sk-`/`ghp_`/tokens di file committable); `.playwright-mcp/` (10.7MB) di-ignore; `echo "# forme"` sengaja dilewati agar README lengkap tidak rusak; `git add -A` = 157 files; commit `9550eec`; `branch -M main`; remote `Maventlabs/forme`; `git push -u origin main` → `[new branch] main -> main`, tracking aktif. |
| Next action | Fresh production build + full `pnpm e2e:production`, lalu scoped `appendChild` + timeout recovery. |

### 2026-09-26 — Temporary Netlify readiness and environment setup

| Field | Evidence |
|---|---|
| Status / task | Prepared a Netlify deployment guide and updated the local environment template; no Netlify site was created and no deployment was performed. |
| Readiness estimate | Approximately 50% for a full public product launch. Coarse denominator: ten core slices; five have a real production-path vertical slice, five remain absent or not release-verified. Details and limits are in `NETLIFY-DEPLOY.md`. |
| Hosting decision | Netlify temporarily while the owner prepares self-hosting; framework/database/auth boundaries remain unchanged. ADR recorded at `docs/decisions/0001-temporary-netlify-host.md`. |
| Environment boundary | `apps/web/.env.local` already exists and contains private local configuration. It was not opened, echoed, edited, or copied. `apps/web/.env.example` is the fill-in template; Netlify cloud builds require variables entered through Netlify rather than assuming the local env file is loaded. |
| Current variables | Runtime: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PROVIDER_SECRET_ENCRYPTION_KEY`, `PROVIDER_SECRET_ENCRYPTION_KEY_ID`. Local migration: `DATABASE_URL_UNPOOLED`. Optional local E2E: `GEMINI_API_KEY` and `E2E_*`. No Upstash/Redis/QStash, OAuth, or S3 credentials are needed for the current integrated app path. |
| Durable/provider boundary | Neon `forme-dev` is development/E2E only; public traffic needs a dedicated production database/branch. Users supply BYOK provider keys in-app; a global `GEMINI_API_KEY` is only for local E2E. |
| Research/tools | Read all four source docs plus `TECH-STACK.md` and existing environment template; checked environment variable names in app/E2E source without reading local values. Loaded `secrets-management`, `security-and-hardening`, `documentation-and-adrs`, `verification-before-completion`. Firecrawl successfully retrieved Netlify Next.js, environment-variable, and function-limit documentation; Apify RAG browser retrieved the Next.js overview. Next Devtools local docs reported `upgrade_required` because installed `node_modules/next` was unavailable in the workspace; used official Netlify docs as the fallback. |
| Netlify facts recorded | Current official docs state Next.js App Router/Route Handlers are supported by OpenNext adapter; cloud builds do not automatically load `.env` files; synchronous function execution is limited to 60s. |
| Files changed | `apps/web/.env.example`, `NETLIFY-DEPLOY.md`, `FORME-PRD.md`, `TECH-STACK.md`, `SESSION.md`, `docs/decisions/0001-temporary-netlify-host.md`. |
| Verification | Required environment-template-key assertion passed; `apps/web/.env.local` existence confirmed with `Test-Path` without reading its contents; literal dependency/source scan found no Upstash/Redis/BullMQ references in the web app; reviewed the updated guide, template, ADR, and source docs. An initial shell grep pattern had a quoting error and was replaced by the successful literal scan. No app source/runtime behavior changed, so no build or E2E rerun was needed. Full Netlify deployment verification is blocked on a site/domain, production Neon environment, and owner-entered credentials. |
| Next action | Owner creates the Netlify site and separate production Neon database/branch, sets the five runtime variables, then run deploy verification; after that continue Phase 5 scoped child-node creation. |
