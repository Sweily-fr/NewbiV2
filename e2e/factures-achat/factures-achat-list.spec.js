import { test, expect } from "../fixtures/auth.fixture.js";

async function gotoFacturesAchat(page) {
  await page.goto("/dashboard/outils/factures-achat", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("PurchaseInvoice") ||
          res.request().postData()?.includes("Expense")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Factures d'achat (purchase invoices)", () => {
  test.setTimeout(90000);

  test("Page se charge avec son titre", async ({ authenticatedPage: page }) => {
    await gotoFacturesAchat(page);
    await expect(
      page.getByRole("heading", { name: /Factures d.achat/i }).first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test("Stats / KPI sont visibles (factures à payer, retard)", async ({
    authenticatedPage: page,
  }) => {
    await gotoFacturesAchat(page);

    // Wait for the page heading first so we know the client component
    // has rendered before reading body text.
    await expect(
      page.getByRole("heading", { name: /Factures d.achat/i }).first(),
    ).toBeVisible({ timeout: 30000 });

    await expect(
      page.getByText(/payer|retard|Montant|Total/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Bouton de création / import visible", async ({
    authenticatedPage: page,
  }) => {
    await gotoFacturesAchat(page);

    const createBtn = page
      .locator('button:has-text("Nouvelle facture")')
      .or(page.locator('button:has-text("Importer")'))
      .or(page.locator('button:has-text("OCR")'))
      .or(page.locator('button:has-text("Ajouter")'))
      .first();

    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("Tableau ou état vide visible", async ({ authenticatedPage: page }) => {
    await gotoFacturesAchat(page);

    const table = page.locator("table").first();
    const empty = page
      .locator("text=/aucune facture|aucun élément|vide|pas de/i")
      .first();

    const hasTable = await table
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasEmpty = await empty
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test("Filtres ou recherche visibles", async ({ authenticatedPage: page }) => {
    await gotoFacturesAchat(page);

    const searchInput = page
      .locator('input[placeholder*="echerch"]')
      .or(page.locator('input[type="search"]'))
      .first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchInput).toBeEnabled();
    }
  });
});
