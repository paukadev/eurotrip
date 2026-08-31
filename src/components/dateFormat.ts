import type { CalendarDate } from "../data/calendar";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(date?: CalendarDate): string {
  if (!date) return "data a definir";
  return `${pad(date.day)}/${pad(date.month)}/${date.year}`;
}

export function formatDateRange(start?: CalendarDate, end?: CalendarDate): string {
  if (!start && !end) return "datas a definir";
  return `${formatDate(start)} — ${formatDate(end)}`;
}
