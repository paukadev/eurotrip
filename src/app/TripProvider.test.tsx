import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HashRouter } from "react-router";
import { TripProvider } from "./TripProvider";
import { AppRoutes } from "./routes";

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

describe("TripProvider root states", () => {
  it("IT-002: fixture `empty` renders the empty state, not an error, on home", async () => {
    stubFetch("{}");
    renderApp();
    expect(await screen.findByText(/nenhum destino cadastrado/i)).toBeInTheDocument();
  });

  it("IT-008: fixture `malformed` renders the legible data-error message, no white screen", async () => {
    stubFetch("{ not valid json");
    renderApp();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent?.toLowerCase()).toContain("não foi possível ler os dados");
  });

  it("IT-009: fetch stubbed to 404 renders 'dados não encontrados' with guidance", async () => {
    stubFetch("Not Found", 404);
    renderApp();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent?.toLowerCase()).toContain("dados não encontrados");
  });
});

describe("Routing", () => {
  it("IT-005: navigating to an unknown slug renders NotFoundPage with a link home", async () => {
    stubFetch(
      JSON.stringify({
        destinos: [{ name: "Berlin", inicioData: "2026-12-15" }],
      }),
    );
    window.location.hash = "#/destino/nao-existe";
    renderApp();
    expect(await screen.findByText(/destino não encontrado/i)).toBeInTheDocument();
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toHaveAttribute("href", "#/");
  });
});
