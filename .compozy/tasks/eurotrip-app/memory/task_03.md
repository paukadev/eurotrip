# Task Memory: task_03.md

## Objective Snapshot

Home + Destination pages implemented and verified: `HomePage`
(`CountdownBanner`, `Timeline`, `RouteMap`, `ConsolidatedChecklist`,
`GeneralItems`) and `DestinationPage` (`StayHeader`, `StayNav`,
`LodgingSection`, `TransferSection`, `ItineraryByDay`), plus Playwright
harness. All assigned tests (IT-001/003/004/006/007/010, E2E-001..009)
pass. Status: complete.

## Important Decisions

- Countdown/consolidation/"livre"/"fora do período"/"sem horário definido"
  literal PT strings are UI-layer responsibility — `derive.ts` only returns
  discriminated unions / structured groups, never the display text.
- `RouteMap` markers use an SVG `<g role="link">` with `onClick`/`onKeyDown`
  calling `useNavigate()`, not `<Link>` — react-router `Link` renders an
  HTML `<a>` which doesn't nest validly inside `<svg>`.
- `DestinationPage` calls `stayHeader(result.trip.stays, stay.slug)` directly
  (not `orderedStays`) because `trip.stays` from `loadTrip()`/`normalize()`
  is already chronologically sorted — `orderedStays()` is only needed on
  `HomePage` for the `overlap` flag consumed by `Timeline`.
- E2E-006 (malformed data + unknown slug) was split into two independent
  Playwright tests (006a/006b) because a hash-only `page.goto()` on the same
  page does not remount `TripProvider` (no full navigation), so a second
  fetch never fires within one test — each fixture variant needs its own
  fresh `page`.
- Playwright's `page.clock.install({ time })` is used to fix "today" for
  countdown tests (E2E-002) instead of relying on the real system clock, so
  the fixture dates (Dec 2026) stay deterministic regardless of when the
  suite runs.

## Learnings

- Vitest picks up `e2e/**/*.spec.ts` by default and fails with "Playwright
  Test did not expect test.describe() to be called here" — added
  `test.exclude: ["**/node_modules/**", "e2e/**"]` to `vite.config.ts`.
- Repo has `"type": "module"` in `package.json`, so `__dirname` is
  unavailable in `e2e/helpers.ts` — use
  `path.dirname(fileURLToPath(import.meta.url))` instead.
- RTL: use `fireEvent.click` from `@testing-library/react`, not
  `@testing-library/user-event` — the latter isn't an installed dependency
  and wasn't worth adding for one click.
- When two stays share a name (e.g. repeated Berlin), `WarningNotice`'s
  `key={warning}` collided on identical warning text — fixed to
  `key={`${index}-${warning}`}` (shared component, minor fix, low risk).
- Playwright role-based queries collide when `RouteMap` and `Timeline` both
  render a same-named link/marker for the same city — scope `Timeline`
  queries via `page.getByTestId("timeline-list")` (added
  `data-testid="timeline-list"` on the `<ol>`).
- Overlapping SVG `<circle>` markers (repeated-city coordinates, e.g. two
  Vienna stays at identical lat/lon) intercept pointer events on each
  other — click a marker via `circle[data-slug='...']` for a
  non-duplicated city, or pass `{ force: true }`.

## Files / Surfaces

- Created: `src/pages/HomePage.tsx`, `src/pages/DestinationPage.tsx`
  (bodies replaced), `src/components/dateFormat.ts`,
  `src/components/home/{CountdownBanner,Timeline,RouteMap,
  ConsolidatedChecklist,GeneralItems}.{tsx,module.css}`,
  `src/components/destination/{StayHeader,StayNav,LodgingSection,
  TransferSection,ItineraryByDay}.{tsx,module.css}`,
  `src/pages/HomePage.test.tsx`, `src/pages/DestinationPage.test.tsx`,
  `playwright.config.ts`, `e2e/helpers.ts`, `e2e/home-destination.spec.ts`,
  `e2e/fixtures/{valid,valid-updated,repeated-cities,empty,malformed,
  multi-currency,100-stays}.json`.
- Modified: `src/components/WarningNotice.tsx` (key fix), `vite.config.ts`
  (vitest exclude), `package.json` (`test:e2e` script, `@playwright/test`
  devDependency).
- `@playwright/test` installed as devDependency; Chromium browser installed
  via `npx playwright install chromium`.

## Errors / Corrections

- Initial `useDefineForClassFields`/build was fine throughout — no
  regressions to `npm run build`/`npm run test` across the whole
  implementation.

## Ready for Next Run

task_03 is done. task_04 (seed data `public/viagem.json` + deploy +
responsive) can now render through these real pages — no further
placeholder bodies remain in `HomePage`/`DestinationPage`.
