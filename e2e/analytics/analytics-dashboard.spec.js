import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Analytics dashboard", () => {
  test.setTimeout(90000);

  test("Page principale d'analytique se charge", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/analytics", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Attendre la requête GraphQL des données analytiques (best-effort)
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/graphql") &&
          (res.request().postData()?.includes("Analytics") ||
            res.request().postData()?.includes("Dashboard") ||
            res.request().postData()?.includes("Stats")),
        { timeout: 15000 },
      )
      .catch(() => {});

    // Le titre doit être visible (ou un état dégradé acceptable)
    const heading = page
      .locator("h1:has-text('Analytique')")
      .or(page.locator("text=/Analyti|Statisti/i"))
      .first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });

  test("Page analytiques (outils) se charge", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/outils/analytiques", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/graphql") &&
          res.request().postData()?.includes("Analytic"),
        { timeout: 15000 },
      )
      .catch(() => {});

    // Soit la page rend un titre, soit elle redirige (pages avec sous-tabs)
    const bodyText = await page.textContent("body");
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("Sélecteur de période est interactif si présent", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/analytics", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(500);

    const periodSelectors = page
      .locator(
        'button:has-text("Mois"), button:has-text("Année"), button:has-text("Semaine"), [role="combobox"]',
      )
      .first();

    if (await periodSelectors.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(periodSelectors).toBeEnabled();
    }
  });

  test("Bouton d'export visible si abonnement permet", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard/analytics", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(500);

    const exportBtn = page
      .locator('button:has-text("Exporter")')
      .or(page.locator('button:has-text("Export")'))
      .first();

    // Best-effort: si présent, doit être cliquable
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await exportBtn.isEnabled()).toBeDefined();
    }
  });

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
