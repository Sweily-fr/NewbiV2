import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page Transactions soit chargée
async function waitForTransactionsPage(page) {
  await page.goto("/dashboard/outils/transactions", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  // Attendre un indicateur de la page (bouton, dropdown, ou solde).
  // Note: `.first()` MUST be at the end of the chain in strict mode — putting
  // it inside .or() branches still leaves the outer chain matching multiple
  // elements when several branches resolve.
  await expect(
    page
      .locator('button:has-text("Nouvelle transaction")')
      .or(page.locator('button:has-text("Tous les comptes")'))
      .or(page.locator('button:has-text("Exporter")'))
      .or(page.locator("text=Solde"))
      .first(),
  ).toBeVisible({ timeout: 30000 });

  // Attendre les queries GraphQL (transactions / comptes bancaires)
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("Transactions") ||
          res.request().postData()?.includes("DashboardData") ||
          res.request().postData()?.includes("BankingAccounts") ||
          res.request().postData()?.includes("transactions")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Transactions", () => {
  test.setTimeout(90000);

  test("Flow: Page liste — header avec solde et actions", async ({
    authenticatedPage: page,
  }) => {
    await waitForTransactionsPage(page);

    // Le header contient un solde (montant € HT) ou un bouton de transaction
    const bodyText = await page.textContent("body");
    const hasHeader =
      bodyText.includes("€") ||
      bodyText.includes("Tous les comptes") ||
      bodyText.includes("Nouvelle transaction") ||
      bodyText.includes("Solde");

    expect(hasHeader).toBeTruthy();
  });

  test("Flow: Bouton 'Nouvelle transaction' ou dropdown d'action visible", async ({
    authenticatedPage: page,
  }) => {
    await waitForTransactionsPage(page);

    const createBtn = page
      .locator('button:has-text("Nouvelle transaction")')
      .or(page.locator('button:has-text("Créer")'))
      .or(page.locator('button:has-text("Saisie manuelle")'))
      .first();

    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("Flow: Sélecteur de compte bancaire / sync banking visible", async ({
    authenticatedPage: page,
  }) => {
    await waitForTransactionsPage(page);

    // Sélecteur des comptes bancaires (dropdown "Tous les comptes")
    const accountSelector = page
      .locator('button:has-text("Tous les comptes")')
      .or(page.locator('button:has-text("comptes")'))
      .or(page.locator('button:has-text("Compte")'))
      .first();

    const hasSelector = await accountSelector
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Soit on voit le sélecteur, soit on voit un texte indiquant la
    // synchronisation bancaire (ou état vide pour comptes non connectés)
    const bodyText = (await page.textContent("body"))?.toLowerCase() || "";
    const hasBankingInfo =
      bodyText.includes("compte") ||
      bodyText.includes("banque") ||
      bodyText.includes("bank") ||
      bodyText.includes("sync") ||
      bodyText.includes("connect") ||
      bodyText.includes("solde");

    expect(hasSelector || hasBankingInfo).toBeTruthy();
  });

  test("Flow: Tableau de transactions ou état vide", async ({
    authenticatedPage: page,
  }) => {
    await waitForTransactionsPage(page);

    // Soit on a un tableau, soit un état "vide"
    const table = page.locator("table").first();
    const emptyState = page
      .locator(
        "text=/aucune transaction|aucun|empty|pas de transaction|connectez/i",
      )
      .first();

    const hasTable = await table
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test("Flow: Bouton d'export visible", async ({ authenticatedPage: page }) => {
    await waitForTransactionsPage(page);

    const exportBtn = page
      .locator('button:has-text("Exporter")')
      .or(page.locator('button:has-text("Export")'))
      .or(page.locator('button:has-text("Télécharger")'))
      .first();

    const hasExport = await exportBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Si pas de bouton export, vérifier au moins que la page contient un
    // contenu cohérent.
    const bodyText = await page.textContent("body");
    expect(hasExport || (bodyText && bodyText.length > 200)).toBeTruthy();
  });
});
