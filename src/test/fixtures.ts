import type { CalendarDate } from "../data/calendar";
import { parseCalendarDate } from "../data/calendar";
import type { Activity, BookingItem, LodgingItem, Stay, TransferItem, Trip } from "../data/trip";

export function date(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new Error(`invalid test fixture date: ${value}`);
  return parsed;
}

export function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: overrides.id ?? "item-1",
    kind: overrides.kind ?? "atracao",
    title: overrides.title ?? "Item",
    status: overrides.status ?? "pendente",
    value: overrides.value,
    currency: overrides.currency,
    warnings: overrides.warnings ?? [],
  };
}

export function makeLodgingItem(overrides: Partial<LodgingItem> = {}): LodgingItem {
  return {
    ...makeBookingItem({ kind: "hospedagem", ...overrides }),
    address: overrides.address,
    checkin: overrides.checkin,
    checkout: overrides.checkout,
    inconsistentDates: overrides.inconsistentDates ?? false,
  };
}

export function makeTransferItem(overrides: Partial<TransferItem> = {}): TransferItem {
  return {
    ...makeBookingItem({ kind: "translado", ...overrides }),
    mode: overrides.mode,
    departure: overrides.departure,
    arrival: overrides.arrival,
    time: overrides.time,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: overrides.id ?? "activity-1",
    date: overrides.date,
    time: overrides.time,
    title: overrides.title ?? "Atividade",
    kind: overrides.kind ?? "atividade",
    status: overrides.status,
    value: overrides.value,
    currency: overrides.currency,
    warnings: overrides.warnings ?? [],
  };
}

export function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    slug: overrides.slug ?? "cidade",
    name: overrides.name ?? "Cidade",
    label: overrides.label,
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    coords: overrides.coords,
    lodging: overrides.lodging ?? [],
    transfer: overrides.transfer ?? [],
    itinerary: overrides.itinerary ?? [],
    warnings: overrides.warnings ?? [],
  };
}

export function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    title: overrides.title ?? "Viagem",
    origin: overrides.origin ?? "GRU",
    stays: overrides.stays ?? [],
    generalItems: overrides.generalItems ?? [],
  };
}
