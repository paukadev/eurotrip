# Seção de câmbio na home — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar à home uma seção que mostra as cotações de EUR, PLN, CZK e HUF em reais, com histórico em gráfico e um indicador de quão barato está o dia de hoje.

**Architecture:** Uma chamada à API Frankfurter (BCE) traz 180 dias das quatro moedas; `exchange.ts` cuida de rede, validação e cache de 12h no `localStorage`; `exchangeStats.ts` contém só funções puras de estatística e formatação; `ExchangeSection.tsx` monta a interface e `RateChart.tsx` desenha o SVG. A seção é independente do `viagem.json` e nunca derruba a home.

**Tech Stack:** React 18, TypeScript, Vite, zod, CSS Modules, Vitest + Testing Library. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-09-11-cambio-design.md`

## Global Constraints

- **Nenhuma dependência nova.** Gráfico em SVG inline, como `RouteMap.tsx` já faz (ADR-005).
- **Site estático, sem backend** (ADR-002): a API é chamada direta do navegador.
- **Endpoint:** `https://api.frankfurter.dev/v1/{YYYY-MM-DD}..?base=BRL&symbols=EUR,PLN,HUF,CZK`, sem chave.
- **Cache:** `localStorage`, chave `eurotrip:rates:v1`, validade 12h. Toda leitura e escrita dentro de `try/catch`.
- **Cores:** só tokens do `src/index.css`. "Bom momento" usa `--accent`, "Na média" usa `--text-3`, "Caro" usa `--warn`. Nunca verde nem vermelho.
- **Textos da interface em português**, como o resto do site.
- **Datas** no formato `YYYY-MM-DD` como string nos dados, convertidas com `parseCalendarDate` de `src/data/calendar.ts`. Nunca usar `new Date("...")` direto.
- **Testes:** Vitest, arquivo `*.test.ts(x)` ao lado do código, no padrão dos existentes. Rodar com `npx vitest run <arquivo>`.
- **Commits** em português, no padrão do repositório (assunto curto no imperativo).

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/data/exchangeStats.ts` | Funções puras: metadados das moedas, inversão para reais, recorte de período, estatísticas, selo e formatação. Sem rede, sem React. |
| `src/data/exchangeStats.test.ts` | Testes das funções puras. |
| `src/data/exchange.ts` | `fetch` da Frankfurter, validação zod, cache de 12h. Sem React. |
| `src/data/exchange.test.ts` | Testes de rede e cache com mocks. |
| `src/components/home/RateChart.tsx` | Só o SVG do gráfico, a partir de pontos já calculados. |
| `src/components/home/RateChart.module.css` | Estilos do gráfico. |
| `src/components/home/RateChart.test.tsx` | Testes do gráfico. |
| `src/components/home/ExchangeSection.tsx` | Estado de moeda/período, textos, selo, estados de carregando e erro. |
| `src/components/home/ExchangeSection.module.css` | Estilos da seção. |
| `src/components/home/ExchangeSection.test.tsx` | Testes da seção. |
| `src/test/fetchStub.ts` | Helper de teste que responde ao `fetch` conforme a URL. |
| `src/pages/HomePage.tsx` | Modificado: inclui a seção depois do Roteiro e deixa de renderizar o `RouteMap`. |
| `src/pages/HomePage.test.tsx` | Modificado: passa a usar o helper novo. |
| `e2e/helpers.ts` | Modificado: ganha o mock das cotações. |
| `e2e/home-destination.spec.ts` | Modificado: E2E-003 (mapa) marcado como `skip`. |

Dependências entre tarefas: 1 → 2 → 3 → 4 → 5. Cada uma termina com testes verdes e um commit.

---

### Task 1: Funções puras de estatística (`exchangeStats.ts`)

**Files:**

- Create: `src/data/exchangeStats.ts`
- Test: `src/data/exchangeStats.test.ts`

**Interfaces:**

- Consumes: `parseCalendarDate`, `diffInDays` de `src/data/calendar.ts`.
- Produces:
  - `type CurrencyCode = "EUR" | "PLN" | "CZK" | "HUF"`
  - `interface CurrencyMeta { code: CurrencyCode; label: string; name: string; unit: number; decimals: number }`
  - `const CURRENCIES: CurrencyMeta[]`
  - `interface RawPoint { date: string; perBrl: number }`
  - `interface SeriesPoint { date: string; value: number }`
  - `function toBrlSeries(points: RawPoint[], unit: number): SeriesPoint[]`
  - `function sliceByDays(points: SeriesPoint[], days: number): SeriesPoint[]`
  - `type Verdict = "bom" | "media" | "caro"`
  - `interface Summary { current: SeriesPoint; min: SeriesPoint; max: SeriesPoint; average: number; diffFromAverage: number; cheaperShare: number; verdict?: Verdict; dayCount: number }`
  - `function summarize(points: SeriesPoint[]): Summary | undefined`
  - `function formatBrl(value: number, decimals: number): string`
  - `function formatPercent(fraction: number): string`
  - `function formatShortDate(date: string): string`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/data/exchangeStats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CURRENCIES,
  formatBrl,
  formatPercent,
  formatShortDate,
  sliceByDays,
  summarize,
  toBrlSeries,
  type SeriesPoint,
} from "./exchangeStats";

function series(values: Array<[string, number]>): SeriesPoint[] {
  return values.map(([date, value]) => ({ date, value }));
}

describe("toBrlSeries", () => {
  it("inverte moeda-por-real em reais-por-unidade", () => {
    const result = toBrlSeries([{ date: "2026-09-11", perBrl: 0.16879 }], 1);
    expect(result[0].value).toBeCloseTo(5.9245, 3);
  });

  it("aplica a unidade de exibição de 100 para o florim", () => {
    const result = toBrlSeries([{ date: "2026-09-11", perBrl: 61.517 }], 100);
    expect(result[0].value).toBeCloseTo(1.6256, 3);
  });

  it("descarta dias com cotação zero, negativa ou não finita", () => {
    const result = toBrlSeries(
      [
        { date: "2026-09-10", perBrl: 0 },
        { date: "2026-09-11", perBrl: -1 },
        { date: "2026-09-14", perBrl: Number.NaN },
        { date: "2026-09-15", perBrl: 0.17 },
      ],
      1,
    );
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-09-15");
  });
});

describe("sliceByDays", () => {
  const points = series([
    ["2026-06-15", 6.0],
    ["2026-08-14", 6.1],
    ["2026-09-04", 5.9],
    ["2026-09-11", 5.92],
  ]);

  it("mantém apenas os dias dentro da janela, contada a partir do último dia", () => {
    expect(sliceByDays(points, 30).map((p) => p.date)).toEqual(["2026-08-14", "2026-09-04", "2026-09-11"]);
  });

  it("devolve toda a série quando a janela é maior que os dados", () => {
    expect(sliceByDays(points, 180)).toHaveLength(4);
  });

  it("devolve vazio para série vazia", () => {
    expect(sliceByDays([], 90)).toEqual([]);
  });
});

describe("summarize", () => {
  it("calcula mínima, máxima, média e diferença para a média", () => {
    const result = summarize(series([
      ["2026-09-08", 6.0],
      ["2026-09-09", 6.2],
      ["2026-09-10", 5.8],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.min.value).toBe(5.8);
    expect(result?.min.date).toBe("2026-09-10");
    expect(result?.max.value).toBe(6.2);
    expect(result?.average).toBeCloseTo(6.0, 5);
    expect(result?.current.date).toBe("2026-09-11");
    expect(result?.diffFromAverage).toBeCloseTo(0, 5);
    expect(result?.dayCount).toBe(4);
  });

  it("dá selo 'bom' quando hoje está entre os 25% mais baratos (limite 0,75)", () => {
    const result = summarize(series([
      ["2026-09-08", 6.1],
      ["2026-09-09", 6.2],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.75, 5);
    expect(result?.verdict).toBe("bom");
  });

  it("dá selo 'caro' no limite de 0,25", () => {
    const result = summarize(series([
      ["2026-09-08", 5.8],
      ["2026-09-09", 5.9],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.25, 5);
    expect(result?.verdict).toBe("caro");
  });

  it("dá selo 'media' entre os dois limites", () => {
    const result = summarize(series([
      ["2026-09-08", 5.8],
      ["2026-09-09", 6.2],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.5, 5);
    expect(result?.verdict).toBe("media");
  });

  it("não dá selo quando há um único dia", () => {
    const result = summarize(series([["2026-09-11", 6.0]]));
    expect(result?.current.value).toBe(6.0);
    expect(result?.verdict).toBeUndefined();
    expect(result?.dayCount).toBe(1);
  });

  it("devolve undefined para série vazia", () => {
    expect(summarize([])).toBeUndefined();
  });
});

describe("formatação", () => {
  it("formata reais em pt-BR com as casas pedidas", () => {
    expect(formatBrl(5.9245, 2)).toBe("5,92");
    expect(formatBrl(0.2441, 3)).toBe("0,244");
  });

  it("formata porcentagem com uma casa e sem sinal", () => {
    expect(formatPercent(-0.0183)).toBe("1,8%");
    expect(formatPercent(0.0183)).toBe("1,8%");
  });

  it("formata data curta como dd/mm", () => {
    expect(formatShortDate("2026-08-06")).toBe("06/08");
  });

  it("devolve a string original quando a data é inválida", () => {
    expect(formatShortDate("não é data")).toBe("não é data");
  });
});

describe("CURRENCIES", () => {
  it("traz as quatro moedas do roteiro com o florim por 100 unidades", () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual(["EUR", "PLN", "CZK", "HUF"]);
    const huf = CURRENCIES.find((c) => c.code === "HUF");
    expect(huf?.unit).toBe(100);
    expect(CURRENCIES.find((c) => c.code === "CZK")?.decimals).toBe(3);
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/data/exchangeStats.test.ts`
Expected: FAIL — `Failed to resolve import "./exchangeStats"`.

- [ ] **Step 3: Implementar `exchangeStats.ts`**

Criar `src/data/exchangeStats.ts`:

```ts
import { diffInDays, parseCalendarDate } from "./calendar";

export type CurrencyCode = "EUR" | "PLN" | "CZK" | "HUF";

export interface CurrencyMeta {
  code: CurrencyCode;
  /** Rótulo curto da aba, já com a unidade de exibição. */
  label: string;
  /** Nome usado nas frases ("R$ 5,92 por euro"). */
  name: string;
  /** Quantas unidades da moeda o valor exibido representa. */
  unit: number;
  decimals: number;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "EUR", label: "€", name: "euro", unit: 1, decimals: 2 },
  { code: "PLN", label: "zł", name: "zloty", unit: 1, decimals: 2 },
  { code: "CZK", label: "Kč", name: "coroa tcheca", unit: 1, decimals: 3 },
  { code: "HUF", label: "100 Ft", name: "100 florins", unit: 100, decimals: 2 },
];

/** Como a API entrega: quantas unidades da moeda valem 1 real. */
export interface RawPoint {
  date: string; // YYYY-MM-DD
  perBrl: number;
}

/** Como a interface usa: quantos reais custa a unidade de exibição. */
export interface SeriesPoint {
  date: string;
  value: number;
}

export function toBrlSeries(points: RawPoint[], unit: number): SeriesPoint[] {
  return points
    .filter((point) => Number.isFinite(point.perBrl) && point.perBrl > 0)
    .map((point) => ({ date: point.date, value: unit / point.perBrl }));
}

/**
 * Recorta a janela de `days` dias corridos contados a partir do último dia da
 * série (não dos dias úteis, que são o que a série contém). Assume `points`
 * em ordem crescente de data.
 */
export function sliceByDays(points: SeriesPoint[], days: number): SeriesPoint[] {
  if (points.length === 0) return [];
  const last = parseCalendarDate(points[points.length - 1].date);
  if (!last) return [];
  return points.filter((point) => {
    const date = parseCalendarDate(point.date);
    return date !== undefined && diffInDays(date, last) < days;
  });
}

export type Verdict = "bom" | "media" | "caro";

export interface Summary {
  current: SeriesPoint;
  min: SeriesPoint;
  max: SeriesPoint;
  average: number;
  /** Fração: negativa quando hoje está abaixo da média. */
  diffFromAverage: number;
  /** Fração dos dias do período mais caros que hoje. */
  cheaperShare: number;
  /** Ausente quando há menos de dois dias para comparar. */
  verdict?: Verdict;
  dayCount: number;
}

function verdictOf(cheaperShare: number): Verdict {
  if (cheaperShare >= 0.75) return "bom";
  if (cheaperShare <= 0.25) return "caro";
  return "media";
}

export function summarize(points: SeriesPoint[]): Summary | undefined {
  if (points.length === 0) return undefined;

  const current = points[points.length - 1];
  let min = points[0];
  let max = points[0];
  let sum = 0;
  let moreExpensive = 0;

  for (const point of points) {
    if (point.value < min.value) min = point;
    if (point.value > max.value) max = point;
    sum += point.value;
    if (point.value > current.value) moreExpensive += 1;
  }

  const average = sum / points.length;
  const cheaperShare = moreExpensive / points.length;

  return {
    current,
    min,
    max,
    average,
    diffFromAverage: average === 0 ? 0 : (current.value - average) / average,
    cheaperShare,
    verdict: points.length < 2 ? undefined : verdictOf(cheaperShare),
    dayCount: points.length,
  };
}

const brlFormatters = new Map<number, Intl.NumberFormat>();

export function formatBrl(value: number, decimals: number): string {
  let formatter = brlFormatters.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    brlFormatters.set(decimals, formatter);
  }
  return formatter.format(value);
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Sempre em módulo: o sinal vira palavra ("abaixo"/"acima") na interface. */
export function formatPercent(fraction: number): string {
  return `${percentFormatter.format(Math.abs(fraction) * 100)}%`;
}

export function formatShortDate(date: string): string {
  const parsed = parseCalendarDate(date);
  if (!parsed) return date;
  const day = String(parsed.day).padStart(2, "0");
  const month = String(parsed.month).padStart(2, "0");
  return `${day}/${month}`;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/data/exchangeStats.test.ts`
Expected: PASS, 15 testes.

Se `formatBrl(5.9245, 2)` falhar por arredondamento, confira que o esperado é `"5,92"` — `Intl` arredonda para cima a partir de 5.925.

- [ ] **Step 5: Commit**

```bash
git add src/data/exchangeStats.ts src/data/exchangeStats.test.ts
git commit -m "Adiciona estatísticas de câmbio em funções puras"
```

---

### Task 2: Busca e cache das cotações (`exchange.ts`)

**Files:**

- Create: `src/data/exchange.ts`
- Test: `src/data/exchange.test.ts`

**Interfaces:**

- Consumes: `CurrencyCode`, `RawPoint` de `./exchangeStats`; `z` de `zod`.
- Produces:
  - `const RATES_API_HOST = "api.frankfurter.dev"`
  - `interface RatesSnapshot { series: Record<CurrencyCode, RawPoint[]>; lastDate: string; fetchedAt: number }`
  - `type RatesResult = { ok: true; snapshot: RatesSnapshot; stale: boolean } | { ok: false }`
  - `function loadRates(now?: number): Promise<RatesResult>`

`stale: true` significa "veio do cache porque a rede falhou".

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/data/exchange.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRates } from "./exchange";

const NOW = Date.UTC(2026, 8, 11, 12, 0, 0); // 2026-09-11
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function apiBody() {
  return JSON.stringify({
    amount: 1,
    base: "BRL",
    start_date: "2026-09-10",
    end_date: "2026-09-11",
    rates: {
      "2026-09-11": { CZK: 4.0956, EUR: 0.16879, HUF: 61.517, PLN: 0.73 },
      "2026-09-10": { CZK: 4.0739, EUR: 0.16799, HUF: 61.274, PLN: 0.72604 },
    },
  });
}

function stubFetchOk() {
  const spy = vi.fn().mockResolvedValue(new Response(apiBody(), { status: 200 }));
  vi.stubGlobal("fetch", spy);
  return spy;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadRates", () => {
  it("busca, ordena por data crescente e devolve a última data", async () => {
    stubFetchOk();
    const result = await loadRates(NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stale).toBe(false);
    expect(result.snapshot.lastDate).toBe("2026-09-11");
    expect(result.snapshot.series.EUR.map((p) => p.date)).toEqual(["2026-09-10", "2026-09-11"]);
    expect(result.snapshot.series.EUR[1].perBrl).toBe(0.16879);
    expect(result.snapshot.series.HUF).toHaveLength(2);
  });

  it("pede 180 dias de histórico das quatro moedas", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("api.frankfurter.dev/v1/2026-03-15..");
    expect(url).toContain("base=BRL");
    expect(url).toContain("symbols=EUR,PLN,HUF,CZK");
  });

  it("usa o cache dentro de 12h sem chamar a rede", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    expect(spy).toHaveBeenCalledTimes(1);

    const second = await loadRates(NOW + TWELVE_HOURS - 1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(second.ok && second.stale).toBe(false);
  });

  it("busca de novo quando o cache passou de 12h", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    await loadRates(NOW + TWELVE_HOURS + 1);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("devolve o cache vencido marcado como stale quando a rede falha", async () => {
    stubFetchOk();
    await loadRates(NOW);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await loadRates(NOW + TWELVE_HOURS + 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stale).toBe(true);
    expect(result.snapshot.lastDate).toBe("2026-09-11");
  });

  it("falha sem estourar quando a rede cai e não há cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata HTTP 500 como falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("erro", { status: 500 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata JSON inválido como falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{ not json", { status: 200 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata resposta fora do schema como falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ base: "USD" }), { status: 200 })),
    );
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("falha quando a resposta não traz nenhuma das moedas pedidas", async () => {
    const body = JSON.stringify({ base: "BRL", rates: { "2026-09-11": { USD: 5.4 } } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("ignora cache corrompido e busca de novo", async () => {
    localStorage.setItem("eurotrip:rates:v1", "{ lixo");
    const spy = stubFetchOk();
    const result = await loadRates(NOW);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
  });

  it("funciona quando o localStorage lança exceção", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("acesso negado");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota cheia");
    });
    stubFetchOk();

    const result = await loadRates(NOW);
    expect(result.ok).toBe(true);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/data/exchange.test.ts`
Expected: FAIL — `Failed to resolve import "./exchange"`.

- [ ] **Step 3: Implementar `exchange.ts`**

Criar `src/data/exchange.ts`:

```ts
import { z } from "zod";
import type { CurrencyCode, RawPoint } from "./exchangeStats";

export const RATES_API_HOST = "api.frankfurter.dev";

const CODES: CurrencyCode[] = ["EUR", "PLN", "HUF", "CZK"];
const HISTORY_DAYS = 180;
const MILLIS_PER_DAY = 86_400_000;
const CACHE_KEY = "eurotrip:rates:v1";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export interface RatesSnapshot {
  /** Séries em ordem crescente de data, uma por moeda. */
  series: Record<CurrencyCode, RawPoint[]>;
  lastDate: string;
  fetchedAt: number;
}

export type RatesResult = { ok: true; snapshot: RatesSnapshot; stale: boolean } | { ok: false };

const ApiResponseSchema = z.object({
  base: z.literal("BRL"),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
});

const PointSchema = z.object({ date: z.string(), perBrl: z.number() });

const SnapshotSchema = z.object({
  series: z.object({
    EUR: z.array(PointSchema),
    PLN: z.array(PointSchema),
    HUF: z.array(PointSchema),
    CZK: z.array(PointSchema),
  }),
  lastDate: z.string(),
  fetchedAt: z.number(),
});

function isoDay(millis: number): string {
  return new Date(millis).toISOString().slice(0, 10);
}

function buildUrl(now: number): string {
  const start = isoDay(now - HISTORY_DAYS * MILLIS_PER_DAY);
  return `https://${RATES_API_HOST}/v1/${start}..?base=BRL&symbols=${CODES.join(",")}`;
}

function readCache(): RatesSnapshot | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = SnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(snapshot: RatesSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Modo privativo ou cota cheia: seguir sem cache.
  }
}

/**
 * Converte o mapa data → moeda → valor da API em uma série por moeda,
 * ordenada por data. Dias sem valor utilizável para uma moeda entram apenas
 * nas séries das outras.
 */
function toSnapshot(rates: Record<string, Record<string, number>>, now: number): RatesSnapshot | undefined {
  const dates = Object.keys(rates).sort();
  if (dates.length === 0) return undefined;

  const series = { EUR: [], PLN: [], HUF: [], CZK: [] } as Record<CurrencyCode, RawPoint[]>;

  for (const date of dates) {
    for (const code of CODES) {
      const perBrl = rates[date][code];
      if (typeof perBrl === "number" && Number.isFinite(perBrl) && perBrl > 0) {
        series[code].push({ date, perBrl });
      }
    }
  }

  if (CODES.some((code) => series[code].length === 0)) return undefined;

  return { series, lastDate: dates[dates.length - 1], fetchedAt: now };
}

async function fetchSnapshot(now: number): Promise<RatesSnapshot | undefined> {
  try {
    const response = await fetch(buildUrl(now));
    if (!response.ok) return undefined;
    const parsed = ApiResponseSchema.safeParse(await response.json());
    if (!parsed.success) return undefined;
    return toSnapshot(parsed.data.rates, now);
  } catch {
    return undefined;
  }
}

/**
 * Cotações das moedas do roteiro. Usa o cache de 12h quando ele está fresco;
 * se a rede falhar, cai para o cache vencido marcado como `stale`.
 */
export async function loadRates(now: number = Date.now()): Promise<RatesResult> {
  const cached = readCache();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { ok: true, snapshot: cached, stale: false };
  }

  const fresh = await fetchSnapshot(now);
  if (fresh) {
    writeCache(fresh);
    return { ok: true, snapshot: fresh, stale: false };
  }

  if (cached) return { ok: true, snapshot: cached, stale: true };
  return { ok: false };
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/data/exchange.test.ts`
Expected: PASS, 12 testes.

O teste da URL espera `2026-03-15..`: 180 dias antes de 11/09/2026. Se falhar por um dia de diferença, confira se o cálculo usa `HISTORY_DAYS * MILLIS_PER_DAY` sobre o `now` recebido, sem fuso local.

- [ ] **Step 5: Commit**

```bash
git add src/data/exchange.ts src/data/exchange.test.ts
git commit -m "Busca cotações na API Frankfurter com cache de 12h"
```

---

### Task 3: Gráfico em SVG (`RateChart.tsx`)

**Files:**

- Create: `src/components/home/RateChart.tsx`
- Create: `src/components/home/RateChart.module.css`
- Test: `src/components/home/RateChart.test.tsx`

**Interfaces:**

- Consumes: `SeriesPoint`, `formatBrl`, `formatShortDate` de `../../data/exchangeStats`.
- Produces: `function RateChart(props: { points: SeriesPoint[]; average: number; min: SeriesPoint; max: SeriesPoint; decimals: number; ariaLabel: string }): JSX.Element | null`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/components/home/RateChart.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RateChart } from "./RateChart";
import { summarize, type SeriesPoint } from "../../data/exchangeStats";

const points: SeriesPoint[] = [
  { date: "2026-09-08", value: 6.0 },
  { date: "2026-09-09", value: 6.2 },
  { date: "2026-09-10", value: 5.8 },
  { date: "2026-09-11", value: 5.9 },
];

function renderChart(series: SeriesPoint[] = points) {
  const summary = summarize(series);
  if (!summary) throw new Error("fixture inválida");
  return render(
    <RateChart
      points={series}
      average={summary.average}
      min={summary.min}
      max={summary.max}
      decimals={2}
      ariaLabel="Euro nos últimos 90 dias"
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RateChart", () => {
  it("desenha um ponto da linha para cada dia", () => {
    renderChart();
    const line = screen.getByTestId("rate-line");
    expect(line.getAttribute("points")?.trim().split(/\s+/)).toHaveLength(4);
  });

  it("descreve o gráfico para leitores de tela", () => {
    renderChart();
    expect(screen.getByRole("img", { name: "Euro nos últimos 90 dias" })).toBeInTheDocument();
  });

  it("marca mínima e máxima com valor e data", () => {
    renderChart();
    expect(screen.getByText("5,80 · 10/09")).toBeInTheDocument();
    expect(screen.getByText("6,20 · 09/09")).toBeInTheDocument();
  });

  it("mostra a linha da média", () => {
    renderChart();
    expect(screen.getByTestId("rate-average")).toBeInTheDocument();
  });

  it("mostra o valor do dia sob o cursor", () => {
    renderChart();
    const svg = screen.getByTestId("rate-svg");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 400,
      top: 0,
      height: 150,
      right: 400,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerMove(svg, { clientX: 400 });
    expect(screen.getByTestId("rate-readout")).toHaveTextContent("11/09");
    expect(screen.getByTestId("rate-readout")).toHaveTextContent("5,90");

    fireEvent.pointerLeave(svg);
    expect(screen.queryByTestId("rate-readout")).not.toBeInTheDocument();
  });

  it("não quebra com um único ponto", () => {
    renderChart([{ date: "2026-09-11", value: 5.9 }]);
    expect(screen.getByTestId("rate-svg")).toBeInTheDocument();
  });

  it("não renderiza nada sem pontos", () => {
    const summary = { average: 0, min: { date: "", value: 0 }, max: { date: "", value: 0 } };
    const { container } = render(
      <RateChart
        points={[]}
        average={summary.average}
        min={summary.min}
        max={summary.max}
        decimals={2}
        ariaLabel="vazio"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/components/home/RateChart.test.tsx`
Expected: FAIL — `Failed to resolve import "./RateChart"`.

- [ ] **Step 3: Implementar o gráfico**

Criar `src/components/home/RateChart.module.css`:

```css
.wrapper {
  position: relative;
  margin-top: var(--sp-4);
}

.svg {
  display: block;
  width: 100%;
  height: auto;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(120, 132, 210, 0.06), transparent 60%),
    var(--surface-inset);
  border: 1px solid var(--border-1);
  border-radius: var(--r-1);
  touch-action: pan-y;
}

.line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 3px var(--accent-glow));
}

.average {
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.cursor {
  stroke: var(--border-3);
  stroke-width: 1;
}

.marker {
  fill: var(--text-3);
}

.current {
  fill: var(--accent);
  stroke: var(--bg);
  stroke-width: 1.5;
}

.label {
  font-family: var(--font-mono);
  font-size: 7px;
  fill: var(--text-3);
}

.readout {
  font-family: var(--font-mono);
  font-size: 8px;
  fill: var(--text-1);
}
```

Criar `src/components/home/RateChart.tsx`:

```tsx
import { useState } from "react";
import { formatBrl, formatShortDate, type SeriesPoint } from "../../data/exchangeStats";
import styles from "./RateChart.module.css";

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 30;
const PAD_Y = 14;
/** Folga de 4% acima e abaixo para a linha não encostar na borda. */
const RANGE_MARGIN = 0.04;

interface RateChartProps {
  points: SeriesPoint[];
  average: number;
  min: SeriesPoint;
  max: SeriesPoint;
  decimals: number;
  ariaLabel: string;
}

interface Projection {
  x: (index: number) => number;
  y: (value: number) => number;
}

function projection(points: SeriesPoint[]): Projection {
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || high || 1;
  const from = low - span * RANGE_MARGIN;
  const to = high + span * RANGE_MARGIN;
  const usableX = WIDTH - PAD_X * 2;
  const usableY = HEIGHT - PAD_Y * 2;

  return {
    x: (index) => (points.length === 1 ? WIDTH / 2 : PAD_X + (index * usableX) / (points.length - 1)),
    y: (value) => PAD_Y + usableY - ((value - from) / (to - from)) * usableY,
  };
}

export function RateChart({ points, average, min, max, decimals, ariaLabel }: RateChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;

  const project = projection(points);
  const polyline = points.map((point, index) => `${project.x(index)},${project.y(point.value)}`).join(" ");
  const current = points[points.length - 1];
  // Procura por data, não por identidade: o resumo pode ter sido calculado
  // sobre outro recorte com os mesmos dias.
  const minIndex = Math.max(points.findIndex((point) => point.date === min.date), 0);
  const maxIndex = Math.max(points.findIndex((point) => point.date === max.date), 0);
  const hovered = hover === null ? null : points[hover];

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const usable = (ratio * WIDTH - PAD_X) / (WIDTH - PAD_X * 2);
    const index = Math.round(usable * (points.length - 1));
    setHover(Math.min(Math.max(index, 0), points.length - 1));
  }

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        data-testid="rate-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <line
          className={styles.average}
          data-testid="rate-average"
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={project.y(average)}
          y2={project.y(average)}
        />
        <polyline className={styles.line} data-testid="rate-line" points={polyline} />

        <circle className={styles.marker} cx={project.x(minIndex)} cy={project.y(min.value)} r={2} />
        <text className={styles.label} x={PAD_X} y={HEIGHT - 3}>
          {`${formatBrl(min.value, decimals)} · ${formatShortDate(min.date)}`}
        </text>
        <circle className={styles.marker} cx={project.x(maxIndex)} cy={project.y(max.value)} r={2} />
        <text className={styles.label} x={PAD_X} y={9}>
          {`${formatBrl(max.value, decimals)} · ${formatShortDate(max.date)}`}
        </text>

        <circle
          className={styles.current}
          cx={project.x(points.length - 1)}
          cy={project.y(current.value)}
          r={3}
        />

        {hovered && (
          <g data-testid="rate-readout">
            <line
              className={styles.cursor}
              x1={project.x(hover ?? 0)}
              x2={project.x(hover ?? 0)}
              y1={PAD_Y}
              y2={HEIGHT - PAD_Y}
            />
            <text className={styles.readout} x={WIDTH - PAD_X} y={9} textAnchor="end">
              {`${formatShortDate(hovered.date)} · ${formatBrl(hovered.value, decimals)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/components/home/RateChart.test.tsx`
Expected: PASS, 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/RateChart.tsx src/components/home/RateChart.module.css src/components/home/RateChart.test.tsx
git commit -m "Adiciona gráfico de cotação em SVG"
```

---

### Task 4: A seção de câmbio (`ExchangeSection.tsx`)

**Files:**

- Create: `src/components/home/ExchangeSection.tsx`
- Create: `src/components/home/ExchangeSection.module.css`
- Test: `src/components/home/ExchangeSection.test.tsx`

**Interfaces:**

- Consumes: `loadRates`, `RatesSnapshot` de `../../data/exchange`; `CURRENCIES`, `formatBrl`, `formatPercent`, `formatShortDate`, `sliceByDays`, `summarize`, `toBrlSeries` de `../../data/exchangeStats`; `RateChart` de `./RateChart`.
- Produces: `function ExchangeSection(): JSX.Element`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/components/home/ExchangeSection.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExchangeSection } from "./ExchangeSection";

/** 90 dias úteis sintéticos: euro caindo de 6,50 para 5,90. */
function apiBody() {
  const rates: Record<string, Record<string, number>> = {};
  for (let i = 0; i < 90; i += 1) {
    const day = new Date(Date.UTC(2026, 5, 15) + i * 86_400_000).toISOString().slice(0, 10);
    const eur = 6.5 - i * (0.6 / 89);
    rates[day] = { EUR: 1 / eur, PLN: 1 / 1.37, CZK: 1 / 0.244, HUF: 1 / 0.016256 };
  }
  return JSON.stringify({ base: "BRL", rates });
}

function stubFetch(body: string, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExchangeSection", () => {
  it("mostra a cotação do euro, o selo e a data", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);

    expect(await screen.findByText(/por euro/)).toBeInTheDocument();
    // "5,90" aparece duas vezes: na aba do euro e no destaque.
    expect(screen.getAllByText("5,90").length).toBeGreaterThan(0);
    expect(screen.getByTestId("rate-verdict")).toHaveTextContent("Bom momento");
    expect(screen.getByTestId("rate-source")).toHaveTextContent("12/09");
  });

  it("troca de moeda ao clicar na aba", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);
    await screen.findByText(/por euro/);

    await userEvent.click(screen.getByRole("tab", { name: /Kč/ }));

    expect(screen.getByText(/por coroa tcheca/)).toBeInTheDocument();
    expect(screen.getAllByText("0,244").length).toBeGreaterThan(0);
  });

  it("troca de período e recalcula a comparação", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);
    await screen.findByText(/por euro/);

    expect(screen.getByTestId("rate-comparison")).toHaveTextContent("média de 90 dias");

    await userEvent.click(screen.getByRole("button", { name: "30d" }));

    expect(screen.getByTestId("rate-comparison")).toHaveTextContent("média de 30 dias");
  });

  it("avisa quando a cotação vem do cache desatualizado", async () => {
    stubFetch(apiBody());
    const { unmount } = render(<ExchangeSection />);
    await screen.findByText(/por euro/);
    unmount();

    // Envelhece o cache: sem isso ele ainda estaria fresco e nem tentaria a rede.
    const cached = JSON.parse(localStorage.getItem("eurotrip:rates:v1") ?? "{}");
    cached.fetchedAt = Date.now() - 13 * 60 * 60 * 1000;
    localStorage.setItem("eurotrip:rates:v1", JSON.stringify(cached));

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ExchangeSection />);

    await waitFor(() => {
      expect(screen.getByTestId("rate-source")).toHaveTextContent("não foi possível atualizar");
    });
  });

  it("mostra indisponível quando a rede falha e não há cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ExchangeSection />);

    expect(await screen.findByText("Cotação indisponível no momento.")).toBeInTheDocument();
  });

  it("mostra o estado de carregando antes da resposta", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<ExchangeSection />);

    expect(screen.getByText("Carregando cotações…")).toBeInTheDocument();
  });
});
```

A última cotação do fixture cai em 12/09/2026 (15/06 mais 89 dias) e vale 5,90; o euro só cai ao longo da série, então o último dia é o mais barato e o selo é "Bom momento".

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/components/home/ExchangeSection.test.tsx`
Expected: FAIL — `Failed to resolve import "./ExchangeSection"`.

Se faltar `@testing-library/user-event`, confirme com `npm ls @testing-library/user-event`. Se não estiver instalado, troque os `userEvent.click(...)` por `fireEvent.click(...)` de `@testing-library/react` em vez de adicionar dependência (ver Global Constraints).

- [ ] **Step 3: Implementar a seção**

Criar `src/components/home/ExchangeSection.module.css`:

```css
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}

.tab {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: var(--r-1);
  cursor: pointer;
}

.tabActive {
  color: var(--text-1);
  border-color: var(--accent-border);
  background: var(--accent-dim);
}

.headline {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
}

.value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  color: var(--text-1);
}

.verdict {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--r-1);
  border: 1px solid var(--border-1);
  color: var(--text-3);
}

.verdictBom {
  color: var(--accent);
  border-color: var(--accent-border);
  background: var(--accent-dim);
}

.verdictCaro {
  color: var(--warn);
  border-color: var(--warn-border);
  background: var(--warn-dim);
}

.comparison {
  font-size: 0.85rem;
  color: var(--text-2);
}

.periods {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.period {
  padding: var(--sp-1) var(--sp-3);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-3);
  background: transparent;
  border: 1px solid var(--border-1);
  border-radius: var(--r-1);
  cursor: pointer;
}

.periodActive {
  color: var(--text-1);
  border-color: var(--border-3);
  background: var(--surface-2);
}

.source {
  margin-top: var(--sp-3);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.skeleton {
  height: 12rem;
  border-radius: var(--r-1);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
```

Criar `src/components/home/ExchangeSection.tsx`:

```tsx
import { useEffect, useState } from "react";
import { loadRates, type RatesSnapshot } from "../../data/exchange";
import {
  CURRENCIES,
  formatBrl,
  formatPercent,
  formatShortDate,
  sliceByDays,
  summarize,
  toBrlSeries,
  type CurrencyCode,
} from "../../data/exchangeStats";
import { RateChart } from "./RateChart";
import styles from "./ExchangeSection.module.css";

const PERIODS = [30, 90, 180] as const;
type Period = (typeof PERIODS)[number];

type State =
  | { phase: "loading" }
  | { phase: "ready"; snapshot: RatesSnapshot; stale: boolean }
  | { phase: "failed" };

export function ExchangeSection() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [code, setCode] = useState<CurrencyCode>("EUR");
  const [period, setPeriod] = useState<Period>(90);

  useEffect(() => {
    let cancelled = false;
    loadRates().then((result) => {
      if (cancelled) return;
      setState(result.ok ? { phase: "ready", snapshot: result.snapshot, stale: result.stale } : { phase: "failed" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h2>Câmbio</h2>
      {state.phase === "loading" && (
        <div className={styles.skeleton} role="status">
          Carregando cotações…
        </div>
      )}
      {state.phase === "failed" && <p className={styles.comparison}>Cotação indisponível no momento.</p>}
      {state.phase === "ready" && (
        <Rates
          snapshot={state.snapshot}
          stale={state.stale}
          code={code}
          period={period}
          onCode={setCode}
          onPeriod={setPeriod}
        />
      )}
    </section>
  );
}

interface RatesProps {
  snapshot: RatesSnapshot;
  stale: boolean;
  code: CurrencyCode;
  period: Period;
  onCode: (code: CurrencyCode) => void;
  onPeriod: (period: Period) => void;
}

function Rates({ snapshot, stale, code, period, onCode, onPeriod }: RatesProps) {
  const meta = CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
  const full = toBrlSeries(snapshot.series[meta.code], meta.unit);
  const slice = sliceByDays(full, period);
  const summary = summarize(slice);

  if (!summary) return <p className={styles.comparison}>Cotação indisponível no momento.</p>;

  const direction = summary.diffFromAverage < 0 ? "abaixo" : "acima";

  return (
    <>
      <div className={styles.tabs} role="tablist">
        {CURRENCIES.map((currency) => {
          const today = summarize(toBrlSeries(snapshot.series[currency.code], currency.unit));
          return (
            <button
              key={currency.code}
              type="button"
              role="tab"
              aria-selected={currency.code === code}
              className={`${styles.tab} ${currency.code === code ? styles.tabActive : ""}`}
              onClick={() => onCode(currency.code)}
            >
              <span>{currency.label}</span>
              <span>{today ? formatBrl(today.current.value, currency.decimals) : "—"}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.headline}>
        <p>
          R$ <span className={styles.value}>{formatBrl(summary.current.value, meta.decimals)}</span> por {meta.name}
        </p>
        <span className={verdictClass(summary.verdict)} data-testid="rate-verdict">
          {verdictLabel(summary.verdict)}
        </span>
      </div>

      <p className={styles.comparison} data-testid="rate-comparison">
        {summary.verdict
          ? `${formatPercent(summary.diffFromAverage)} ${direction} da média de ${period} dias · mais barato que ${Math.round(summary.cheaperShare * 100)}% dos dias`
          : `Sem histórico suficiente para comparar com a média de ${period} dias`}
      </p>

      <div className={styles.periods}>
        {PERIODS.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.period} ${option === period ? styles.periodActive : ""}`}
            onClick={() => onPeriod(option)}
          >
            {`${option}d`}
          </button>
        ))}
      </div>

      <RateChart
        points={slice}
        average={summary.average}
        min={summary.min}
        max={summary.max}
        decimals={meta.decimals}
        ariaLabel={`${meta.name} nos últimos ${summary.dayCount} dias úteis: mínima ${formatBrl(summary.min.value, meta.decimals)}, máxima ${formatBrl(summary.max.value, meta.decimals)}, hoje ${formatBrl(summary.current.value, meta.decimals)} reais`}
      />

      <p className={styles.source} data-testid="rate-source">
        {stale
          ? `Cotação de ${formatShortDate(snapshot.lastDate)} · não foi possível atualizar`
          : `Cotação oficial BCE de ${formatShortDate(snapshot.lastDate)} · atualiza 1x por dia útil`}
      </p>
    </>
  );
}

function verdictLabel(verdict?: "bom" | "media" | "caro"): string {
  if (verdict === "bom") return "Bom momento";
  if (verdict === "caro") return "Caro";
  if (verdict === "media") return "Na média";
  return "Sem comparação";
}

function verdictClass(verdict?: "bom" | "media" | "caro"): string {
  if (verdict === "bom") return `${styles.verdict} ${styles.verdictBom}`;
  if (verdict === "caro") return `${styles.verdict} ${styles.verdictCaro}`;
  return styles.verdict;
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/components/home/ExchangeSection.test.tsx`
Expected: PASS, 6 testes.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ExchangeSection.tsx src/components/home/ExchangeSection.module.css src/components/home/ExchangeSection.test.tsx
git commit -m "Adiciona seção de câmbio com abas de moeda e período"
```

---

### Task 5: Ligar na home, esconder o mapa e ajustar o stub de `fetch` dos testes

**Files:**

- Create: `src/test/fetchStub.ts`
- Modify: `src/pages/HomePage.tsx` (renderiza a seção depois do `Timeline`; remove o `RouteMap`)
- Modify: `src/pages/HomePage.test.tsx:7-9` (usa o helper novo)
- Modify: `e2e/helpers.ts` (mock das cotações)
- Modify: `e2e/home-destination.spec.ts:36` (E2E-003 marcado como `skip` enquanto o mapa está fora)

**Interfaces:**

- Consumes: `ExchangeSection` da Task 4; `RATES_API_HOST` de `../data/exchange`.
- Produces: `function stubFetchRoutes(routes: Array<{ match: string; body: string; status?: number }>): void` e `function ratesFixtureBody(): string` em `src/test/fetchStub.ts`.

O problema que isso resolve: os testes atuais substituem o `fetch` global por uma resposta única, a do `viagem.json`. Com a seção na home, a chamada de câmbio receberia o JSON da viagem.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar em `src/pages/HomePage.test.tsx`, dentro do `describe("HomePage", ...)`:

```tsx
  it("mostra a seção de câmbio com a cotação do euro", async () => {
    stubFetch(JSON.stringify({ title: "Eurotrip", destinos: [stayFixture()] }));
    renderApp();

    expect(await screen.findByText(/por euro/)).toBeInTheDocument();
  });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx vitest run src/pages/HomePage.test.tsx`
Expected: FAIL — `Unable to find an element with the text: /por euro/`.

- [ ] **Step 3: Criar o helper de `fetch` por URL**

Criar `src/test/fetchStub.ts`:

```ts
import { vi } from "vitest";
import { RATES_API_HOST } from "../data/exchange";

interface Route {
  /** Trecho da URL que identifica a rota, ex.: "viagem.json". */
  match: string;
  body: string;
  status?: number;
}

/**
 * Substitui o `fetch` global respondendo conforme a URL pedida. URL sem rota
 * correspondente falha alto, em vez de devolver o corpo errado em silêncio.
 */
export function stubFetchRoutes(routes: Route[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const route = routes.find((candidate) => url.includes(candidate.match));
      if (!route) throw new Error(`fetch não esperado nos testes: ${url}`);
      return new Response(route.body, { status: route.status ?? 200 });
    }),
  );
}

/** Série curta de cotações, suficiente para a seção de câmbio renderizar. */
export function ratesFixtureBody(): string {
  return JSON.stringify({
    base: "BRL",
    rates: {
      "2026-09-10": { EUR: 0.16799, PLN: 0.72604, CZK: 4.0739, HUF: 61.274 },
      "2026-09-11": { EUR: 0.16879, PLN: 0.73, CZK: 4.0956, HUF: 61.517 },
    },
  });
}

export const RATES_MATCH = RATES_API_HOST;
```

- [ ] **Step 4: Usar o helper em `HomePage.test.tsx`**

Substituir o `stubFetch` local (linhas 7-9) por uma versão que também atende a chamada de câmbio, e limpar o `localStorage` entre os testes:

```tsx
import { stubFetchRoutes, ratesFixtureBody, RATES_MATCH } from "../test/fetchStub";

function stubFetch(body: string, status = 200) {
  stubFetchRoutes([
    { match: "viagem.json", body, status },
    { match: RATES_MATCH, body: ratesFixtureBody() },
  ]);
}
```

E no `afterEach` existente (linhas 11-14), acrescentar `localStorage.clear();` para o cache de um teste não vazar para o próximo.

- [ ] **Step 5: Renderizar a seção na home e tirar o mapa**

Em `src/pages/HomePage.tsx`: importar `ExchangeSection`, colocá-la logo depois do
`Timeline` (a seção "Roteiro") e remover a linha do `RouteMap` junto com o import dele.
O componente `RouteMap`, seus estilos e os testes de `projectRoute` continuam no
repositório — só param de ser renderizados.

```tsx
import { ExchangeSection } from "../components/home/ExchangeSection";
```

O corpo do `return` fica assim:

```tsx
      <Timeline stays={ordered} totalDuration={duration} />
      <ExchangeSection />
      <ConsolidatedChecklist trip={trip} />
      <GeneralItems items={trip.generalItems} />
```

Remover também o import agora sem uso:

```tsx
import { RouteMap } from "../components/home/RouteMap";
```

Se sobrar import não usado, `npm run build` falha no `tsc`.

- [ ] **Step 6: Ajustar os testes E2E**

O teste E2E-003 exige o mapa visível na home e passa a falhar. Em
`e2e/home-destination.spec.ts:36`, trocar `test(` por `test.skip(` nesse caso e
acrescentar a razão logo acima:

```ts
  // Mapa da rota fora da home por decisão do usuário (2026-09-11); o componente
  // continua no repositório. Reativar este teste quando ele voltar.
  test.skip("E2E-003: renders markers per coord-bearing city, click marker opens stay page", async ({
```

Em `e2e/helpers.ts`, acrescentar o mock das cotações, para o navegador do Playwright não
chamar a API de verdade:

```ts
export async function mockRates(page: Page): Promise<void> {
  const body = JSON.stringify({
    base: "BRL",
    rates: {
      "2026-09-10": { EUR: 0.16799, PLN: 0.72604, CZK: 4.0739, HUF: 61.274 },
      "2026-09-11": { EUR: 0.16879, PLN: 0.73, CZK: 4.0956, HUF: 61.517 },
    },
  });
  await page.route("**/api.frankfurter.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body }),
  );
}
```

E chamar `await mockRates(page);` junto de cada `await mockTrip(page, ...)` nos testes
que abrem a home.

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npx vitest run`
Expected: PASS em todos os arquivos, incluindo `derive.routemap.test.ts` (as funções do
mapa continuam testadas) e `DestinationPage.test.tsx`, que não renderiza a home.

Run: `npm run build`
Expected: build sem erro de TypeScript, inclusive de import não usado.

- [ ] **Step 8: Conferir no navegador**

Run: `npm run dev` e abrir a home.
Expected: a ordem é contagem regressiva, Roteiro, Câmbio, checklist, itens gerais, sem o
mapa da rota. A seção de câmbio traz as quatro abas, o valor de hoje, o selo, o gráfico e
a data da cotação; trocar de aba e de período muda os números. Com a rede desligada nas
ferramentas de desenvolvedor e o cache limpo, aparece "Cotação indisponível no momento" e
o resto da home continua normal.

- [ ] **Step 9: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx src/test/fetchStub.ts e2e/helpers.ts e2e/home-destination.spec.ts
git commit -m "Exibe câmbio abaixo do roteiro e esconde o mapa da rota"
```
