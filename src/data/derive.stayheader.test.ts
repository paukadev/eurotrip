import { describe, expect, it } from "vitest";
import { stayHeader } from "./derive";
import { date, makeStay } from "../test/fixtures";

describe("stayHeader", () => {
  it("UT-041: computes duration in days from start/end", () => {
    const stays = [
      makeStay({ slug: "viena", startDate: date("2026-12-28"), endDate: date("2026-12-30") }),
    ];
    const header = stayHeader(stays, "viena");
    expect(header?.durationDays).toBe(3);
    expect(header?.inconsistentDates).toBe(false);
  });

  it("UT-042: inverted dates flag inconsistentDates, still returns available data", () => {
    const stays = [
      makeStay({ slug: "viena", startDate: date("2026-12-30"), endDate: date("2026-12-28") }),
    ];
    const header = stayHeader(stays, "viena");
    expect(header?.inconsistentDates).toBe(true);
    expect(header?.name).toBe("Cidade");
  });

  it("UT-043: missing dates leave durationDays undefined ('a definir')", () => {
    const stays = [makeStay({ slug: "viena" })];
    const header = stayHeader(stays, "viena");
    expect(header?.durationDays).toBeUndefined();
    expect(header?.inconsistentDates).toBe(false);
  });

  it("UT-044: first stay has no prev, last stay has no next", () => {
    const stays = [
      makeStay({ slug: "berlin" }),
      makeStay({ slug: "cracovia" }),
      makeStay({ slug: "praga" }),
    ];
    expect(stayHeader(stays, "berlin")).toMatchObject({ hasPrev: false, hasNext: true });
    expect(stayHeader(stays, "praga")).toMatchObject({ hasPrev: true, hasNext: false });
  });
});
