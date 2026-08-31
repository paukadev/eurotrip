import type { StayHeaderInfo } from "../../data/derive";
import { formatDateRange } from "../dateFormat";
import { WarningNotice } from "../WarningNotice";
import styles from "./StayHeader.module.css";

export function StayHeader({ info }: { info: StayHeaderInfo }) {
  return (
    <header className={styles.header}>
      <h1>
        {info.name}
        {info.label ? ` — ${info.label}` : ""}
      </h1>
      <p className={styles.dates}>{formatDateRange(info.startDate, info.endDate)}</p>
      {info.durationDays !== undefined && <p>{info.durationDays} dias</p>}
      {info.inconsistentDates && <WarningNotice warnings={["Datas inconsistentes."]} />}
    </header>
  );
}
