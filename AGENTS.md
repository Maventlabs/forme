# AGENTS.md — FORME by Mavent

## Operating Contract

This file is generated and maintained together with:

- `DESIGN.md` — visual and interaction source of truth
- `prd.md` — product requirements and implementation scope
- `AGENTS.md` — execution rules for coding/design agents
- `SESSION.md` — mutable execution ledger, evidence, blockers, decisions, and next action

Read all four files before changing the repository.

The product hierarchy is authoritative in this order:

1. Product goal and measurable outcomes
2. Product behavior in `prd.md`
3. Visual/interaction contract in `DESIGN.md`
4. Features and sub-features
5. Development phases
6. Tasks
7. Acceptance criteria
8. Verification evidence

Do not mark a parent complete while a relevant child or its evidence is incomplete.

If a new explicit product decision conflicts with `DESIGN.md` or `prd.md`, update the relevant source-of-truth file first instead of silently implementing an exception.

---

## 1. Priority And Execution

Use one priority vocabulary only:

- `High/P0` — release-blocking core behavior
- `Medium/P1` — important behavior that follows the core release
- `Low/P2` — optional enhancement or polish

Use **production breadth-first** execution.

For all `High/P0` features:
1. establish the smallest real end-to-end slice;
2. use the actual production code path;
3. use the real configured provider or durable boundary;
4. verify persistence, failure, recovery, and user-visible result;
5. only then deepen the implementation.

Do not spend multiple phases polishing one feature while another P0 feature has no real vertical slice.

Respect true dependency blockers, especially:
- auth before private project access;
- canonical block/node schema before AI edit logic;
- provider validation before model selector;
- Design Context before AI rules consumption;
- stable Canvas/Node/Design Context schema before MCP implementation.

---

## 2. Completion Rule

A task may be checked only after the complete user journey works end-to-end through the real configured provider or durable boundary, including:

- success path;
- failure path;
- persistence;
- retry/recovery where relevant;
- user-visible state;
- verification evidence in `SESSION.md`.

The following are implementation prework, not completion evidence by themselves:

- unit tests;
- local adapters;
- mocks;
- compile success;
- build success;
- typecheck success;
- isolated component render;
- hardcoded provider/model fixtures;
- fake upload/export;
- simulated AI response.

Never mark a task complete because the UI “looks done” if the control is dead.

---

## 3. Mandatory Source-of-Truth Rules

### `DESIGN.md`
Controls:
- brand color;
- typography;
- landing composition;
- workspace visual system;
- dark/light workspace rules;
- iconography;
- radius;
- section composition;
- motion;
- block visuals;
- placeholder behavior;
- anti-AI-slop rules.

### `prd.md`
Controls:
- features;
- priorities;
- product flow;
- Coming Soon boundaries;
- provider behavior;
- auth;
- project/canvas behavior;
- responsive rules;
- share/export;
- testing/security/observability requirements.

### `SESSION.md`
Controls:
- current phase;
- current task;
- actual provider/boundary used;
- skills used;
- MCP/tools used;
- commands executed;
- E2E evidence;
- blockers;
- files changed;
- next action.

Never maintain hidden project truth only in chat or code comments when it belongs in one of these files.

---

## 4. Required Tools Contract

For every task:

- Use every **installed skill** that is relevant.
- Use every **available MCP server/tool** that materially improves the task.
- Use browser/search/reference tools when research is required.
- Verify credentials before claiming provider integration works.
- Distinguish:
  - skill availability;
  - MCP availability;
  - credential availability;
  - provider connectivity;
  - production success.
- Record actual tools used in `SESSION.md`.
- If a relevant tool is unavailable, record the fallback and limitation.

Never claim that a skill, MCP, provider, browser tool, or credential was used if it was not actually used.

### Skill categories to prefer when available

Use the exact installed skill names, but map tasks to these categories:

- UI / product design
- frontend implementation
- animation / GSAP / Motion
- accessibility
- responsive design
- design systems / tokens
- visual QA
- web research / inspiration research
- auth
- Neon/Postgres
- security
- testing / E2E
- observability
- AI provider integration
- MCP / tool protocol

If multiple overlapping skills exist, use the smallest set that actually contributes.

---

## 5. Reference-First Design Rule

Before implementing any major landing-page section or major workspace interaction, perform a **reference pass**.

Minimum:
1. inspect 2–4 relevant references;
2. identify what each reference solves well;
3. select one composition/interaction direction;
4. adapt it to FORME;
5. record the reasoning in `SESSION.md`;
6. do not copy proprietary assets, wording, branding, or exact layout.

Preferred sources are defined in `DESIGN.md` under
`Landing Page Reference Strategy / Primary Reference URLs`.
- other high-quality references suited to the exact section
The agent MUST use the exact URLs defined there rather than guessing domains.

Use available design/research skills, browser/search, MCP, or approved reference tools.

Do not start from a generic component-library pattern if reference research would materially improve the result.

---

## 5A. Logo Asset Preflight Contract

This contract is mandatory **before any P0 visual implementation**.

### Canonical source

Use:

`forme_logo_assets_master_sheet.png.png`

as the production source of truth for FORME logo variants.

The logo sheet already contains the approved variants. Treat this as an extraction task.

### Required behavior

Before building landing/workspace branding:

1. inspect the master sheet;
2. identify only the variants required by the current production slice;
3. manually crop/extract those variants;
4. preserve transparency, geometry, proportions, spacing, and lockup;
5. place the extracted files in the production asset path;
6. verify the asset visually;
7. record source → output → usage mapping in `SESSION.md`.

### Usage mapping

- main/primary landing logo → crop from the master sheet;
- white logo/mark → use for dark workspace branding;
- app icon/favicon → use the approved app-icon artwork from the master sheet;
- `forme_brand_identity_master_board.png` → reference/presentation only when the same asset is present in the master sheet;
- `forme_logo_mark_white.png` → convenience export only if it matches the approved master-sheet white variant.

### Never do this

- do not redesign the logo;
- do not regenerate it with an image model;
- do not auto-trace the raster into a new interpretation;
- do not approximate the logo with CSS shapes;
- do not change symbol geometry;
- do not change wordmark geometry;
- do not change lockup spacing;
- do not distort aspect ratio;
- do not add a background to an asset that should be transparent;
- do not add gradient/glow/shadow;
- do not introduce arbitrary logo colors;
- do not use crimson branding in the neutral dark workspace when the approved white mark exists.

Explicit 2026-09-25 asset exception: for the supplied canonical sheet, use deterministic local raster cleanup only on halo/splatter/background pixels outside the approved artwork. A pure-white workspace mark may use the exact cleaned red-symbol alpha mask with visible RGB set to white. Verify identical alpha/geometry and log crop bounds and source → output in `SESSION.md`; never redraw, trace, or invent a shape.

### Missing asset behavior

If a needed standalone export does not yet exist:
- crop it from the canonical master sheet;
- do not replace it with a placeholder logo;
- do not invent a new variant;
- log the new extracted file in `SESSION.md`.

If `forme_logo_assets_master_sheet.png.png` is missing, corrupted, or unreadable, this is a valid pause gate because production brand provenance cannot be verified.

### Suggested output path

Reuse the repository's existing asset organization.

If no convention exists, prefer:

`public/brand/forme/`

with clear production names such as:
- `forme-logo-primary.png`
- `forme-logo-symbol.png`
- `forme-logo-wordmark.png`
- `forme-logo-horizontal.png`
- `forme-logo-stacked.png`
- `forme-logo-mark-white.png`
- `forme-app-icon-light.png`
- `forme-app-icon-dark.png`

Create only variants that are actually needed.

## 6. FORME Visual Enforcement

The agent MUST enforce `DESIGN.md`.

### Landing
- fixed light theme;
- predominantly white;
- primary brand color: `#7D070B`;
- alternate button-only crimson fills:
  - `#5B090C`
  - `#A30A10`
- do not combine crimson variants in the same treatment;
- do not use crimson gradients;
- hero minimum `100svh`;
- product visuals dominate over text;
- concise copy;
- no dark-mode toggle for landing.

### Workspace dark mode
Strictly neutral:
- black;
- charcoal;
- gray;
- white.

No crimson, maroon, red, pink, berry, rose, magenta, or brand tint in dark workspace chrome.

### Workspace light mode
Mostly white/gray. Crimson can be used sparingly for selected/focus/primary states.

### Typography
- Instrument Sans: primary
- Geist Mono: technical/measurement values

All font and color use must flow from global tokens. Do not hardcode repeated design values across unrelated components.

### Icons
- Lucide React for normal UI controls
- Simple Icons / Devicon / official asset for provider/technology branding
- no emoji
- no unicode symbols pretending to be icons

---

## 7. Anti-AI-Slop Contract

The agent MUST NOT default to:

- purple/blue aurora;
- decorative gradient;
- gradient text;
- glow;
- generic AI sparkle;
- glassmorphism everywhere;
- six identical icon cards;
- excessive pill buttons;
- card wrappers around every section;
- fake bento grid;
- huge logo cloud with no narrative purpose;
- random 3D blobs;
- stock people unrelated to product;
- repeated eyebrow labels;
- “AI-powered” badges everywhere;
- long filler paragraphs;
- “revolutionize / unlock / supercharge” generic SaaS copy;
- dark sections added only for visual variety;
- random parallax;
- endless stagger animation.

If a layout begins to look like a generic AI-generated SaaS template, stop and re-run the reference pass.

---

## 8. Landing Page Execution Contract

Implement the landing in this product narrative:

1. Navbar
2. 100svh Hero
3. Product Proof / Workspace
4. Block Wireframing
5. AI Composer
6. Presets + DESIGN.md
7. Bring Your Own Model / Providers
8. Workflow / Handoff
9. Pricing
10. Closing CTA + Footer

### Navbar
- wide at top;
- compact floating on scroll;
- smooth morph;
- no layout jump;
- page navigation, not fake section-anchor-first navigation;
- minimal item count.

### Hero
- minimum `100svh`;
- concise headline;
- one short supporting sentence;
- one primary CTA;
- one secondary CTA;
- dark FORME workspace visual as the main proof;
- no generic abstract AI illustration.

### Product sections
Prefer:
- large interface stage;
- sticky visual + scrolling copy;
- asymmetric product bands;
- annotated UI;
- responsive frame comparison;
- real product-state transitions.

Avoid:
- repetitive 3-card feature rows;
- icon/title/paragraph clones;
- unreadably tiny screenshots.

### Pricing
Follow the real business model in `prd.md`.
If PAYG remains current, do not invent Starter/Pro/Enterprise subscriptions merely for visual convention.

---

## 9. Placeholder Asset Contract

If the correct screenshot, photo, illustration, or product capture does not exist yet:

DO:
- use a clean neutral placeholder;
- preserve the intended aspect ratio;
- add a replacement note;
- include subject + role + context;
- include recommended aspect ratio or dimensions when useful;
- continue implementing layout around it.

Example:

```text
PLACEHOLDER
Ideal asset:
Dark FORME workspace screenshot showing the floating AI Composer editing
a Hero node while Desktop and Mobile frames are visible.
Preferred ratio: 16:10.
Role: Hero product proof.
```

DO NOT:
- fetch random stock imagery;
- generate unrelated decoration;
- silently use a temporary image as if final;
- block the entire section waiting for an asset.

Make placeholders easy to search globally, e.g. `PLACEHOLDER_ASSET`.

---

## 10. Workspace Contract

The workspace is purpose-built for wireframing, not general vector graphics.

Core anatomy:

- left rail;
- infinite canvas;
- floating AI Composer;
- floating tool dock;
- right profile/share/export/inspector panel.

### Left rail
Expected:
- FORME
- File
- Agents
- Assets
- Tools
- Variables

Add new items only when product behavior requires them.

### Right panel
Order:
1. Profile
2. Share
3. Export
4. Inspector

Profile is rectangular with modest radius, not a large pill.

### Inspector
May include:
- X/Y
- width/height
- spacing
- gap
- alignment
- typography
- fill/border
- semantic label
- breakpoint
- visibility

Use Geist Mono for numeric values.

---

## 11. Floating Tool Dock Contract

The dock floats inside the canvas.

Two tools MUST always remain directly visible:
- Select / Mouse Pointer
- Text

Recommended top-level:
- Select
- Frame
- Text
- Media
- Container
- Blocks
- More

Use dropdowns for larger categories instead of expanding the dock indefinitely.

### Primitives
- Text
- Heading
- Paragraph
- Image
- GIF
- Button
- Input
- Divider
- Spacer
- Container
- Stack
- Grid

### UI Blocks
- Navbar
- Footer
- Card
- Form
- Search
- Tabs
- Accordion
- Sidebar
- Breadcrumb
- Pagination
- Table
- List
- Badge
- Avatar
- Alert
- Modal placeholder
- Dropdown
- Stats
- Quote
- Logo Cloud

### Section Templates
- Hero
- Features
- Pricing
- Testimonials
- FAQ
- CTA
- Gallery
- Stats
- Team
- Contact
- Blog List
- Dashboard Header
- Dashboard Sidebar
- Settings
- Authentication

---

## 12. Block / Node Architecture Rules

A **Block** is a reusable template.

A **Node** is an instance of that block placed on the canvas.

Do not maintain separate incompatible models for block, canvas, responsive layout, AI context, and future MCP.

Canonical node data should include:
- unique ID;
- semantic type;
- semantic label;
- parent;
- children;
- position/layout;
- width/height;
- breakpoint values;
- visibility;
- style/context references.

Prefer:
- flow;
- stack;
- grid.

Absolute positioning is allowed only when intentionally needed.

Avoid using only X/Y coordinates as the core layout model.

---

## 13. Semantic Wireframe Rules

Wireframe content is grayscale.

Depth rule:
- lighter gray = larger/deeper structural layer;
- darker gray = nearer/content-level layer.

Different block types must be identified primarily by:
- silhouette;
- icon;
- border;
- label;
- placeholder pattern;
- hierarchy.

Do not use arbitrary rainbow colors per block type.

Crimson is not part of the wireframe itself.

---

## 14. Responsive Contract

Default widths:
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px

Frame height is auto/content-driven by default.

One semantic node identity persists across breakpoints.

Breakpoint-specific properties may include:
- size;
- order;
- alignment;
- position;
- visibility.

Content/semantic label updates should propagate across breakpoints.

Layout overrides for one breakpoint must not destroy another breakpoint.

---

## 15. AI Composer Contract

The AI Composer floats inside the canvas.

It is not:
- a footer;
- a global bottom navigation;
- a detached chat page.

Controls:
- `+`
- `/`
- `@`
- Preset
- Model
- Send

### `+`
Supports:
- image;
- GIF;
- markdown/text;
- file/reference.

### `/`
May include:
- create;
- edit;
- restructure;
- responsive;
- duplicate;
- lint.

### `@`
Must support scoped context:
- page;
- node;
- component;
- file;
- uploaded reference.

AI edits must respect the selected/scoped context.

Do not silently rewrite unrelated pages.

---

## 16. AI Provider Integration Contract

Provider/company options:

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
- OpenAI-Compatible
  - Base URL
  - API Key

### Real integration flow

1. user selects provider;
2. user supplies credential/config;
3. backend validates credential;
4. provider adapter fetches models live when supported;
5. normalize model/capability schema;
6. cache result;
7. show models in Composer selector.

Do not hardcode a permanent live-model list in frontend source.

### Credential handling
- server-side only;
- encrypted at rest;
- never return plaintext secret to client;
- never log API keys;
- never expose secrets in analytics/session evidence.

### Ignix
- visible;
- disabled;
- Coming Soon;
- no fake click-through;
- no fake model list.

---

## 17. DESIGN.md Feature Contract

Current release supports:
- upload DESIGN.md;
- paste DESIGN.md;
- write/edit DESIGN.md manually;
- parse/apply rules.

Automatic DESIGN.md generation:
- Coming Soon.

Do not simulate generation.

Preset and DESIGN.md are independent inputs and may be applied before or after wireframe creation.

Applying a preset/design context must not destroy semantic structure.

---

## 18. Website Crawling Contract

Crawler UI may be visible as Coming Soon.

Do not implement fake crawling.

When crawler is activated in a later phase, require:
- SSRF protection;
- URL validation;
- private/internal network blocking;
- safe redirect policy;
- content/asset boundaries;
- structure/principle extraction;
- no pixel-perfect cloning;
- no proprietary asset copying.

---

## 19. Animation Contract

Use motion to communicate:
- state;
- hierarchy;
- continuity;
- spatial relationship.

Preferred:
- opacity + translate;
- clip/mask reveal;
- subtle scale;
- navbar morph;
- interface state crossfade;
- scroll-linked product walkthrough;
- block drag/place;
- Composer typing demonstration.

Typing animation is allowed only where it demonstrates AI Composer behavior.

Avoid:
- random bounce;
- perpetual floating;
- decorative parallax;
- spinning icons;
- animated gradients;
- shimmer on everything;
- heavy physics on standard controls.

Respect `prefers-reduced-motion`.

Use GSAP or Motion only when the interaction justifies it; do not introduce both arbitrarily for the same class of animation.

---

## 20. Production Code Standard

- Modify the real production code path.
- Reuse existing tokens/contracts before adding abstractions.
- Keep changes typed, validated, reversible, observable.
- Implement loading, empty, success, failure, retry, and recovery where relevant.
- No dead buttons.
- No simulated success.
- No placeholder completion state pretending to be production.
- Coming Soon must be explicitly non-working.
- Keep secrets, raw prompts, document contents, API keys, and unnecessary PII out of logs/client bundles.
- Preserve accessible keyboard/focus behavior.
- Avoid unnecessary dependency additions.

---

## 21. Testing Contract

For each feature, verify the appropriate layers.

### Unit
- node schema;
- breakpoint transforms;
- design context parser;
- provider normalization;
- pure layout logic;
- permission rules.

### Integration
- auth/session;
- Neon persistence;
- uploads;
- provider validation;
- model discovery;
- share/export;
- AI generation job boundary.

### Contract
- provider API shape;
- normalized model schema;
- generated node schema;
- future MCP contract.

### E2E
FORME production E2E uses reusable Node.js/TypeScript scripts under `apps/web/scripts/e2e`, run via `pnpm e2e:production`. Use explicit production-build/staging/production URLs and real configured boundaries; assert status and persisted read-back, use timeouts, redact secrets, return non-zero on failure, and clean only uniquely created test records when safe. Do not use or add Playwright unless the user explicitly reauthorizes browser automation. If a browser-only interaction cannot be meaningfully tested by HTTP, record the UI-only limitation and keep testing the production API/durable path.

At minimum:

```text
Signup/Login
→ Create Project
→ Open Workspace
→ Add Blocks
→ Save
→ Reload
→ Responsive Override
→ Connect Provider
→ Fetch Model
→ AI Edit Scoped Node
→ Apply Preset or DESIGN.md
→ Export / Share
```

Also test:
- invalid provider key;
- provider timeout;
- malformed AI output;
- upload failure;
- unauthorized project access;
- expired/revoked share;
- Coming Soon controls do not pretend success.

---

## 22. Security Contract

Required:
- sanitize user input;
- validate all schema boundaries;
- project ownership checks;
- auth/session validation;
- encrypted provider secrets;
- secret redaction from logs;
- upload content/type/size validation;
- rate limiting on expensive/public endpoints;
- dependency vulnerability checks;
- CSP/XSS protections where applicable;
- secure share permissions;
- SSRF guard before crawler activation.

Never store raw API keys in client state, localStorage, analytics, `SESSION.md`, or logs.

---

## 23. Observability Contract

Collect product analytics only after required consent.

Allowed categories:
- page views;
- signup completion;
- project creation;
- first node creation;
- AI generation start/completion;
- provider connection result;
- design context applied;
- export/share result.

Never log:
- prompts;
- DESIGN.md contents;
- uploaded file contents;
- raw API keys;
- email where not required;
- raw IP as product identity.

Use authenticated user ID or salted anonymous actor key.

Local fixtures validate metric logic only. Do not report local synthetic events as real MAU/DAU.

---

## 24. Verification Protocol

For each task:

1. Read `DESIGN.md`, `prd.md`, `AGENTS.md`, `SESSION.md`.
2. Inspect current repository state.
3. Identify real provider and durable boundary.
4. Perform reference pass if visual work is involved.
5. Implement the smallest production-ready slice.
6. Run focused unit/integration/contract tests.
7. Run relevant E2E path.
8. Verify success, failure, persistence, recovery.
9. Update `SESSION.md`.
10. Continue automatically when acceptance criteria pass.

Do not repeat a passing E2E unless:
- source changed;
- config changed;
- provider changed;
- environment changed;
- previous failure changed;
- release gate changed.

---

## 25. Pause Gates

Continue automatically between tasks and phases.

Pause only for:

- missing/corrupted canonical logo master sheet when brand extraction is required;
- missing/invalid credential required by real provider;
- destructive or irreversible action;
- real payment/financial side effect;
- production mutation/deployment approval;
- unresolved privacy/legal/security decision;
- unresolved product decision that materially changes architecture.

Do not pause merely because:
- tests passed;
- build passed;
- local adapter works;
- UI is visually complete.

---

## 26. MCP Sequencing Rule

MCP is **not an early-phase deliverable**.

Do not stabilize MCP against an unstable node schema.

MCP work starts only after:
- Block/Node schema is stable;
- responsive data model is stable;
- Design Context contract is stable;
- share/export paths are stable enough for read semantics;
- QA has validated core workspace journey.

Initial MCP should be read-only.

Write access comes later after read contract is stable.

---

## 27. SESSION.md Update Contract

Before ending a run, update:

- current phase;
- current task;
- priority;
- execution mode;
- status;
- next action;
- commit/environment;
- skills used;
- MCP/tools used;
- provider/boundary;
- commands;
- E2E path/result;
- persistence evidence;
- failure/recovery evidence;
- files changed;
- blockers;
- decisions.

Use concise evidence, not long narrative logs.

---

## 28. Final Agent Checklist

Before marking a major phase complete, confirm:

- [ ] Pre-P0 logo asset gate completed before P0 visual work
- [ ] production logo variants came from `forme_logo_assets_master_sheet.png.png`
- [ ] dark workspace uses the approved white logo/mark
- [ ] app icon/favicon uses the approved master-sheet app-icon artwork
- [ ] logo extraction paths/provenance recorded in `SESSION.md`

- [ ] `DESIGN.md` still matches implementation
- [ ] no emoji
- [ ] no unauthorized crimson in dark workspace
- [ ] no decorative gradient/glow
- [ ] no generic AI-slop composition
- [ ] all placeholder assets include replacement notes
- [ ] no fake Coming Soon behavior
- [ ] no hardcoded live model catalog
- [ ] provider credential flow is real
- [ ] semantic node schema persists correctly
- [ ] responsive overrides behave correctly
- [ ] AI edits respect scoped context
- [ ] auth/ownership enforced
- [ ] loading/failure/recovery implemented
- [ ] E2E evidence recorded
- [ ] security checks completed
- [ ] observability/privacy contract respected
- [ ] `SESSION.md` updated
- [ ] next action is explicit

---

## 29. Handoff Rule

When handing off to another agent/developer, do not summarize from memory only.

Point them to:
1. `DESIGN.md`
2. `prd.md`
3. `AGENTS.md`
4. `SESSION.md`

Then state only:
- current state;
- what is verified;
- what remains blocked;
- exact next action.

The repository documents are the source of truth.
