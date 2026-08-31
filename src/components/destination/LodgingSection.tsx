import type { LodgingItem } from "../../data/trip";
import { formatDate } from "../dateFormat";
import { ItemStatusBadge } from "../ItemStatusBadge";
import { MoneyAmount } from "../MoneyAmount";
import { WarningNotice } from "../WarningNotice";
import styles from "./LodgingSection.module.css";

export function LodgingSection({ lodging }: { lodging: LodgingItem[] }) {
  return (
    <section>
      <h2>Hospedagem</h2>
      {lodging.length === 0 ? (
        <p>Hospedagem a definir.</p>
      ) : (
        <ul className={styles.list}>
          {lodging.map((item) => (
            <li key={item.id} className={styles.item}>
              <p>
                <strong>{item.title}</strong> <ItemStatusBadge status={item.status} />
              </p>
              {item.address && <p>{item.address}</p>}
              <p>
                Check-in: {formatDate(item.checkin)} · Check-out: {formatDate(item.checkout)}
              </p>
              <MoneyAmount value={item.value} currency={item.currency} />
              {item.inconsistentDates && <WarningNotice warnings={["Check-out anterior ao check-in."]} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
