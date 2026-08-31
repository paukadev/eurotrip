import { describe, expect, it, vi, afterEach } from "vitest";
import { loadTrip } from "./trip";

function stubFetch(body: string, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadTrip", () => {
  it("UT-100: an unknown extra field is ignored, parse succeeds", async () => {
    stubFetch(
      JSON.stringify({
        title: "Eurotrip",
        somethingUnexpected: "value",
        destinos: [{ name: "Berlin", extraField: 123 }],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.title).toBe("Eurotrip");
      expect(result.trip.stays[0].name).toBe("Berlin");
    }
  });

  it("UT-101: syntactically invalid JSON returns a fatal error, never throws", async () => {
    stubFetch("{ not valid json");
    const result = await loadTrip();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-json");
    }
  });

  it("UT-102: fetch rejects / 404 returns a fatal 'not found' error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })));
    const result = await loadTrip();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("not-found");
    }
  });

  it("UT-102b: a network-level fetch rejection is also a fatal error, no throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await loadTrip();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("network");
    }
  });

  it("UT-103: an empty body ([] or {}) is a non-fatal empty state", async () => {
    stubFetch("[]");
    const resultArray = await loadTrip();
    expect(resultArray.ok).toBe(true);
    if (resultArray.ok) expect(resultArray.trip.stays).toEqual([]);

    stubFetch("{}");
    const resultObject = await loadTrip();
    expect(resultObject.ok).toBe(true);
    if (resultObject.ok) expect(resultObject.trip.stays).toEqual([]);
  });

  it("UT-104: an unrecognized date format is treated as absent, no 'Invalid Date' string", async () => {
    stubFetch(
      JSON.stringify({
        destinos: [{ name: "Viena", inicioData: "32/13/2026" }],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays[0].startDate).toBeUndefined();
      expect(result.warnings.some((w) => w.includes("não reconhecida"))).toBe(true);
      expect(JSON.stringify(result.trip)).not.toContain("Invalid Date");
    }
  });

  it("UT-120: a stay missing 'name' is excluded, with a warning; valid stays are retained", async () => {
    stubFetch(
      JSON.stringify({
        destinos: [{ inicioData: "2026-12-20" }, { name: "Berlin", inicioData: "2026-12-21" }],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays).toHaveLength(1);
      expect(result.trip.stays[0].name).toBe("Berlin");
      expect(result.warnings.some((w) => w.includes("sem"))).toBe(true);
    }
  });

  it("UT-121: status defaults and unknown-field tolerance apply during parse", async () => {
    stubFetch(
      JSON.stringify({
        weirdTopLevelField: true,
        destinos: [
          {
            name: "Praga",
            hospedagens: [{ nome: "Hotel", weirdField: 1 }],
          },
        ],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays[0].lodging[0].status).toBe("pendente");
    }
  });

  it("UT-122: slugs assigned during normalization are unique across all stays", async () => {
    stubFetch(
      JSON.stringify({
        destinos: [
          { name: "Viena", inicioData: "2026-12-28" },
          { name: "Bratislava", inicioData: "2026-12-30" },
          { name: "Viena", inicioData: "2027-01-01" },
        ],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      const slugs = result.trip.stays.map((s) => s.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("UT-123: stays are returned already chronologically ordered", async () => {
    stubFetch(
      JSON.stringify({
        destinos: [
          { name: "Praga", inicioData: "2027-01-01" },
          { name: "Berlin", inicioData: "2026-12-15" },
        ],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.stays.map((s) => s.name)).toEqual(["Berlin", "Praga"]);
    }
  });

  it("UT-124: an invalid value (-5 or non-numeric) is normalized out of sums, with a warning", async () => {
    stubFetch(
      JSON.stringify({
        generalItems: [
          { kind: "translado", title: "Voo", value: -5 },
          { kind: "translado", title: "Seguro", value: "x" },
        ],
      }),
    );
    const result = await loadTrip();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trip.generalItems.every((item) => item.value === undefined)).toBe(true);
      expect(result.warnings.some((w) => w.includes("inválido"))).toBe(true);
    }
  });
});
