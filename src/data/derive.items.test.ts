import { describe, expect, it } from "vitest";
import { collectItems } from "./derive";
import { normalizeLodging } from "./trip";
import { makeActivity, makeBookingItem, makeLodgingItem, makeStay, makeTransferItem, makeTrip } from "../test/fixtures";

describe("collectItems (stay)", () => {
  it("UT-080: returns lodging + transfer + attraction items with status/value", () => {
    const stay = makeStay({
      lodging: [makeLodgingItem({ id: "l1", status: "comprado" })],
      transfer: [makeTransferItem({ id: "t1", status: "pendente" })],
      itinerary: [
        makeActivity({
          id: "a1",
          kind: "atracao",
          status: "pendente",
          value: 26,
          currency: "EUR",
          title: "Schönbrunn",
        }),
        makeActivity({ id: "a2", kind: "refeicao", title: "Almoço" }),
      ],
    });
    const items = collectItems(stay);
    expect(items.map((i) => i.id)).toEqual(["l1", "t1", "a1"]);
  });

  it("UT-081: an unexpected status ('talvez') normalizes to pendente with a warning", () => {
    const lodging = normalizeLodging({ nome: "Hotel", status: "talvez" }, "cidade", 0);
    expect(lodging.status).toBe("pendente");
    expect(lodging.warnings.some((w) => w.includes("desconhecido"))).toBe(true);

    const stay = makeStay({ lodging: [lodging] });
    expect(collectItems(stay)[0].status).toBe("pendente");
  });

  it("UT-082: item without status defaults to pendente", () => {
    const stay = makeStay({
      itinerary: [makeActivity({ id: "a1", kind: "atracao", status: undefined })],
    });
    const items = collectItems(stay);
    expect(items[0].status).toBe("pendente");
  });
});

describe("collectItems (trip)", () => {
  it("UT-090: general items are included for the home", () => {
    const trip = makeTrip({ generalItems: [makeBookingItem({ id: "g1" })] });
    const items = collectItems(trip);
    expect(items.map((i) => i.id)).toContain("g1");
  });

  it("UT-091: no general items leaves the section input empty", () => {
    const trip = makeTrip({ generalItems: [] });
    expect(collectItems(trip)).toEqual([]);
  });

  it("UT-092: an item is never counted twice even if ids collide across contexts", () => {
    const stay = makeStay({ lodging: [makeLodgingItem({ id: "shared" })] });
    const trip = makeTrip({ stays: [stay], generalItems: [makeBookingItem({ id: "shared" })] });
    const items = collectItems(trip);
    expect(items.filter((i) => i.id === "shared")).toHaveLength(1);
  });
});
