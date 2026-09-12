import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExchangeSection } from "./ExchangeSection";

/** 90 dias úteis sintéticos: euro caindo de 6,50 para 5,90. */
function apiBody() {
  const rates: Record<string, Record<string, number>> = {};
  for (let i = 0; i < 90; i += 1) {
    const day = new Date(Date.UTC(2026, 5, 15) + i * 86_400_000).toISOString().slice(0, 10);
    const eur = 6.5 - i * (0.6 / 89);
    rates[day] = { EUR: 1 / eur, PLN: 1 / 1.37, CZK: 1 / 0.244, HUF: 1 / 0.016256 };
  }
  return JSON.stringify({ base: "BRL", rates });
}

function stubFetch(body: string, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExchangeSection", () => {
  it("mostra a cotação do euro, o selo e a data", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);

    expect(await screen.findByTestId("rate-headline")).toHaveTextContent(/por euro/);
    // "5,90" aparece duas vezes: na aba do euro e no destaque.
    expect(screen.getAllByText("5,90").length).toBeGreaterThan(0);
    expect(screen.getByTestId("rate-verdict")).toHaveTextContent("Bom momento");
    expect(screen.getByTestId("rate-source")).toHaveTextContent("12/09");
  });

  it("troca de moeda ao clicar na aba", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);
    await screen.findByTestId("rate-headline");

    fireEvent.click(screen.getByRole("tab", { name: /Kč/ }));

    expect(screen.getByTestId("rate-headline")).toHaveTextContent(/por coroa tcheca/);
    expect(screen.getAllByText("0,244").length).toBeGreaterThan(0);
  });

  it("troca de período e recalcula a comparação", async () => {
    stubFetch(apiBody());
    render(<ExchangeSection />);
    await screen.findByTestId("rate-headline");

    expect(screen.getByTestId("rate-comparison")).toHaveTextContent("média de 90 dias");

    fireEvent.click(screen.getByRole("button", { name: "30d" }));

    expect(screen.getByTestId("rate-comparison")).toHaveTextContent("média de 30 dias");
  });

  it("avisa quando a cotação vem do cache desatualizado", async () => {
    stubFetch(apiBody());
    const { unmount } = render(<ExchangeSection />);
    await screen.findByTestId("rate-headline");
    unmount();

    // Envelhece o cache: sem isso ele ainda estaria fresco e nem tentaria a rede.
    const cached = JSON.parse(localStorage.getItem("eurotrip:rates:v1") ?? "{}");
    cached.fetchedAt = Date.now() - 13 * 60 * 60 * 1000;
    localStorage.setItem("eurotrip:rates:v1", JSON.stringify(cached));

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ExchangeSection />);

    await waitFor(() => {
      expect(screen.getByTestId("rate-source")).toHaveTextContent("não foi possível atualizar");
    });
  });

  it("mostra indisponível quando a rede falha e não há cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<ExchangeSection />);

    expect(await screen.findByText("Cotação indisponível no momento.")).toBeInTheDocument();
  });

  it("mostra o estado de carregando antes da resposta", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<ExchangeSection />);

    expect(screen.getByText("Carregando cotações…")).toBeInTheDocument();
  });
});
