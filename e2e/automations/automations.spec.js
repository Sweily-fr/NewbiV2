import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Automatisations", () => {
  test.setTimeout(90000);

  test("Page automatisation se charge", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/automatisation", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(1500);

    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("Page contient des éléments d'automatisation", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/automatisation", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1500);

    const bodyText = await page.textContent("body");
    const hasAutomationContent =
      bodyText.includes("Automatisation") ||
      bodyText.includes("Automation") ||
      bodyText.includes("Règle") ||
      bodyText.includes("Workflow") ||
      bodyText.includes("CRM") ||
      bodyText.includes("Email") ||
      bodyText.includes("Document");
    expect(hasAutomationContent).toBeTruthy();
  });
});
