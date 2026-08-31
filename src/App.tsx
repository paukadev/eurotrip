import { HashRouter } from "react-router";
import { TripProvider } from "./app/TripProvider";
import { AppRoutes } from "./app/routes";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <a className={styles.brand} href="#/" aria-label="Eurotrip 2026/2027 — início">
            <span className={styles.mark} aria-hidden="true">
              {/* rail / route glyph */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <circle cx="5" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="19" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M6.7 7.6 17.3 16.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeDasharray="1.5 2.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.brandText}>
              Eurotrip <span className={styles.brandYear}>26/27</span>
            </span>
          </a>
          <span className={styles.route} aria-label="Origem e retorno São Paulo">
            GRU <span aria-hidden="true">⇄</span> BER
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <HashRouter>
          <TripProvider>
            <AppRoutes />
          </TripProvider>
        </HashRouter>
      </main>

      <footer className={styles.footer}>
        Dez 2026 – Jan 2027 · Berlin · Cracóvia · Budapeste · Viena · Bratislava · Praga
      </footer>
    </div>
  );
}
