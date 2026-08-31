import { useNavigate } from "react-router";
import { projectRoute } from "../../data/derive";
import type { Stay } from "../../data/trip";
import { EmptyState } from "../EmptyState";
import { WarningNotice } from "../WarningNotice";
import styles from "./RouteMap.module.css";

export function RouteMap({ stays }: { stays: Stay[] }) {
  const navigate = useNavigate();
  const geometry = projectRoute(stays);

  if (geometry.points.length === 0) {
    return (
      <section className={styles.wrapper}>
        <h2>Mapa da rota</h2>
        <EmptyState message="Nenhuma coordenada disponível para o mapa." />
        <WarningNotice warnings={geometry.warnings} />
      </section>
    );
  }

  const polylinePoints = geometry.points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <section className={styles.wrapper}>
      <h2>Mapa da rota</h2>
      <svg className={styles.svg} viewBox={geometry.viewBox} role="img" aria-label="Mapa da rota">
        <polyline className={styles.route} points={polylinePoints} />
        {geometry.points.map((point) => (
          <g
            key={point.slug}
            className={styles.point}
            role="link"
            tabIndex={0}
            aria-label={point.name}
            onClick={() => navigate(`/destino/${point.slug}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate(`/destino/${point.slug}`);
              }
            }}
          >
            <circle cx={point.x} cy={point.y} r={5} data-slug={point.slug} />
            <text className={styles.label} x={point.x + 7} y={point.y + 3}>
              {point.name}
            </text>
          </g>
        ))}
      </svg>
      <WarningNotice warnings={geometry.warnings} />
    </section>
  );
}
