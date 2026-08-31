import type { ItemStatus } from "../data/trip";
import styles from "./ItemStatusBadge.module.css";

const CONFIG: Record<ItemStatus, { label: string; icon: string }> = {
  comprado: { label: "Comprado", icon: "✓" },
  gratuito: { label: "Gratuito", icon: "★" },
  pendente: { label: "Pendente", icon: "○" },
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const { label, icon } = CONFIG[status];
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}
