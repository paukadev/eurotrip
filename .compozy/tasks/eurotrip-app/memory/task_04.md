# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

task_04 complete: real 8-stay seed data, static deploy config, responsive
CSS pass, README, E2E-010/E2E-011. All requirements R1-R5 verified; full
pipeline (`npm run build` + `npm run test` + `npm run test:e2e`) green
(77 vitest + 13 Playwright, incl. the 2 new IDs).

## Important Decisions

- Open PRD question (return leg modeling) resolved: each stay's
  `translados[]` holds the *departure* transfer to the next stop (matches
  the canonical `_techspec.md` example — Viena's translado targets
  Bratislava); the international round-trip GRU⇄Berlin flight is a single
  `generalItems` entry, not per-stay. `praga.translados` carries the
  Praga→Berlin leg; `berlin-2.translados` is empty (last stay).
- Slugs are NOT set explicitly in the seed — `name` alone ("Berlin" x2,
  "Viena" x2, others once) plus chronological ordering lets
  `assignSlugs`/`normalizeSlug` derive exactly `berlin-1/cracovia/
  budapeste/viena-1/bratislava/viena-2/praga/berlin-2` with zero warnings.
  Verified once via a throwaway vitest file (parsed + `loadTrip()`), then
  deleted — don't recreate it as a permanent test, it was just seed
  validation.
- `DEFAULT_TRIP_URL` in `src/data/trip.ts` changed from hardcoded
  `"/viagem.json"` to `` `${import.meta.env.BASE_URL}viagem.json` `` so
  the fetch respects a non-root Vite `base` (needed for GitHub Pages
  project-subpath deploys). `vite.config.ts` now reads
  `base: process.env.VITE_BASE_PATH ?? "/"` — root-domain hosts (Netlify/
  Vercel) get default `/` (no env needed); the GH Pages Actions workflow
  sets `VITE_BASE_PATH=/${{ github.event.repository.name }}/`.
- Added `@types/node` as a devDependency — required for `process.env` in
  `vite.config.ts` to type-check under `tsc -b` (tsconfig.node.json has no
  `types` restriction, so it picks it up automatically).
- Deploy config ships both a GitHub Pages Actions workflow
  (`.github/workflows/deploy.yml`) and a `netlify.toml` — gives a working
  path for either "project subpath" or "root domain" free hosts without
  the user having to decide which one to build config for.

## Learnings

- Global CSS was entirely absent (no `index.css`, no box-sizing reset, no
  `#root` padding/max-width). Added `src/index.css` (imported from
  `main.tsx`): `box-sizing: border-box` reset, body margin 0, `#root`
  `max-width: 48rem` + `padding: 1rem`, `img/svg { max-width: 100% }`.
  Also added `flex-wrap: wrap` to `GeneralItems.module.css` `.item` and
  `ConsolidatedChecklist.module.css` `.counts` — the only two flex rows
  mixing free-text with `white-space: nowrap` money amounts, so the ones
  actually at risk at 375px. Everything else already used `max-width:
  100%` / auto-width blocks and needed no change.
- E2E-010 deliberately does NOT use `mockTrip()` — it lets Playwright's
  preview server serve the real `public/viagem.json` as a static asset,
  which is the only way to actually prove "static file, no backend"
  rather than proving the mock-interception path (already covered by the
  other 11 e2e cases).

## Files / Surfaces

- `public/viagem.json` (new) — full 8-stay seed.
- `src/data/trip.ts` — `DEFAULT_TRIP_URL` now base-aware.
- `vite.config.ts` — `base` from `VITE_BASE_PATH` env.
- `src/index.css` (new), `src/main.tsx` — global reset import.
- `src/components/home/GeneralItems.module.css`,
  `src/components/home/ConsolidatedChecklist.module.css` — `flex-wrap`.
- `.github/workflows/deploy.yml` (new), `netlify.toml` (new) — deploy
  config for two free-host shapes.
- `README.md` (new) — build/deploy/edit-data/offline-Non-Goal docs.
- `e2e/home-destination.spec.ts` — added `E2E-010`, `E2E-011`, plus one
  extra (unassigned but cheap) offline-navigation-fails case documenting
  US-015.EC-2 without asserting success.
- `package.json` — added `@types/node` devDependency.

## Errors / Corrections

- First `npm run build` failed: `tsc -b` couldn't type-check
  `process.env.VITE_BASE_PATH` in `vite.config.ts` (no Node types
  installed). Fixed by adding `@types/node` rather than avoiding
  `process.env` — it's the standard, idiomatic fix for Vite configs and
  needed no `tsconfig.node.json` changes.

## Ready for Next Run

task_04 was the last task in the chain (`task_01 → 02 → 03 → 04`, linear,
per `_tasks.md`) — no downstream task depends on this one. If a future
task edits `public/viagem.json`'s real dates/content, re-run the
`RawTripSchema.safeParse` + `loadTrip()` sanity check pattern documented
above before shipping (throwaway test, not permanent).
