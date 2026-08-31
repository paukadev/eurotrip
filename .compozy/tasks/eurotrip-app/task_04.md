---
status: completed
title: "Dados semente + deploy + responsivo"
type: infra
complexity: low
---

# Task 4: Dados semente + deploy + responsivo

## Overview
Delivers the real trip data and makes the app publishable: authors `public/viagem.json`
with the full 8-stay circuit, adds the static build/deploy configuration for a free host,
and confirms the responsive layout for phone-width use during the trip. This is the last
slice — it turns the working UI into a deployed, real-data site.

<critical>
- ALWAYS READ the PRD, the TechSpec, and their catalogs (`_user_stories.md`, `_tests.md`) before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — implement every test case assigned in ## Tests
</critical>

<requirements>
- R1: `public/viagem.json` MUST encode the full circuit as distinct stays with unique slugs — `berlin-1`, `cracovia`, `budapeste`, `viena-1`, `bratislava`, `viena-2`, `praga`, `berlin-2` — each with dates, coordinates, lodging, transfer, and itinerary, and MUST validate cleanly against `TripSchema` (task_01).
- R2: The seed MUST include general items (e.g., international flight GRU⇄Berlin, insurance) and MUST NOT contain sensitive data (full reservation numbers, documents) per the PRD public-URL rule (US-015.EC-3).
- R3: A production static build (`npm run build`) MUST produce assets deployable to a free static host (GitHub Pages / Vercel / Netlify), serving `viagem.json` as a static asset, with base-path/config set so hash routes resolve (ADR-002/ADR-004).
- R4: The layout MUST be responsive: readable at a 375px-wide viewport with no horizontal scroll on home and destination pages (US-015.EC-1).
- R5: Documentation MUST note the expected offline behavior (v1 may not load offline — a documented Non-Goal, not a defect) (US-015.EC-2).
</requirements>

## Subtasks
- [x] 4.1 Author `public/viagem.json` with the 8 stays, coordinates, lodging/transfer/itinerary, and general items.
- [x] 4.2 Validate the seed against `TripSchema`; confirm the app renders it end to end.
- [x] 4.3 Add the static build/deploy configuration (base path, host config) for a free host.
- [x] 4.4 Audit/adjust responsive CSS for 375px width across home and destination.
- [x] 4.5 Document deploy steps and the offline Non-Goal in the README.
- [x] 4.6 Write and pass the assigned deploy/responsive e2e tests.

## Implementation Details
Create `public/viagem.json` (real data), deploy config appropriate to the chosen host
(e.g., `vite.config.ts` `base`, and a Pages/Netlify/Vercel config file), and a `README.md`
with build/publish/edit-data instructions. Revisit CSS Modules media queries in the page
and shared components (task_02/task_03) only for responsive fixes — no behavior changes.
Reference TechSpec → Development Sequencing (deploy) and PRD → High-Level Technical
Constraints.

### Relevant Files
- `_prd.md` — Overview (the 8-stay circuit), Business Rules (no sensitive data), Constraints.
- `src/data/schema.ts` — schema the seed must satisfy (task_01).
- `public/viagem.json` — real trip data (to create).
- `vite.config.ts`, host config, `README.md` — deploy setup (to create/modify).

### Dependent Files
- `src/pages/*`, `src/components/*` — responsive tweaks may touch their CSS Modules.

### Related ADRs
- [ADR-002: Hospedagem estática gratuita, sem backend](adrs/adr-002.md) — deploy target.
- [ADR-004: Hash routing](adrs/adr-004.md) — base-path/route resolution on host.
- [ADR-006: Cidades repetidas / slugs](adrs/adr-006.md) — slugs used in the seed.

## Deliverables
- `public/viagem.json` with the full validated 8-stay circuit and general items.
- A production static build and deploy configuration for a free host.
- Responsive layout verified at phone width; README with deploy/edit-data steps.
- Every test case assigned in `## Tests` implemented and passing **(REQUIRED)**.

## Tests

Cases assigned from `_tests.md` — read each ID's full definition there before writing tests.

- [x] E2E-010 — production build served as static files loads the home over HTTP with no backend.
- [x] E2E-011 — at 375px width, home and a stay page are readable with no horizontal scroll; offline failure is documented expected behavior, not asserted as success.

## Success Criteria
- Every assigned test case implemented and passing.
- `public/viagem.json` validates against `TripSchema` and renders the full circuit.
- The built site is publishable to a free static host and loads by URL.
- Home and destination are usable at 375px width with no horizontal scroll.
