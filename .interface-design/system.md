# Eurotrip — Design System

Dark-only interface for a personal year-end Euro trip control app (React + Vite + TS,
CSS Modules). Read this before adding or restyling any UI; reuse the tokens and patterns
below instead of reinventing them.

## Direction & Feel

**A train window at dusk crossing Central Europe in winter** — deep cold-blue dark
outside, warm amber lamplight inside. Cozy but precise. Not a generic dark dashboard.

- **Committed to dark only** (`color-scheme: dark`). Do not add a light theme unless asked.
- The tension of **warm light in cold dark** is the whole idea — keep the canvas cold
  (midnight indigo) and let the single amber accent carry all warmth/meaning.

## Signature — "lit vs unlit"

The load-bearing idea, reused across components:

- **comprado** (bought/secured) = **lit**: warm amber fill + glow. The lamp is on.
- **pendente** = **unlit**: dim, transparent, dashed outline. Not yet lit.

Appears in: `ItemStatusBadge` (both variants), `ConsolidatedChecklist` counts (lit vs
dim readouts), Timeline station nodes (light up on hover), CountdownBanner (a glowing
"lamp" dot), RouteMap nodes. When you show status or emphasis, express it as light.

## Depth Strategy

**Borders + subtle surface color shifts.** Dark leans on borders, not shadows. One soft
shadow only on the sticky bar and cards (`--shadow-bar`, `--shadow-card`). Do not mix in
dramatic drop shadows.

## Tokens (defined in `src/index.css` `:root`)

Always use these variables — no raw hex in components.

- **Surfaces** (whisper-quiet elevation): `--bg` #0c0e17 · `--surface-1` #12141f (cards) ·
  `--surface-2` #191c2a (raised/hover) · `--surface-inset` #090a11 (map panel, data rows).
- **Text hierarchy** (warm-white → cool dusk): `--text-1` #f4f1ea · `--text-2` #b8bccc
  (body) · `--text-3` #7c8199 (metadata) · `--text-muted` #565b70.
- **Borders** (low-opacity, cool): `--border-1` .09 (standard) · `--border-2` .05 (soft) ·
  `--border-3` .16 (emphasis).
- **Accent — warm amber lamplight (the ONE accent):** `--accent` #e6a94e ·
  `--accent-strong` #f2bd6b · `--accent-dim` rgba(.14) fill · `--accent-border` rgba(.4) ·
  `--accent-glow` rgba(.28). Means warmth / secured / active / interactive.
- **Semantic:** `--warn` #dd9a6c (+`--warn-dim`, `--warn-border`) terracotta dusk for
  warnings and out-of-range. Pendente has **no** loud color — it is the unlit state.
- **Spacing** (base 0.25rem): `--sp-1`..`--sp-7` = .25/.5/.75/1/1.5/2/3rem.
- **Radius:** `--r-1` .5rem (inputs/badges) · `--r-2` .875rem (cards) · `--r-3` 1.25rem.
- **Type:** `--font-sans` (Inter → system) for prose; `--font-mono` (ui-monospace stack)
  with `font-variant-numeric: tabular-nums` for **all** dates, times, counts, money —
  rail-timetable feel.

## Typographic conventions (global in `index.css`)

- `h1`: `clamp(1.55rem, …, 2.1rem)`, weight 650, tracking -0.02em, `--text-1`.
- `h2`: rendered as an **eyebrow** — 0.72rem, uppercase, tracking .14em, `--text-3`, with
  an amber tick via `::before`. All section titles use this automatically.
- `h3`: 0.9rem, weight 600, `--text-1`.
- Data/number-heavy text: monospace + tabular-nums (use `.tabular` or component classes).

## Layout patterns

- **App shell** (`App.tsx` / `App.module.css`): sticky translucent bar (brand + rail
  glyph + `GRU ⇄ BER` pill) → centered `main` (max-width 64rem) → footer. Tests render
  `TripProvider`/`AppRoutes` directly, NOT `App`, so shell changes are test-safe. Keep the
  brand a plain `<a>`, **not** a heading (avoids duplicate `h1` breaking heading queries).
- **Home** (`HomePage.module.css`): one centered column (`max-width: 52rem`,
  `margin-inline: auto`), every section a full-width row stacked at `--sp-5`. No grid, no
  aside. Reading order = time pressure → booking status → where → when → loose ends: hero
  (mono eyebrow + h1 + countdown), ConsolidatedChecklist, RouteMap, Timeline, GeneralItems.
- **Detail pages** (`DestinationPage.module.css`): narrower 44rem reading column.
- **Sections as cards**: `main section` is globally styled (surface-1, border-1, r-2,
  shadow-card). Just render `<section>` and it's a card.

## Component patterns (reused 2+ times)

- **Booking-item badge** (`ItemStatusBadge.module.css`): pill, mono 0.72rem. `.comprado`
  amber-dim fill + border + glow; `.pendente` transparent, `--text-3`, **dashed**
  `--border-3`.
- **Stat readout pair** (`ConsolidatedChecklist`): two flex pills; first (comprado) lit
  amber, second (pendente) `--surface-2` dim. Mono tabular numbers.
- **Rail timeline** (`Timeline.module.css`): `.list` padding-left 1.75rem, vertical rail
  via `.list::before` (amber→border gradient), station node via `.item::before` (0.7rem
  dot) that fills amber + glows on hover. No inner scroll — the page scrolls (it's the
  centerpiece row now).
- **Data rows** (itinerary/lodging/transfer): `--surface-inset` bg, border-1, r-1; times
  in `.time` = mono amber; titles in `.title` = `--text-1`, `flex: 1 1 auto`.
- **Warning** (`WarningNotice.module.css`): warn-dim bg, warn border with 3px left edge.
- **Empty / status / 404**: centered panel, surface-1/inset, dashed or solid border-1,
  `--text-2/3`, mono for status text.

## Responsive rules

- `body { overflow-x: hidden }`; `img,svg { max-width: 100% }`. Verified usable at 375px
  (E2E-011: no horizontal scroll). Grids collapse to one column; rows use `flex-wrap`.
- Section padding drops from `--sp-5` to `--sp-4` under 30rem.

## Guardrails when editing

- Keep test-queried DOM stable: timeline `<Link>` text (city + dates), single `h1` per
  page, literal strings "comprado(s)"/"pendente(s)", alert messages, StayNav
  "Anterior"/"Próximo", NotFound "…home" link. Verify with `npm run test` + `npm run build`.
- One accent only. If you reach for a second hue, reconsider — express difference with the
  lit/unlit + surface/border system instead.
