import type { CalendarDate } from "./calendar";
import { calendarDateToUTCMillis, diffInDays } from "./calendar";
import type { Activity, BookingItem, Stay, Trip } from "./trip";
import { isValidCoordinate } from "./trip";

// --- Ordering & duration -----------------------------------------------

export type OrderedStay = Stay & { overlap: boolean };

/**
 * Returns stays sorted chronologically by `startDate` (stable tie-break on
 * original array order), each flagged `overlap: true` when its `endDate`
 * extends past the following stay's `startDate`.
 */
export function orderedStays(stays: Stay[]): OrderedStay[] {
  const indexed = stays.map((stay, index) => ({ stay, index }));
  indexed.sort((a, b) => {
    if (a.stay.startDate && b.stay.startDate) {
      const diff =
        calendarDateToUTCMillis(a.stay.startDate) - calendarDateToUTCMillis(b.stay.startDate);
      if (diff !== 0) return diff;
      return a.index - b.index;
    }
    if (a.stay.startDate && !b.stay.startDate) return -1;
    if (!a.stay.startDate && b.stay.startDate) return 1;
    return a.index - b.index;
  });

  const sorted = indexed.map((entry) => entry.stay);
  return sorted.map((stay, i) => {
    const next = sorted[i + 1];
    let overlap = false;
    if (stay.endDate && next?.startDate) {
      overlap = calendarDateToUTCMillis(stay.endDate) > calendarDateToUTCMillis(next.startDate);
    }
    return { ...stay, overlap };
  });
}

/** Total trip duration in days: first `startDate` to last `endDate`, inclusive. */
export function tripDuration(stays: Stay[]): number | undefined {
  const starts = stays.map((s) => s.startDate).filter((d): d is CalendarDate => Boolean(d));
  const ends = stays.map((s) => s.endDate).filter((d): d is CalendarDate => Boolean(d));
  if (starts.length === 0 || ends.length === 0) return undefined;

  const first = starts.reduce((min, d) =>
    calendarDateToUTCMillis(d) < calendarDateToUTCMillis(min) ? d : min,
  );
  const last = ends.reduce((max, d) =>
    calendarDateToUTCMillis(d) > calendarDateToUTCMillis(max) ? d : max,
  );
  return diffInDays(first, last) + 1;
}

export function findStayBySlug(trip: Trip, slug: string): Stay | undefined {
  return trip.stays.find((stay) => stay.slug === slug);
}

// --- Countdown -----------------------------------------------------------

export type CountdownState =
  | { phase: "before"; days: number }
  | { phase: "during"; dayN: number; total: number }
  | { phase: "after" }
  | { phase: "unknown" };

export function countdownState(trip: Trip, today: CalendarDate): CountdownState {
  const starts = trip.stays.map((s) => s.startDate).filter((d): d is CalendarDate => Boolean(d));
  const ends = trip.stays.map((s) => s.endDate).filter((d): d is CalendarDate => Boolean(d));
  if (starts.length === 0 || ends.length === 0) return { phase: "unknown" };

  const start = starts.reduce((min, d) =>
    calendarDateToUTCMillis(d) < calendarDateToUTCMillis(min) ? d : min,
  );
  const end = ends.reduce((max, d) =>
    calendarDateToUTCMillis(d) > calendarDateToUTCMillis(max) ? d : max,
  );

  const todayMillis = calendarDateToUTCMillis(today);
  const startMillis = calendarDateToUTCMillis(start);
  const endMillis = calendarDateToUTCMillis(end);

  if (todayMillis <= startMillis) {
    return { phase: "before", days: diffInDays(today, start) };
  }
  if (todayMillis <= endMillis) {
    return { phase: "during", dayN: diffInDays(start, today) + 1, total: diffInDays(start, end) + 1 };
  }
  return { phase: "after" };
}

// --- Item collection & totals --------------------------------------------

export function collectItems(target: Stay): BookingItem[];
export function collectItems(target: Trip): BookingItem[];
export function collectItems(target: Stay | Trip): BookingItem[] {
  if ("stays" in target) {
    const items = new Map<string, BookingItem>();
    for (const item of target.generalItems) items.set(item.id, item);
    for (const stay of target.stays) {
      for (const item of collectItems(stay)) items.set(item.id, item);
    }
    return [...items.values()];
  }

  const attractionItems: BookingItem[] = target.itinerary
    .filter((activity: Activity) => activity.kind === "atracao")
    .map((activity) => ({
      id: activity.id,
      kind: "atracao" as const,
      title: activity.title,
      status: activity.status ?? "pendente",
      value: activity.value,
      currency: activity.currency,
      warnings: activity.warnings,
    }));

  return [...target.lodging, ...target.transfer, ...attractionItems];
}

export interface ConsolidatedTotals {
  bought: number;
  pending: number;
  byCurrency: Record<string, { bought: number; pending: number }>;
  valuedItems: number;
  totalItems: number;
}

export function consolidatedTotals(trip: Trip): ConsolidatedTotals {
  const items = collectItems(trip);
  const totals: ConsolidatedTotals = {
    bought: 0,
    pending: 0,
    byCurrency: {},
    valuedItems: 0,
    totalItems: items.length,
  };

  for (const item of items) {
    if (item.status === "comprado") totals.bought += 1;
    else totals.pending += 1;

    if (item.value === undefined) continue;
    totals.valuedItems += 1;

    const currency = item.currency ?? "N/D";
    const bucket = totals.byCurrency[currency] ?? { bought: 0, pending: 0 };
    if (item.status === "comprado") bucket.bought += item.value;
    else bucket.pending += item.value;
    totals.byCurrency[currency] = bucket;
  }

  return totals;
}

// --- Itinerary grouping ----------------------------------------------------

export interface DayGroup {
  date?: CalendarDate;
  label: string;
  activities: Activity[];
  outOfRange: boolean;
}

function addDays(date: CalendarDate, amount: number): CalendarDate {
  const millis = calendarDateToUTCMillis(date) + amount * 86_400_000;
  const d = new Date(millis);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function sortActivitiesWithinDay(activities: Activity[]): Activity[] {
  const timed = activities.filter((a) => a.time);
  const untimed = activities.filter((a) => !a.time);
  timed.sort((a, b) => (a.time! < b.time! ? -1 : a.time! > b.time! ? 1 : 0));
  return [...timed, ...untimed];
}

export function groupItineraryByDay(stay: Stay): DayGroup[] {
  const groups: DayGroup[] = [];
  const groupByKey = new Map<string, DayGroup>();

  if (stay.startDate && stay.endDate) {
    const totalDays = Math.max(diffInDays(stay.startDate, stay.endDate) + 1, 0);
    for (let i = 0; i < totalDays; i += 1) {
      const date = addDays(stay.startDate, i);
      const group: DayGroup = { date, label: `Dia ${i + 1}`, activities: [], outOfRange: false };
      groups.push(group);
      groupByKey.set(`${date.year}-${date.month}-${date.day}`, group);
    }
  }

  const outOfRangeGroup: DayGroup = {
    date: undefined,
    label: "Fora do período",
    activities: [],
    outOfRange: true,
  };

  for (const activity of stay.itinerary) {
    const key = activity.date ? `${activity.date.year}-${activity.date.month}-${activity.date.day}` : undefined;
    const targetGroup = key ? groupByKey.get(key) : undefined;
    if (targetGroup) {
      targetGroup.activities.push(activity);
    } else {
      outOfRangeGroup.activities.push(activity);
    }
  }

  for (const group of groups) {
    group.activities = sortActivitiesWithinDay(group.activities);
  }

  if (outOfRangeGroup.activities.length > 0) {
    outOfRangeGroup.activities = sortActivitiesWithinDay(outOfRangeGroup.activities);
    groups.push(outOfRangeGroup);
  }

  return groups;
}

// --- Stay-page header derivation -------------------------------------------

export interface StayHeaderInfo {
  slug: string;
  name: string;
  label?: string;
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  durationDays?: number;
  inconsistentDates: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  prevSlug?: string;
  nextSlug?: string;
}

export function stayHeader(stays: Stay[], slug: string): StayHeaderInfo | undefined {
  const index = stays.findIndex((s) => s.slug === slug);
  if (index === -1) return undefined;
  const stay = stays[index];

  let durationDays: number | undefined;
  let inconsistentDates = false;
  if (stay.startDate && stay.endDate) {
    const diff = diffInDays(stay.startDate, stay.endDate);
    if (diff < 0) {
      inconsistentDates = true;
    } else {
      durationDays = diff + 1;
    }
  }

  return {
    slug: stay.slug,
    name: stay.name,
    label: stay.label,
    startDate: stay.startDate,
    endDate: stay.endDate,
    durationDays,
    inconsistentDates,
    hasPrev: index > 0,
    hasNext: index < stays.length - 1,
    prevSlug: index > 0 ? stays[index - 1].slug : undefined,
    nextSlug: index < stays.length - 1 ? stays[index + 1].slug : undefined,
  };
}

// --- Route map projection ---------------------------------------------------

export interface RoutePoint {
  slug: string;
  name: string;
  x: number;
  y: number;
}

export interface RouteGeometry {
  points: RoutePoint[];
  viewBox: string;
  warnings: string[];
}

export function projectRoute(
  stays: Stay[],
  options: { width?: number; height?: number; padding?: number } = {},
): RouteGeometry {
  const width = options.width ?? 400;
  const height = options.height ?? 300;
  const padding = options.padding ?? 20;
  const warnings: string[] = [];

  const valid: Array<{ slug: string; name: string; lat: number; lon: number }> = [];
  for (const stay of stays) {
    if (!stay.coords) {
      warnings.push(`"${stay.name}" sem coordenadas — omitido do mapa.`);
      continue;
    }
    const { lat, lon } = stay.coords;
    if (isValidCoordinate(lat, lon)) {
      valid.push({ slug: stay.slug, name: stay.name, lat, lon });
    } else {
      warnings.push(`Coordenadas inválidas para "${stay.name}" — omitido do mapa.`);
    }
  }

  if (valid.length === 0) {
    return { points: [], viewBox: `0 0 ${width} ${height}`, warnings };
  }

  const lats = valid.map((v) => v.lat);
  const lons = valid.map((v) => v.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;

  const points: RoutePoint[] = valid.map((v) => ({
    slug: v.slug,
    name: v.name,
    x: padding + ((v.lon - minLon) / lonRange) * (width - 2 * padding),
    y: padding + ((maxLat - v.lat) / latRange) * (height - 2 * padding),
  }));

  return { points, viewBox: `0 0 ${width} ${height}`, warnings };
}
