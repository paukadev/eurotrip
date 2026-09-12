import { describe, expect, it } from "vitest";
import {
  CURRENCIES,
  formatBrl,
  formatPercent,
  formatShortDate,
  sliceByDays,
  summarize,
  toBrlSeries,
  type SeriesPoint,
} from "./exchangeStats";

function series(values: Array<[string, number]>): SeriesPoint[] {
  return values.map(([date, value]) => ({ date, value }));
}

describe("toBrlSeries", () => {
  it("inverte moeda-por-real em reais-por-unidade", () => {
    const result = toBrlSeries([{ date: "2026-09-11", perBrl: 0.16879 }], 1);
    expect(result[0].value).toBeCloseTo(5.9245, 3);
  });

  it("aplica a unidade de exibição de 100 para o florim", () => {
    const result = toBrlSeries([{ date: "2026-09-11", perBrl: 61.517 }], 100);
    expect(result[0].value).toBeCloseTo(1.6256, 3);
  });

  it("descarta dias com cotação zero, negativa ou não finita", () => {
    const result = toBrlSeries(
      [
        { date: "2026-09-10", perBrl: 0 },
        { date: "2026-09-11", perBrl: -1 },
        { date: "2026-09-14", perBrl: Number.NaN },
        { date: "2026-09-15", perBrl: 0.17 },
      ],
      1,
    );
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-09-15");
  });
});

describe("sliceByDays", () => {
  const points = series([
    ["2026-06-15", 6.0],
    ["2026-08-14", 6.1],
    ["2026-09-04", 5.9],
    ["2026-09-11", 5.92],
  ]);

  it("mantém apenas os dias dentro da janela, contada a partir do último dia", () => {
    expect(sliceByDays(points, 30).map((p) => p.date)).toEqual(["2026-08-14", "2026-09-04", "2026-09-11"]);
  });

  it("devolve toda a série quando a janela é maior que os dados", () => {
    expect(sliceByDays(points, 180)).toHaveLength(4);
  });

  it("devolve vazio para série vazia", () => {
    expect(sliceByDays([], 90)).toEqual([]);
  });
});

describe("summarize", () => {
  it("calcula mínima, máxima, média e diferença para a média", () => {
    const result = summarize(series([
      ["2026-09-08", 6.0],
      ["2026-09-09", 6.2],
      ["2026-09-10", 5.8],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.min.value).toBe(5.8);
    expect(result?.min.date).toBe("2026-09-10");
    expect(result?.max.value).toBe(6.2);
    expect(result?.average).toBeCloseTo(6.0, 5);
    expect(result?.current.date).toBe("2026-09-11");
    expect(result?.diffFromAverage).toBeCloseTo(0, 5);
    expect(result?.dayCount).toBe(4);
  });

  it("dá selo 'bom' quando hoje está entre os 25% mais baratos (limite 0,75)", () => {
    const result = summarize(series([
      ["2026-09-08", 6.1],
      ["2026-09-09", 6.2],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.75, 5);
    expect(result?.verdict).toBe("bom");
  });

  it("dá selo 'caro' no limite de 0,25", () => {
    const result = summarize(series([
      ["2026-09-08", 5.8],
      ["2026-09-09", 5.9],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.25, 5);
    expect(result?.verdict).toBe("caro");
  });

  it("dá selo 'media' entre os dois limites", () => {
    const result = summarize(series([
      ["2026-09-08", 5.8],
      ["2026-09-09", 6.2],
      ["2026-09-10", 6.3],
      ["2026-09-11", 6.0],
    ]));
    expect(result?.cheaperShare).toBeCloseTo(0.5, 5);
    expect(result?.verdict).toBe("media");
  });

  it("não dá selo quando há um único dia", () => {
    const result = summarize(series([["2026-09-11", 6.0]]));
    expect(result?.current.value).toBe(6.0);
    expect(result?.verdict).toBeUndefined();
    expect(result?.dayCount).toBe(1);
  });

  it("devolve undefined para série vazia", () => {
    expect(summarize([])).toBeUndefined();
  });
});

describe("formatação", () => {
  it("formata reais em pt-BR com as casas pedidas", () => {
    expect(formatBrl(5.9245, 2)).toBe("5,92");
    expect(formatBrl(0.2441, 3)).toBe("0,244");
  });

  it("formata porcentagem com uma casa e sem sinal", () => {
    expect(formatPercent(-0.0183)).toBe("1,8%");
    expect(formatPercent(0.0183)).toBe("1,8%");
  });

  it("formata data curta como dd/mm", () => {
    expect(formatShortDate("2026-08-06")).toBe("06/08");
  });

  it("devolve a string original quando a data é inválida", () => {
    expect(formatShortDate("não é data")).toBe("não é data");
  });
});

describe("CURRENCIES", () => {
  it("traz as quatro moedas do roteiro com o florim por 100 unidades", () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual(["EUR", "PLN", "CZK", "HUF"]);
    const huf = CURRENCIES.find((c) => c.code === "HUF");
    expect(huf?.unit).toBe(100);
    expect(CURRENCIES.find((c) => c.code === "CZK")?.decimals).toBe(3);
  });
});
