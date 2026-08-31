# TechSpec: Eurotrip — App de Controle da Viagem

Companion to [_prd.md](_prd.md) and [_user_stories.md](_user_stories.md). Language of
implementation artifacts: TypeScript; UI copy in Portuguese.

## Executive Summary

A static, read-only React SPA (Vite + TypeScript) renders a year-end euro trip from a
single hand-edited `public/viagem.json`. There is no backend and no in-app editing
(PRD → ADR-001/ADR-002): the app fetches the JSON at runtime, validates and normalizes it
with a single `zod` schema, and renders a home overview plus one route per stay. The
route map is an inline SVG projection of city coordinates (ADR-005), avoiding any map
library or network tiles. Repeated cities (Berlin start/end, Vienna twice) are modeled as
distinct stay entries with unique slugs (ADR-006).

The primary trade-offs: hash-based routing (`/#/destino/:slug`) is chosen over clean URLs
so deep links and refresh work on any free static host with zero rewrite config
(ADR-004); the `zod` layer is the single source of types, validation, defaults, and the
legible error messages required by US-013; and a "booking item" is a unifying concept so
the home's bought-vs-pending totals derive from the same items shown on stay pages
(ADR-003), never a separate tally.

## System Architecture

### Component Overview

Data layer:

- **`loadTrip()` (data loader)** — fetches `viagem.json`, parses via `TripSchema`,
  normalizes (defaults, slug assignment, chronological ordering, coordinate/date
  validation), and returns a `LoadResult` (either a normalized `Trip` with collected
  warnings, or a fatal load error). Sole entry point for data. Feeds everything.
- **`TripSchema` (zod)** — schema + inferred types; enforces required `name`, coerces
  dates, defaults `status` to `pendente`, tolerates unknown fields.
- **Derivations (pure functions)** — `orderedStays`, `assignSlugs`, `tripDuration`,
  `countdownState`, `groupItineraryByDay`, `collectItems`, `consolidatedTotals`. Pure,
  unit-testable, no I/O.

UI layer (React):

- **`TripProvider` / `useTrip`** — React Context holding the single `LoadResult`; renders
  loading, fatal-error, and empty states once at the root.
- **`HomePage`** — composes `CountdownBanner`, `Timeline`, `RouteMap`,
  `ConsolidatedChecklist`, and `GeneralItems`.
- **`DestinationPage`** — resolves `:slug` to a stay; composes `StayHeader`,
  `LodgingSection`, `TransferSection`, `ItineraryByDay`, and prev/next navigation.
- **Shared** — `ItemStatusBadge` (bought/pending, not color-only), `MoneyAmount`
  (value+currency or nothing), `WarningNotice` (renders normalization warnings),
  `EmptyState`, `NotFoundPage`.

### Data flow

`viagem.json` → `loadTrip()` → `TripProvider` (Context) → `HomePage` / `DestinationPage`
→ derivation functions → presentational components. One fetch per app load; no writes.

### External system interactions

None. Fully self-contained static assets; no APIs, no map tiles, no auth.

## Implementation Design

### Core Interfaces

```typescript
// data/trip.ts — the primary type every UI component depends on.
export type ItemStatus = "comprado" | "pendente";
export type ItemKind = "translado" | "hospedagem" | "atracao";

export interface BookingItem {
  id: string;               // stable, derived if absent
  kind: ItemKind;
  title: string;
  status: ItemStatus;       // defaults to "pendente"
  value?: number;           // omitted when unknown; never coerced to 0
  currency?: string;        // e.g. "EUR" | "BRL"; no cross-currency summing
  warnings: string[];       // per-item normalization notes
}

export interface Stay {
  slug: string;             // unique per stay: "viena-1", "viena-2"
  name: string;             // display city, e.g. "Viena"
  label?: string;           // optional "1ª parte"
  startDate?: CalendarDate; // undefined when unparseable → "a definir"
  endDate?: CalendarDate;
  coords?: { lat: number; lon: number };
  lodging: BookingItem[];
  transfer: BookingItem[];  // departure toward the next stay
  itinerary: Activity[];    // attractions carry status/value
}

export interface Trip {
  title: string;
  origin: string;           // "GRU"
  stays: Stay[];            // chronological
  generalItems: BookingItem[];
}

export type LoadResult =
  | { ok: true; trip: Trip; warnings: string[] }
  | { ok: false; error: LoadError }; // fatal: fetch/404/JSON-syntax/empty

export async function loadTrip(url?: string): Promise<LoadResult>;
```

```typescript
// data/derive.ts — pure derivations consumed by the UI.
export function countdownState(trip: Trip, today: CalendarDate):
  | { phase: "before"; days: number }      // "faltam X dias"; today===start → days 0
  | { phase: "during"; dayN: number; total: number }
  | { phase: "after" }
  | { phase: "unknown" };                   // no valid dates → no "NaN"

export function consolidatedTotals(trip: Trip): {
  bought: number; pending: number;          // counts across stays + general
  byCurrency: Record<string, { bought: number; pending: number }>;
  valuedItems: number; totalItems: number;  // "considera N de M com valor"
};

export function groupItineraryByDay(stay: Stay): Array<{
  date?: CalendarDate; label: string;       // "Dia N"; empty day → "livre"
  activities: Activity[];                    // ordered by time; "sem horário" bucket
  outOfRange: boolean;                       // activity outside start..end
}>;
```

### Data Models

`CalendarDate` is a timezone-safe calendar value (year/month/day; parsed from
`YYYY-MM-DD` at UTC midnight) so the countdown never drifts ±1 day (US-002.EC-4).

`viagem.json` shape (hand-edited):

```jsonc
{
  "title": "Eurotrip 2026/2027",
  "origin": "GRU",
  "generalItems": [
    { "kind": "translado", "title": "Voo GRU⇄Berlin", "status": "pendente", "value": 6200, "currency": "BRL" }
  ],
  "destinos": [
    {
      "name": "Viena", "label": "1ª parte",
      "inicioData": "2026-12-28", "fimData": "2026-12-30",
      "coordenadas": { "lat": 48.2082, "lon": 16.3738 },
      "hospedagens": [ { "nome": "Hotel X", "endereco": "...", "checkin": "2026-12-28", "checkout": "2026-12-30", "status": "comprado", "valor": 240, "moeda": "EUR" } ],
      "translados": [ { "modo": "trem", "chegada": "Bratislava", "horario": "2026-12-30T09:15", "status": "pendente" } ],
      "roteiro": [ { "data": "2026-12-29", "horario": "10:00", "titulo": "Schönbrunn", "tipo": "atracao", "status": "pendente", "valor": 26, "moeda": "EUR" } ]
    }
  ]
}
```

Normalization rules (enforced in `loadTrip`, per PRD Business Rules): required `name`;
`status` default `pendente`; unknown `status` → `pendente` + warning; non-numeric/negative
`value` → dropped from sums + warning; out-of-range coords → treated as absent + warning;
unparseable dates → absent + warning; unknown fields ignored; stays ordered by
`inicioData` with file-order tie-break; slugs assigned uniquely with chronological
suffixes on collision (ADR-006).

### API Endpoints

None. The only network read is `GET /viagem.json` (a static asset). Documented failure
shapes handled by `loadTrip`: 404/network → fatal `LoadError`; invalid JSON syntax →
fatal `LoadError`; valid-but-empty (`[]`/`{}`) → non-fatal empty state.

## Integration Points

None — no external services. (Section retained per template; intentionally empty.)

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|----------------------|-----------------|
| Project scaffold (Vite+TS+React) | new | Greenfield repo; no existing code. Low risk. | Init Vite React-TS, `react-router`, `zod`, CSS Modules |
| `public/viagem.json` + seed data | new | Hand-edited data source; malformed JSON risk. | Author seed with the 8 stays; document schema |
| `data/` (loader, schema, derivations) | new | Core logic; correctness-critical. | Implement with full unit coverage |
| Routing (hash) + SPA shell | new | Deep-link/refresh must work on static host. | Configure `HashRouter`; slug route |
| UI components (home + destination) | new | Presentational; depends on data layer. | Build after data layer |
| Deploy config | new | Free static host (Pages/Vercel/Netlify). | Add build script + host config |

## Testing Approach

- **Frameworks**: Vitest + React Testing Library (unit/component); Playwright (e2e against
  the built static site). Fakes only at the I/O boundary — the sole boundary is `fetch`,
  stubbed with fixture JSON strings (valid, malformed, empty, partial, multi-currency).
- **Unit**: every derivation and normalization branch, including all error/warning paths
  in `loadTrip` (missing `name`, bad dates, bad values, out-of-range coords, unknown
  status, slug collisions, ordering ties).
- **Integration**: `loadTrip` + `TripProvider` wiring — a fixture JSON drives the rendered
  loading/error/empty/partial states; slug resolution to `DestinationPage`.
- **E2E**: the user journeys from `_user_stories.md` through the built UI (home overview,
  navigate to a stay, deep link + refresh, bought-vs-pending consolidation, malformed-data
  message). Data dependency: fixture `viagem.json` variants served as static assets.

## Development Sequencing

### Build Order

1. Scaffold Vite + React + TS, add `react-router`, `zod`, CSS Modules — no deps.
2. `CalendarDate` helpers + `TripSchema` (zod) — depends on 1.
3. `loadTrip()` normalization (slugs, ordering, defaults, warnings) — depends on 2.
4. Pure derivations (`countdownState`, `consolidatedTotals`, `groupItineraryByDay`, …) —
   depends on 2.
5. `TripProvider`/`useTrip` + root loading/error/empty states — depends on 3.
6. `HomePage` + subcomponents (Timeline, RouteMap SVG, Countdown, Consolidated, General) —
   depends on 4/5.
7. `DestinationPage` + subcomponents + prev/next + `NotFoundPage` — depends on 4/5.
8. Seed `viagem.json` (8 stays) + deploy config — depends on 3.

### Technical Dependencies

- Node/npm toolchain for Vite. No external services, keys, or infrastructure to provision.

## Monitoring and Observability

Not applicable — static client-only app with no server. Operational visibility is limited
to build-time output and browser console warnings emitted by `loadTrip` for normalization
issues (the same warnings surfaced in-UI via `WarningNotice`).

## Technical Considerations

### Key Decisions

- **Decision**: Runtime `fetch` + `zod` over build-time JSON import. **Rationale**: single
  source for types, validation, defaults, and US-013 runtime error UX; swap data without
  a full rebuild. **Trade-off**: loading/error states to handle. **Rejected**: build-time
  import + manual types (no runtime message; type drift).
- **Decision**: Hash routing. **Rationale**: deep link + refresh on any static host, zero
  config (US-014.EC-1). **Trade-off**: `/#/` URLs. **Rejected**: history routing (per-host
  rewrite config).
- **Decision**: Inline SVG route map (ADR-005). **Rationale**: self-contained, no tiles/
  keys, adapts to new cities via coordinates. **Trade-off**: schematic, not a real map.
- **Decision**: Distinct stay entries + unique slugs (ADR-006). **Rationale**: chronological
  timeline and per-stay deep links. **Trade-off**: light JSON duplication for repeats.

### Known Risks

- **Hand-edited JSON errors** (likely). Mitigation: `zod` fatal vs. warning split, partial
  rendering, legible messages (US-013).
- **Multi-currency totals** (medium). Mitigation: sum per currency only; never mix; show
  "N of M valued" (US-004.EC-2/AC-3). Conversion remains a PRD Open Question / Non-Goal.
- **Public URL exposes data** (low). Mitigation: PRD rule — no sensitive data in JSON
  (US-015.EC-3); visibility left as PRD Open Question.

## Architecture Decision Records

- [ADR-001: Dados em JSON editados à mão, app somente-leitura](adrs/adr-001.md)
- [ADR-002: Web app estático em hospedagem gratuita, sem backend](adrs/adr-002.md)
- [ADR-003: Modelo unificado de "item reservável" com status e valor opcional](adrs/adr-003.md)
- [ADR-004: React + Vite + TypeScript, hash routing, JSON validado com zod](adrs/adr-004.md)
- [ADR-005: Mapa do roteiro como SVG estático, sem biblioteca de mapa](adrs/adr-005.md)
- [ADR-006: Cidades repetidas como estadias distintas com slug único](adrs/adr-006.md)
