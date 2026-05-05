import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Favoris", () => {
  test.setTimeout(90000);

  test("Page favoris se charge", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard/favoris", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(1500);

    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("Page contient un titre ou état vide", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/favoris", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent("body");
    const hasFavoritesContent =
      bodyText.includes("Favori") ||
      bodyText.includes("favori") ||
      bodyText.includes("Favorite") ||
      bodyText.includes("Aucun");
    expect(hasFavoritesContent).toBeTruthy();
  });
});
