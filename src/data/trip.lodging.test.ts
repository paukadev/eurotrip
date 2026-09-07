import { describe, expect, it, vi, afterEach } from "vitest";
import { normalizeLodging, normalizeMapUrl, loadTrip } from "./trip";

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

describe("normalizeMapUrl", () => {
  it("keeps an absolute https map link", () => {
    const url = "https://www.google.com/maps/place/Leonardo+Hotel+Berlin/@52.5,13.3,17z";
    expect(normalizeMapUrl(url)).toEqual({ mapUrl: url });
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeMapUrl("  https://maps.app.goo.gl/abc  ")).toEqual({
      mapUrl: "https://maps.app.goo.gl/abc",
    });
  });

  it("returns nothing when the field is absent or empty", () => {
    expect(normalizeMapUrl(undefined)).toEqual({});
    expect(normalizeMapUrl("")).toEqual({});
  });

  it("drops non-http(s) or malformed links with a warning", () => {
    for (const bad of ["javascript:alert(1)", "/maps/place", 42]) {
      const result = normalizeMapUrl(bad);
      expect(result.mapUrl).toBeUndefined();
      expect(result.warning).toMatch(/Link de mapa inválido/);
    }
  });
});

describe("normalizeLodging map link", () => {
  it("exposes mapa as mapUrl on the lodging item", () => {
    const item = normalizeLodging(
      { nome: "Hotel X", mapa: "https://maps.google.com/?q=hotel" },
      "berlin-1",
      0,
    );
    expect(item.mapUrl).toBe("https://maps.google.com/?q=hotel");
    expect(item.warnings).toEqual([]);
  });

  it("drops an invalid mapa and warns", () => {
    const item = normalizeLodging({ nome: "Hotel X", mapa: "javascript:alert(1)" }, "s", 0);
    expect(item.mapUrl).toBeUndefined();
    expect(item.warnings).toHaveLength(1);
  });
});
