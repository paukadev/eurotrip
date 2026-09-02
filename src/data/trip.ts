import type { CalendarDate } from "./calendar";
import { parseCalendarDate } from "./calendar";
import { RawTripSchema, type RawDestino, type RawTrip } from "./schema";
import { assignSlugs } from "./slug";

export type ItemStatus = "comprado" | "pendente" | "gratuito";
export type ItemKind = "translado" | "hospedagem" | "atracao";

export interface BookingItem {
  id: string;
  kind: ItemKind;
  title: string;
  status: ItemStatus;
  value?: number;
  currency?: string;
  warnings: string[];
}

/** Lodging entry: a BookingItem plus display fields from PRD Business Rules. */
export interface LodgingItem extends BookingItem {
  address?: string;
  checkin?: CalendarDate;
  checkout?: CalendarDate;
  inconsistentDates: boolean; // checkout < checkin
}

/** Transfer entry: a BookingItem plus display fields from PRD Business Rules. */
export interface TransferItem extends BookingItem {
  mode?: string;
  departure?: string;
  arrival?: string;
  time?: string; // raw horario string, e.g. "2026-12-30T09:15"
}

/**
 * Itinerary activity. Not a BookingItem: `kind` is free-form pt-BR text
 * ("atracao" | other categories), and only "atracao" activities carry
 * meaningful status/value semantics (still present, optional, on all).
 */
export interface Activity {
  id: string;
  date?: CalendarDate;
  time?: string;
  title: string;
  kind: string;
  status?: ItemStatus;
  value?: number;
  currency?: string;
  warnings: string[];
}

export interface Stay {
  slug: string;
  name: string;
  label?: string;
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  coords?: { lat: number; lon: number };
  lodging: LodgingItem[];
  transfer: TransferItem[];
  itinerary: Activity[];
  warnings: string[];
}

export interface Trip {
  title: string;
  origin: string;
  stays: Stay[];
  generalItems: BookingItem[];
}

export type LoadErrorKind = "network" | "not-found" | "invalid-json" | "invalid-data";

export interface LoadError {
  kind: LoadErrorKind;
  message: string;
}

export type LoadResult =
  | { ok: true; trip: Trip; warnings: string[] }
  | { ok: false; error: LoadError };

const DEFAULT_TRIP_URL = `${import.meta.env.BASE_URL}viagem.json`;

export function normalizeStatus(raw: unknown): { status: ItemStatus; warning?: string } {
  if (raw === undefined || raw === null) return { status: "pendente" };
  if (raw === "comprado") return { status: "comprado" };
  if (raw === "pendente") return { status: "pendente" };
  if (raw === "Gratuito") return { status: "gratuito" };
  return {
    status: "pendente",
    warning: `Status desconhecido "${String(raw)}" tratado como "pendente".`,
  };
}

export function normalizeValue(raw: unknown): { value?: number; warning?: string } {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return { value: raw };
  }
  return { value: undefined, warning: `Valor inválido "${String(raw)}" ignorado na soma.` };
}

export function isValidCoordinate(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function normalizeGeneralItem(
  raw: RawTrip["generalItems"][number],
  index: number,
): BookingItem {
  const warnings: string[] = [];
  const { status, warning: statusWarning } = normalizeStatus(raw.status);
  if (statusWarning) warnings.push(statusWarning);
  const { value, warning: valueWarning } = normalizeValue(raw.value);
  if (valueWarning) warnings.push(valueWarning);

  const kind: ItemKind =
    raw.kind === "hospedagem" || raw.kind === "atracao" ? raw.kind : "translado";

  return {
    id: `geral-${index}`,
    kind,
    title: raw.title ?? "Item geral",
    status,
    value,
    currency: raw.currency,
    warnings,
  };
}

export function normalizeLodging(
  raw: RawDestino["hospedagens"][number],
  staySlug: string,
  index: number,
): LodgingItem {
  const warnings: string[] = [];
  const { status, warning: statusWarning } = normalizeStatus(raw.status);
  if (statusWarning) warnings.push(statusWarning);
  const { value, warning: valueWarning } = normalizeValue(raw.valor);
  if (valueWarning) warnings.push(valueWarning);

  const checkin = parseCalendarDate(raw.checkin);
  if (raw.checkin && !checkin) {
    warnings.push(`Data de check-in não reconhecida: "${raw.checkin}".`);
  }
  const checkout = parseCalendarDate(raw.checkout);
  if (raw.checkout && !checkout) {
    warnings.push(`Data de check-out não reconhecida: "${raw.checkout}".`);
  }

  let inconsistentDates = false;
  if (checkin && checkout && checkout.year * 10000 + checkout.month * 100 + checkout.day <
    checkin.year * 10000 + checkin.month * 100 + checkin.day) {
    inconsistentDates = true;
    warnings.push("Check-out anterior ao check-in.");
  }

  return {
    id: `${staySlug}-hospedagem-${index}`,
    kind: "hospedagem",
    title: raw.nome ?? "Hospedagem",
    status,
    value,
    currency: raw.moeda,
    warnings,
    address: raw.endereco,
    checkin,
    checkout,
    inconsistentDates,
  };
}

export function normalizeTransfer(
  raw: RawDestino["translados"][number],
  staySlug: string,
  index: number,
): TransferItem {
  const warnings: string[] = [];
  const { status, warning: statusWarning } = normalizeStatus(raw.status);
  if (statusWarning) warnings.push(statusWarning);
  const { value, warning: valueWarning } = normalizeValue(raw.valor);
  if (valueWarning) warnings.push(valueWarning);

  return {
    id: `${staySlug}-translado-${index}`,
    kind: "translado",
    title: raw.chegada ? `Translado para ${raw.chegada}` : "Translado",
    status,
    value,
    currency: raw.moeda,
    warnings,
    mode: raw.modo,
    departure: raw.partida,
    arrival: raw.chegada,
    time: raw.horario,
  };
}

export function normalizeActivity(
  raw: RawDestino["roteiro"][number],
  staySlug: string,
  index: number,
  stayStart?: CalendarDate,
  stayEnd?: CalendarDate,
): Activity {
  const warnings: string[] = [];
  const date = parseCalendarDate(raw.data);
  if (raw.data && !date) {
    warnings.push(`Data de atividade não reconhecida: "${raw.data}".`);
  }

  if (date && stayStart && stayEnd) {
    const millis = (d: CalendarDate) => Date.UTC(d.year, d.month - 1, d.day);
    if (millis(date) < millis(stayStart) || millis(date) > millis(stayEnd)) {
      warnings.push("Atividade fora do período da estadia.");
    }
  }

  const isReservable = raw.tipo === "atracao";
  let status: ItemStatus | undefined;
  let value: number | undefined;
  if (isReservable) {
    const statusResult = normalizeStatus(raw.status);
    status = statusResult.status;
    if (statusResult.warning) warnings.push(statusResult.warning);
    const valueResult = normalizeValue(raw.valor);
    value = valueResult.value;
    if (valueResult.warning) warnings.push(valueResult.warning);
  }

  return {
    id: `${staySlug}-atividade-${index}`,
    date,
    time: raw.horario,
    title: raw.titulo ?? "Atividade",
    kind: raw.tipo ?? "atividade",
    status,
    value,
    currency: raw.moeda,
    warnings,
  };
}

interface CandidateStay {
  raw: RawDestino;
  name: string;
  startDate?: CalendarDate;
  endDate?: CalendarDate;
  fileIndex: number;
}

export async function loadTrip(url: string = DEFAULT_TRIP_URL): Promise<LoadResult> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return {
      ok: false,
      error: { kind: "network", message: "Não foi possível acessar os dados da viagem." },
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error: {
        kind: "not-found",
        message: "Dados não encontrados. Verifique se o arquivo viagem.json existe.",
      },
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: { kind: "network", message: "Não foi possível acessar os dados da viagem." },
    };
  }

  const text = await response.text();

  let parsed: unknown;
  try {
    parsed = text.trim().length === 0 ? {} : JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: { kind: "invalid-json", message: "Não foi possível ler os dados (JSON inválido)." },
    };
  }

  if (parsed === null || (Array.isArray(parsed) && parsed.length === 0)) {
    return { ok: true, trip: emptyTrip(), warnings: [] };
  }
  if (Array.isArray(parsed)) {
    return {
      ok: false,
      error: { kind: "invalid-data", message: "Formato de dados inesperado." },
    };
  }

  const result = RawTripSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: { kind: "invalid-data", message: "Não foi possível ler os dados (formato inesperado)." },
    };
  }

  return normalize(result.data);
}

function emptyTrip(): Trip {
  return { title: "", origin: "", stays: [], generalItems: [] };
}

function normalize(raw: RawTrip): LoadResult {
  const warnings: string[] = [];

  const candidates: CandidateStay[] = [];
  raw.destinos.forEach((destino, index) => {
    const name = destino.name?.trim();
    if (!name) {
      warnings.push(`Destino #${index + 1} sem "name" — descartado.`);
      return;
    }
    const startDate = parseCalendarDate(destino.inicioData);
    if (destino.inicioData && !startDate) {
      warnings.push(`Destino "${name}": data de início não reconhecida.`);
    }
    const endDate = parseCalendarDate(destino.fimData);
    if (destino.fimData && !endDate) {
      warnings.push(`Destino "${name}": data de fim não reconhecida.`);
    }
    candidates.push({ raw: destino, name, startDate, endDate, fileIndex: index });
  });

  const chronological = [...candidates].sort((a, b) => {
    if (a.startDate && b.startDate) {
      const millis = (d: CalendarDate) => Date.UTC(d.year, d.month - 1, d.day);
      const diff = millis(a.startDate) - millis(b.startDate);
      if (diff !== 0) return diff;
      return a.fileIndex - b.fileIndex;
    }
    if (a.startDate && !b.startDate) return -1;
    if (!a.startDate && b.startDate) return 1;
    return a.fileIndex - b.fileIndex;
  });

  const slugAssignments = assignSlugs(
    chronological.map((c) => ({ name: c.name, explicitSlug: c.raw.slug })),
  );

  const stays: Stay[] = chronological.map((candidate, order) => {
    const { slug, warning: slugWarning } = slugAssignments[order];
    const stayWarnings: string[] = [];
    if (slugWarning) stayWarnings.push(slugWarning);

    let coords: { lat: number; lon: number } | undefined;
    if (candidate.raw.coordenadas) {
      const { lat, lon } = candidate.raw.coordenadas;
      if (isValidCoordinate(lat, lon)) {
        coords = { lat: lat as number, lon: lon as number };
      } else if (lat !== undefined || lon !== undefined) {
        stayWarnings.push(`Coordenadas inválidas para "${candidate.name}" — tratadas como ausentes.`);
      }
    }

    const lodging = candidate.raw.hospedagens.map((item, index) =>
      normalizeLodging(item, slug, index),
    );
    const transfer = candidate.raw.translados.map((item, index) =>
      normalizeTransfer(item, slug, index),
    );
    const itinerary = candidate.raw.roteiro.map((item, index) =>
      normalizeActivity(item, slug, index, candidate.startDate, candidate.endDate),
    );

    for (const item of [...lodging, ...transfer, ...itinerary]) {
      stayWarnings.push(...item.warnings);
    }

    return {
      slug,
      name: candidate.name,
      label: candidate.raw.label,
      startDate: candidate.startDate,
      endDate: candidate.endDate,
      coords,
      lodging,
      transfer,
      itinerary,
      warnings: stayWarnings,
    };
  });

  const generalItems = raw.generalItems.map((item, index) => normalizeGeneralItem(item, index));
  for (const item of generalItems) warnings.push(...item.warnings);
  for (const stay of stays) warnings.push(...stay.warnings);

  return {
    ok: true,
    trip: { title: raw.title, origin: raw.origin, stays, generalItems },
    warnings,
  };
}
