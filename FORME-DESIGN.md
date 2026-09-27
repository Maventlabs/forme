# FORME — DESIGN.md

> Visual and interaction source of truth for **FORME by Mavent**.
>
> FORME is a professional wireframing and AI-assisted design workspace. The product must feel like a serious creative instrument, not a generic AI SaaS landing page and not a Figma clone.
>
> This document governs brand color, typography, landing-page composition, workspace chrome, component treatment, section composition, motion, semantic wireframe blocks, AI Composer behavior, provider presentation, responsive behavior, and visual anti-patterns.

---

## 0. Theme Contract

### Landing
- Fixed **light** theme.
- White-dominant.
- No public dark-mode switch.
- Crimson is used as a deliberate accent, never as a page-wide decorative wash.
- Product screenshots may show the dark workspace.

### Workspace
- **Dark-first**.
- Dark mode is strictly neutral: black, charcoal, gray, white.
- **No crimson, maroon, red, pink, berry, or brand tint in dark workspace chrome.**
- Optional light workspace mode may use FORME Crimson sparingly.

### Brand
- Primary brand color: `#7D070B`
- Primary typeface: **Instrument Sans**
- Technical/measurement typeface: **Geist Mono**
- Standard UI icons: **Lucide React**
- Provider/technology brand icons: **Simple Icons**, **Devicon**, or official supplied assets
- Emoji are prohibited as UI icons or decoration.

---

# 1. Brand Character

FORME should feel:

- precise;
- composed;
- modern;
- design-literate;
- technical without looking like a terminal;
- editorial without looking like fashion media;
- premium without luxury clichés;
- restrained without feeling empty;
- animated without visual noise.

The interface should communicate quality through **composition, typography, spacing, motion, hierarchy, and product visuals** rather than through gradients, glows, decorative blobs, excessive cards, or large amounts of copy.

A user should look at FORME and immediately understand that the product is built for designing interfaces, not merely prompting an AI model.

---

# 2. Color System

## 2.1 Core Brand Colors

| Token | Value | Purpose |
|---|---:|---|
| `--forme-crimson` | `#7D070B` | Primary FORME brand color |
| `--forme-white` | `#FFFFFF` | Primary contrast counterpart |
| `--forme-ink` | `#121212` | Primary text on light surfaces |

The brand is fundamentally **Crimson + White**.

Crimson should normally appear as:
- primary CTA fill;
- selected state in the light workspace;
- small interaction accent;
- restrained brand moment;
- mark/wordmark accent when required.

It must not become the default color for every icon, heading, border, section, or card.

---

## 2.2 Two Alternate Crimson Button Colors

FORME has exactly **two** additional crimson-family colors.

They exist only as **alternate button/action fills** when a section needs a different red emphasis.

| Token | Value | Character | Allowed Role |
|---|---:|---|---|
| `--forme-crimson-deep` | `#5B090C` | Deep oxblood / maroon-red | Alternate CTA/button fill |
| `--forme-crimson-signal` | `#A30A10` | Brighter true crimson-red | Alternate CTA/button fill |

### Critical rule

These colors are **not a palette to combine together**.

Do not place:

- `#7D070B` beside `#5B090C` as two competing filled CTAs;
- `#7D070B` text on `#A30A10`;
- deep crimson + bright crimson in one component;
- crimson gradients;
- layered crimson surfaces.

A section chooses **one** filled crimson treatment.

Example:

```text
Section A
Primary CTA: #7D070B + white text
Secondary CTA: white + neutral border

Section B
Primary CTA: #5B090C + white text
Secondary CTA: white + neutral border
```

The variants must never be used for:
- workspace dark mode;
- general backgrounds;
- cards;
- decorative surfaces;
- data visualization;
- badges;
- gradients;
- long text;
- shadows.

No pink, berry, rose, magenta, mauve, or softened crimson tones are allowed.

---

## 2.3 Landing Neutrals

| Token | Value | Role |
|---|---:|---|
| `--landing-canvas` | `#FFFFFF` | Dominant page background |
| `--landing-surface` | `#FAFAFA` | Quiet alternate surface |
| `--landing-surface-2` | `#F3F3F3` | Stronger neutral section/product plate |
| `--landing-ink` | `#121212` | Primary text |
| `--landing-muted` | `#676767` | Secondary text |
| `--landing-subtle` | `#8D8D8D` | Metadata/helper copy |
| `--landing-border` | `#E5E5E5` | Hairline divider |
| `--landing-border-strong` | `#D5D5D5` | Stronger divider |

### Visual balance

Target approximately:
- 80–90% white / near-white;
- 8–15% black / gray;
- 2–8% crimson.

The landing page must not look red-heavy.

---

## 2.4 Dark Workspace

Dark workspace chrome is deliberately brand-neutral.

| Token | Value | Role |
|---|---:|---|
| `--ws-canvas` | `#191919` | Infinite canvas background |
| `--ws-panel` | `#202020` | Left/right chrome |
| `--ws-surface` | `#272727` | Buttons, selectors, raised controls |
| `--ws-surface-hover` | `#303030` | Hover |
| `--ws-surface-active` | `#383838` | Pressed/active neutral |
| `--ws-border` | `#373737` | Standard border |
| `--ws-border-strong` | `#505050` | Strong separator |
| `--ws-text` | `#F3F3F3` | Primary |
| `--ws-text-muted` | `#AAAAAA` | Secondary |
| `--ws-text-subtle` | `#777777` | Tertiary |
| `--ws-selection` | `#F2F2F2` | Selection outline/handle |
| `--ws-selection-ink` | `#151515` | Selected control icon |

**No red family color is permitted in dark workspace chrome.**

Selected controls should use:
- white/light-gray fill + dark icon;
- stronger neutral border;
- neutral inversion.

---

## 2.5 Optional Light Workspace

Light workspace is primarily white/gray and may use `#7D070B` only for:
- selected tool;
- selected block outline;
- focus ring;
- primary action.

Do not introduce the two alternate crimson button variants into workspace chrome.

---

## 2.6 Authenticated Product Hub

The post-login hub uses the workspace’s neutral-first discipline and supports a persisted dark/light theme.

| Role | Dark | Light |
|---|---:|---:|
| Canvas | `#171717` | `#F8F8F7` |
| Sidebar | `#1D1D1D` | `#FFFFFF` |
| Project surface | `#202020` | `#FFFFFF` |
| Raised surface | `#292929` | `#F1F1F0` |
| Border | `#383838` | `#E4E4E2` |
| Primary text | `#F2F2F2` | `#171717` |
| Wave line | white at 6% | ink at 5% |
| Primary action | neutral white | FORME Crimson `#7D070B` |

- The Workspace page has a narrow collapsible/slide-in navigation for Workspace, Generator, and Cloning.
- Persisted canvas nodes, not fabricated screenshots, determine each project thumbnail.
- The small seamless wave pattern is static, low contrast, and limited to the Workspace hub surface.
- The sliding menu takes about 220ms and becomes immediate under `prefers-reduced-motion`.
- Generator and Cloning routes are explicit Coming Soon states and have no active input controls.

---

# 3. Typography

## 3.1 Families

### Instrument Sans
Use for:
- wordmark;
- hero;
- headings;
- body;
- navigation;
- buttons;
- AI Composer;
- inspector labels;
- canvas labels;
- landing and product UI.

### Geist Mono
Use only for:
- px/rem;
- width × height;
- coordinates;
- breakpoint values;
- code-like values;
- tokens;
- provider/base URL metadata;
- technical status strings.

```css
:root {
  --font-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

Font families must be configurable globally. Do not scatter font-family declarations throughout components.

---

## 3.2 Weights

Use:
- 400 Regular
- 500 Medium
- 600 SemiBold

Avoid 700–900 as routine styling.

Typography should feel confident because of **scale and composition**, not excessive bold weight.

---

## 3.3 Landing Scale

| Role | Size | Weight | Line Height | Tracking |
|---|---:|---:|---:|---:|
| Hero Display | `clamp(64px, 8vw, 104px)` | 500 | 0.94 | `-0.05em` |
| H1 | 64px | 500 | 1.00 | `-0.04em` |
| H2 | 48px | 500 | 1.05 | `-0.035em` |
| H3 | 32px | 500 | 1.15 | `-0.025em` |
| Body Large | 20px | 400 | 1.50 | `-0.01em` |
| Body | 16px | 400 | 1.60 | normal |
| Small | 14px | 400/500 | 1.50 | normal |
| Caption | 12px | 500 | 1.40 | normal |

---

## 3.4 Workspace Scale

| Role | Family | Size |
|---|---|---:|
| Panel title | Instrument Sans 500 | 13–14px |
| Control label | Instrument Sans 400/500 | 12–13px |
| Button | Instrument Sans 500 | 13px |
| Inspector value | Geist Mono 400 | 12–13px |
| Dimensions | Geist Mono 400 | 12px |
| Canvas label | Instrument Sans 500 | 11–12px |

---

# 4. Layout and Spacing

**Base unit:** `4px`

Recommended scale:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160`

### Landing
- Max content width: 1440px
- Standard content width: 1280px
- Desktop gutter: 48–64px
- Tablet gutter: 32px
- Mobile gutter: 20px
- Standard section vertical gap: 96–120px
- Major narrative transition: 120–160px

### Workspace
- Dock/control gap: 4–8px
- Inspector row: 32–36px
- Compact controls preferred
- Panels should be dense enough for professional work

---

# 5. Shape Language

FORME must not default to pill-shaped UI.

| Element | Radius |
|---|---:|
| Tiny control | 6px |
| Button | 8px |
| Input / selector | 8px |
| Floating dock | 10px |
| Panel | 10–12px |
| AI Composer | 14px |
| Marketing product plate | 12–16px |
| Avatar | circular |

`9999px` radius is reserved for truly circular or intentionally pill-like controls.

Avoid the “every object is a rounded card” pattern.

---

# 6. Borders, Shadows, and Elevation

Use:
1. spacing;
2. surface change;
3. 1px border;
4. shadow only when the object must visibly float.

### Landing
Cards/product plates:
- flat;
- hairline border;
- minimal shadow.

Navbar after scroll and product floating previews may use a soft low-opacity shadow.

### Workspace
- panel separation through borders;
- floating AI Composer/tool dock may use compact shadow;
- no oversized blur;
- no glow.

---

# 7. Iconography

### Standard controls
Use **Lucide React** only.

### Provider/technology logos
Use:
- Simple Icons;
- Devicon;
- official supplied asset.

### Prohibited
- emoji;
- unicode symbol pretending to be an icon;
- mixed random icon sets;
- decorative sparkle icon used merely to imply “AI”.

Icons should communicate function, not decorate empty space.

---

# 7A. Logo Asset Source of Truth

FORME production branding must use the existing approved logo artwork. Logo extraction is an **asset-preparation task**, not a logo redesign task.

## Canonical Files

### Production extraction source
`forme_logo_assets_master_sheet.png.png`

This file is the canonical source for production logo variants.

Rules:
- the sheet is already provided without a presentation-board background;
- manually crop/extract the required variant from this sheet;
- preserve transparency/alpha;
- preserve the exact symbol geometry, wordmark geometry, proportions, spacing, alignment, and lockup composition;
- do not redraw, trace, reinterpret, regenerate, simplify, or redesign an existing variant;
- do not add new gradient, glow, shadow, outline, 3D, bevel, or decorative treatment;
- do not recolor an existing production variant unless `DESIGN.md` explicitly requires a variant that is not present in the sheet;
- prefer the exact pre-existing variant from the sheet over recreating it in CSS/SVG.

**Approved asset-production exception (2026-09-25):** deterministic local raster cleanup of cropped master-sheet regions is permitted when low-alpha halo/splatter/background pixels contaminate an export. Remove only pixels outside the approved artwork; retain its silhouette, spacing, proportions, and original antialiased alpha edge. A pure-white dark-workspace mark may be derived from the same cleaned red-symbol alpha mask by replacing visible RGB with white without changing any alpha or geometry. Record crop bounds, cleanup method, verification, and source → output provenance in `SESSION.md`. This does not permit redrawing/tracing/regeneration or arbitrary recoloring.

### Presentation/reference board
`forme_brand_identity_master_board.png`

This file may be used to understand the approved identity system and naming, but it is **not** the preferred extraction source when the same asset exists in `forme_logo_assets_master_sheet.png.png`.

### Existing white mark
`forme_logo_mark_white.png`

This may be used as a convenience export for dark workspace branding only if it matches the approved white variant in the master sheet. The master sheet remains authoritative if there is any discrepancy.

## Required Production Variants

Extract only the variants actually required by the implementation, including as needed:

- primary full lockup for landing/light surfaces;
- symbol-only mark;
- wordmark-only mark;
- horizontal lockup;
- stacked lockup;
- white logo/mark for dark workspace;
- light app icon from the sheet;
- dark app icon from the sheet.

The agent must **not invent an additional logo variant merely for convenience**.

## Usage Contract

### Landing / light marketing surfaces
Use the approved main logo/lockup cropped from `forme_logo_assets_master_sheet.png.png`.

### Dark workspace
Use the approved **white** logo/mark. The dark workspace chrome remains fully neutral; do not introduce crimson merely because the marketing logo uses crimson.

### App icon / favicon
Use the approved app-icon artwork already present in the master sheet. Do not reconstruct the icon from the symbol manually if the sheet already contains the intended app-icon treatment.

## Extraction Quality

When cropping:
- retain transparent background;
- crop to the artwork bounds with only intentional safe padding;
- do not crop into anti-aliased edges;
- do not stretch or rescale non-proportionally;
- keep the source aspect ratio;
- export at sufficient resolution for the target use;
- prefer lossless PNG when extracting from the provided raster master sheet;
- if an SVG master is later supplied, migrate production usage to the official SVG rather than auto-tracing the raster.

## Asset Placement

Follow the repository's existing asset convention if one already exists.

If no brand-asset convention exists, use:

```text
public/
└── brand/
    └── forme/
        ├── forme-logo-primary.png
        ├── forme-logo-symbol.png
        ├── forme-logo-wordmark.png
        ├── forme-logo-horizontal.png
        ├── forme-logo-stacked.png
        ├── forme-logo-mark-white.png
        ├── forme-app-icon-light.png
        └── forme-app-icon-dark.png
```

Only create files that are actually extracted/used.

## Pre-P0 Rule

Before any P0 visual implementation begins, the agent must:

1. locate and inspect the canonical master sheet;
2. crop the logo variants required by the first production slice;
3. verify transparency, geometry, and readability;
4. place the exports in the real production asset path;
5. record the source file, output file paths, and usage mapping in `SESSION.md`;
6. only then continue into the landing/workspace P0 implementation.

If the canonical sheet is missing or unreadable, treat that as a real asset blocker rather than regenerating the identity.

# 8. Landing Page Reference Strategy

FORME must not copy one website end-to-end.

Each section should be designed after a **reference pass**, choosing the best interaction/composition pattern for that specific job.

### Primary Reference URLs

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

These references are used to study composition, component placement,
interaction, motion, hierarchy, product visualization, section structure,
and visual rhythm. Do not copy branding, assets, copywriting, or layouts
pixel-for-pixel.

The current reference pool includes:

- **Rootly** — product storytelling through large product bands, sub-capabilities, screenshots, proof, and philosophy rather than a repetitive grid of identical cards.
- **Retool** — product-first storytelling with real application-builder visuals, AI interaction, MCP/dev workflow, and interface screenshots carrying the explanation.
- **ElevenLabs** — sparse editorial hero, clear primary/secondary CTA hierarchy, product-family exploration, use-case groupings, and low-noise trust/logo presentation.
- **Raycast** — concise category-defining hero, strong narrative copy, benefit-led product sections, and disciplined product-led presentation.
- **Melius** — canvas-rich hero, dense artifact/product composition, persona/use-case storytelling, and visual proof of multi-step creative workflows.
- **Linear** — thesis-led hero, strong product principles, alternating capability sections, customer proof, and confident closing CTA.
- **Framer** — canvas-native agent narrative, editable-result framing, direct product UI demonstrations, and sections that make the product itself the visual system.

These are **composition references**, not visual templates to clone.

---

# 9. Landing Page — 10-Section Blueprint

FORME's first marketing page should use approximately ten major sections.

The sequence can evolve, but the page should preserve this narrative logic.

## Section 1 — Navbar

### Goal
Make FORME feel like a mature product before the user reads any marketing copy.

### Direction
Reference the restraint of **Raycast / Linear**, combined with FORME's own morphing behavior.

At top:
- wide;
- visually integrated with white page;
- minimal chrome;
- logo left;
- small number of page-level navigation items;
- auth/action controls right.

On scroll:
- smoothly contracts;
- becomes a compact floating bar;
- subtle neutral border;
- white background;
- restrained shadow;
- maintains page-level navigation.

Do not:
- use a crowded mega-menu for v1;
- fill navbar with badges;
- use red across all nav items;
- make every link a pill.

### Motion
Animate:
- width;
- height;
- padding;
- border radius;
- surface opacity;
- shadow.

No sudden layout jump.

---

## Section 2 — Hero, `100svh`

### Goal
Explain FORME in one visual moment.

### Reference direction
Use the **sparsity of ElevenLabs**, the **category confidence of Linear/Raycast**, and the **product immediacy of Retool/Framer**.

### Composition
- `min-height: 100svh`;
- oversized Instrument Sans headline;
- one concise supporting sentence;
- primary crimson CTA;
- white/neutral secondary CTA;
- large FORME workspace/product visual;
- no decorative illustration competing with product UI.

The hero product visual should demonstrate:
- dark canvas;
- floating AI Composer;
- block toolbar;
- visible wireframe;
- right inspector.

Do not show a generic dashboard screenshot unrelated to the core workflow.

### Motion
- headline line-mask reveal;
- short supporting-copy fade/translate;
- CTA enters after headline;
- workspace enters with subtle scale + vertical translation;
- AI Composer may type one short realistic instruction after the workspace settles.

Do not apply typing animation to the headline.

---

## Section 3 — Product Proof / “See the Workspace”

### Reference direction
**Retool + Framer**

Use a large, near-full-width product stage where UI is the dominant content.

Show:
- left rail;
- canvas;
- floating composer;
- tool dock;
- inspector;
- Web/Mobile frames.

Copy should be minimal and attached to specific visible behavior.

Preferred interaction:
- scroll-controlled feature focus;
- highlight one region at a time;
- UI stays largely persistent while annotations change.

Avoid a three-card feature grid here.

---

## Section 4 — Build Wireframes with Blocks

### Goal
Explain the block system without long technical text.

### Reference direction
**Framer's editable-canvas framing + Melius's artifact-rich canvas presentation**

Composition:
- central canvas visual;
- floating block palette;
- example nodes entering the frame;
- small labels for primitive / UI block / section template;
- side-by-side desktop/mobile preview where useful.

Show:
- Select;
- Text;
- Image;
- GIF;
- Container;
- Button;
- Navbar;
- Card;
- Footer;
- Hero section template.

### Motion
Blocks may animate from palette → canvas using spatial continuity.

Do not use random floating-card animation.

---

## Section 5 — AI Composer

### Goal
Show that AI works **inside the canvas**, not in a detached chat page.

### Reference direction
**Framer agent + Retool prompt/build interaction**

Visual:
- Composer floating over the actual canvas;
- `/`, `@`, upload, preset, model selector;
- user mentions a node such as `@Hero`;
- targeted change appears in the selected region only.

Example interaction:
“Make @Hero denser and align the media block with @reference.png.”

Keep technical implementation details out of the marketing copy.

### Motion
Typing animation is permitted here because it demonstrates product behavior.
After submit:
- brief progress state;
- targeted node transition;
- no fake “AI magic” sparkle explosion.

---

## Section 6 — Design Presets + DESIGN.md

### Goal
Explain visual direction and user control.

### Reference direction
Use **Framer exploration/variation framing**, but keep FORME's own preset logic.

Composition:
- one wireframe/project;
- 3–4 visual direction previews;
- a compact preset selector;
- DESIGN.md upload/paste UI;
- generated DESIGN.md visibly marked **Coming Soon**.

Do not show ten full-size generic theme cards at once.

Use progressive disclosure:
- featured presets;
- “View all”;
- searchable list/modal.

---

## Section 7 — Bring Your Own Model

### Goal
Present model/provider flexibility as infrastructure, not as a logo wall.

### Reference direction
Borrow Raycast's multi-tool clarity and Retool's developer-tool credibility.

Show a compact provider connection surface:
- provider logos;
- connected/unconnected state;
- selected model;
- OpenAI-compatible custom connector;
- Ignix disabled with “Coming Soon”.

Do not make provider logos the hero visual of the entire section.

The visual hierarchy must remain:
FORME workflow > provider brand.

---

## Section 8 — Workflow / From Blank Canvas to Structured Handoff

### Goal
Explain the complete product journey.

### Reference direction
Use **Linear's capability narrative** and **Rootly's product-band storytelling** instead of a generic numbered timeline.

Suggested stages:
1. Create frame / choose size
2. Build manually or with AI
3. Apply preset or DESIGN.md
4. Refine Desktop/Mobile
5. Export / continue workflow
6. Future MCP handoff

Represent stages with real UI fragments, not abstract circles and arrows.

Website crawling may appear as **Coming Soon**, not as a fake active workflow.

---

## Section 9 — Pricing

### Goal
Make the approved monthly subscription model understandable with three deliberately differentiated, legible cards.

### Reference direction
Study:
- **Melius** for straightforward plan/usage presentation;
- **Retool** for structured capability comparison;
- **Raycast** for clean plan differentiation;
- **Rootly** for simple top-level offer + deeper comparison.

FORME pricing must reflect the actual product model from `prd.md`.

**2026-09-25 product decision:** FORME is a proprietary monthly-subscription product with three offers; replace the earlier conditional PAYG/wallet framing. Show the billing interval, what is included, and that BYOK model-provider charges are separate. Until checkout/terms are approved and live, label prices as proposed and do not expose a pretend purchase button. Cards should differ by real use case and hierarchy rather than three cloned templates.

---

## Section 10 — Closing CTA + Footer

### Reference direction
**Linear + Rootly**

Use one confident close:
- short headline;
- one primary action;
- optional secondary action;
- restrained footer beneath.

Footer should contain:
- Product
- Resources
- Company / Mavent
- Legal
- social/community links if real

Do not add a giant repeated feature matrix before the footer.

### Approved landing extension (2026-09-25)

- Keep at least nine meaningful major sections. Add a restrained post-hero left-moving marqueelike strip of FORME plus clearly identified third-party *ecosystem examples*, never falsely presented as customers, partners, or connected providers.
- Unite Blocks, AI Composer, and Design Direction in one scroll-linked narrative: copy at left follows the active state while one product stage at right stays visible. Typing is limited to the Composer instruction, not the hero headline.
- After the narrative, use an asymmetric evidence-led bento composition with distinct interactive SVG/semantic-block studies, rather than equal icon cards.
- Present the workflow as four horizontal, visually distinct process cards; keep copy and movement tied to actual editor stages.
- Put FAQ directly before the closing/footer. The hero preview must be completely visible, labeled illustrative until the real workspace exists, and may offer honestly scoped local interaction without simulating AI/provider success.
- Navbar may link to real page-level informational routes for Workspace, DESIGN.md generator, Crawler, and Mavent products. Generator/crawler remain clearly Coming Soon and Login must not simulate authentication before Phase 2.
- Make hover and scroll motion deliberate, preserve keyboard access, and show a static or gently reduced state for `prefers-reduced-motion`. GSAP may orchestrate complex scroll storytelling; CSS handles simple hover. Do not add multiple animation runtimes for the same motion.
- Mavent portfolio entries beyond FORME remain neutral placeholder slots until the owner supplies each product's approved description, screenshot, and official destination URL; do not fill from search guesses.

---

# 10. Card Design Rules

Cards are allowed only when content needs a bounded surface.

### Preferred
- flat;
- 1px neutral border;
- white/light neutral;
- 12–16px radius marketing;
- strong internal hierarchy;
- visual content larger than explanatory copy when showcasing product.

### Avoid
- repeated 3-column grids in every section;
- equal card dimensions when content is not equal;
- icon + title + paragraph clones repeated six times;
- gradient border;
- glow;
- fake glassmorphism;
- decorative top-left AI sparkle.

Prefer:
- asymmetric product plates;
- one large + two supporting cards;
- split-screen;
- product band;
- sticky visual + scrolling copy;
- interface screenshot with direct callouts.

---

# 11. Product Section Composition Rules

The product itself should carry the landing page.

Every major feature section should include at least one of:
- live-like interface composition;
- annotated screenshot;
- UI reconstruction;
- workflow animation;
- canvas state change;
- responsive frame comparison;
- component transformation.

Do not replace product proof with generic illustrations.

### Product visual framing
- max 1 dominant product visual per section;
- neutral frame;
- minimal browser chrome;
- only show controls relevant to the story;
- crop intentionally;
- avoid unreadably tiny full-screen screenshots.

---

# 11.5 Authenticated Product Hub

After a successful signup or login, open the `/projects` product hub.

## Composition
- Use a narrow, collapsible left navigation that slides in on small screens.
- Product destinations are **Workspace**, **Generator**, and **Cloning**.
- Workspace is the default and contains searchable recent/all project entries with compact previews derived only from persisted semantic canvas nodes.
- Keep project creation and opening as real authenticated actions; previews must not invent content for an empty canvas.
- Generator and Cloning remain clearly **Coming Soon** until their production workflows exist; do not show an input that implies either workflow is active.
- Keep the page area spacious and product-led, with a restrained project grid and low-noise chrome.

## Surface and motion
- The hub supports dark and light neutral surfaces. Dark mode stays grayscale; light mode is mostly white/gray with crimson limited to the primary action/focus state.
- Add a seamless, low-contrast repeating wave line behind the Workspace content. Keep the wave small and subordinate to project previews, recolor it for the selected theme, and remove its motion under `prefers-reduced-motion`.
- The navigation may collapse on desktop and slide over the canvas on mobile; preserve focus visibility, accessible names, and a keyboard-reachable close path.
- The landing page remains fixed light; hub theme preference must not restyle marketing routes.

## Reference direction
- Borrow Linear’s restrained workspace hierarchy and Retool’s project/gallery preview scale.
- Use the user-provided Figma-like placement as a navigation/composition cue only; retain FORME’s own neutral surfaces, typography, and spacing. Do not copy product branding, assets, or exact layout.

---

# 12. Workspace Anatomy

```text
┌──────┬───────────────────────────────────────────┬──────────────┐
│FORME │                                           │ Profile      │
│      │                                           │ Share Export │
│File  │                                           ├──────────────┤
│Agents│               Infinite Canvas             │ Inspector    │
│Assets│                                           │              │
│Tools │                                           │ Layout       │
│Vars  │        Floating AI Composer               │ Size         │
│      │                                           │ Spacing      │
│      │        Floating Block Tool Dock           │ Appearance   │
│      │                                           │ Responsive   │
└──────┴───────────────────────────────────────────┴──────────────┘
```

## Left Rail
- FORME logo;
- File;
- Agents;
- Assets;
- Tools;
- Variables;
- additional item only when required.

Short icon + label treatment.

## Right Panel
Order:
1. Profile rectangular control
2. Share
3. Export
4. Inspector

Profile:
- avatar;
- short identity;
- moderate radius;
- not oversized.

Inspector:
- layout;
- position;
- width/height;
- spacing;
- alignment;
- typography;
- fill/border;
- breakpoint;
- semantic label;
- visibility.

---

# 13. Floating Tool Dock

The dock floats inside the canvas.

Always-visible controls:
- **Mouse Pointer / Select**
- **Text**

Recommended top-level:
- Select
- Frame
- Text
- Media
- Container
- Blocks
- More

Use dropdowns when the category grows.

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
- Logo cloud

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
- Blog list
- Dashboard header
- Dashboard sidebar
- Settings
- Authentication

---

# 14. Semantic Wireframe Language

Wireframes are grayscale.

Brand color must not leak into the wireframe itself.

## Depth rule

**Lighter gray = farther back / larger structural layer.**  
**Darker gray = nearer / content-level layer.**

| Layer | Example |
|---|---:|
| Canvas | `#F2F2F2` |
| Frame | `#FFFFFF` |
| Section | `#ECECEC` |
| Container | `#E1E1E1` |
| Card | `#D3D3D3` |
| Media | `#C3C3C3` |
| Interactive placeholder | `#B3B3B3` |
| Primary content bar | `#898989` |

Different block types should be differentiated through:
- silhouette;
- border;
- icon;
- label;
- placeholder pattern;
- hierarchy.

Not through arbitrary rainbow colors.

---

# 15. Block / Node Model

**Block** = reusable template.  
**Node** = placed instance.

Node carries:
- ID;
- semantic type;
- semantic label;
- parent;
- children;
- width/height;
- flow/position;
- breakpoint layouts;
- visibility;
- style reference.

Default to flow/grid/stack behavior.

Absolute positioning is opt-in.

---

# 16. Responsive Frames

Defaults:
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px

Frame height:
- auto/content-driven by default.

One node identity persists across breakpoints.

Breakpoint-specific:
- dimensions;
- order;
- visibility;
- alignment;
- position.

Desktop and mobile should support side-by-side preview.

---

# 17. AI Composer

The Composer floats **inside the canvas**.

```text
┌─────────────────────────────────────────────────────┐
│ Apa yang ingin Anda buat atau ubah?                │
│                                                     │
│ +   /   @   [Preset]   [Model]                Send │
└─────────────────────────────────────────────────────┘
```

Controls:

### `+`
- image;
- GIF;
- markdown/text;
- file;
- reference attachment.

### `/`
- create;
- edit;
- restructure;
- responsive;
- duplicate;
- lint;
- additional contextual commands.

### `@`
Mention:
- page;
- block/node;
- component;
- file;
- reference image.

Composer motion:
- subtle resize/expand;
- no chat-bubble cascade;
- selection context appears compactly;
- generation progress should remain visually quiet.

Dark Composer uses grayscale only.

---

# 18. Provider UI

Provider/company connections use official brand marks.

Provider groups:
- Meta / Muse
- OpenAI
- Anthropic / Claude
- Google / Gemini
- Alibaba / Qwen
- Z.ai / GLM
- Xiaomi / MiMo
- xAI / Grok
- Moonshot AI / Kimi
- DeepSeek
- MiniMax
- Ignix — Coming Soon
- OpenAI-Compatible — Base URL + API key

Model names are fetched after connection and must not be treated as permanent hardcoded catalog data.

Ignix:
- official supplied logo;
- visible;
- disabled;
- Coming Soon;
- no simulated success.

---

# 19. DESIGN.md Interaction

Current release supports:
- upload DESIGN.md;
- paste DESIGN.md;
- manually write/edit DESIGN.md;
- parse/apply its context.

Automatic DESIGN.md generation:
- **Coming Soon**.

Preset selection:
- available before wireframe;
- available after wireframe;
- independent from DESIGN.md.

---

# 20. Website Crawling

Website crawl → semantic wireframe may appear in product IA but is **Coming Soon** initially.

Future crawler:
- extracts structure/principles;
- does not pixel-clone;
- does not copy proprietary assets/content;
- converts results into semantic Design IR.

Coming Soon controls must not behave like active features.

---

# 21. Motion System

Motion must reinforce continuity and product understanding.

## Global hierarchy
1. route/page transition
2. navbar morph
3. hero reveal
4. section entrance
5. product visual state change
6. text reveal
7. canvas interaction
8. AI Composer interaction
9. microinteraction

## Recommended patterns
- opacity + translate;
- clip/mask reveal;
- subtle scale;
- spatial morph;
- scroll-linked product walkthrough;
- interface crossfade;
- block drag/place demonstration;
- controlled text line reveal.

Typing effect is reserved for:
- AI Composer demonstration;
- realistic agent interaction.

Do not use typing effect for static marketing headlines.

## Prohibited
- random bounce;
- perpetual floating;
- excessive parallax;
- spinning icons;
- random 3D rotation;
- animated gradient;
- shimmer everywhere;
- stagger every grid by default.

Respect `prefers-reduced-motion`.

---

# 22. Reference-First Build Rule

Before implementing each major section, the agent must do a reference pass using relevant available tools.

At minimum:
1. inspect 2–4 relevant references;
2. identify what each reference solves well;
3. choose one composition direction;
4. adapt it to FORME;
5. record reference rationale in development notes/SESSION;
6. do not copy assets, wording, branding, or exact layout.

Use available:
- web/search;
- browser;
- relevant MCP;
- installed design skills;
- visual/reference tools.

Sources to prioritize:
- Refero
- Awwwards
- Behance
- Dribbble
- Pinterest
- Rootly
- Retool
- ElevenLabs
- Raycast
- Melius
- Linear
- Framer
- other high-quality references appropriate to the exact section

The goal is not to make a collage of competitors.  
The goal is to prevent default AI-generated composition.

---

# 23. Copywriting Rules

FORME copy should be short and specific.

### Prefer
- category-defining statement;
- one-sentence explanation;
- concrete action;
- labels users understand;
- product evidence.

### Avoid
- large technical paragraphs;
- unnecessary “AI-powered” text;
- implementation jargon;
- visible separators like `---`;
- filler labels;
- repeated eyebrow labels above every heading;
- “revolutionize”, “unlock”, “supercharge” style generic SaaS copy;
- emoji.

If a product visual can explain the feature, reduce the copy.

---

# 24. Anti-AI-Slop Rules

Never default to:
- centered hero + tiny badge + gradient headline + two pill CTAs;
- purple/blue aurora;
- gradient text;
- glass cards everywhere;
- six identical icon cards;
- “How it works” with three numbered circles unless genuinely useful;
- arbitrary bento grid;
- huge logo cloud immediately under hero without narrative need;
- rounded container around every section;
- fake testimonials;
- decorative statistics;
- floating sparkle icons;
- generic 3D blob;
- stock people;
- dark section inserted only for contrast;
- inconsistent border radii;
- excessive text.

Every section must earn its layout based on the content/job.

---

# 25. Button System

## Primary Brand CTA
- fill: `#7D070B`
- text/icon: `#FFFFFF`
- radius: 8px

## Alternate Deep CTA
- fill: `#5B090C`
- text/icon: `#FFFFFF`
- radius: 8px

## Alternate Signal CTA
- fill: `#A30A10`
- text/icon: `#FFFFFF`
- radius: 8px

### Rule
Only one filled crimson-family button treatment should dominate a given section.

Secondary action beside it should normally be:
- white;
- black/ink text;
- neutral border.

Do not place multiple red shades side-by-side as a hierarchy system.

Hover:
- same fill;
- subtle translate/scale;
- border/shadow adjustment;
- no new red shade.

## Dark Workspace Buttons
Neutral only.

---

# 26. Quick Tokens

```css
:root {
  /* Brand */
  --forme-crimson: #7D070B;
  --forme-crimson-deep: #5B090C;
  --forme-crimson-signal: #A30A10;
  --forme-white: #FFFFFF;
  --forme-ink: #121212;

  /* Typography */
  --font-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Landing */
  --landing-canvas: #FFFFFF;
  --landing-surface: #FAFAFA;
  --landing-surface-2: #F3F3F3;
  --landing-ink: #121212;
  --landing-muted: #676767;
  --landing-subtle: #8D8D8D;
  --landing-border: #E5E5E5;
  --landing-border-strong: #D5D5D5;

  /* Dark workspace */
  --ws-canvas: #191919;
  --ws-panel: #202020;
  --ws-surface: #272727;
  --ws-surface-hover: #303030;
  --ws-surface-active: #383838;
  --ws-border: #373737;
  --ws-border-strong: #505050;
  --ws-text: #F3F3F3;
  --ws-text-muted: #AAAAAA;
  --ws-text-subtle: #777777;
  --ws-selection: #F2F2F2;
  --ws-selection-ink: #151515;

  /* Radius */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-marketing-card: 16px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-30: 120px;
  --space-40: 160px;
}
```

---

# 27. Final Implementation Contract

This file is FORME's visual source of truth.

When implementation begins:

1. read `DESIGN.md`, `prd.md`, `AGENTS.md`, and `SESSION.md`;
2. use design references before major visual work;
3. use relevant installed design skills and available MCP tools;
4. preserve the Crimson + White marketing identity;
5. preserve the all-neutral dark workspace;
6. use real product UI as the primary marketing visual;
7. keep the page visually concise;
8. document intentional design-system changes instead of silently drifting.

If a future explicit product decision changes a visual rule, update this document rather than creating an undocumented exception.
