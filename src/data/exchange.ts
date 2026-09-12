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

/** Só aceitamos chaves de data no formato ISO: uma chave de lixo viraria `lastDate`. */
const IsoDayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const ApiResponseSchema = z.object({
  base: z.literal("BRL"),
  rates: z.record(IsoDayKey, z.record(z.string(), z.number())),
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
 * nas séries das outras, e uma moeda ausente da resposta fica com série vazia
 * sem derrubar as demais: só falha quando nenhuma das quatro tem dados.
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

  if (CODES.every((code) => series[code].length === 0)) return undefined;

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
