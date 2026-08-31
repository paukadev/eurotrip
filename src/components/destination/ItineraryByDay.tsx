import { groupItineraryByDay } from "../../data/derive";
import type { Activity, Stay } from "../../data/trip";
import { formatDate } from "../dateFormat";
import { ItemStatusBadge } from "../ItemStatusBadge";
import { MoneyAmount } from "../MoneyAmount";
import styles from "./ItineraryByDay.module.css";

function ActivityRow({ activity, showDate }: { activity: Activity; showDate?: boolean }) {
  return (
    <li className={styles.activity}>
      {activity.time && <span className={styles.time}>{activity.time}</span>}
      {showDate && activity.date && <span className={styles.time}>{formatDate(activity.date)}</span>}
      <span className={styles.title}>{activity.title}</span>
      {activity.status && <ItemStatusBadge status={activity.status} />}
      <MoneyAmount value={activity.value} currency={activity.currency} />
    </li>
  );
}

export function ItineraryByDay({ stay }: { stay: Stay }) {
  const groups = groupItineraryByDay(stay);

  if (groups.length === 0) {
    return (
      <section>
        <h2>Roteiro</h2>
        <p>Livre.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Roteiro</h2>
      {groups.map((group) => {
        const timed = group.activities.filter((activity) => activity.time);
        const untimed = group.activities.filter((activity) => !activity.time);

        return (
          <div
            key={group.label}
            className={`${styles.day} ${group.outOfRange ? styles.outOfRange : ""}`}
          >
            <h3>{group.label}</h3>
            {group.activities.length === 0 ? (
              <p>Livre.</p>
            ) : (
              <>
                {timed.length > 0 && (
                  <ul className={styles.list}>
                    {timed.map((activity) => (
                      <ActivityRow key={activity.id} activity={activity} showDate={group.outOfRange} />
                    ))}
                  </ul>
                )}
                {untimed.length > 0 && (
                  <>
                    <p>Sem horário definido</p>
                    <ul className={styles.list}>
                      {untimed.map((activity) => (
                        <ActivityRow key={activity.id} activity={activity} showDate={group.outOfRange} />
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </section>
  );
}
