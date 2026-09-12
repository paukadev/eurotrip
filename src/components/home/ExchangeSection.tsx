import { useEffect, useState, type ReactNode } from "react";
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
  type CurrencyMeta,
  type SeriesPoint,
  type Summary,
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

  const periods = (
    <div className={styles.periods} role="group" aria-label="Período">
      {PERIODS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === period}
          className={`${styles.period} ${option === period ? styles.periodActive : ""}`}
          onClick={() => onPeriod(option)}
        >
          {`${option}d`}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Grupo de botões e não `tablist`: não há painel de aba correspondente. */}
      <div className={styles.tabs} role="group" aria-label="Moeda">
        {CURRENCIES.map((currency) => {
          const today = summarize(toBrlSeries(snapshot.series[currency.code], currency.unit));
          return (
            <button
              key={currency.code}
              type="button"
              aria-pressed={currency.code === code}
              className={`${styles.tab} ${currency.code === code ? styles.tabActive : ""}`}
              onClick={() => onCode(currency.code)}
            >
              <span>{currency.label}</span>
              <span>{today ? formatBrl(today.current.value, currency.decimals) : "—"}</span>
            </button>
          );
        })}
      </div>

      {summary ? (
        <CurrencyDetail meta={meta} summary={summary} slice={slice} stale={stale} periods={periods} />
      ) : (
        <>
          <p className={styles.comparison} data-testid="rate-empty">
            {`Sem histórico de cotação para ${meta.name} nesta fonte.`}
          </p>
          {periods}
        </>
      )}
    </>
  );
}

interface CurrencyDetailProps {
  meta: CurrencyMeta;
  summary: Summary;
  slice: SeriesPoint[];
  stale: boolean;
  periods: ReactNode;
}

function CurrencyDetail({ meta, summary, slice, stale, periods }: CurrencyDetailProps) {
  const quoteDate = formatShortDate(summary.current.date);

  return (
    <>
      <div className={styles.headline}>
        <p data-testid="rate-headline">
          R$ <span className={styles.value}>{formatBrl(summary.current.value, meta.decimals)}</span> por {meta.name}
        </p>
        {/* Sem selo quando não há amostra suficiente: o espaço fica vazio. */}
        {summary.verdict && (
          <span className={verdictClass(summary.verdict)} data-testid="rate-verdict">
            {verdictLabel(summary.verdict)}
          </span>
        )}
      </div>

      <p className={styles.comparison} data-testid="rate-comparison">
        {comparisonText(summary)}
      </p>

      {periods}

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
          ? `Cotação de ${quoteDate} · não foi possível atualizar`
          : `Cotação oficial BCE de ${quoteDate} · atualiza 1x por dia útil`}
      </p>
    </>
  );
}

/**
 * O período pedido (30/90/180) é só a janela; o texto informa o número real de
 * dias úteis encontrados dentro dela.
 */
function comparisonText(summary: Summary): string {
  const range = `${summary.dayCount} dias úteis`;

  if (!summary.verdict) {
    return summary.dayCount === 1
      ? "Um único dia no período: sem comparação com a média."
      : `Apenas ${range} no período: histórico curto demais para comparar.`;
  }

  const cheaper = `mais barato que ${Math.round(summary.cheaperShare * 100)}% dos dias`;
  if (summary.diffFromAverage === 0) return `Exatamente na média de ${range} · ${cheaper}`;

  const direction = summary.diffFromAverage < 0 ? "abaixo" : "acima";
  return `${formatPercent(summary.diffFromAverage)} ${direction} da média de ${range} · ${cheaper}`;
}

function verdictLabel(verdict: "bom" | "media" | "caro"): string {
  if (verdict === "bom") return "Bom momento";
  if (verdict === "caro") return "Caro";
  return "Na média";
}

function verdictClass(verdict: "bom" | "media" | "caro"): string {
  if (verdict === "bom") return `${styles.verdict} ${styles.verdictBom}`;
  if (verdict === "caro") return `${styles.verdict} ${styles.verdictCaro}`;
  return styles.verdict;
}
