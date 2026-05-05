import { test, expect } from "@playwright/test";

// Public route — no auth needed
test.describe("Accept invitation page", () => {
  test.setTimeout(60000);

  test("Page se charge avec un id invalide", async ({ page }) => {
    await page.goto("/accept-invitation/invalid-id-xyz", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Doit afficher un état (chargement, erreur, ou redirection)
    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test("Page affiche un message ou redirige pour id manquant", async ({
    page,
  }) => {
    const response = await page.goto("/accept-invitation/", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Soit 404, soit redirige vers une page valide, soit affiche du contenu
    const status = response?.status();
    expect([200, 301, 302, 307, 308, 404]).toContain(status || 200);
  });

  test("L'URL de la page d'invitation existe (pas d'erreur 500)", async ({
    page,
  }) => {
    const response = await page.goto("/accept-invitation/test-id-1234", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    expect(response?.status() || 200).toBeLessThan(500);
  });
});
