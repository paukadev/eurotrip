import { describe, expect, it, vi, afterEach } from "vitest";
import { normalizeTransfer, loadTrip } from "./trip";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeTransfer", () => {
  it("UT-060: maps modo/horario/chegada/status/valor", () => {
    const item = normalizeTransfer(
      { modo: "trem", chegada: "Bratislava", horario: "2026-12-30T09:15", status: "pendente", valor: 40, moeda: "EUR" },
      "viena-1",
      0,
    );
    expect(item).toMatchObject({
      mode: "trem",
      arrival: "Bratislava",
      time: "2026-12-30T09:15",
      status: "pendente",
      value: 40,
      currency: "EUR",
    });
  });

  it("UT-061: the last stay with no translados[] has no outbound transfer", async () => {
    const body = JSON.stringify({
      destinos: [{ name: "Berlin", inicioData: "2027-01-02", fimData: "2027-01-05" }],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays[0].transfer).toEqual([]);
    }
  });

  it("UT-062: transfer without horario shows 'a definir' upstream, status still present", () => {
    const item = normalizeTransfer({ modo: "voo", status: "pendente" }, "s", 0);
    expect(item.time).toBeUndefined();
    expect(item.status).toBe("pendente");
  });

  it("UT-063: chegada mismatched with the next stay's name renders as-is, no crash", () => {
    const item = normalizeTransfer({ modo: "trem", chegada: "Lisboa" }, "s", 0);
    expect(item.arrival).toBe("Lisboa");
  });
});
