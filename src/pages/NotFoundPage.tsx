import { Link } from "react-router";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.wrapper} role="status">
      <p>Destino não encontrado.</p>
      <Link to="/">Voltar para a home</Link>
    </div>
  );
}
