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
  /**
   * Fração dos dias de comparação (todos menos o atual) mais caros que hoje.
   * Dias empatados com o valor de hoje contam meio, para que uma série
   * perfeitamente estável fique em 0,5 ("na média") em vez de 0 ("caro").
   */
  cheaperShare: number;
  /** Ausente quando há menos de `MIN_DAYS_FOR_VERDICT` dias para comparar. */
  verdict?: Verdict;
  dayCount: number;
}

/** Abaixo disso a amostra é pequena demais para um selo honesto. */
export const MIN_DAYS_FOR_VERDICT = 10;

function verdictOf(cheaperShare: number): Verdict {
  if (cheaperShare >= 0.75) return "bom";
  if (cheaperShare <= 0.25) return "caro";
  return "media";
}

export function summarize(points: SeriesPoint[]): Summary | undefined {
  if (points.length === 0) return undefined;

  const current = points[points.length - 1];
  const currentIndex = points.length - 1;
  let min = points[0];
  let max = points[0];
  let sum = 0;
  let moreExpensive = 0;
  let ties = 0;

  points.forEach((point, index) => {
    if (point.value < min.value) min = point;
    if (point.value > max.value) max = point;
    sum += point.value;
    if (index === currentIndex) return;
    if (point.value > current.value) moreExpensive += 1;
    else if (point.value === current.value) ties += 1;
  });

  const average = sum / points.length;
  const comparisonDays = points.length - 1;
  const cheaperShare = comparisonDays === 0 ? 0 : (moreExpensive + 0.5 * ties) / comparisonDays;

  return {
    current,
    min,
    max,
    average,
    diffFromAverage: average === 0 ? 0 : (current.value - average) / average,
    cheaperShare,
    verdict: points.length < MIN_DAYS_FOR_VERDICT ? undefined : verdictOf(cheaperShare),
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
