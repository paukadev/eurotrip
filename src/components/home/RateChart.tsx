import { useState } from "react";
import { parseCalendarDate } from "../../data/calendar";
import { formatBrl, formatShortDate, type SeriesPoint } from "../../data/exchangeStats";
import styles from "./RateChart.module.css";

const WIDTH = 320;
const HEIGHT = 132;
/** Folga à esquerda para os valores do eixo y. */
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
/** Folga acima para o rótulo da máxima. */
const PAD_TOP = 18;
/** Folga abaixo para o rótulo da mínima e os meses do eixo x. */
const PAD_BOTTOM = 28;
/** Folga de 4% acima e abaixo para a linha não encostar na borda. */
const RANGE_MARGIN = 0.04;
/** Igual ao `font-size` de `.label`; usado para estimar largura e colisões. */
const LABEL_SIZE = 9;
/** Largura média de um caractere na fonte monoespaçada, em unidades do viewBox. */
const CHAR_WIDTH = LABEL_SIZE * 0.6;

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const PLOT_LEFT = PAD_LEFT;
const PLOT_RIGHT = WIDTH - PAD_RIGHT;
const PLOT_BOTTOM = HEIGHT - PAD_BOTTOM;

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
  const usableX = PLOT_RIGHT - PLOT_LEFT;
  const usableY = PLOT_BOTTOM - PAD_TOP;

  return {
    x: (index) =>
      points.length === 1 ? (PLOT_LEFT + PLOT_RIGHT) / 2 : PLOT_LEFT + (index * usableX) / (points.length - 1),
    y: (value) => PAD_TOP + usableY - ((value - from) / (to - from)) * usableY,
  };
}

type Anchor = "start" | "middle" | "end";

/**
 * Ancora um rótulo perto do x do seu marcador, grudando na borda da área do
 * gráfico quando o texto estimado passaria do viewBox.
 */
function anchorLabel(x: number, text: string): { x: number; anchor: Anchor } {
  const half = (text.length * CHAR_WIDTH) / 2;
  if (x - half < PLOT_LEFT) return { x: PLOT_LEFT, anchor: "start" };
  if (x + half > PLOT_RIGHT) return { x: PLOT_RIGHT, anchor: "end" };
  return { x, anchor: "middle" };
}

/**
 * Até três marcas de mês, na virada de cada mês da série. Com mais meses que
 * isso mantém o primeiro, o do meio e o último, para não poluir no celular.
 */
function monthTicks(points: SeriesPoint[]): Array<{ index: number; label: string }> {
  const ticks: Array<{ index: number; label: string }> = [];
  let lastMonth = -1;

  points.forEach((point, index) => {
    const parsed = parseCalendarDate(point.date);
    if (!parsed || parsed.month === lastMonth) return;
    lastMonth = parsed.month;
    ticks.push({ index, label: MONTHS_PT[parsed.month - 1] });
  });

  if (ticks.length <= 3) return ticks;
  return [ticks[0], ticks[Math.floor((ticks.length - 1) / 2)], ticks[ticks.length - 1]];
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

  const minText = `${formatBrl(min.value, decimals)} · ${formatShortDate(min.date)}`;
  const maxText = `${formatBrl(max.value, decimals)} · ${formatShortDate(max.date)}`;
  const minLabel = anchorLabel(project.x(minIndex), minText);
  const maxLabel = anchorLabel(project.x(maxIndex), maxText);

  const minY = project.y(min.value);
  const maxY = project.y(max.value);
  const averageY = project.y(average);
  // Omite o valor da média no eixo y quando ele encostaria na mínima ou na máxima.
  const showAverageAxis =
    Math.abs(averageY - minY) > LABEL_SIZE && Math.abs(averageY - maxY) > LABEL_SIZE;

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const usable = (ratio * WIDTH - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT);
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
          x1={PLOT_LEFT}
          x2={PLOT_RIGHT}
          y1={averageY}
          y2={averageY}
        />
        <polyline className={styles.line} data-testid="rate-line" points={polyline} />

        <g data-testid="rate-axis-y">
          <text className={styles.axis} x={PLOT_LEFT - 5} y={maxY + 3} textAnchor="end">
            {formatBrl(max.value, decimals)}
          </text>
          {showAverageAxis && (
            <text className={styles.axis} x={PLOT_LEFT - 5} y={averageY + 3} textAnchor="end">
              {formatBrl(average, decimals)}
            </text>
          )}
          <text className={styles.axis} x={PLOT_LEFT - 5} y={minY + 3} textAnchor="end">
            {formatBrl(min.value, decimals)}
          </text>
        </g>

        <g data-testid="rate-axis-x">
          {monthTicks(points).map((tick) => {
            const placed = anchorLabel(project.x(tick.index), tick.label);
            return (
              <text
                key={tick.label}
                className={styles.axis}
                x={placed.x}
                y={HEIGHT - 6}
                textAnchor={placed.anchor}
              >
                {tick.label}
              </text>
            );
          })}
        </g>

        <circle className={styles.marker} cx={project.x(minIndex)} cy={minY} r={2} />
        <circle className={styles.marker} cx={project.x(maxIndex)} cy={maxY} r={2} />

        {/* Durante o toque/hover o leitor do dia ocupa o topo: esconder os
            rótulos de mínima e máxima evita texto sobreposto no celular. */}
        {!hovered && (
          <>
            <text
              className={styles.label}
              data-testid="rate-min-label"
              x={minLabel.x}
              y={HEIGHT - 17}
              textAnchor={minLabel.anchor}
            >
              {minText}
            </text>
            <text
              className={styles.label}
              data-testid="rate-max-label"
              x={maxLabel.x}
              y={11}
              textAnchor={maxLabel.anchor}
            >
              {maxText}
            </text>
          </>
        )}

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
              y1={PAD_TOP}
              y2={PLOT_BOTTOM}
            />
            <text className={styles.readout} x={PLOT_RIGHT} y={11} textAnchor="end">
              {`${formatShortDate(hovered.date)} · ${formatBrl(hovered.value, decimals)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
