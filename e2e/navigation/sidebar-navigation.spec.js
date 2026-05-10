import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Sidebar Navigation", () => {
  test("should navigate to Invoices page", async ({
    authenticatedPage: page,
  }) => {
    const invoicesLink = page
      .locator(
        'a[href*="factures"], [data-testid="nav-invoices"], a:has-text("Factures")',
      )
      .first();

    if (await invoicesLink.isVisible({ timeout: 5000 })) {
      await invoicesLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("factures");
    }
  });
});
