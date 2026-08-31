import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HashRouter } from "react-router";
import { TripProvider } from "../app/TripProvider";
import { AppRoutes } from "../app/routes";

function stubFetch(body: string, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = "";
});

function renderApp() {
  return render(
    <HashRouter>
      <TripProvider>
        <AppRoutes />
      </TripProvider>
    </HashRouter>,
  );
}

function stayFixture(overrides: Record<string, unknown> = {}) {
  return {
    name: "Berlin",
    inicioData: "2026-12-15",
    fimData: "2026-12-18",
    ...overrides,
  };
}

describe("HomePage", () => {
  it("IT-001: renders 8 stays chronologically with dates", async () => {
    const destinos = [
      { name: "Berlin", inicioData: "2026-12-15", fimData: "2026-12-17" },
      { name: "Viena", inicioData: "2026-12-18", fimData: "2026-12-19" },
      { name: "Budapeste", inicioData: "2026-12-20", fimData: "2026-12-21" },
      { name: "Viena", inicioData: "2026-12-22", fimData: "2026-12-23" },
      { name: "Praga", inicioData: "2026-12-24", fimData: "2026-12-26" },
      { name: "Cracóvia", inicioData: "2026-12-27", fimData: "2026-12-29" },
      { name: "Berlin", inicioData: "2026-12-30", fimData: "2027-01-01" },
      { name: "Munique", inicioData: "2027-01-02", fimData: "2027-01-03" },
    ];
    stubFetch(JSON.stringify({ title: "Eurotrip", destinos }));
    renderApp();

    const items = await screen.findAllByRole("link", { name: /berlin|viena|budapeste|praga|cracóvia|munique/i });
    expect(items).toHaveLength(8);
    expect(items[0]).toHaveTextContent("Berlin");
    expect(items[0]).toHaveTextContent("15/12/2026");
    expect(items[7]).toHaveTextContent("Munique");
  });

  it("IT-003: consolidated checklist shows combined counts and per-currency totals", async () => {
    stubFetch(
      JSON.stringify({
        title: "Eurotrip",
        generalItems: [{ title: "Voo internacional", status: "comprado", value: 1000, currency: "USD" }],
        destinos: [
          {
            ...stayFixture(),
            hospedagens: [{ nome: "Hotel A", status: "pendente", valor: 100, moeda: "EUR" }],
          },
        ],
      }),
    );
    renderApp();

    expect(await screen.findByText(/1 comprado/i)).toBeInTheDocument();
    expect(screen.getByText(/1 pendente/i)).toBeInTheDocument();
    expect(screen.getByText(/USD: comprado/i)).toBeInTheDocument();
    expect(screen.getByText(/EUR: comprado/i)).toBeInTheDocument();
    expect(screen.getByText(/considera 2 de 2 itens com valor/i)).toBeInTheDocument();
  });

  it("IT-004: click a timeline item renders the destination page for that slug", async () => {
    stubFetch(JSON.stringify({ title: "Eurotrip", destinos: [stayFixture()] }));
    renderApp();

    const link = await screen.findByRole("link", { name: /berlin/i });
    fireEvent.click(link);

    expect(await screen.findByRole("heading", { level: 1, name: /berlin/i })).toBeInTheDocument();
  });

  it("IT-007: swapping the fixture and re-mounting reflects the new data", async () => {
    stubFetch(JSON.stringify({ title: "Eurotrip", destinos: [stayFixture()] }));
    const { unmount } = renderApp();
    expect(await screen.findByRole("link", { name: /berlin/i })).toBeInTheDocument();
    unmount();

    stubFetch(
      JSON.stringify({
        title: "Eurotrip",
        destinos: [
          stayFixture({ hospedagens: [{ nome: "Hotel A", status: "comprado", valor: 50, moeda: "EUR" }] }),
          { name: "Praga", inicioData: "2026-12-20", fimData: "2026-12-22" },
        ],
      }),
    );
    renderApp();

    expect(await screen.findByRole("link", { name: /praga/i })).toBeInTheDocument();
    expect(screen.getByText(/1 comprado/i)).toBeInTheDocument();
  });
});
