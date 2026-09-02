import { useState } from "react";
import { collectItems, consolidatedTotals } from "../../data/derive";
import type { BookingItem, Trip } from "../../data/trip";
import { MoneyAmount } from "../MoneyAmount";
import styles from "./ConsolidatedChecklist.module.css";

type Panel = "comprado" | "pendente";

export function ConsolidatedChecklist({ trip }: { trip: Trip }) {
  const totals = consolidatedTotals(trip);
  const currencies = Object.entries(totals.byCurrency);
  const items = collectItems(trip);
  const bought = items.filter((item) => item.status === "comprado");
  const pending = items.filter((item) => item.status !== "comprado");

  const [open, setOpen] = useState<Panel | null>(null);
  const toggle = (panel: Panel) => setOpen((cur) => (cur === panel ? null : panel));

  return (
    <section className={styles.wrapper}>
      <h2>Comprado x pendente</h2>
      <div className={styles.counts}>
        <button
          type="button"
          className={`${styles.count} ${styles.bought}`}
          aria-expanded={open === "comprado"}
          aria-controls="checklist-comprado"
          onClick={() => toggle("comprado")}
        >
          <span>{totals.bought} comprado(s)</span>
          <span className={styles.caret} aria-hidden="true">
            ▸
          </span>
        </button>
        <button
          type="button"
          className={`${styles.count} ${styles.pending}`}
          aria-expanded={open === "pendente"}
          aria-controls="checklist-pendente"
          onClick={() => toggle("pendente")}
        >
          <span>{totals.pending} pendente(s)</span>
          <span className={styles.caret} aria-hidden="true">
            ▸
          </span>
        </button>
      </div>

      {open === "comprado" && <Breakdown id="checklist-comprado" tone="bought" items={bought} />}
      {open === "pendente" && <Breakdown id="checklist-pendente" tone="pending" items={pending} />}

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

function Breakdown({
  id,
  tone,
  items,
}: {
  id: string;
  tone: "bought" | "pending";
  items: BookingItem[];
}) {
  if (items.length === 0) {
    return (
      <p id={id} className={styles.breakdownEmpty}>
        Nenhum item {tone === "bought" ? "comprado" : "pendente"}.
      </p>
    );
  }

  return (
    <ul id={id} className={`${styles.breakdown} ${styles[tone]}`}>
      {items.map((item) => (
        <li key={item.id} className={styles.row}>
          <span className={styles.rowTitle}>{item.title}</span>
          {item.value === undefined ? (
            <span className={styles.rowNoValue}>sem valor</span>
          ) : (
            <MoneyAmount value={item.value} currency={item.currency} />
          )}
        </li>
      ))}
    </ul>
  );
}
