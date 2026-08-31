export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a "YYYY-MM-DD" string into a timezone-safe CalendarDate.
 * Returns undefined for anything unparseable or out of calendar range
 * (never throws, never produces "Invalid Date").
 */
export function parseCalendarDate(input?: string): CalendarDate | undefined {
  if (typeof input !== "string") return undefined;
  const match = DATE_PATTERN.exec(input.trim());
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const millis = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(millis);
  const isRealCalendarDate =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day;

  return isRealCalendarDate ? { year, month, day } : undefined;
}

export function calendarDateToUTCMillis(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

export function diffInDays(from: CalendarDate, to: CalendarDate): number {
  const millisPerDay = 86_400_000;
  return Math.round(
    (calendarDateToUTCMillis(to) - calendarDateToUTCMillis(from)) / millisPerDay,
  );
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return calendarDateToUTCMillis(a) - calendarDateToUTCMillis(b);
}

export function todayCalendarDate(reference: Date = new Date()): CalendarDate {
  return {
    year: reference.getFullYear(),
    month: reference.getMonth() + 1,
    day: reference.getDate(),
  };
}
