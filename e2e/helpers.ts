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
