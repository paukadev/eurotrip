import { vi } from "vitest";
import { RATES_API_HOST } from "../data/exchange";

interface Route {
  /** Trecho da URL que identifica a rota, ex.: "viagem.json". */
  match: string;
  body: string;
  status?: number;
}

/**
 * Substitui o `fetch` global respondendo conforme a URL pedida. URL sem rota
 * correspondente falha alto, em vez de devolver o corpo errado em silêncio.
 */
export function stubFetchRoutes(routes: Route[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const route = routes.find((candidate) => url.includes(candidate.match));
      if (!route) throw new Error(`fetch não esperado nos testes: ${url}`);
      return new Response(route.body, { status: route.status ?? 200 });
    }),
  );
}

/** Série curta de cotações, suficiente para a seção de câmbio renderizar. */
export function ratesFixtureBody(): string {
  return JSON.stringify({
    base: "BRL",
    rates: {
      "2026-09-10": { EUR: 0.16799, PLN: 0.72604, CZK: 4.0739, HUF: 61.274 },
      "2026-09-11": { EUR: 0.16879, PLN: 0.73, CZK: 4.0956, HUF: 61.517 },
    },
  });
}

export const RATES_MATCH = RATES_API_HOST;
