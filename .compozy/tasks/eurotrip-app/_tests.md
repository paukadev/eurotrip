# Test Specification: Eurotrip — App de Controle da Viagem

Canonical test contract for the euro trip control app. Companion to
[_techspec.md](_techspec.md). Derived from [_user_stories.md](_user_stories.md)
(behavior) and the TechSpec (components).

## Strategy

- **Frameworks and harnesses**: Vitest + React Testing Library for unit and component
  tests; Playwright for end-to-end against the built static site. The only I/O boundary is
  `fetch(viagem.json)`; fakes stub it with fixture JSON strings. Pure derivations take
  plain objects — no faking.
- **Execution**: `vitest run` for unit/integration (jsdom env); `playwright test` runs the
  Vite preview build with fixture `viagem.json` variants served as static assets.
- **Conventions**: table-driven unit cases where inputs vary over one behavior; fixtures
  named by intent (`valid`, `malformed`, `empty`, `missing-name`, `bad-dates`,
  `multi-currency`, `repeated-cities`); each case asserts exactly one observable behavior.

## Coverage Matrix

| Source | Behavior | Unit | Integration | E2E |
|--------|----------|------|-------------|-----|
| US-001 | Timeline ordenada com datas | UT-001, UT-002 | IT-001 | E2E-001 |
| US-001.EC-1 | Sem destinos → estado vazio | UT-003 | IT-002 | — |
| US-001.EC-2 | inicioData iguais → ordem estável | UT-004 | — | — |
| US-001.EC-3 | Datas sobrepostas → sinalizado | UT-005 | — | — |
| US-001.EC-4 | 100+ destinos navegável | UT-006 | — | E2E-009 |
| US-002 | Contagem regressiva | UT-010, UT-011 | — | E2E-002 |
| US-002.EC-1 | Após o fim → "concluída" | UT-012 | — | — |
| US-002.EC-2 | Começa hoje → "começa hoje" | UT-013 | — | — |
| US-002.EC-3 | Sem datas válidas → sem "NaN" | UT-014 | — | — |
| US-002.EC-4 | Fuso não desloca ±1 dia | UT-015 | — | — |
| US-003 | Mapa SVG com rota | UT-020 | — | E2E-003 |
| US-003.EC-1 | Destino sem coord omitido do mapa | UT-021 | — | — |
| US-003.EC-2 | Nenhuma coord → mapa vazio | UT-022 | — | — |
| US-003.EC-3 | Coord fora de faixa → tratada como ausente | UT-023 | — | — |
| US-004 | Consolidado comprado×pendente | UT-030, UT-031 | IT-003 | E2E-004 |
| US-004.EC-1 | Sem itens → 0/0 sem NaN | UT-032 | — | — |
| US-004.EC-2 | Moedas distintas não somadas | UT-033 | — | — |
| US-004.EC-3 | Valor inválido ignorado na soma | UT-034 | — | — |
| US-004.EC-4 | Todos comprados → 100% | UT-035 | — | — |
| US-005 | Navegar home→destino | — | IT-004 | E2E-001 |
| US-005.EC-1 | Destino inexistente → mensagem | UT-040 | IT-005 | E2E-006 |
| US-006 | Cabeçalho datas/duração | UT-041 | — | E2E-001 |
| US-006.EC-1 | Datas invertidas → aviso | UT-042 | — | — |
| US-006.EC-2 | Datas ausentes → "a definir" | UT-043 | — | — |
| US-006.EC-3 | Primeiro/último sem prev/next | UT-044 | IT-006 | — |
| US-007 | Hospedagem exibida | UT-050 | — | E2E-001 |
| US-007.EC-1 | Sem hospedagem → "a definir" | UT-051 | — | — |
| US-007.EC-2 | Múltiplas hospedagens | UT-052 | — | — |
| US-007.EC-3 | Checkout<checkin → aviso | UT-053 | — | — |
| US-008 | Translado exibido | UT-060 | — | — |
| US-008.EC-1 | Último destino sem saída | UT-061 | — | — |
| US-008.EC-2 | Translado sem horário | UT-062 | — | — |
| US-008.EC-3 | Chegada ≠ próximo destino | UT-063 | — | — |
| US-009 | Roteiro por dia/horário | UT-070, UT-071 | — | E2E-005 |
| US-009.EC-1 | Atividade fora do período | UT-072 | — | — |
| US-009.EC-2 | Mesmo horário → ambas | UT-073 | — | — |
| US-009.EC-3 | Sem horário → faixa própria | UT-074 | — | — |
| US-009.EC-4 | Estadia de 1 dia | UT-075 | — | — |
| US-010 | Status/valor por item | UT-080 | — | E2E-004 |
| US-010.EC-1 | Status inesperado → pendente | UT-081 | — | — |
| US-010.EC-2 | Status ausente → pendente | UT-082 | — | — |
| US-011 | Itens gerais exibidos | UT-090 | IT-003 | E2E-004 |
| US-011.EC-1 | Sem itens gerais → seção omitida | UT-091 | — | — |
| US-011.EC-2 | Item geral não contado 2x | UT-092 | — | — |
| US-012 | Editar JSON reflete no app | — | IT-007 | E2E-007 |
| US-012.EC-1 | Campo extra ignorado | UT-100 | — | — |
| US-012.EC-2 | Ordem do arquivo ≠ cronológica | UT-004 | — | — |
| US-013 | JSON inválido → mensagem legível | UT-101 | IT-008 | E2E-006 |
| US-013.EC-1 | Arquivo ausente/404 | UT-102 | IT-009 | — |
| US-013.EC-2 | JSON vazio → estado vazio | UT-103 | IT-002 | — |
| US-013.EC-3 | Data não reconhecida → sem Invalid Date | UT-104 | — | — |
| US-014 | Deep link para destino | — | IT-010 | E2E-008 |
| US-014.EC-1 | Refresh em rota resolve | — | — | E2E-008 |
| US-014.EC-2 | Slug com acento estável | UT-110 | — | — |
| US-015 | Publicar em host estático | — | — | E2E-010 |
| US-015.EC-1 | Responsivo no celular | — | — | E2E-011 |
| US-015.EC-2 | Offline não abre (esperado) | — | — | E2E-011 |
| US-015.EC-3 | Sem dado sensível (orientação) | — | — | — (doc/lint only) |
| loadTrip (TechSpec) | fetch+parse+normalize | UT-100–UT-104, UT-110, UT-120–UT-124 | IT-007–IT-009 | — |
| TripSchema (zod) | validação/defaults | UT-082, UT-100, UT-120, UT-121 | — | — |
| Derivations | funções puras | UT-001–UT-075, UT-080–UT-092 | — | — |
| TripProvider | estados carregando/erro/vazio | — | IT-002, IT-008, IT-009 | — |
| Routing (hash) | slug→página, 404 | UT-110 | IT-010, IT-005 | E2E-008 |

## Unit Tests

### Derivations — ordering & slugs (TechSpec: Implementation Design → derive)

- **UT-001** (happy): `orderedStays` — given 3 stays with dates out of order, returns them
  sorted ascending by `inicioData`.
- **UT-002** (happy): `tripDuration` — first `inicioData` 2026-12-20, last `fimData`
  2027-01-05, returns 17 days.
- **UT-003** (boundary): `orderedStays` — given `stays: []`, returns `[]` (drives empty
  state).
- **UT-004** (ordering): `orderedStays` — two stays with equal `inicioData`, returns them
  in original file order (stable tie-break); also covers US-012.EC-2.
- **UT-005** (state): overlap detector — stay A `fimData` after stay B `inicioData`, flags
  `overlap: true` without dropping either.
- **UT-006** (boundary): `orderedStays` — 120 stays sort correctly and return all 120.
- **UT-110** (happy): `assignSlugs` — `["Viena","Bratislava","Viena"]` → `["viena-1",
  "bratislava","viena-2"]`; "Cracóvia" → `cracovia` (US-014.EC-2). Explicit duplicate
  slug in input gets a deterministic suffix + warning.
- **UT-040** (error): `findStayBySlug` — given a trip and an unknown slug `"lisboa"`,
  returns `undefined` (drives the "destino não encontrado" message); given `"viena-2"`,
  returns that stay (US-005.EC-1).

### Derivations — countdown (TechSpec: derive → countdownState)

- **UT-010** (happy): today 2026-12-01, start 2026-12-20 → `{phase:"before", days:19}`.
- **UT-011** (happy): today between start/end → `{phase:"during", dayN, total}`.
- **UT-012** (state): today after last `fimData` → `{phase:"after"}` (US-002.EC-1).
- **UT-013** (boundary): today === start → `{phase:"before", days:0}` rendered as "começa
  hoje" (US-002.EC-2).
- **UT-014** (error): no stay has valid dates → `{phase:"unknown"}`, never `NaN`
  (US-002.EC-3).
- **UT-015** (boundary): device TZ = UTC-3, start 2026-12-20 near midnight → days computed
  on calendar date, no ±1 drift (US-002.EC-4).

### Derivations — route map projection (TechSpec: RouteMap, ADR-005)

- **UT-020** (happy): projects N coords into viewBox with padding; polyline points follow
  chronological order.
- **UT-021** (error): one stay without coords → omitted from points, others plotted,
  warning present (US-003.EC-1).
- **UT-022** (boundary): no stay has coords → returns empty geometry (drives empty map)
  (US-003.EC-2).
- **UT-023** (error): coord lat=120 → treated as absent + warning (US-003.EC-3).

### Derivations — consolidated totals (TechSpec: derive → consolidatedTotals)

- **UT-030** (happy): 5 bought + 3 pending across stays+general → counts `{bought:5,
  pending:3}`.
- **UT-031** (happy): mixed valued/unvalued → `valuedItems`/`totalItems` reflect how many
  entered sums (US-004.AC-3).
- **UT-032** (boundary): no items → `{bought:0, pending:0}`, no currency totals, no NaN
  (US-004.EC-1).
- **UT-033** (state): items in EUR and BRL → `byCurrency` keeps them separate; no mixed
  sum (US-004.EC-2).
- **UT-034** (error): item with `value:-10` or `value:"x"` → excluded from sums + warning;
  count unaffected (US-004.EC-3).
- **UT-035** (boundary): all items bought → `pending:0` (renders 100%) (US-004.EC-4).

### Derivations — itinerary grouping (TechSpec: derive → groupItineraryByDay)

- **UT-070** (happy): activities across 3 days → grouped per day, ordered by `horario`
  within each day.
- **UT-071** (happy): attraction activity carries `status`/`value` through grouping.
- **UT-072** (state): activity dated outside start..end → placed in `outOfRange` group +
  warning, not dropped (US-009.EC-1).
- **UT-073** (ordering): two activities same `horario` → both retained, stable order
  (US-009.EC-2).
- **UT-074** (boundary): activity without `horario` → "sem horário" bucket within its day
  (US-009.EC-3).
- **UT-075** (boundary): 1-day stay → single day group, no crash (US-009.EC-4).

### Derivations — item collection (TechSpec: derive → collectItems)

- **UT-080** (happy): `collectItems` returns lodging+transfer+attraction items with
  status/value for a stay.
- **UT-081** (error): item `status:"talvez"` → normalized to `pendente` + warning
  (US-010.EC-1).
- **UT-082** (boundary): item without `status` → defaults `pendente` (US-010.EC-2).
- **UT-090** (happy): general items included in `collectItems(trip)` for the home
  (US-011.AC-1).
- **UT-091** (boundary): no general items → section input empty (omitted) (US-011.EC-1).
- **UT-092** (idempotency): a general item that also references a stay counted once
  (US-011.EC-2).

### Stay-page derivations (TechSpec: StayHeader/Lodging/Transfer)

- **UT-041** (happy): `StayHeader` data — name/start/end → duration in days/nights.
- **UT-042** (error): `inicioData` > `fimData` → `inconsistent:true` (aviso), still
  renders available data (US-006.EC-1).
- **UT-043** (boundary): missing dates → "a definir", no Invalid Date (US-006.EC-2).
- **UT-044** (boundary): first stay has no prev, last has no next (US-006.EC-3).
- **UT-050** (happy): lodging maps nome/endereco/checkin/checkout/status/value.
- **UT-051** (boundary): stay with no lodging → "a definir"; not counted as an item
  (US-007.EC-1).
- **UT-052** (happy): two lodgings → both returned, each with own status (US-007.EC-2).
- **UT-053** (error): checkout < checkin → `inconsistent` flag (US-007.EC-3).
- **UT-060** (happy): transfer maps modo/horario/chegada/status/value.
- **UT-061** (boundary): last stay → no outbound transfer (or return leg if present)
  (US-008.EC-1).
- **UT-062** (boundary): transfer without `horario` → "a definir", status still present
  (US-008.EC-2).
- **UT-063** (state): transfer `chegada` ≠ next stay name → rendered as-is, no crash
  (US-008.EC-3).

### loadTrip / schema (TechSpec: loadTrip, TripSchema)

- **UT-100** (happy): unknown extra field in JSON → ignored, parse succeeds (US-012.EC-1).
- **UT-101** (error): syntactically invalid JSON string → `{ok:false, error}` fatal, no
  throw (US-013).
- **UT-102** (error): fetch rejects / 404 → `{ok:false, error}` "dados não encontrados"
  (US-013.EC-1).
- **UT-103** (boundary): body `[]`/`{}` → `{ok:true}` with empty `stays` (empty state, not
  error) (US-013.EC-2).
- **UT-104** (error): `inicioData:"32/13/2026"` → date treated as absent + warning, no
  "Invalid Date" string (US-013.EC-3).
- **UT-120** (error): stay missing `name` → excluded from `stays` + warning; valid stays
  retained (US-013.AC-2).
- **UT-121** (happy): `status` default + unknown-field tolerance applied during
  `TripSchema` parse.
- **UT-122** (happy): slugs assigned during normalization are unique across all stays.
- **UT-123** (happy): stays returned already chronologically ordered from `loadTrip`.
- **UT-124** (error): value `-5`/non-numeric normalized out of sums at load, warning
  attached to item.

## Integration Tests

### Data layer + Provider (TechSpec: loadTrip + TripProvider)

- **IT-001**: `loadTrip` (fixture `repeated-cities`) → `HomePage` renders 8 stays in
  chronological order with dates (US-001).
- **IT-002**: fixture `empty` → `TripProvider` renders the empty state, not an error, on
  home (US-001.EC-1 / US-013.EC-2).
- **IT-003**: fixture with stay items + general items → `ConsolidatedChecklist` shows
  combined bought/pending counts and per-currency totals (US-004, US-011).
- **IT-008**: fixture `malformed` → `TripProvider` renders the legible "não foi possível
  ler os dados" message, no white screen (US-013).
- **IT-009**: `fetch` stubbed to 404 → root renders "dados não encontrados" with guidance
  (US-013.EC-1).

### Routing (TechSpec: hash routing)

- **IT-004**: click a timeline item on `HomePage` → `DestinationPage` for that slug renders
  (US-005).
- **IT-005**: navigate to unknown slug → `NotFoundPage` with link home (US-005.EC-1).
- **IT-006**: on first stay page, no "anterior" control; on last, no "próximo" (US-006.EC-3).
- **IT-007**: swap fixture (add a stay, flip an item to `comprado`) then re-mount →
  home reflects the new stay and updated consolidation (US-012).
- **IT-010**: mount app at hash route `/#/destino/viena-2` directly → that stay renders
  without visiting home (US-014).

## End-to-End Tests

### Home overview & navigation (US-001, US-005, US-006, US-007)

- **E2E-001**: load site → home shows the stay timeline with dates → click "Praga" → stay
  page shows header/duration, lodging, and itinerary → back returns to home.

### Countdown (US-002)

- **E2E-002**: with a fixture start date in the future, home shows "faltam X dias".

### Route map (US-003)

- **E2E-003**: home renders the SVG route map with a marker per coord-bearing city; click a
  marker → its stay page opens.

### Bought vs pending (US-004, US-010, US-011)

- **E2E-004**: home shows bought/pending counts and per-currency totals including general
  items; a pending item on a stay page shows the pending badge.

### Itinerary by day (US-009)

- **E2E-005**: open a multi-day stay → activities appear grouped by day and ordered by
  time; an empty day shows "livre".

### Malformed data (US-005.EC-1, US-013)

- **E2E-006**: serve a malformed `viagem.json` → app shows the legible data-error message,
  not a blank page; unknown-slug URL shows "destino não encontrado".

### Data update (US-012)

- **E2E-007**: replace `viagem.json` (new stay + an item marked comprado) and reload → the
  new stay appears and the home consolidation updates.

### Deep link + refresh (US-014)

- **E2E-008**: navigate directly to `/#/destino/viena-1`, then refresh (F5) → the stay page
  loads both times without a host 404.

### Scale (US-001.EC-4)

- **E2E-009**: fixture with 100+ stays → timeline scrolls and remains navigable without
  horizontal overflow.

### Deploy & responsiveness (US-015)

- **E2E-010**: production build served as static files loads the home over HTTP with no
  backend.
- **E2E-011**: at a 375px-wide viewport the home and a stay page are readable with no
  horizontal scroll (US-015.EC-1); offline load failure is the documented expected
  behavior, not asserted as success (US-015.EC-2).
