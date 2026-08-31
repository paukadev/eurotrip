import { Link } from "react-router";
import type { StayHeaderInfo } from "../../data/derive";
import styles from "./StayNav.module.css";

export function StayNav({ info }: { info: StayHeaderInfo }) {
  if (!info.hasPrev && !info.hasNext) return null;

  return (
    <nav className={styles.nav} aria-label="Navegação entre destinos">
      {info.hasPrev ? (
        <Link to={`/destino/${info.prevSlug}`}>← Anterior</Link>
      ) : (
        <span />
      )}
      {info.hasNext ? (
        <Link to={`/destino/${info.nextSlug}`}>Próximo →</Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
