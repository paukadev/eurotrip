import { describe, expect, it } from "vitest";
import { groupItineraryByDay } from "./derive";
import { date, makeActivity, makeStay } from "../test/fixtures";

describe("groupItineraryByDay", () => {
  it("UT-070: groups activities per day, ordered by time within each day", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-30"),
      itinerary: [
        makeActivity({ id: "a1", date: date("2026-12-29"), time: "15:00", title: "Tarde" }),
        makeActivity({ id: "a2", date: date("2026-12-29"), time: "09:00", title: "Manhã" }),
        makeActivity({ id: "a3", date: date("2026-12-28"), time: "10:00", title: "Dia 1" }),
      ],
    });
    const groups = groupItineraryByDay(stay);
    expect(groups).toHaveLength(3);
    expect(groups[1].activities.map((a) => a.title)).toEqual(["Manhã", "Tarde"]);
  });

  it("UT-071: attraction activity carries status/value through grouping", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-28"),
      itinerary: [
        makeActivity({
          id: "a1",
          date: date("2026-12-28"),
          kind: "atracao",
          status: "pendente",
          value: 26,
          currency: "EUR",
        }),
      ],
    });
    const groups = groupItineraryByDay(stay);
    expect(groups[0].activities[0]).toMatchObject({ status: "pendente", value: 26, currency: "EUR" });
  });

  it("UT-072: an out-of-range activity is placed in the outOfRange group, not dropped", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-29"),
      itinerary: [makeActivity({ id: "a1", date: date("2027-01-05"), title: "Fora" })],
    });
    const groups = groupItineraryByDay(stay);
    const outOfRange = groups.find((g) => g.outOfRange);
    expect(outOfRange?.activities.map((a) => a.title)).toEqual(["Fora"]);
  });

  it("UT-073: two activities at the same time are both retained, stable order", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-28"),
      itinerary: [
        makeActivity({ id: "a1", date: date("2026-12-28"), time: "10:00", title: "Primeira" }),
        makeActivity({ id: "a2", date: date("2026-12-28"), time: "10:00", title: "Segunda" }),
      ],
    });
    const groups = groupItineraryByDay(stay);
    expect(groups[0].activities.map((a) => a.title)).toEqual(["Primeira", "Segunda"]);
  });

  it("UT-074: an activity without horario falls into the no-time bucket within its day", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-28"),
      itinerary: [
        makeActivity({ id: "a1", date: date("2026-12-28"), time: "10:00", title: "Com horário" }),
        makeActivity({ id: "a2", date: date("2026-12-28"), title: "Sem horário" }),
      ],
    });
    const groups = groupItineraryByDay(stay);
    expect(groups[0].activities.map((a) => a.title)).toEqual(["Com horário", "Sem horário"]);
  });

  it("UT-075: a 1-day stay produces a single day group without crashing", () => {
    const stay = makeStay({
      startDate: date("2026-12-28"),
      endDate: date("2026-12-28"),
      itinerary: [makeActivity({ id: "a1", date: date("2026-12-28") })],
    });
    const groups = groupItineraryByDay(stay);
    expect(groups).toHaveLength(1);
  });
});
