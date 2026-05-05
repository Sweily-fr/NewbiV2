import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// A11y audits for public (unauthenticated) pages.

const PUBLIC_PAGES = [
  { path: "/", name: "Landing" },
  { path: "/auth/login", name: "Login" },
  { path: "/auth/signup", name: "Signup" },
  { path: "/cgv", name: "CGV" },
  { path: "/mentions-legales", name: "Mentions légales" },
  { path: "/politique-de-confidentialite", name: "Politique confidentialité" },
];

test.describe("Accessibility (a11y) — public pages", () => {
  test.setTimeout(60000);

  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path}) — no SERIOUS or CRITICAL violations`, async ({
      page,
    }) => {
      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      if (!response || response.status() >= 400) {
        test.skip(true, `Page ${path} returned ${response?.status()}`);
      }

      await page.waitForTimeout(1500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const blocking = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );

      if (blocking.length > 0) {
        console.log(
          `\n⚠️  ${blocking.length} a11y violations on ${path}:`,
          blocking.map((v) => `  ${v.id} (${v.impact}): ${v.help}`).join("\n"),
        );
      }

      expect(
        blocking,
        `Found ${blocking.length} serious/critical a11y violations on ${path}`,
      ).toHaveLength(0);
    });
  }
});
