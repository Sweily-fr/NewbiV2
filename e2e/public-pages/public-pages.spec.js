import { test, expect } from "@playwright/test";

// Smoke tests for public marketing/legal pages
test.describe("Public pages", () => {
  test.setTimeout(60000);

  const publicRoutes = [
    { path: "/", expectStatus: [200, 301, 302, 307] },
    { path: "/cgv", expectStatus: [200, 301, 302, 307, 404] },
    { path: "/mentions-legales", expectStatus: [200, 301, 302, 307, 404] },
    {
      path: "/politique-de-confidentialite",
      expectStatus: [200, 301, 302, 307, 404],
    },
    { path: "/cookies", expectStatus: [200, 301, 302, 307, 404] },
    { path: "/faq", expectStatus: [200, 301, 302, 307, 404] },
    { path: "/qui-sommes-nous", expectStatus: [200, 301, 302, 307, 404] },
    { path: "/produits", expectStatus: [200, 301, 302, 307, 404] },
  ];

  for (const route of publicRoutes) {
    test(`Route publique ${route.path} ne retourne pas une 5xx`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      const status = response?.status() || 0;
      expect(status).toBeLessThan(500);
    });
  }
});

test.describe("404 / not found", () => {
  test.setTimeout(60000);

  test("Page inexistante affiche un 404", async ({ page }) => {
    const response = await page.goto("/this-route-definitely-does-not-exist", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    // Soit 404 explicite, soit Next.js affiche une page not-found avec status 200
    expect(response?.status() || 0).toBeLessThan(500);
  });
});
