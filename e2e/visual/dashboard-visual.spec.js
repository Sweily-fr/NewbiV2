import { test, expect } from "../fixtures/auth.fixture.js";

/**
 * Visual regression — authenticated dashboard pages.
 *
 * Première exécution : crée les baselines via `--update-snapshots`.
 * Exécutions suivantes : compare pixel-à-pixel.
 *
 * Baselines stockées dans `dashboard-visual.spec.js-snapshots/`.
 */

const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: "disabled",
  maxDiffPixelRatio: 0.01,
};

const VIEWPORTS = {
  desktop: { width: 1400, height: 900 },
  mobile: { width: 375, height: 812 },
};

// Sous-ensemble représentatif des pages dashboard (top-level + outils principaux)
const DASHBOARD_PAGES = [
  { path: "/dashboard", name: "dashboard-home" },
  { path: "/dashboard/analytics", name: "analytics" },
  { path: "/dashboard/automatisation", name: "automatisation" },
  { path: "/dashboard/calendar", name: "calendar" },
  { path: "/dashboard/catalogues", name: "catalogues" },
  { path: "/dashboard/favoris", name: "favoris" },
  { path: "/dashboard/clients", name: "clients" },
  { path: "/dashboard/clients/blocked", name: "clients-blocked" },
  { path: "/dashboard/clients/listes", name: "clients-listes" },
  { path: "/dashboard/clients/segments", name: "clients-segments" },
  { path: "/dashboard/outils/factures", name: "factures" },
  { path: "/dashboard/outils/factures/new", name: "factures-new" },
  { path: "/dashboard/outils/devis", name: "devis" },
  { path: "/dashboard/outils/devis/new", name: "devis-new" },
  { path: "/dashboard/outils/bons-commande", name: "bons-commande" },
  { path: "/dashboard/outils/bons-commande/new", name: "bons-commande-new" },
  { path: "/dashboard/outils/factures-achat", name: "factures-achat" },
  { path: "/dashboard/outils/kanban", name: "kanban" },
  {
    path: "/dashboard/outils/transferts-fichiers",
    name: "transferts-fichiers",
  },
  { path: "/dashboard/outils/documents-partages", name: "documents-partages" },
  { path: "/dashboard/outils/signatures-mail", name: "signatures-mail" },
  { path: "/dashboard/outils/transactions", name: "transactions" },
  { path: "/dashboard/outils/prevision", name: "prevision" },
  { path: "/dashboard/outils/analytiques", name: "analytiques" },
  {
    path: "/dashboard/outils/mentions-legales",
    name: "outils-mentions-legales",
  },
  {
    path: "/dashboard/outils/optimiseur-seo-blog",
    name: "optimiseur-seo-blog",
  },
];

async function waitForStable(page) {
  await page
    .waitForLoadState("networkidle", { timeout: 20_000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  // Le dashboard a beaucoup de queries GraphQL; donne le temps aux skeletons
  // de se résoudre.
  await page.waitForTimeout(1500);
}

test.describe("Visual — Dashboard pages", () => {
  test.describe.configure({ timeout: 180_000 });

  for (const { path, name } of DASHBOARD_PAGES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test(`${name} — ${viewportName}`, async ({ authenticatedPage: page }) => {
        await page.setViewportSize(viewport);
        await page.goto(path, {
          waitUntil: "domcontentloaded",
          timeout: 90_000,
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
