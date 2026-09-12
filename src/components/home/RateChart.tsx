import { useState } from "react";
import { formatBrl, formatShortDate, type SeriesPoint } from "../../data/exchangeStats";
import styles from "./RateChart.module.css";

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 30;
const PAD_Y = 14;
/** Folga de 4% acima e abaixo para a linha não encostar na borda. */
const RANGE_MARGIN = 0.04;

interface RateChartProps {
  points: SeriesPoint[];
  average: number;
  min: SeriesPoint;
  max: SeriesPoint;
  decimals: number;
  ariaLabel: string;
}

interface Projection {
  x: (index: number) => number;
  y: (value: number) => number;
}

function projection(points: SeriesPoint[]): Projection {
  const values = points.map((point) => point.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || high || 1;
  const from = low - span * RANGE_MARGIN;
  const to = high + span * RANGE_MARGIN;
  const usableX = WIDTH - PAD_X * 2;
  const usableY = HEIGHT - PAD_Y * 2;

  return {
    x: (index) => (points.length === 1 ? WIDTH / 2 : PAD_X + (index * usableX) / (points.length - 1)),
    y: (value) => PAD_Y + usableY - ((value - from) / (to - from)) * usableY,
  };
}

export function RateChart({ points, average, min, max, decimals, ariaLabel }: RateChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length === 0) return null;

  const project = projection(points);
  const polyline = points.map((point, index) => `${project.x(index)},${project.y(point.value)}`).join(" ");
  const current = points[points.length - 1];
  // Procura por data, não por identidade: o resumo pode ter sido calculado
  // sobre outro recorte com os mesmos dias.
  const minIndex = Math.max(points.findIndex((point) => point.date === min.date), 0);
  const maxIndex = Math.max(points.findIndex((point) => point.date === max.date), 0);
  const hovered = hover === null ? null : points[hover];

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const usable = (ratio * WIDTH - PAD_X) / (WIDTH - PAD_X * 2);
    const index = Math.round(usable * (points.length - 1));
    setHover(Math.min(Math.max(index, 0), points.length - 1));
  }

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        data-testid="rate-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <line
          className={styles.average}
          data-testid="rate-average"
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={project.y(average)}
          y2={project.y(average)}
        />
        <polyline className={styles.line} data-testid="rate-line" points={polyline} />

        <circle className={styles.marker} cx={project.x(minIndex)} cy={project.y(min.value)} r={2} />
        <text className={styles.label} x={PAD_X} y={HEIGHT - 3}>
          {`${formatBrl(min.value, decimals)} · ${formatShortDate(min.date)}`}
        </text>
        <circle className={styles.marker} cx={project.x(maxIndex)} cy={project.y(max.value)} r={2} />
        <text className={styles.label} x={PAD_X} y={9}>
          {`${formatBrl(max.value, decimals)} · ${formatShortDate(max.date)}`}
        </text>

        <circle
          className={styles.current}
          cx={project.x(points.length - 1)}
          cy={project.y(current.value)}
          r={3}
        />

        {hovered && (
          <g data-testid="rate-readout">
            <line
              className={styles.cursor}
              x1={project.x(hover ?? 0)}
              x2={project.x(hover ?? 0)}
              y1={PAD_Y}
              y2={HEIGHT - PAD_Y}
            />
            <text className={styles.readout} x={WIDTH - PAD_X} y={9} textAnchor="end">
              {`${formatShortDate(hovered.date)} · ${formatBrl(hovered.value, decimals)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
