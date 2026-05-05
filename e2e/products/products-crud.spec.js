import { test, expect } from "../fixtures/auth.fixture.js";

// Helper: navigate to the catalogue page and wait for the product list to settle
async function waitForCataloguePage(page) {
  await page.goto("/dashboard/catalogues", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await expect(page.locator("text=Gestion du Catalogue").first()).toBeVisible({
    timeout: 30000,
  });

  // The page calls the products query — wait for it to settle (best-effort)
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("Products") ||
          res.request().postData()?.includes("GetProducts")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Catalogue produits", () => {
  test.setTimeout(90000);

  test("Header, boutons d'action et structure de la page", async ({
    authenticatedPage: page,
  }) => {
    await waitForCataloguePage(page);

    // Titre principal
    await expect(
      page.locator("text=Gestion du Catalogue").first(),
    ).toBeVisible();

    // Bouton "Ajouter un produit" (action principale)
    await expect(
      page.locator('button:has-text("Ajouter un produit")').first(),
    ).toBeVisible({ timeout: 10000 });

    // Boutons secondaires : Importer, Champs personnalisés
    await expect(
      page.locator('button:has-text("Importer")').first(),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Champs")').first(),
    ).toBeVisible();
  });

  test("Ouverture du formulaire de création de produit", async ({
    authenticatedPage: page,
  }) => {
    await waitForCataloguePage(page);

    await page.locator('button:has-text("Ajouter un produit")').first().click();

    // Le dialog doit apparaître
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Champ "Nom du produit"
    const nameField = page
      .locator('input[placeholder*="Ordinateur"]')
      .or(page.locator('input[placeholder*="Dell"]'))
      .first();
    await expect(nameField).toBeVisible({ timeout: 5000 });

    // Champ "Référence" / SKU
    const refField = page
      .locator('input[placeholder*="DELL"]')
      .or(page.locator('input[placeholder*="REF"]'))
      .first();
    await expect(refField).toBeVisible();

    // Champ "Description"
    const descField = page.locator(
      'textarea[placeholder*="Description"], input[placeholder*="Description"]',
    );
    await expect(descField.first()).toBeVisible();

    // Bouton de sauvegarde présent
    await expect(
      page
        .locator('button:has-text("Enregistrer")')
        .or(page.locator('button:has-text("Créer")'))
        .or(page.locator('button:has-text("Ajouter")'))
        .first(),
    ).toBeVisible({ timeout: 5000 });

    // Fermer le dialog avec Escape
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });

  test("Ouverture du dialog d'import depuis fichier", async ({
    authenticatedPage: page,
  }) => {
    await waitForCataloguePage(page);

    const importBtn = page.locator('button:has-text("Importer")').first();

    // Si le bouton est désactivé (subscription read-only), skip
    if (await importBtn.isDisabled()) {
      test.skip(true, "Mode lecture seule — import désactivé");
    }

    await importBtn.click();

    // Un dialog avec étapes (upload / mapping) doit apparaître
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Le dialog doit contenir un input file ou un texte explicite
    const bodyText = await dialog.textContent();
    const hasImportFlow =
      bodyText?.includes("Importer") ||
      bodyText?.includes("Glisser") ||
      bodyText?.includes("CSV") ||
      bodyText?.includes("Excel") ||
      bodyText?.includes("fichier");
    expect(hasImportFlow).toBeTruthy();

    await page.keyboard.press("Escape");
  });

  test("Ouverture du gestionnaire de champs personnalisés", async ({
    authenticatedPage: page,
  }) => {
    await waitForCataloguePage(page);

    await page.locator('button:has-text("Champs")').first().click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Le contenu doit mentionner les champs personnalisés
    const text = await dialog.textContent();
    expect(text?.toLowerCase()).toMatch(/champ|custom|personnalisé/);

    await page.keyboard.press("Escape");
  });

  test("Le tableau des produits est rendu (peut être vide)", async ({
    authenticatedPage: page,
  }) => {
    await waitForCataloguePage(page);

    // Soit on a un tableau, soit un état "vide" — on accepte les deux
    const table = page.locator("table").first();
    const emptyState = page
      .locator("text=/aucun|empty|pas de produit/i")
      .first();

    const hasTable = await table
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });
});
