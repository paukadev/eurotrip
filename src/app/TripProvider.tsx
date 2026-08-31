import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadTrip, type LoadResult } from "../data/trip";
import { EmptyState } from "../components/EmptyState";
import styles from "./TripProvider.module.css";

const TripContext = createContext<LoadResult | null>(null);

export function useTrip(): LoadResult {
  const result = useContext(TripContext);
  if (result === null) {
    throw new Error("useTrip must be used within TripProvider");
  }
  return result;
}

type ProviderState = { phase: "loading" } | { phase: "loaded"; result: LoadResult };

function isEmptyTrip(result: LoadResult): boolean {
  return result.ok && result.trip.stays.length === 0 && result.trip.generalItems.length === 0;
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadTrip().then((result) => {
      if (!cancelled) setState({ phase: "loaded", result });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === "loading") {
    return (
      <div className={styles.status} role="status">
        Carregando dados da viagem…
      </div>
    );
  }

  const { result } = state;

  if (!result.ok) {
    return (
      <div className={styles.status} role="alert">
        {result.error.message}
      </div>
    );
  }

  if (isEmptyTrip(result)) {
    return <EmptyState message="Nenhum destino cadastrado." />;
  }

  return <TripContext.Provider value={result}>{children}</TripContext.Provider>;
}
