import type { BookingItem } from "../../data/trip";
import { ItemStatusBadge } from "../ItemStatusBadge";
import { MoneyAmount } from "../MoneyAmount";
import styles from "./GeneralItems.module.css";

export function GeneralItems({ items }: { items: BookingItem[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2>Itens gerais da viagem</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span>{item.title}</span>
            <ItemStatusBadge status={item.status} />
            <MoneyAmount value={item.value} currency={item.currency} />
          </li>
        ))}
      </ul>
    </section>
  );
}
