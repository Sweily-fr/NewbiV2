import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Analytics dashboard", () => {
  test.setTimeout(90000);

  test("Pas d'erreur fatale dans la console pendant le chargement", async ({
    authenticatedPage: page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/dashboard/analytics", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(2000);

    // Filtrer les erreurs non bloquantes connues
    const fatal = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("hydration") &&
        !e.includes("preload"),
    );
    expect(fatal).toEqual([]);
  });
});
