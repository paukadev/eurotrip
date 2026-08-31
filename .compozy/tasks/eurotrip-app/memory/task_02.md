# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Task complete: `TripProvider`/`useTrip`, `HashRouter` routes, `NotFoundPage`, and shared
components (`ItemStatusBadge`, `MoneyAmount`, `WarningNotice`, `EmptyState`) implemented.
`npm run test` (70/70) and `npm run build` both clean.

## Important Decisions

- `TripProvider` guards children rendering: it only renders `<TripContext.Provider>` when
  `result.ok && !isEmptyTrip(result)`. Loading/fatal-error/empty states are handled
  entirely at the root before any route/page code runs, so `useTrip()` always returns an
  `ok: true`, non-empty `LoadResult` inside any component that actually mounts under it.
- Unknown-slug resolution (IT-005 / US-005.EC-1) is NOT done at the route level (the route
  `/destino/:slug` always matches syntactically valid paths) — it's done inside
  `DestinationPage` itself via `findStayBySlug(trip, slug)`, falling back to
  `<NotFoundPage />` when the slug doesn't resolve to a stay. `HomePage`/`DestinationPage`
  in this task are thin placeholders (title / stay name only) — task_03 replaces their
  bodies but must keep this not-found fallback logic in `DestinationPage`.
- Added `"vite/client"` to `tsconfig.app.json` `compilerOptions.types` — required for
  `*.module.css` imports to type-check (wasn't there from task_01's scaffold since no CSS
  Modules existed yet).

## Learnings

- In RTL tests, don't `findByRole("status")` when both the loading state AND the target
  state use `role="status"` — the query resolves on the first (loading) render before the
  async state settles. Use `findByText(/specific copy/i)` instead to wait for the actual
  target content.
- `src/data/trip.ts` error messages already contain the exact required PT strings
  ("Não foi possível ler os dados...", "Dados não encontrados...") from task_01 — no need
  to re-derive copy in the UI layer, `TripProvider` just renders `result.error.message`
  verbatim.

## Files / Surfaces

- `src/app/TripProvider.tsx` (+ `.module.css`), `src/app/routes.tsx`
- `src/pages/NotFoundPage.tsx` (+ `.module.css`)
- `src/pages/HomePage.tsx`, `src/pages/DestinationPage.tsx` — placeholder bodies only
- `src/components/{ItemStatusBadge,MoneyAmount,WarningNotice,EmptyState}.tsx` (+ CSS Modules)
- `src/App.tsx` — wires `HashRouter` → `TripProvider` → `AppRoutes`
- `src/app/TripProvider.test.tsx` — IT-002, IT-005, IT-008, IT-009
- `tsconfig.app.json` — added `vite/client` to `types`

## Errors / Corrections

## Ready for Next Run

- task_03 can now build `HomePage`/`DestinationPage` real bodies against
  `useTrip()`/shared components/routes without touching the shell contract — just replace
  the placeholder JSX in both page files (keep `DestinationPage`'s not-found fallback).
