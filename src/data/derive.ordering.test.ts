import { describe, expect, it } from "vitest";
import { orderedStays, tripDuration, findStayBySlug } from "./derive";
import { assignSlugs } from "./slug";
import { date, makeStay, makeTrip } from "../test/fixtures";

describe("orderedStays", () => {
  it("UT-001: sorts stays ascending by startDate", () => {
    const a = makeStay({ slug: "a", startDate: date("2026-12-25") });
    const b = makeStay({ slug: "b", startDate: date("2026-12-20") });
    const c = makeStay({ slug: "c", startDate: date("2027-01-02") });
    const result = orderedStays([a, b, c]);
    expect(result.map((s) => s.slug)).toEqual(["b", "a", "c"]);
  });

  it("UT-003: returns [] for an empty stays array", () => {
    expect(orderedStays([])).toEqual([]);
  });

  it("UT-004: equal startDate keeps original file order (stable tie-break)", () => {
    const a = makeStay({ slug: "a", startDate: date("2026-12-20") });
    const b = makeStay({ slug: "b", startDate: date("2026-12-20") });
    const result = orderedStays([a, b]);
    expect(result.map((s) => s.slug)).toEqual(["a", "b"]);
  });

  it("UT-005: flags overlap without dropping either stay", () => {
    const a = makeStay({
      slug: "a",
      startDate: date("2026-12-20"),
      endDate: date("2026-12-27"),
    });
    const b = makeStay({
      slug: "b",
      startDate: date("2026-12-25"),
      endDate: date("2026-12-30"),
    });
    const result = orderedStays([a, b]);
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.slug === "a")?.overlap).toBe(true);
    expect(result.find((s) => s.slug === "b")?.overlap).toBe(false);
  });

  it("UT-006: sorts and returns all 120 stays", () => {
    const stays = Array.from({ length: 120 }, (_, i) =>
      makeStay({ slug: `s${i}`, startDate: date("2026-12-20") }),
    ).reverse();
    const result = orderedStays(stays);
    expect(result).toHaveLength(120);
  });
});

describe("tripDuration", () => {
  it("UT-002: computes inclusive duration from first start to last end", () => {
    const stays = [
      makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-25") }),
      makeStay({ startDate: date("2026-12-26"), endDate: date("2027-01-05") }),
    ];
    expect(tripDuration(stays)).toBe(17);
  });
});

describe("assignSlugs (UT-110)", () => {
  it("suffixes repeated names chronologically and normalizes accents", () => {
    const result = assignSlugs([{ name: "Viena" }, { name: "Bratislava" }, { name: "Viena" }]);
    expect(result.map((r) => r.slug)).toEqual(["viena-1", "bratislava", "viena-2"]);
  });

  it("normalizes accented names", () => {
    const result = assignSlugs([{ name: "Cracóvia" }]);
    expect(result[0].slug).toBe("cracovia");
  });

  it("deduplicates an explicit duplicate slug with a warning", () => {
    const result = assignSlugs([
      { name: "Berlin", explicitSlug: "berlin" },
      { name: "Berlim", explicitSlug: "berlin" },
    ]);
    expect(result[0].slug).toBe("berlin");
    expect(result[1].slug).not.toBe("berlin");
    expect(result[1].warning).toBeDefined();
  });
});

describe("findStayBySlug (UT-040)", () => {
  it("returns undefined for an unknown slug", () => {
    const trip = makeTrip({ stays: [makeStay({ slug: "viena-2" })] });
    expect(findStayBySlug(trip, "lisboa")).toBeUndefined();
  });

  it("returns the matching stay for a known slug", () => {
    const stay = makeStay({ slug: "viena-2" });
    const trip = makeTrip({ stays: [stay] });
    expect(findStayBySlug(trip, "viena-2")).toBe(stay);
  });
});
