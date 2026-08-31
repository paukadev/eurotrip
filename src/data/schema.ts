import { z } from "zod";

/**
 * Raw shapes mirror the hand-edited `viagem.json` exactly (PRD Business Rules).
 * Deliberately lenient: every field is optional here so `safeParse` never
 * fails on missing/invalid business data (e.g. a stay without `name`).
 * Business-rule enforcement — required `name`, status defaults, value/coord
 * validation — happens during normalization in `trip.ts`, not here.
 * Unknown keys are stripped silently by default `z.object()` behavior
 * (satisfies "unknown fields ignored").
 */

const RawGeneralItemSchema = z.object({
  kind: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  value: z.unknown().optional(),
  currency: z.string().optional(),
});

const RawHospedagemSchema = z.object({
  nome: z.string().optional(),
  endereco: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  status: z.string().optional(),
  valor: z.unknown().optional(),
  moeda: z.string().optional(),
});

const RawTransladoSchema = z.object({
  modo: z.string().optional(),
  partida: z.string().optional(),
  chegada: z.string().optional(),
  horario: z.string().optional(),
  status: z.string().optional(),
  valor: z.unknown().optional(),
  moeda: z.string().optional(),
});

const RawAtividadeSchema = z.object({
  data: z.string().optional(),
  horario: z.string().optional(),
  titulo: z.string().optional(),
  tipo: z.string().optional(),
  status: z.string().optional(),
  valor: z.unknown().optional(),
  moeda: z.string().optional(),
});

const RawCoordenadasSchema = z.object({
  lat: z.unknown().optional(),
  lon: z.unknown().optional(),
});

const RawDestinoSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  slug: z.string().optional(),
  inicioData: z.string().optional(),
  fimData: z.string().optional(),
  coordenadas: RawCoordenadasSchema.optional(),
  hospedagens: z.array(RawHospedagemSchema).optional().default([]),
  translados: z.array(RawTransladoSchema).optional().default([]),
  roteiro: z.array(RawAtividadeSchema).optional().default([]),
});

export const RawTripSchema = z.object({
  title: z.string().optional().default(""),
  origin: z.string().optional().default(""),
  generalItems: z.array(RawGeneralItemSchema).optional().default([]),
  destinos: z.array(RawDestinoSchema).optional().default([]),
});

export type RawTrip = z.infer<typeof RawTripSchema>;
export type RawDestino = z.infer<typeof RawDestinoSchema>;
export type RawHospedagem = z.infer<typeof RawHospedagemSchema>;
export type RawTranslado = z.infer<typeof RawTransladoSchema>;
export type RawAtividade = z.infer<typeof RawAtividadeSchema>;
export type RawGeneralItem = z.infer<typeof RawGeneralItemSchema>;
