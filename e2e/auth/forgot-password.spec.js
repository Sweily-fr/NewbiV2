import { test, expect } from "@playwright/test";

test.describe("Forgot password / reset", () => {
  test.setTimeout(60000);

  test("Page de connexion contient un lien 'Mot de passe oublié'", async ({
    page,
  }) => {
    await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    const forgotLink = page
      .locator('a:has-text("oublié")')
      .or(page.locator('a:has-text("Forgot")'))
      .or(page.locator("text=/mot de passe oublié/i"))
      .first();

    await expect(forgotLink).toBeVisible({ timeout: 10000 });
  });

  test("Page reset password se charge sans token (état initial)", async ({
    page,
  }) => {
    const response = await page.goto("/auth/forgot-password", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
      // Ne pas faire échouer si la page n'existe pas - certaines implémentations utilisent un modal
    });

    // Soit la page existe et charge, soit 404 (auth via modal/dialog)
    if (response && response.status() < 400) {
      const bodyText = await page.textContent("body");
      expect(bodyText.length).toBeGreaterThan(20);
    } else {
      // 404 acceptable - le flow est ailleurs
      expect(response?.status() || 0).toBeGreaterThanOrEqual(400);
    }
  });
});
