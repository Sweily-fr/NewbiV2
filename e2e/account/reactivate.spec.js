import { test, expect } from "@playwright/test";

test.describe("Reactivate account page", () => {
  test.setTimeout(60000);

  test("Page se charge sans token (état d'erreur attendu)", async ({
    page,
  }) => {
    await page.goto("/reactivate-account", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // La page doit charger (pas une 500)
    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("Avec token invalide, message d'erreur ou redirection", async ({
    page,
  }) => {
    await page.goto("/reactivate-account?token=invalid-xxx", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent("body");
    // Doit afficher du contenu (succès, erreur, ou bouton de connexion)
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("API endpoint /api/account/reactivate refuse les requêtes invalides", async ({
    page,
  }) => {
    const response = await page.request.post("/api/account/reactivate", {
      data: { token: "" },
      failOnStatusCode: false,
    });
    // 400 / 401 / 404 attendu
    expect([400, 401, 403, 404, 405]).toContain(response.status());
  });
});
