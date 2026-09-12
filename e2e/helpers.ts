import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

export async function mockTrip(page: Page, fixtureName: string, status = 200): Promise<void> {
  const filePath = path.join(FIXTURES_DIR, `${fixtureName}.json`);
  const body = readFileSync(filePath, "utf-8");
  await page.route("**/viagem.json", (route) =>
    route.fulfill({ status, contentType: "application/json", body }),
  );
}

export async function mockRates(page: Page): Promise<void> {
  const body = JSON.stringify({
    base: "BRL",
    rates: {
      "2026-09-10": { EUR: 0.16799, PLN: 0.72604, CZK: 4.0739, HUF: 61.274 },
      "2026-09-11": { EUR: 0.16879, PLN: 0.73, CZK: 4.0956, HUF: 61.517 },
    },
  });
  await page.route("**/api.frankfurter.dev/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body }),
  );
}
