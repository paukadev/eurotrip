---
status: completed
title: "Páginas: Home + Destino"
type: frontend
complexity: high
---

# Task 3: Páginas: Home + Destino

## Overview
Delivers the user-facing screens: the home overview (timeline, SVG route map, countdown,
bought-vs-pending consolidation, general items) and the destination page (header/duration,
lodging, transfer, itinerary by day, prev/next), plus the navigation and deep-linking that
tie them together. Home and destination ship as one slice because they share routing,
shared components, and cross-page navigation tests that need both pages present.

<critical>
- ALWAYS READ the PRD, the TechSpec, and their catalogs (`_user_stories.md`, `_tests.md`) before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — implement every test case assigned in ## Tests
</critical>

<requirements>
- R1: `HomePage` MUST render a chronologically ordered timeline of stays with names and dates, each linking to its destination page, and show the total trip duration (US-001).
- R2: `HomePage` MUST render a `CountdownBanner` reflecting `countdownState` (before → "faltam X dias", "começa hoje" at 0; during → "Dia N de M"; after → "concluída"; unknown → omitted/"sem datas") (US-002).
- R3: `HomePage` MUST render the SVG `RouteMap` from projected coordinates with a marker per coord-bearing city and a polyline in visit order; markers link to the stay; stays without valid coords are omitted from the map but kept in the timeline (US-003).
- R4: `HomePage` MUST render the consolidated bought/pending counts and per-currency totals — including general items — with a "considera N de M com valor" note, and a `GeneralItems` section (omitted when empty) (US-004, US-011).
- R5: `DestinationPage` MUST resolve `:slug` to a stay and render header (name/dates/duration), lodging(s), outbound transfer, and itinerary grouped by day and time, each booking item showing its status badge and optional money amount (US-006–US-010).
- R6: `DestinationPage` MUST offer prev/next navigation in chronological order, absent on the first/last stay respectively (US-006.EC-3), and reflect inconsistency warnings (inverted dates, checkout<checkin) without crashing.
- R7: Direct deep-link entry (`/#/destino/:slug`) and refresh MUST render the correct stay without visiting home first (US-014).
- R8: All screens MUST consume the derivations from task_01 and the shared components/provider from task_02 — no re-implementation of data logic in the view layer.
</requirements>

## Subtasks
- [x] 3.1 Implement `HomePage` composition and layout.
- [x] 3.2 Implement `Timeline` (ordered stays, dates, links, total duration).
- [x] 3.3 Implement `RouteMap` SVG (projection from task_01, markers, polyline, empty state, omitted-coord handling).
- [x] 3.4 Implement `CountdownBanner` from `countdownState`.
- [x] 3.5 Implement `ConsolidatedChecklist` (counts, per-currency totals, valued/total note) and `GeneralItems`.
- [x] 3.6 Implement `DestinationPage` slug resolution and composition.
- [x] 3.7 Implement `StayHeader` (duration, inconsistency notice) and prev/next navigation.
- [x] 3.8 Implement `LodgingSection`, `TransferSection`, and `ItineraryByDay` (day groups, time order, "livre"/"sem horário"/"fora do período").
- [x] 3.9 Wire home↔destination navigation and deep-link/refresh handling.
- [x] 3.10 Write and pass all assigned integration and e2e tests.

## Implementation Details
Create `src/pages/HomePage.tsx` and `src/pages/DestinationPage.tsx`, plus their
subcomponents under `src/components/home/` (`Timeline`, `RouteMap`, `CountdownBanner`,
`ConsolidatedChecklist`, `GeneralItems`) and `src/components/destination/` (`StayHeader`,
`LodgingSection`, `TransferSection`, `ItineraryByDay`, `StayNav`), with CSS Modules.
Slot these into the routes declared in task_02. Set up Playwright with fixture
`viagem.json` variants (`valid`/`repeated-cities`, `empty`, `malformed`, `multi-currency`,
`100-stays`) served as static assets. Reference TechSpec → System Architecture (UI layer).

### Relevant Files
- `_techspec.md` — UI layer components and derivation usage.
- `_user_stories.md` — US-001–US-011, US-014 acceptance criteria and edge cases.
- `src/data/derive.ts` — timeline/countdown/totals/itinerary/projection functions (task_01).
- `src/app/TripProvider.tsx`, `src/components/*` — provider and shared components (task_02).
- `src/pages/HomePage.tsx`, `src/pages/DestinationPage.tsx` — to create.

### Dependent Files
- `public/viagem.json` (task_04) — real seed rendered by these pages.
- `playwright.config.ts` + `e2e/fixtures/*` — e2e fixtures (to create here).

### Related ADRs
- [ADR-003: Item reservável / totais derivados](adrs/adr-003.md) — consolidation UI.
- [ADR-005: Mapa SVG estático](adrs/adr-005.md) — `RouteMap` rendering.
- [ADR-006: Cidades repetidas / slugs](adrs/adr-006.md) — slug resolution and prev/next order.

## Deliverables
- `HomePage` with timeline, SVG route map, countdown, consolidation, and general items.
- `DestinationPage` with header/duration, lodging, transfer, itinerary-by-day, and prev/next.
- Working home↔destination navigation and deep-link/refresh.
- Playwright harness with fixture data variants.
- Every test case assigned in `## Tests` implemented and passing **(REQUIRED)**.

## Tests

Cases assigned from `_tests.md` — read each ID's full definition there before writing tests.

- [x] IT-001 — home renders 8 stays chronologically with dates.
- [x] IT-003 — consolidated checklist shows combined counts and per-currency totals (stays + general).
- [x] IT-004 — click a timeline item → destination page for that slug renders.
- [x] IT-006 — first stay has no "anterior"; last has no "próximo".
- [x] IT-007 — swap fixture (add stay, flip item to comprado) + re-mount → home reflects it.
- [x] IT-010 — mount at `/#/destino/viena-2` directly → that stay renders without home.
- [x] E2E-001 — home timeline → open Praga → header/lodging/itinerary → back to home.
- [x] E2E-002 — future start date → "faltam X dias".
- [x] E2E-003 — SVG route map markers; click marker → stay page.
- [x] E2E-004 — bought/pending counts + per-currency totals incl. general; pending badge on stay.
- [x] E2E-005 — multi-day stay → activities grouped by day, ordered by time; empty day "livre".
- [x] E2E-006 — malformed `viagem.json` → legible data-error message; unknown slug → "destino não encontrado". (split into isolated Playwright cases E2E-006a/006b — see task memory)
- [x] E2E-007 — replace `viagem.json` (new stay + comprado) + reload → new stay + updated consolidation.
- [x] E2E-008 — deep link `/#/destino/viena-1`, then refresh → loads both times, no host 404.
- [x] E2E-009 — 100+ stays → timeline scrolls, navigable, no horizontal overflow.

## Success Criteria
- Every assigned test case implemented and passing.
- Home and destination render correctly from fixture data, including all edge-case states.
- Navigation, deep links, and refresh work under `HashRouter` with no host config.
- No data logic re-implemented in the view layer — all derived values come from task_01.
