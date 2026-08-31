import type { TransferItem } from "../../data/trip";
import { ItemStatusBadge } from "../ItemStatusBadge";
import { MoneyAmount } from "../MoneyAmount";
import styles from "./TransferSection.module.css";

export function TransferSection({ transfer }: { transfer: TransferItem[] }) {
  return (
    <section>
      <h2>Translado</h2>
      {transfer.length === 0 ? (
        <p>Sem translado registrado.</p>
      ) : (
        <ul className={styles.list}>
          {transfer.map((item) => (
            <li key={item.id} className={styles.item}>
              <p>
                <strong>{item.title}</strong> <ItemStatusBadge status={item.status} />
              </p>
              {item.mode && <p>Modo: {item.mode}</p>}
              <p>{item.time ? item.time : "Horário a definir"}</p>
              <MoneyAmount value={item.value} currency={item.currency} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
