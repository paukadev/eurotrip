import type { CountdownState } from "../../data/derive";
import styles from "./CountdownBanner.module.css";

export function CountdownBanner({ state }: { state: CountdownState }) {
  const text = describe(state);
  if (!text) return null;
  return (
    <div className={styles.banner} role="status">
      {text}
    </div>
  );
}

function describe(state: CountdownState): string | null {
  switch (state.phase) {
    case "before":
      return state.days === 0 ? "Começa hoje" : `Faltam ${state.days} dias`;
    case "during":
      return `Dia ${state.dayN} de ${state.total}`;
    case "after":
      return "Viagem concluída";
    case "unknown":
      return "Sem datas definidas";
    default:
      return null;
  }
}
