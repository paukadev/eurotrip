import { describe, expect, it } from "vitest";
import { parseCalendarDate, diffInDays } from "./calendar";

describe("calendar", () => {
  it("parses a valid YYYY-MM-DD date", () => {
    expect(parseCalendarDate("2026-12-20")).toEqual({ year: 2026, month: 12, day: 20 });
  });

  it("rejects an unparseable date without throwing", () => {
    expect(parseCalendarDate("32/13/2026")).toBeUndefined();
  });

  it("rejects a calendar-invalid date (Feb 30)", () => {
    expect(parseCalendarDate("2026-02-30")).toBeUndefined();
  });

  it("computes day differences across a month boundary without drift", () => {
    const from = parseCalendarDate("2026-12-20")!;
    const to = parseCalendarDate("2027-01-05")!;
    expect(diffInDays(from, to)).toBe(16);
  });
});
