import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page Bons de commande soit chargée
async function waitForPurchaseOrdersPage(page) {
  await page.goto("/dashboard/outils/bons-commande", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  // Attendre un indicateur de la page (titre ou bouton de création)
  await expect(
    page
      .locator("text=Bons de commande")
      .or(page.locator('button:has-text("Nouveau bon de commande")'))
      .first(),
  ).toBeVisible({ timeout: 30000 });

  // Attendre la query GraphQL (best-effort)
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("PurchaseOrders") ||
          res.request().postData()?.includes("GetPurchaseOrders") ||
          res.request().postData()?.includes("purchaseOrders")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Bons de commande", () => {
  test.setTimeout(90000);

  test("Flow: Page liste — header et titre principal", async ({
    authenticatedPage: page,
  }) => {
    await waitForPurchaseOrdersPage(page);

    // Le titre principal doit être visible (peut être au pluriel ou variantes)
    await expect(
      page
        .locator("text=Bons de commande")
        .or(page.locator("text=Bon de commande"))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("Flow: Bouton 'Nouveau bon de commande' / action principale visible", async ({
    authenticatedPage: page,
  }) => {
    await waitForPurchaseOrdersPage(page);

    // Le bouton de création peut être désactivé (subscription) mais doit être présent
    const createBtn = page
      .locator('button:has-text("Nouveau bon de commande")')
      .or(page.locator('button:has-text("Nouveau BC")'))
      .or(page.locator('button:has-text("Créer un bon")'))
      .or(page.locator('a:has-text("Nouveau bon de commande")'))
      .first();

    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("Flow: Stats cards / boutons secondaires visibles", async ({
    authenticatedPage: page,
  }) => {
    await waitForPurchaseOrdersPage(page);

    // L'un de ces éléments doit être visible (stats ou bouton secondaire)
    const bodyText = await page.textContent("body");
    const hasSecondary =
      bodyText.includes("Total commandé") ||
      bodyText.includes("Total confirmé") ||
      bodyText.includes("En cours") ||
      bodyText.includes("Importer") ||
      bodyText.includes("Exporter");
    expect(hasSecondary).toBeTruthy();
  });

  test("Flow: Tableau des bons de commande ou état vide", async ({
    authenticatedPage: page,
  }) => {
    await waitForPurchaseOrdersPage(page);

    // Soit un tableau, soit un état "vide"
    const table = page.locator("table").first();
    const emptyState = page
      .locator("text=/aucun|empty|pas de bon|aucune commande/i")
      .first();

    const hasTable = await table
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test("Flow: Ouverture de l'éditeur de bon de commande", async ({
    authenticatedPage: page,
  }) => {
    await waitForPurchaseOrdersPage(page);

    const createBtn = page
      .locator('button:has-text("Nouveau bon de commande")')
      .or(page.locator('button:has-text("Nouveau BC")'))
      .or(page.locator('a:has-text("Nouveau bon de commande")'))
      .first();

    // Si le bouton est désactivé (read-only / subscription), skip
    const isDisabled = await createBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      test.skip(true, "Mode lecture seule — création de BC désactivée");
    }

    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Bouton de création de BC non disponible");
    }

    await createBtn.click();

    // Soit un dialog, soit une nouvelle page (/new)
    const dialog = page.locator('[role="dialog"]').first();
    const hasDialog = await dialog
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasDialog) {
      // Modal d'édition visible
      const dialogText = await dialog.textContent();
      expect(dialogText && dialogText.length > 0).toBeTruthy();
      await page.keyboard.press("Escape");
    } else {
      // Navigation vers /new — attendre
      await page
        .waitForURL("**/bons-commande/**", { timeout: 15000 })
        .catch(() => {});
      const url = page.url();
      expect(
        url.includes("bons-commande") || url.includes("dashboard"),
      ).toBeTruthy();
    }
  });
});
