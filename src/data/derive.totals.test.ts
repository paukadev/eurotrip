import { describe, expect, it } from "vitest";
import { consolidatedTotals } from "./derive";
import { makeBookingItem, makeLodgingItem, makeStay, makeTransferItem, makeTrip } from "../test/fixtures";

describe("consolidatedTotals", () => {
  it("UT-030: counts bought/pending across stays + general items", () => {
    const stay = makeStay({
      slug: "s1",
      lodging: [
        makeLodgingItem({ id: "l1", status: "comprado" }),
        makeLodgingItem({ id: "l2", status: "comprado" }),
      ],
      transfer: [makeTransferItem({ id: "t1", status: "pendente" })],
    });
    const trip = makeTrip({
      stays: [stay],
      generalItems: [
        makeBookingItem({ id: "g1", status: "comprado" }),
        makeBookingItem({ id: "g2", status: "comprado" }),
        makeBookingItem({ id: "g3", status: "comprado" }),
        makeBookingItem({ id: "g4", status: "pendente" }),
        makeBookingItem({ id: "g5", status: "pendente" }),
      ],
    });
    const totals = consolidatedTotals(trip);
    expect(totals.bought).toBe(5);
    expect(totals.pending).toBe(3);
  });

  it("UT-031: valuedItems/totalItems reflect how many entered the sum", () => {
    const trip = makeTrip({
      generalItems: [
        makeBookingItem({ id: "g1", value: 100, currency: "EUR" }),
        makeBookingItem({ id: "g2" }),
      ],
    });
    const totals = consolidatedTotals(trip);
    expect(totals.valuedItems).toBe(1);
    expect(totals.totalItems).toBe(2);
  });

  it("UT-032: no items yields zeroed counts, no currency totals, no NaN", () => {
    const totals = consolidatedTotals(makeTrip());
    expect(totals).toEqual({
      bought: 0,
      pending: 0,
      byCurrency: {},
      valuedItems: 0,
      totalItems: 0,
    });
  });

  it("UT-033: keeps EUR and BRL sums separate, never mixed", () => {
    const trip = makeTrip({
      generalItems: [
        makeBookingItem({ id: "g1", value: 100, currency: "EUR", status: "comprado" }),
        makeBookingItem({ id: "g2", value: 500, currency: "BRL", status: "comprado" }),
      ],
    });
    const totals = consolidatedTotals(trip);
    expect(totals.byCurrency.EUR).toEqual({ bought: 100, pending: 0 });
    expect(totals.byCurrency.BRL).toEqual({ bought: 500, pending: 0 });
  });

  it("UT-034: invalid value is excluded from sums with a warning, count unaffected", () => {
    const trip = makeTrip({
      generalItems: [
        makeBookingItem({ id: "g1", value: undefined, warnings: ["Valor inválido"] }),
      ],
    });
    const totals = consolidatedTotals(trip);
    expect(totals.valuedItems).toBe(0);
    expect(totals.totalItems).toBe(1);
    expect(totals.byCurrency).toEqual({});
  });

  it("UT-035: all items bought yields pending:0", () => {
    const trip = makeTrip({
      generalItems: [
        makeBookingItem({ id: "g1", status: "comprado" }),
        makeBookingItem({ id: "g2", status: "comprado" }),
      ],
    });
    const totals = consolidatedTotals(trip);
    expect(totals.pending).toBe(0);
  });
});
