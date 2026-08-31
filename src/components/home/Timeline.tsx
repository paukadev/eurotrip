import { Link } from "react-router";
import type { OrderedStay } from "../../data/derive";
import { formatDateRange } from "../dateFormat";
import { EmptyState } from "../EmptyState";
import { WarningNotice } from "../WarningNotice";
import styles from "./Timeline.module.css";

export function Timeline({
  stays,
  totalDuration,
}: {
  stays: OrderedStay[];
  totalDuration?: number;
}) {
  if (stays.length === 0) {
    return <EmptyState message="Nenhum destino cadastrado." />;
  }

  return (
    <section className={styles.wrapper}>
      <h2>Roteiro</h2>
      {totalDuration !== undefined && <p>Duração total: {totalDuration} dias</p>}
      <ol className={styles.list} data-testid="timeline-list">
        {stays.map((stay) => (
          <li key={stay.slug}>
            <Link className={styles.item} to={`/destino/${stay.slug}`}>
              <span className={styles.name}>{stay.name}</span>
              <span className={styles.dates}> — {formatDateRange(stay.startDate, stay.endDate)}</span>
              {stay.overlap && <WarningNotice warnings={["Datas sobrepostas com o próximo destino."]} />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
