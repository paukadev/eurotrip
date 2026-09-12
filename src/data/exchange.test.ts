import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadRates } from "./exchange";

const NOW = Date.UTC(2026, 8, 11, 12, 0, 0); // 2026-09-11
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function apiBody() {
  return JSON.stringify({
    amount: 1,
    base: "BRL",
    start_date: "2026-09-10",
    end_date: "2026-09-11",
    rates: {
      "2026-09-11": { CZK: 4.0956, EUR: 0.16879, HUF: 61.517, PLN: 0.73 },
      "2026-09-10": { CZK: 4.0739, EUR: 0.16799, HUF: 61.274, PLN: 0.72604 },
    },
  });
}

function stubFetchOk() {
  const spy = vi.fn().mockResolvedValue(new Response(apiBody(), { status: 200 }));
  vi.stubGlobal("fetch", spy);
  return spy;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadRates", () => {
  it("busca, ordena por data crescente e devolve a última data", async () => {
    stubFetchOk();
    const result = await loadRates(NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stale).toBe(false);
    expect(result.snapshot.lastDate).toBe("2026-09-11");
    expect(result.snapshot.series.EUR.map((p) => p.date)).toEqual(["2026-09-10", "2026-09-11"]);
    expect(result.snapshot.series.EUR[1].perBrl).toBe(0.16879);
    expect(result.snapshot.series.HUF).toHaveLength(2);
  });

  it("pede 180 dias de histórico das quatro moedas", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("api.frankfurter.dev/v1/2026-03-15..");
    expect(url).toContain("base=BRL");
    expect(url).toContain("symbols=EUR,PLN,HUF,CZK");
  });

  it("usa o cache dentro de 12h sem chamar a rede", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    expect(spy).toHaveBeenCalledTimes(1);

    const second = await loadRates(NOW + TWELVE_HOURS - 1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(second.ok && second.stale).toBe(false);
  });

  it("busca de novo quando o cache passou de 12h", async () => {
    const spy = stubFetchOk();
    await loadRates(NOW);
    await loadRates(NOW + TWELVE_HOURS + 1);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("devolve o cache vencido marcado como stale quando a rede falha", async () => {
    stubFetchOk();
    await loadRates(NOW);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await loadRates(NOW + TWELVE_HOURS + 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stale).toBe(true);
    expect(result.snapshot.lastDate).toBe("2026-09-11");
  });

  it("falha sem estourar quando a rede cai e não há cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata HTTP 500 como falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("erro", { status: 500 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata JSON inválido como falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{ not json", { status: 200 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("trata resposta fora do schema como falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ base: "USD" }), { status: 200 })),
    );
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("falha quando a resposta não traz nenhuma das moedas pedidas", async () => {
    const body = JSON.stringify({ base: "BRL", rates: { "2026-09-11": { USD: 5.4 } } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("mantém as moedas presentes quando só uma delas vem na resposta", async () => {
    const body = JSON.stringify({
      base: "BRL",
      rates: {
        "2026-09-10": { EUR: 0.16799 },
        "2026-09-11": { EUR: 0.16879 },
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    const result = await loadRates(NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.series.EUR).toHaveLength(2);
    expect(result.snapshot.series.PLN).toEqual([]);
    expect(result.snapshot.series.CZK).toEqual([]);
    expect(result.snapshot.series.HUF).toEqual([]);
    expect(result.snapshot.lastDate).toBe("2026-09-11");
  });

  it("rejeita a resposta quando uma chave de data não é uma data ISO", async () => {
    const body = JSON.stringify({
      base: "BRL",
      rates: {
        "2026-09-11": { CZK: 4.0956, EUR: 0.16879, HUF: 61.517, PLN: 0.73 },
        zzz_lixo: { CZK: 1, EUR: 1, HUF: 1, PLN: 1 },
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    await expect(loadRates(NOW)).resolves.toEqual({ ok: false });
  });

  it("ignora cache corrompido e busca de novo", async () => {
    localStorage.setItem("eurotrip:rates:v1", "{ lixo");
    const spy = stubFetchOk();
    const result = await loadRates(NOW);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
  });

  it("funciona quando o localStorage lança exceção", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("acesso negado");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cota cheia");
    });
    stubFetchOk();

    const result = await loadRates(NOW);
    expect(result.ok).toBe(true);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
