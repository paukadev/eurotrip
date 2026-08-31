import { describe, expect, it, vi, afterEach } from "vitest";
import { normalizeLodging, loadTrip } from "./trip";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeLodging", () => {
  it("UT-050: maps nome/endereco/checkin/checkout/status/valor", () => {
    const item = normalizeLodging(
      {
        nome: "Hotel X",
        endereco: "Rua Y, 123",
        checkin: "2026-12-28",
        checkout: "2026-12-30",
        status: "comprado",
        valor: 240,
        moeda: "EUR",
      },
      "viena-1",
      0,
    );
    expect(item).toMatchObject({
      title: "Hotel X",
      address: "Rua Y, 123",
      status: "comprado",
      value: 240,
      currency: "EUR",
    });
    expect(item.checkin).toEqual({ year: 2026, month: 12, day: 28 });
    expect(item.checkout).toEqual({ year: 2026, month: 12, day: 30 });
  });

  it("UT-051: a stay with no hospedagens[] yields an empty lodging array (no item counted)", async () => {
    const body = JSON.stringify({
      destinos: [{ name: "Praga", inicioData: "2026-12-30", fimData: "2027-01-02" }],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays[0].lodging).toEqual([]);
    }
  });

  it("UT-052: two lodgings each keep their own status", () => {
    const first = normalizeLodging({ nome: "Hotel A", status: "comprado" }, "s", 0);
    const second = normalizeLodging({ nome: "Hotel B", status: "pendente" }, "s", 1);
    expect(first.status).toBe("comprado");
    expect(second.status).toBe("pendente");
    expect(first.id).not.toBe(second.id);
  });

  it("UT-053: checkout before checkin sets inconsistentDates with a warning", () => {
    const item = normalizeLodging(
      { nome: "Hotel X", checkin: "2026-12-30", checkout: "2026-12-28" },
      "s",
      0,
    );
    expect(item.inconsistentDates).toBe(true);
    expect(item.warnings.length).toBeGreaterThan(0);
  });
});
