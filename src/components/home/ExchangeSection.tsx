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
        <p data-testid="rate-headline">
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
