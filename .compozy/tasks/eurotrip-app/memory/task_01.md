# Task Memory: task_01.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Scaffold Vite+React+TS app and implement the read-only data/logic foundation
(`TripSchema` zod schema, `loadTrip()`, pure derivations) that every later task
(app shell, home/destino pages, seed data) depends on. Completed.

## Important Decisions

- Ambiguity resolution (TechSpec vs PRD Business Rules): TechSpec's Core
  Interfaces literally type `Stay.lodging`/`Stay.transfer` as `BookingItem[]`,
  but PRD requires richer display fields (address/checkin/checkout;
  modo/chegada/horario). Resolved by making `LodgingItem`/`TransferItem`
  additive subtypes of `BookingItem` (structurally assignable to
  `BookingItem[]`), so the TechSpec signature holds exactly while PRD fields
  are still carried. `Activity` (itinerary) is its own type, not a
  `BookingItem`, since only `tipo:"atracao"` entries carry reservable
  semantics.
- `TripSchema` (zod) is deliberately lenient (all fields optional, including
  destino `name`) so `safeParse` never fails structurally. The PRD's
  "required name" invariant is enforced in `normalize()` (trip.ts), which
  drops nameless destinos with a warning — this is what makes partial
  rendering / non-throwing behavior possible (UT-120), since a strict zod
  `name` requirement would fail the whole array parse on one bad entry.
- `assignSlugs` (slug.ts): symmetric chronological "-1/-2" suffixes only
  apply to genuinely repeated display `name`s (ADR-006 case: "Viena" twice).
  An explicit-slug collision between two *different* names only suffixes the
  later occurrence (first keeps its explicit slug) — no "sibling" to number
  against in that case.
- Stays with no valid `startDate` sort last in chronological order,
  preserving file order among themselves (not explicitly tested, but needed
  for `orderedStays`/`normalize` to be total functions).

- Task-file R2 says domain types must be `z.infer`-derived from `TripSchema`
  with "no hand-written parallel types." TechSpec's own Core Interfaces code
  block, however, defines `BookingItem`/`Stay`/`Trip`/`ItemStatus`/`ItemKind`
  as hand-written TS interfaces/types living in `data/trip.ts` (not
  `z.infer<>`). Per Authority Precedence, the TechSpec's machine-checkable
  code beats the task file's paraphrase — implemented hand-written domain
  types in `trip.ts` matching the TechSpec block verbatim, with a separate
  lenient `RawTripSchema` (zod, `schema.ts`) for the raw JSON shape only.
  `loadTrip()` bridges raw → domain via `normalize()`.

## Learnings

- `npm create vite@latest .` fails non-interactively when the target
  directory isn't empty (repo already had CLAUDE.md/images/curso.md unrelated
  to this app) — scaffolded the Vite/TS/Vitest config files by hand instead
  of via the CLI to avoid touching those files.
- Writing a literal Unicode combining-diacritics range (`̀-ͯ`) into
  a file via the Bash/Edit tool pipeline is unreliable — escape sequences
  got silently converted to literal codepoints somewhere in the tool
  transport. Ended up writing the literal codepoints directly (functionally
  equivalent, verified via `codePointAt` inspection) rather than fighting the
  escape. If touching `src/data/slug.ts`'s `COMBINING_DIACRITICS` regex
  again, verify with a `codePointAt` check rather than trusting the visual
  diff.
- `tsc -b` (used by `npm run build`) type-checks `src/**/*.test.ts` too
  (tsconfig.app.json `include: ["src"]`), so test fixtures must satisfy the
  real domain types exactly (e.g. use `makeLodgingItem`/`makeTransferItem`,
  not bare `makeBookingItem`, for `Stay.lodging`/`Stay.transfer`).

## Files / Surfaces

- Scaffold: package.json, vite.config.ts, tsconfig*.json, index.html,
  src/main.tsx, src/App.tsx, src/test/setup.ts, .gitignore.
- Data layer: src/data/calendar.ts, src/data/schema.ts, src/data/slug.ts,
  src/data/trip.ts, src/data/derive.ts.
- Test fixtures: src/test/fixtures.ts.
- Tests (11 files, 66 tests, all 58 assigned UT IDs covered exactly once):
  src/data/calendar.test.ts, derive.ordering.test.ts, derive.countdown.test.ts,
  derive.routemap.test.ts, derive.totals.test.ts, derive.itinerary.test.ts,
  derive.items.test.ts, derive.stayheader.test.ts, trip.lodging.test.ts,
  trip.transfer.test.ts, trip.loadTrip.test.ts.

## Errors / Corrections

- Initial `assignSlugs` symmetric-suffix logic broke the "explicit duplicate
  slug" case (both entries got suffixed instead of just the second) —
  fixed by keying the symmetric-suffix rule off repeated `name`, not off the
  final candidate slug (see Important Decisions).
- Initial `derive.items.test.ts`/`derive.totals.test.ts` fixtures used
  `makeBookingItem` for `Stay.lodging`/`transfer` entries, which fails
  `tsc -b` (LodgingItem/TransferItem require extra fields) even though
  Vitest alone didn't catch it (Vitest doesn't type-check by default) —
  always run `npm run build` too, not just `vitest run`.

## Ready for Next Run

- task_02 (app shell + shared components) can rely on: `loadTrip()`,
  `TripProvider`-ready `LoadResult`/`Trip`/`Stay`/`BookingItem` types, and all
  derivations exported from `src/data/derive.ts`. No UI exists yet beyond a
  placeholder `App.tsx`.
- `public/viagem.json` (task_04) must satisfy `RawTripSchema` shape in
  src/data/schema.ts (pt-BR keys for destino-nested items, English keys for
  top-level + generalItems — see the JSON example in `_techspec.md`).
- No seed data or actual UI built in this task, per scope.
