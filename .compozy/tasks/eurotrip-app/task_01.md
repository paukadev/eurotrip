---
status: completed
title: "Fundação: scaffold + camada de dados/lógica"
type: frontend
complexity: high
---

# Task 1: Fundação: scaffold + camada de dados/lógica

## Overview
Delivers the greenfield project scaffold and the entire read-only data/logic foundation
that every UI component consumes: the Vite + React + TypeScript app, the `zod` trip
schema (single source of types), the `loadTrip()` loader with normalization, and all pure
derivation functions. This is the contract layer — no task after it can build without it,
which is why it carries the bulk of the unit tests.

<critical>
- ALWAYS READ the PRD, the TechSpec, and their catalogs (`_user_stories.md`, `_tests.md`) before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — implement every test case assigned in ## Tests
</critical>

<requirements>
- R1: MUST scaffold a Vite + React + TypeScript project with `react-router`, `zod`, and CSS Modules, plus Vitest + React Testing Library configured for a jsdom environment (per ADR-004).
- R2: MUST define `TripSchema` in `zod` as the single source of the domain types (`BookingItem`, `Stay`, `Trip`, `ItemStatus`, `ItemKind`, `CalendarDate`), inferring TypeScript types from the schema — no hand-written parallel types.
- R3: `loadTrip(url?)` MUST `fetch` the JSON, parse via `TripSchema.safeParse`, and return a `LoadResult` discriminated union: `{ok:true, trip, warnings}` or `{ok:false, error}`. It MUST NOT throw on malformed/absent input.
- R4: Normalization MUST enforce every PRD Business Rule: required `name` (invalid stay dropped with warning, valid stays kept); `status` default `pendente`; unknown `status` → `pendente` + warning; non-numeric/negative `value` excluded from sums + warning; out-of-range coords treated as absent + warning; unparseable dates treated as absent (never "Invalid Date"); unknown fields ignored.
- R5: Slug assignment MUST be unique per stay, normalizing `name` (lowercase, no accents, spaces→hyphen) and appending chronological suffixes on collision (`viena-1`, `viena-2`); explicit JSON slugs take precedence but are still checked for uniqueness (ADR-006).
- R6: `CalendarDate` MUST be timezone-safe (parsed from `YYYY-MM-DD` at UTC midnight) so date math never drifts ±1 day.
- R7: Derivations (`orderedStays`, `tripDuration`, `countdownState`, `consolidatedTotals`, `groupItineraryByDay`, `collectItems`, route-map projection, stay-header/lodging/transfer mappers) MUST be pure functions with no I/O.
- R8: `consolidatedTotals` MUST count bought/pending across stays + general items, keep per-currency sums separate (never mixing currencies), and report `valuedItems`/`totalItems`.
</requirements>

## Subtasks
- [x] 1.1 Scaffold Vite + React + TS project; add `react-router`, `zod`, CSS Modules; configure Vitest + React Testing Library (jsdom).
- [x] 1.2 Implement `CalendarDate` helpers: parse `YYYY-MM-DD` at UTC midnight, diff-in-days, and calendar-safe comparisons.
- [x] 1.3 Define `TripSchema` (zod) and infer the domain types; tolerate unknown fields; default `status`.
- [x] 1.4 Implement `loadTrip()`: fetch → `safeParse` → normalize → `LoadResult`; handle fatal (fetch/404/syntax) vs non-fatal (empty, warnings) paths.
- [x] 1.5 Implement slug assignment with accent-stripping and chronological collision suffixes.
- [x] 1.6 Implement ordering/duration derivations (`orderedStays` with stable tie-break, overlap flag, `tripDuration`).
- [x] 1.7 Implement `countdownState` with before/during/after/unknown phases.
- [x] 1.8 Implement `consolidatedTotals` and `collectItems` (stays + general, per-currency, dedup, valued/total counts).
- [x] 1.9 Implement `groupItineraryByDay` (per-day grouping, time ordering, out-of-range bucket, no-time bucket).
- [x] 1.10 Implement stay-page derivations (header/duration, lodging/transfer mappers, inconsistency flags) and route-map coordinate projection.
- [x] 1.11 Write and pass all assigned unit tests.

## Implementation Details
Create the project root (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`,
`src/main.tsx`, `src/App.tsx` placeholder). Data/logic lives under `src/data/`:
`src/data/calendar.ts` (`CalendarDate`), `src/data/schema.ts` (`TripSchema` + inferred
types), `src/data/trip.ts` (public types re-export + `loadTrip`), `src/data/derive.ts`
(pure derivations), `src/data/slug.ts` (slug rules). Follow the TechSpec → Implementation
Design → Core Interfaces signatures exactly (`loadTrip`, `countdownState`,
`consolidatedTotals`, `groupItineraryByDay`). No UI in this task beyond a placeholder
`App`.

### Relevant Files
- `_techspec.md` — Core Interfaces and Data Models drive every signature here.
- `_prd.md` (Business Rules) — normalization/validation/slug/currency rules to enforce.
- `src/data/schema.ts` — zod schema and inferred types (to create).
- `src/data/trip.ts` — `loadTrip` and public types (to create).
- `src/data/derive.ts` — pure derivations (to create).
- `src/data/calendar.ts`, `src/data/slug.ts` — helpers (to create).

### Dependent Files
- `src/**` UI (task_02, task_03) — every component imports the types and derivations from here.
- `public/viagem.json` (task_04) — must satisfy `TripSchema`.

### Related ADRs
- [ADR-001: Dados em JSON, app somente-leitura](adrs/adr-001.md) — read-only loader, no writes.
- [ADR-003: Item reservável unificado](adrs/adr-003.md) — `BookingItem` model + derived totals.
- [ADR-004: Stack, hash routing, zod](adrs/adr-004.md) — scaffold + validation approach.
- [ADR-006: Cidades repetidas / slugs](adrs/adr-006.md) — unique slug assignment.

## Deliverables
- A runnable scaffolded Vite + React + TS project with test tooling configured.
- `TripSchema` (zod) with inferred domain types.
- `loadTrip()` returning a `LoadResult` with normalization and warnings, never throwing.
- All pure derivations from the TechSpec, unit-tested.
- Every test case assigned in `## Tests` implemented and passing **(REQUIRED)**.

## Tests

Cases assigned from `_tests.md` — read each ID's full definition there before writing tests.

- [x] UT-001, UT-002, UT-003, UT-004, UT-005, UT-006, UT-110, UT-040 — ordering, duration, empty, stable tie-break, overlap, scale sort, slug assignment, `findStayBySlug` unknown/known.
- [x] UT-010, UT-011, UT-012, UT-013, UT-014, UT-015 — countdown before/during/after/unknown, "today===start", timezone safety.
- [x] UT-020, UT-021, UT-022, UT-023 — route-map projection: geometry, missing coord, no coords, out-of-range coord.
- [x] UT-030, UT-031, UT-032, UT-033, UT-034, UT-035 — consolidated totals: counts, valued/total, empty, per-currency separation, invalid value excluded, all-bought.
- [x] UT-070, UT-071, UT-072, UT-073, UT-074, UT-075 — itinerary grouping by day/time, attraction status carry, out-of-range, same-time, no-time, 1-day.
- [x] UT-080, UT-081, UT-082, UT-090, UT-091, UT-092 — item collection, unknown/absent status defaults, general items included, empty general, dedup once.
- [x] UT-041, UT-042, UT-043, UT-044 — stay header duration, inverted dates, missing dates, first/last prev-next flags.
- [x] UT-050, UT-051, UT-052, UT-053 — lodging mapping, none, multiple, checkout<checkin.
- [x] UT-060, UT-061, UT-062, UT-063 — transfer mapping, last-stay none, no-time, arrival≠next.
- [x] UT-100, UT-101, UT-102, UT-103, UT-104, UT-120, UT-121, UT-122, UT-123, UT-124 — loadTrip/schema: unknown field tolerated, invalid JSON fatal, 404 fatal, empty non-fatal, unrecognized date, missing name dropped, defaults, unique slugs, chronological order, invalid value normalized out.

## Success Criteria
- Every assigned test case implemented and passing.
- `loadTrip()` never throws for any documented bad input; returns the correct `LoadResult` variant.
- Types across the app derive from `TripSchema` — no duplicate hand-written domain types.
- `npm run build` and `vitest run` both succeed on a clean checkout.
