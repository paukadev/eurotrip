---
status: completed
title: "App shell + componentes compartilhados"
type: frontend
complexity: medium
---

# Task 2: App shell + componentes compartilhados

## Overview
Delivers the application shell that both feature pages depend on: the `TripProvider`
context that loads the trip once and renders the root loading/error/empty states, the
hash-based router, the `NotFoundPage`, and the shared presentational components
(status badge, money amount, warning notice, empty state). This is the wiring boundary
between the data layer and the pages.

<critical>
- ALWAYS READ the PRD, the TechSpec, and their catalogs (`_user_stories.md`, `_tests.md`) before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — implement every test case assigned in ## Tests
</critical>

<requirements>
- R1: `TripProvider` MUST call `loadTrip()` exactly once and expose the `LoadResult` via `useTrip()`; it MUST render, at the root, distinct states for loading, fatal error, and empty-but-valid data.
- R2: The fatal-error state MUST show a legible Portuguese message ("não foi possível ler os dados" for parse/syntax failures; "dados não encontrados" for fetch/404) and never a blank screen or raw runtime error (US-013).
- R3: The empty state MUST render for valid-but-empty data (`[]`/`{}`) instead of an error (US-013.EC-2 / US-001.EC-1).
- R4: Routing MUST use `HashRouter` (`/#/` and `/#/destino/:slug`) so deep links and refresh resolve on any static host without rewrite config (ADR-004); an unknown slug MUST render `NotFoundPage` with a link home.
- R5: Shared components MUST exist and be reusable by both pages: `ItemStatusBadge` (bought/pending using label+icon, not color alone), `MoneyAmount` (renders value+currency, or nothing when value absent — never "R$ 0"), `WarningNotice` (renders normalization warnings), `EmptyState`.
- R6: Route definitions MUST be declared so that the page components (task_03) can be slotted in without changing the shell contract.
</requirements>

## Subtasks
- [x] 2.1 Implement `TripProvider` + `useTrip()` hook calling `loadTrip()` once.
- [x] 2.2 Implement root state rendering: loading, fatal error (parse vs fetch messages), empty.
- [x] 2.3 Set up `HashRouter` with routes for home (`/`) and destination (`/destino/:slug`), plus a catch-all to `NotFoundPage`.
- [x] 2.4 Implement `NotFoundPage` with a link back home.
- [x] 2.5 Implement `ItemStatusBadge` (label+icon, accessible, not color-only).
- [x] 2.6 Implement `MoneyAmount` (value+currency or nothing).
- [x] 2.7 Implement `WarningNotice` and `EmptyState`.
- [x] 2.8 Write and pass all assigned integration tests.

## Implementation Details
Create `src/app/TripProvider.tsx`, `src/app/routes.tsx` (or router setup in
`src/App.tsx`), `src/pages/NotFoundPage.tsx`, and `src/components/` for shared components
(`ItemStatusBadge.tsx`, `MoneyAmount.tsx`, `WarningNotice.tsx`, `EmptyState.tsx`) with CSS
Modules. Consume the types and `loadTrip` from `src/data/` (task_01). Follow TechSpec →
System Architecture (UI layer) for component boundaries. Do not implement `HomePage` or
`DestinationPage` bodies here — only the route scaffolding they plug into.

### Relevant Files
- `_techspec.md` — System Architecture (UI layer) and Core Interfaces.
- `src/data/trip.ts` — `loadTrip`, `LoadResult`, types (from task_01).
- `src/app/TripProvider.tsx`, `src/app/routes.tsx` — to create.
- `src/components/*` — shared presentational components (to create).
- `src/pages/NotFoundPage.tsx` — to create.

### Dependent Files
- `src/pages/HomePage.tsx`, `src/pages/DestinationPage.tsx` (task_03) — consume `useTrip`, shared components, and route slots.

### Related ADRs
- [ADR-002: Web app estático, sem backend](adrs/adr-002.md) — client-only shell.
- [ADR-004: Hash routing + zod](adrs/adr-004.md) — router mode and error UX.

## Deliverables
- `TripProvider`/`useTrip` with root loading/error/empty states.
- `HashRouter` wiring with home, destination, and not-found routes.
- Reusable shared components (`ItemStatusBadge`, `MoneyAmount`, `WarningNotice`, `EmptyState`) and `NotFoundPage`.
- Every test case assigned in `## Tests` implemented and passing **(REQUIRED)**.

## Tests

Cases assigned from `_tests.md` — read each ID's full definition there before writing tests.

- [x] IT-002 — fixture `empty` → provider renders empty state, not error.
- [x] IT-005 — unknown slug → `NotFoundPage` with link home.
- [x] IT-008 — fixture `malformed` → provider renders legible data-error message, no white screen.
- [x] IT-009 — `fetch` 404 → root renders "dados não encontrados" with guidance.

## Success Criteria
- Every assigned test case implemented and passing.
- Loading, fatal-error, and empty states render at the root without any page-specific code.
- Deep-link and unknown-slug routes resolve via `HashRouter` without host configuration.
- Shared components are importable and used by both pages in task_03.
