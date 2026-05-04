import { test, expect } from "@playwright/test";

/**
 * Visual regression — public pages (no auth required).
 *
 * Première exécution : crée les baselines via `--update-snapshots`.
 * Exécutions suivantes : compare pixel-à-pixel.
 *
 * Baselines stockées dans `public-visual.spec.js-snapshots/`.
 */

// Pas d'auth — clean cookie jar pour pages publiques
test.use({ storageState: { cookies: [], origins: [] } });

// Pré-accepte la bannière cookies pour ne pas polluer les screenshots
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true }),
    );
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
  });
});

const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: "disabled",
  maxDiffPixelRatio: 0.01,
};

const VIEWPORTS = {
  desktop: { width: 1400, height: 900 },
  mobile: { width: 375, height: 812 },
};

const PUBLIC_PAGES = [
  { path: "/", name: "home" },
  { path: "/cgv", name: "cgv" },
  { path: "/mentions-legales", name: "mentions-legales" },
  { path: "/politique-de-confidentialite", name: "politique-confidentialite" },
  { path: "/cookies", name: "cookies" },
  { path: "/faq", name: "faq" },
  { path: "/qui-sommes-nous", name: "qui-sommes-nous" },
  { path: "/produits", name: "produits" },
];

async function waitForStable(page) {
  await page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(500);
}

test.describe("Visual — Public pages", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const { path, name } of PUBLIC_PAGES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`${name} — ${viewportName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
        await waitForStable(page);
        await expect(page).toHaveScreenshot(
          `${name}-${viewportName}.png`,
          SCREENSHOT_OPTIONS,
        );
      });
    }
  }
});
