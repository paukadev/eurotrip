# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_01 (scaffold + data/logic layer) is complete: Vite+React+TS scaffold,
  `TripSchema` (zod), `loadTrip()`, all pure derivations in
  `src/data/derive.ts`, 66 unit tests (all 58 assigned UT IDs), clean
  `vitest run` + `npm run build`. No seed `public/viagem.json` yet.
- task_02 (app shell + shared components) is complete: `TripProvider`/`useTrip`
  (root loading/fatal-error/empty states), `HashRouter` routes (`/`,
  `/destino/:slug`, catch-all), `NotFoundPage`, and shared components
  `ItemStatusBadge`/`MoneyAmount`/`WarningNotice`/`EmptyState`. 70 tests total
  (66 from task_01 + 4 new IT-002/005/008/009), clean `vitest run` +
  `npm run build`. `HomePage`/`DestinationPage` exist only as placeholder
  bodies (title / stay name) — task_03 replaces the bodies, not the shell.
- task_03 (Home + Destination pages) is complete: full `HomePage`/
  `DestinationPage` compositions, Playwright e2e harness added. 77 vitest
  tests + 10 Playwright e2e tests, clean `vitest run` + `npm run build` +
  `npx playwright test`. See Handoffs below for details.
- task_04 (seed data + deploy + responsive) is complete — final task in
  the chain. Real `public/viagem.json` (8 stays), static deploy config
  (GitHub Pages Actions workflow + `netlify.toml`), `README.md`, global
  CSS reset, and `E2E-010`/`E2E-011` all shipped. 77 vitest + 13
  Playwright tests (all IDs across all 4 tasks) pass; `npm run build`
  clean. Workflow is done end to end.

## Shared Decisions

- `Stay.lodging`/`Stay.transfer` are typed as `LodgingItem`/`TransferItem` —
  additive subtypes of `BookingItem` (extra optional display fields:
  address/checkin/checkout for lodging; mode/departure/arrival/time for
  transfer). Structurally still assignable to `BookingItem[]` so TechSpec's
  literal Core Interfaces signature holds. `Activity` (itinerary) is its own
  type, not a `BookingItem` — only `tipo:"atracao"` entries carry
  status/value semantics. UI tasks (task_02/03) building lodging/transfer
  sections should read these extra fields directly off `Stay.lodging[]` /
  `Stay.transfer[]`, no separate mapper needed.
- `viagem.json` top-level fields (`title`, `origin`, `generalItems[].kind/
  title/status/value/currency`) use English keys; destino-nested fields
  (`hospedagens`, `translados`, `roteiro` and their sub-fields like
  `nome/checkin/checkout/valor/moeda`) use pt-BR keys, per the canonical
  example in `_techspec.md`. task_04's seed data must follow this exact
  mixed-key shape — see `src/data/schema.ts` (`RawTripSchema`).

## Shared Learnings

- `npm run build` (`tsc -b`) type-checks everything under `src/` including
  `*.test.ts` files (tsconfig.app.json `include: ["src"]`). Always run both
  `vitest run` and `npm run build` before claiming a task done — Vitest
  alone won't catch type errors in test fixtures.
- Repo root already contained unrelated files (CLAUDE.md, curso.md, image*.png
  — a flight-planning side project, not part of this app) — the Vite
  scaffold was built by hand (package.json/vite.config.ts/tsconfig*.json/
  index.html) rather than via `npm create vite@latest .`, which refuses to
  run non-interactively in a non-empty directory. Future tasks should keep
  treating those root files as out of scope / untouched.

- `loadTrip()`'s default trip URL is base-aware:
  `` `${import.meta.env.BASE_URL}viagem.json` `` (not a hardcoded
  `"/viagem.json"`), and `vite.config.ts` reads `base` from a
  `VITE_BASE_PATH` env var (default `"/"`). Any future change to fetch
  paths or routing must keep this base-path awareness or GitHub Pages
  project-subpath deploys break.
- `@types/node` is now a devDependency (needed for `process.env` in
  `vite.config.ts` under `tsc -b`) — don't remove it.

## Open Risks

## Handoffs

- task_03 (Home + Destination pages) is complete: `HomePage`/`DestinationPage`
  now compose real subcomponents under `src/components/home/` and
  `src/components/destination/` (CSS Modules pattern), consuming
  `derive.ts` functions directly (`orderedStays`, `tripDuration`,
  `countdownState`, `consolidatedTotals`, `groupItineraryByDay`,
  `stayHeader`, `projectRoute`, `findStayBySlug`) — no data logic
  reimplemented in the view layer. `DestinationPage` keeps its
  `findStayBySlug` → `NotFoundPage` fallback (unchanged from task_02, still
  the unknown-slug path). 77 vitest tests total (all IT-* + task_01/02 UT-*)
  and 10 Playwright e2e tests (all assigned E2E-001..009, with E2E-006 split
  into two isolated cases) pass; `npm run build`/`npm run test` clean.
- Playwright infra added: `playwright.config.ts` (webServer runs
  `npm run build && npm run preview -- --port 4173 --strictPort`),
  `e2e/helpers.ts` (`mockTrip(page, fixtureName)` — intercepts
  `**/viagem.json` via `page.route()` and fulfills from
  `e2e/fixtures/*.json`, so no `public/viagem.json` seed is needed for
  e2e), `e2e/fixtures/{valid,valid-updated,repeated-cities,empty,
  malformed,multi-currency,100-stays}.json`. Run via `npm run test:e2e`.
  `vite.config.ts` test config now excludes `e2e/**` so Vitest doesn't try
  to collect Playwright spec files (they use `test.describe`, which throws
  outside the Playwright runner).
- task_04 (seed data + deploy + responsive) starts from a fully-wired UI —
  dropping a real `public/viagem.json` in place is the only remaining step
  for the pages to render actual trip data; the e2e suite already proves
  the fetch-driven flow end-to-end against fixture data.
