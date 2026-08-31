import { describe, expect, it } from "vitest";
import { countdownState } from "./derive";
import { date, makeStay, makeTrip } from "../test/fixtures";

describe("countdownState", () => {
  it("UT-010: before phase computes days remaining", () => {
    const trip = makeTrip({
      stays: [makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-27") })],
    });
    expect(countdownState(trip, date("2026-12-01"))).toEqual({ phase: "before", days: 19 });
  });

  it("UT-011: during phase computes dayN/total", () => {
    const trip = makeTrip({
      stays: [makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-27") })],
    });
    const result = countdownState(trip, date("2026-12-22"));
    expect(result).toEqual({ phase: "during", dayN: 3, total: 8 });
  });

  it("UT-012: after phase once today is past the last endDate", () => {
    const trip = makeTrip({
      stays: [makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-27") })],
    });
    expect(countdownState(trip, date("2027-01-01"))).toEqual({ phase: "after" });
  });

  it("UT-013: today === start renders before with days:0", () => {
    const trip = makeTrip({
      stays: [makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-27") })],
    });
    expect(countdownState(trip, date("2026-12-20"))).toEqual({ phase: "before", days: 0 });
  });

  it("UT-014: no valid dates anywhere returns unknown, never NaN", () => {
    const trip = makeTrip({ stays: [makeStay({})] });
    expect(countdownState(trip, date("2026-12-01"))).toEqual({ phase: "unknown" });
  });

  it("UT-015: calendar-date math avoids timezone ±1 day drift", () => {
    const trip = makeTrip({
      stays: [makeStay({ startDate: date("2026-12-20"), endDate: date("2026-12-27") })],
    });
    const nearMidnightUTCMinus3 = date("2026-12-19");
    expect(countdownState(trip, nearMidnightUTCMinus3)).toEqual({ phase: "before", days: 1 });
  });
});
