import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

const twoStayTrip = JSON.stringify({
  title: "Eurotrip",
  destinos: [
    { name: "Viena", slug: "viena-1", inicioData: "2026-12-15", fimData: "2026-12-16" },
    { name: "Viena", slug: "viena-2", inicioData: "2026-12-17", fimData: "2026-12-18" },
  ],
});

describe("DestinationPage", () => {
  it("IT-006: first stay has no 'anterior', last has no 'próximo'", async () => {
    stubFetch(twoStayTrip);
    window.location.hash = "#/destino/viena-1";
    renderApp();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("link", { name: /anterior/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /próximo/i })).toBeInTheDocument();
  });

  it("IT-006: last stay has no 'próximo'", async () => {
    stubFetch(twoStayTrip);
    window.location.hash = "#/destino/viena-2";
    renderApp();

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: /anterior/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /próximo/i })).not.toBeInTheDocument();
  });

  it("IT-010: mounting directly at /#/destino/viena-2 renders that stay without visiting home", async () => {
    stubFetch(twoStayTrip);
    window.location.hash = "#/destino/viena-2";
    renderApp();

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Viena");
    expect(screen.getByRole("link", { name: /anterior/i })).toBeInTheDocument();
  });
});
