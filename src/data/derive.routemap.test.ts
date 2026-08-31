import { describe, expect, it } from "vitest";
import { projectRoute } from "./derive";
import { makeStay } from "../test/fixtures";

describe("projectRoute", () => {
  it("UT-020: projects N coords into a viewBox, points in chronological order", () => {
    const stays = [
      makeStay({ slug: "berlin", name: "Berlin", coords: { lat: 52.52, lon: 13.405 } }),
      makeStay({ slug: "cracovia", name: "Cracóvia", coords: { lat: 50.06, lon: 19.94 } }),
      makeStay({ slug: "budapeste", name: "Budapeste", coords: { lat: 47.49, lon: 19.04 } }),
    ];
    const result = projectRoute(stays);
    expect(result.points.map((p) => p.slug)).toEqual(["berlin", "cracovia", "budapeste"]);
    expect(result.viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  it("UT-021: a stay without coords is omitted, others plotted, warning present", () => {
    const stays = [
      makeStay({ slug: "berlin", name: "Berlin", coords: { lat: 52.52, lon: 13.405 } }),
      makeStay({ slug: "praga", name: "Praga" }),
    ];
    const result = projectRoute(stays);
    expect(result.points.map((p) => p.slug)).toEqual(["berlin"]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("UT-022: no stay has coords returns empty geometry", () => {
    const stays = [makeStay({ slug: "berlin" }), makeStay({ slug: "praga" })];
    const result = projectRoute(stays);
    expect(result.points).toEqual([]);
  });

  it("UT-023: an out-of-range coordinate is treated as absent, with warning", () => {
    const stays = [
      makeStay({ slug: "berlin", name: "Berlin", coords: { lat: 52.52, lon: 13.405 } }),
      makeStay({ slug: "invalido", name: "Inválido", coords: { lat: 120, lon: 20 } }),
    ];
    const result = projectRoute(stays);
    expect(result.points.map((p) => p.slug)).toEqual(["berlin"]);
    expect(result.warnings.some((w) => w.includes("Inválido"))).toBe(true);
  });
});
