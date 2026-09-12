import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RateChart } from "./RateChart";
import { summarize, type SeriesPoint } from "../../data/exchangeStats";

// jsdom não implementa PointerEvent: sem isso, fireEvent.pointerMove cai para um
// Event genérico e perde propriedades como clientX, quebrando o teste de hover.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  // @ts-expect-error polyfill mínimo apenas para o ambiente de testes
  window.PointerEvent = PointerEventPolyfill;
}

const points: SeriesPoint[] = [
  { date: "2026-09-08", value: 6.0 },
  { date: "2026-09-09", value: 6.2 },
  { date: "2026-09-10", value: 5.8 },
  { date: "2026-09-11", value: 5.9 },
];

function renderChart(series: SeriesPoint[] = points) {
  const summary = summarize(series);
  if (!summary) throw new Error("fixture inválida");
  return render(
    <RateChart
      points={series}
      average={summary.average}
      min={summary.min}
      max={summary.max}
      decimals={2}
      ariaLabel="Euro nos últimos 90 dias"
    />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RateChart", () => {
  it("desenha um ponto da linha para cada dia", () => {
    renderChart();
    const line = screen.getByTestId("rate-line");
    expect(line.getAttribute("points")?.trim().split(/\s+/)).toHaveLength(4);
  });

  it("descreve o gráfico para leitores de tela", () => {
    renderChart();
    expect(screen.getByRole("img", { name: "Euro nos últimos 90 dias" })).toBeInTheDocument();
  });

  it("marca mínima e máxima com valor e data", () => {
    renderChart();
    expect(screen.getByText("5,80 · 10/09")).toBeInTheDocument();
    expect(screen.getByText("6,20 · 09/09")).toBeInTheDocument();
  });

  it("ancora o rótulo da máxima perto do marcador dela, não na borda esquerda", () => {
    // Máxima no último dia: o rótulo tem de ir para a direita.
    renderChart([
      { date: "2026-09-08", value: 5.8 },
      { date: "2026-09-09", value: 5.9 },
      { date: "2026-09-10", value: 6.0 },
      { date: "2026-09-11", value: 6.4 },
    ]);

    const maxLabel = screen.getByTestId("rate-max-label");
    const minLabel = screen.getByTestId("rate-min-label");
    expect(maxLabel).toHaveTextContent("6,40 · 11/09");
    expect(maxLabel).toHaveAttribute("text-anchor", "end");
    expect(Number(maxLabel.getAttribute("x"))).toBeGreaterThan(Number(minLabel.getAttribute("x")));
    expect(minLabel).toHaveAttribute("text-anchor", "start");
  });

  it("mantém os rótulos dentro do viewBox", () => {
    renderChart();
    for (const testId of ["rate-min-label", "rate-max-label"]) {
      const x = Number(screen.getByTestId(testId).getAttribute("x"));
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(320);
    }
  });

  it("rotula o eixo y com mínima, média e máxima", () => {
    // Média exata de 6,00 entre mínima 5,60 e máxima 6,40.
    renderChart([
      { date: "2026-09-08", value: 6.0 },
      { date: "2026-09-09", value: 6.4 },
      { date: "2026-09-10", value: 5.6 },
      { date: "2026-09-11", value: 6.0 },
    ]);

    const axis = screen.getByTestId("rate-axis-y");
    expect(axis.querySelectorAll("text")).toHaveLength(3);
    expect(axis).toHaveTextContent("5,60");
    expect(axis).toHaveTextContent("6,00");
    expect(axis).toHaveTextContent("6,40");
  });

  it("marca os meses no eixo x, abreviados em português", () => {
    const spanning: SeriesPoint[] = [
      { date: "2026-06-15", value: 6.0 },
      { date: "2026-07-15", value: 6.2 },
      { date: "2026-08-14", value: 5.8 },
      { date: "2026-09-11", value: 5.9 },
    ];
    renderChart(spanning);

    const axis = screen.getByTestId("rate-axis-x");
    expect(axis).toHaveTextContent("jun");
    expect(axis).toHaveTextContent("set");
    // No máximo três marcas, para não poluir a largura de celular.
    expect(axis.querySelectorAll("text")).toHaveLength(3);
  });

  it("mostra a linha da média", () => {
    renderChart();
    expect(screen.getByTestId("rate-average")).toBeInTheDocument();
  });

  it("mostra o valor do dia sob o cursor", () => {
    renderChart();
    const svg = screen.getByTestId("rate-svg");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 400,
      top: 0,
      height: 150,
      right: 400,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerMove(svg, { clientX: 400 });
    expect(screen.getByTestId("rate-readout")).toHaveTextContent("11/09");
    expect(screen.getByTestId("rate-readout")).toHaveTextContent("5,90");

    fireEvent.pointerLeave(svg);
    expect(screen.queryByTestId("rate-readout")).not.toBeInTheDocument();
  });

  it("não quebra com um único ponto", () => {
    renderChart([{ date: "2026-09-11", value: 5.9 }]);
    expect(screen.getByTestId("rate-svg")).toBeInTheDocument();
  });

  it("não renderiza nada sem pontos", () => {
    const summary = { average: 0, min: { date: "", value: 0 }, max: { date: "", value: 0 } };
    const { container } = render(
      <RateChart
        points={[]}
        average={summary.average}
        min={summary.min}
        max={summary.max}
        decimals={2}
        ariaLabel="vazio"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
