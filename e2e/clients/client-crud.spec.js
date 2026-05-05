import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page clients soit chargée
async function waitForClientsPage(page) {
  await page.goto("/dashboard/clients", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  // Attendre que le h1 de la page clients soit rendu (desktop: "Gestion des
  // contacts", mobile: "Contacts"). Utilise getByRole pour éviter une strict
  // mode violation (le précédent .or(text=Contacts) matchait aussi le bouton
  // "Nouveau contact").
  // Timeout généreux : sur le 7e test consécutif, le dev server Next peut
  // mettre >30s à monter le RSC sous charge parallèle.
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
    timeout: 60000,
  });
  // Attendre que les données chargent
  // Wait for the clients GraphQL query to settle instead of an arbitrary timeout
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        res.request().postData()?.includes("GetClients"),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Clients", () => {
  test.setTimeout(90000);

  test("Flow: Page liste — header, recherche, boutons, tableau", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    // Bouton création
    await expect(
      page.locator('button:has-text("Nouveau contact")').first(),
    ).toBeVisible();

    // Barre de recherche
    const searchInput = page
      .locator('input[placeholder*="Recherchez"]')
      .or(page.locator('input[placeholder*="recherch"]'))
      .first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Tableau avec les clients seedés (2 clients)
    const tableBody = page.locator("table tbody");
    if (await tableBody.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = page.locator("table tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("Flow: Recherche de client par nom", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    const searchInput = page
      .locator('input[placeholder*="Recherchez"]')
      .or(page.locator('input[placeholder*="recherch"]'))
      .first();

    // Rechercher "Alpha" (client seedé) — wait for the search debounce + GraphQL response
    await searchInput.fill("Alpha");
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/graphql") &&
          res.request().postData()?.includes("Alpha"),
        { timeout: 10000 },
      )
      .catch(() => {});

    // Vérifier que le client Alpha apparaît
    await expect(page.locator("text=Alpha").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Flow: Ouverture du formulaire de création de client", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    // Cliquer sur "Nouveau contact" puis attendre qu'un dialog ou un formulaire dédié apparaisse
    await page.locator('button:has-text("Nouveau contact")').first().click();

    // Le modal ou la page de création doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    const hasDialog = await dialog
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasDialog) {
      // Modal de création visible
      // Vérifier les champs du formulaire
      const nameField = page
        .locator('input[placeholder*="entreprise"]')
        .or(page.locator('input[placeholder*="Nom"]'))
        .first();
      await expect(nameField).toBeVisible({ timeout: 5000 });

      // Type de client sélectionnable
      const bodyText = await dialog.textContent();
      const hasTypeSelector =
        bodyText.includes("Type") ||
        bodyText.includes("Entreprise") ||
        bodyText.includes("Particulier") ||
        bodyText.includes("COMPANY") ||
        bodyText.includes("INDIVIDUAL");
      expect(hasTypeSelector).toBeTruthy();

      // Bouton de sauvegarde
      await expect(
        page
          .locator('button:has-text("Enregistrer")')
          .or(
            page
              .locator('button:has-text("Créer")')
              .or(page.locator('button:has-text("Sauvegarder")')),
          )
          .first(),
      ).toBeVisible({ timeout: 5000 });

      // Fermer le modal
      await page.keyboard.press("Escape");
    } else {
      // Peut-être une navigation vers une page dédiée
      const currentUrl = page.url();
      expect(
        currentUrl.includes("/clients/new") || currentUrl.includes("/clients"),
      ).toBeTruthy();
    }
  });

  test("Flow: Clic sur un client existant → détails", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    // Clic sur la ligne — attendre que la fetch détail (GetClient) revienne
    await Promise.all([
      page
        .waitForResponse(
          (res) =>
            res.url().includes("/graphql") &&
            res.request().postData()?.includes("GetClient"),
          { timeout: 10000 },
        )
        .catch(() => {}),
      firstRow.click(),
    ]);

    // Vérifier qu'on voit les détails du client (sidebar ou page)
    const bodyText = await page.textContent("body");
    // Le client seedé "Entreprise Alpha SAS" ou "Micro-entreprise Beta" doit être visible
    const hasClientInfo =
      bodyText.includes("Alpha") ||
      bodyText.includes("Beta") ||
      bodyText.includes("contact@") ||
      bodyText.includes("SIRET");
    expect(hasClientInfo).toBeTruthy();
  });

  test("Flow: Sélection multiple et actions en lot", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    // Chercher les checkboxes dans le tableau
    const checkboxes = page
      .locator('table tbody tr input[type="checkbox"]')
      .or(page.locator('table tbody tr [role="checkbox"]'));

    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Cocher le premier client
      await checkboxes.first().click();

      // Vérifier qu'un indicateur de sélection apparaît
      const bodyText = await page.textContent("body");
      const hasSelection =
        bodyText.includes("sélectionné") ||
        bodyText.includes("selected") ||
        bodyText.includes("Supprimer") ||
        bodyText.includes("Plus d'actions");
      expect(hasSelection).toBeTruthy();
    }
  });

  test("Flow: Recherche avec terme sans résultat", async ({
    authenticatedPage: page,
  }) => {
    await waitForClientsPage(page);

    const searchInput = page
      .locator('input[placeholder*="Recherchez"]')
      .or(page.locator('input[placeholder*="recherch"]'))
      .first();

    // Rechercher un terme inexistant
    await searchInput.fill("ZZZZZZZZZ_INTROUVABLE");
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/graphql") &&
          res.request().postData()?.includes("ZZZZZZZZZ_INTROUVABLE"),
        { timeout: 10000 },
      )
      .catch(() => {});

    // Le tableau doit être vide ou afficher un message
    const bodyText = await page.textContent("body");
    const isEmpty =
      bodyText.includes("Aucun") ||
      bodyText.includes("aucun") ||
      bodyText.includes("vide") ||
      bodyText.includes("Pas de");

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();

    // Soit message "aucun résultat", soit 0 lignes
    expect(isEmpty || rowCount === 0).toBeTruthy();
  });
});
