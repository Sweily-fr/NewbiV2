import { test, expect } from "../fixtures/auth.fixture.js";
import AxeBuilder from "@axe-core/playwright";

// Accessibility audits using axe-core. Run with:
//   PLAYWRIGHT_PROJECT=a11y npx playwright test --project=a11y
//
// We assert there are no SERIOUS or CRITICAL violations on key authenticated
// pages. Lesser violations (moderate / minor) are reported but don't fail.

const PAGES_TO_AUDIT = [
  { path: "/dashboard", name: "Dashboard home" },
  { path: "/dashboard/clients", name: "Clients" },
  { path: "/dashboard/outils/factures", name: "Factures" },
  { path: "/dashboard/outils/devis", name: "Devis" },
  { path: "/dashboard/outils/kanban", name: "Kanban" },
  { path: "/dashboard/catalogues", name: "Catalogues" },
  // /dashboard/account a été supprimée (commit 8d21709a, 2026-02-25) au profit
  // d'un settings-modal (src/components/settings-modal.jsx). Les composants
  // ChangePassword/Setup2FA/etc. existent encore mais sont rendus via le modal.
  // Voir REGRESSIONS_TO_FIX.md R5.
];

test.describe("Accessibility (a11y) — authenticated pages", () => {
  test.setTimeout(90000);

  for (const { path, name } of PAGES_TO_AUDIT) {
    test(`${name} (${path}) has no SERIOUS or CRITICAL a11y violations`, async ({
      authenticatedPage: page,
    }) => {
      await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      // Let async content load
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );

      if (blocking.length > 0) {
        console.log(
          `\n⚠️  ${blocking.length} a11y violations on ${path}:`,
          blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join("\n"),
        );
      }

      expect(
        blocking,
        `Found ${blocking.length} serious/critical a11y violations on ${path}`,
      ).toHaveLength(0);
    });
  }
});
