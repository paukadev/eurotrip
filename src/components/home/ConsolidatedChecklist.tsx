import { consolidatedTotals } from "../../data/derive";
import type { Trip } from "../../data/trip";
import styles from "./ConsolidatedChecklist.module.css";

export function ConsolidatedChecklist({ trip }: { trip: Trip }) {
  const totals = consolidatedTotals(trip);
  const currencies = Object.entries(totals.byCurrency);

  return (
    <section className={styles.wrapper}>
      <h2>Comprado x pendente</h2>
      <p className={styles.counts}>
        <span>{totals.bought} comprado(s)</span>
        <span>{totals.pending} pendente(s)</span>
      </p>
      {currencies.length > 0 && (
        <ul className={styles.currencyList}>
          {currencies.map(([currency, amounts]) => (
            <li key={currency}>
              {currency}: comprado {amounts.bought.toFixed(2)} · pendente {amounts.pending.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.note}>
        Total considera {totals.valuedItems} de {totals.totalItems} itens com valor informado.
      </p>
    </section>
  );
}
