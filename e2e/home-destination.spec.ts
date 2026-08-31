import { expect, test } from "@playwright/test";
import { mockTrip } from "./helpers";

test.describe("Home overview and navigation", () => {
  test("E2E-001: home timeline -> open Praga -> header/lodging/itinerary -> back to home", async ({
    page,
  }) => {
    await mockTrip(page, "valid");
    await page.goto("/");

    const timeline = page.getByTestId("timeline-list");
    await expect(timeline.getByRole("link", { name: /praga/i })).toBeVisible();
    await timeline.getByRole("link", { name: /praga/i }).click();

    await expect(page.getByRole("heading", { level: 1, name: /praga/i })).toBeVisible();
    await expect(page.getByText(/hotel praga centro/i)).toBeVisible();
    await expect(page.getByText(/relogio astronomico|relógio astronômico/i)).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: /eurotrip/i })).toBeVisible();
  });
});

test.describe("Countdown", () => {
  test("E2E-002: future start date shows 'faltam X dias'", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-12-01T12:00:00Z") });
    await mockTrip(page, "valid");
    await page.goto("/");

    await expect(page.getByRole("status").filter({ hasText: /faltam \d+ dias/i })).toBeVisible();
    await expect(page.getByText(/faltam 14 dias/i)).toBeVisible();
  });
});

test.describe("Route map", () => {
  test("E2E-003: renders markers per coord-bearing city, click marker opens stay page", async ({
    page,
  }) => {
    await mockTrip(page, "repeated-cities");
    await page.goto("/");

    const svg = page.locator("svg[aria-label='Mapa da rota']");
    await expect(svg).toBeVisible();
    const markers = svg.locator("circle");
    await expect(markers).toHaveCount(8);

    const pragaMarker = svg.locator("circle[data-slug='praga']");
    await pragaMarker.click({ force: true });
    await expect(page).toHaveURL(/#\/destino\/praga/);
    await expect(page.getByRole("heading", { level: 1, name: /praga/i })).toBeVisible();
  });
});

test.describe("Bought vs pending consolidation", () => {
  test("E2E-004: shows counts and per-currency totals including general items; pending badge on stay", async ({
    page,
  }) => {
    await mockTrip(page, "multi-currency");
    await page.goto("/");

    await expect(page.getByText(/2 comprado/i)).toBeVisible();
    await expect(page.getByText(/2 pendente/i)).toBeVisible();
    await expect(page.getByText(/CZK: comprado/i)).toBeVisible();
    await expect(page.getByText(/PLN: comprado/i)).toBeVisible();
    await expect(page.getByText(/BRL: comprado/i)).toBeVisible();

    await page.getByTestId("timeline-list").getByRole("link", { name: /praga/i }).click();
    await expect(page.getByText("Pendente").first()).toBeVisible();
  });
});

test.describe("Itinerary by day", () => {
  test("E2E-005: multi-day stay groups activities by day and time; empty day shows 'livre'", async ({
    page,
  }) => {
    await mockTrip(page, "valid");
    await page.goto("/");
    await page.getByTestId("timeline-list").getByRole("link", { name: /praga/i }).click();

    await expect(page.getByRole("heading", { name: "Dia 1" })).toBeVisible();
    await expect(page.getByText(/relogio astronomico|relógio astronômico/i)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Dia 2" })).toBeVisible();
    await expect(page.getByText("Livre.")).toBeVisible();
  });
});

test.describe("Malformed data", () => {
  test("E2E-006a: malformed viagem.json shows a legible error message, not a blank page", async ({
    page,
  }) => {
    await mockTrip(page, "malformed");
    await page.goto("/");
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    expect((await alert.textContent())?.toLowerCase()).toContain("não foi possível ler os dados");
  });

  test("E2E-006b: unknown slug shows 'destino não encontrado'", async ({ page }) => {
    await mockTrip(page, "valid");
    await page.goto("/#/destino/nao-existe");
    await expect(page.getByText(/destino não encontrado/i)).toBeVisible();
  });
});

test.describe("Data update", () => {
  test("E2E-007: replacing viagem.json and reloading reflects the new stay and totals", async ({
    page,
  }) => {
    await mockTrip(page, "valid");
    await page.goto("/");
    const timeline = page.getByTestId("timeline-list");
    await expect(timeline.getByRole("link", { name: /praga/i })).toBeVisible();
    await expect(page.getByText(/4 comprado/i)).toBeVisible();

    await mockTrip(page, "valid-updated");
    await page.reload();

    await expect(timeline.getByRole("link", { name: /viena/i })).toBeVisible();
    await expect(page.getByText(/3 comprado/i)).toBeVisible();
  });
});

test.describe("Deep link and refresh", () => {
  test("E2E-008: deep link to /#/destino/viena-1 then refresh loads correctly without host 404", async ({
    page,
  }) => {
    await mockTrip(page, "repeated-cities");
    await page.goto("/#/destino/viena-1");
    await expect(page.getByRole("heading", { level: 1, name: /viena/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: /viena/i })).toBeVisible();
    expect(await page.textContent("body")).not.toMatch(/cannot get|404/i);
  });
});

test.describe("Static deploy", () => {
  test("E2E-010: production build served as static files loads home over HTTP with no backend", async ({
    page,
  }) => {
    // No mockTrip: this exercises the real public/viagem.json served as a
    // plain static asset by the preview server, proving the whole flow
    // (HTML, JS bundle, and data) works over static HTTP with no backend.
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /eurotrip/i })).toBeVisible();
  });
});

test.describe("Responsive layout (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("E2E-011: home and a stay page are readable at 375px with no horizontal scroll", async ({
    page,
  }) => {
    await mockTrip(page, "valid");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /eurotrip/i })).toBeVisible();

    const noHomeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(noHomeOverflow).toBe(true);

    await page.getByTestId("timeline-list").getByRole("link", { name: /praga/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /praga/i })).toBeVisible();

    const noStayOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(noStayOverflow).toBe(true);
  });

  // US-015.EC-2: offline is a documented v1 Non-Goal (see README), not a defect.
  // This asserts the failure mode only — it must never be read as "offline works".
  test("offline navigation fails as expected — documented Non-Goal, not asserted as success", async ({
    page,
    context,
  }) => {
    await context.setOffline(true);
    await expect(page.goto("/")).rejects.toThrow();
  });
});

test.describe("Scale", () => {
  test("E2E-009: 100+ stays keeps the timeline scrollable and navigable without horizontal overflow", async ({
    page,
  }) => {
    await mockTrip(page, "100-stays");
    await page.goto("/");

    const links = page.getByTestId("timeline-list").getByRole("link");
    await expect(links.first()).toBeVisible();
    expect(await links.count()).toBeGreaterThanOrEqual(100);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);

    await links.last().scrollIntoViewIfNeeded();
    await links.last().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
