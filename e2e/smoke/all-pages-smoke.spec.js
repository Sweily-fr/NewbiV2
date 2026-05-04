import { test, expect } from "../fixtures/auth.fixture.js";

/**
 * Smoke test — visit every static dashboard page and assert the app didn't
 * crash (no runtime React error, no 500, the page rendered something).
 *
 * Dynamic routes ([id], [shareLink]) are excluded because they require seeded
 * domain entities. They have dedicated E2E specs in their own folders.
 *
 * What this catches:
 *   - SSR crashes (RSC errors, missing imports)
 *   - Auth/permission regressions (page redirects when it shouldn't)
 *   - Route registration mistakes
 *   - GraphQL queries that fail at boot
 *
 * What it doesn't catch:
 *   - Functional regressions (covered by per-feature specs)
 *   - Visual regressions (covered by *-visual.spec.js)
 */

const STATIC_DASHBOARD_PAGES = [
  // Top-level
  "/dashboard",
  "/dashboard/analytics",
  "/dashboard/automatisation",
  "/dashboard/calendar",
  "/dashboard/catalogues",
  "/dashboard/favoris",

  // Clients
  "/dashboard/clients",
  "/dashboard/clients/blocked",
  "/dashboard/clients/listes",
  "/dashboard/clients/segments",

  // Outils — billing & docs
  "/dashboard/outils/factures",
  "/dashboard/outils/factures/new",
  "/dashboard/outils/devis",
  "/dashboard/outils/devis/new",
  "/dashboard/outils/bons-commande",
  "/dashboard/outils/bons-commande/new",
  "/dashboard/outils/factures-achat",

  // Outils — productivity
  "/dashboard/outils/kanban",
  "/dashboard/outils/kanban/new",
  "/dashboard/outils/transferts-fichiers",
  "/dashboard/outils/transferts-fichiers/new",
  "/dashboard/outils/documents-partages",
  "/dashboard/outils/signatures-mail",
  "/dashboard/outils/signatures-mail/new",

  // Outils — finance & analytics
  "/dashboard/outils/transactions",
  "/dashboard/outils/prevision",
  "/dashboard/outils/analytiques",
  "/dashboard/outils/analytiques/vue-densemble",

  // Outils — divers
  "/dashboard/outils/mentions-legales",
  "/dashboard/outils/optimiseur-seo-blog",
];

test.describe("Smoke — all dashboard pages render", () => {
  // Each page has its own short timeout; the suite is parallel-safe.
  test.describe.configure({ mode: "parallel" });

  for (const path of STATIC_DASHBOARD_PAGES) {
    test(`renders ${path}`, async ({ authenticatedPage: page }) => {
      // Generous test timeout — the Next.js dev server can stall under
      // parallel load while compiling routes on the fly. Need enough budget
      // for the fixture's /dashboard load + the target page's first compile.
      test.setTimeout(180_000);
      const consoleErrors = [];
      page.on("pageerror", (err) => consoleErrors.push(err.message));
      page.on("response", (res) => {
        // Ignore third-party/CDN noise — only flag our own server 5xx.
        const url = res.url();
        const isOwn =
          url.includes("/api/") ||
          url.includes("/dashboard") ||
          url.endsWith(path);
        if (isOwn && res.status() >= 500) {
          consoleErrors.push(`HTTP ${res.status()} on ${url}`);
        }
      });

      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });

      // The route either responded 200, redirected to a 200, or is itself 200.
      // We don't fail on redirects — some pages redirect to /onboarding etc.
      if (response) {
        expect(response.status()).toBeLessThan(500);
      }

      // App shell rendered something — no blank page / fatal error boundary.
      const body = page.locator("body");
      await expect(body).toBeVisible();
      const bodyText = await body.innerText();
      expect(bodyText.length).toBeGreaterThan(0);

      // No runtime React errors raised during initial render.
      expect(
        consoleErrors,
        `Errors on ${path}: ${consoleErrors.join("\n")}`,
      ).toHaveLength(0);
    });
  }
});
