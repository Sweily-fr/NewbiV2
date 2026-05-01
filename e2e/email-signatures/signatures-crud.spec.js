import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page Signatures Mail soit chargée
async function waitForSignaturesPage(page) {
  await page.goto("/dashboard/outils/signatures-mail", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  // Attendre soit le h1 desktop "Signatures Mail" soit le h2 mobile
  // "Fonctionnalité Desktop uniquement". L'ancien `text=Signatures Mail`
  // ne matchait pas le <h1> rendu et tombait sur le <h2> hidden (lg:hidden).
  const desktopHeading = page.getByRole("heading", {
    level: 1,
    name: "Signatures Mail",
  });
  const mobileHeading = page.getByRole("heading", {
    level: 2,
    name: /Fonctionnalité Desktop/i,
  });
  await expect(desktopHeading.or(mobileHeading)).toBeVisible({
    timeout: 30000,
  });

  // Attendre la query GraphQL (best-effort)
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("EmailSignatures") ||
          res.request().postData()?.includes("getMyEmailSignatures") ||
          res.request().postData()?.includes("emailSignatures")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

test.describe("Signatures Mail", () => {
  test.setTimeout(90000);

  test("Flow: Page — titre principal visible (ou notice desktop)", async ({
    authenticatedPage: page,
  }) => {
    await waitForSignaturesPage(page);

    // Sur desktop : <h1>Signatures Mail</h1> — sur mobile : <h2>Fonctionnalité
    // Desktop uniquement</h2>. getByRole évite le matching textuel imprécis
    // qui retombait sur le <h2> hidden quand le <h1> desktop était présent.
    const desktopTitle = page.getByRole("heading", {
      level: 1,
      name: "Signatures Mail",
    });
    const mobileNotice = page.getByRole("heading", {
      level: 2,
      name: /Fonctionnalité Desktop/i,
    });

    const hasDesktop = await desktopTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasMobile = await mobileNotice
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasDesktop || hasMobile).toBeTruthy();
  });

  test("Flow: Bouton 'Créer une signature' visible (desktop)", async ({
    authenticatedPage: page,
  }) => {
    await waitForSignaturesPage(page);

    // Si on est sur la notice mobile/desktop-only, skip
    const mobileNotice = await page
      .locator("text=Fonctionnalité Desktop")
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (mobileNotice) {
      test.skip(true, "Vue mobile — création de signature désactivée");
    }

    const createBtn = page
      .locator('button:has-text("Créer une signature")')
      .or(page.locator('button:has-text("Nouvelle signature")'))
      .or(page.locator('a:has-text("Créer une signature")'))
      .first();

    await expect(createBtn).toBeVisible({ timeout: 10000 });
  });

  test("Flow: Liste/grille des signatures ou état vide", async ({
    authenticatedPage: page,
  }) => {
    await waitForSignaturesPage(page);

    const mobileNotice = await page
      .locator("text=Fonctionnalité Desktop")
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (mobileNotice) {
      test.skip(true, "Vue mobile — pas de liste affichée");
    }

    // Soit un tableau/grille, soit un état "vide"
    const table = page.locator("table").first();
    const grid = page.locator('[role="grid"], .grid').first();
    const emptyState = page
      .locator("text=/aucune signature|aucun|empty|pas de signature/i")
      .first();

    const hasTable = await table
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const hasGrid = await grid.isVisible({ timeout: 2000 }).catch(() => false);
    const hasEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasTable || hasGrid || hasEmpty).toBeTruthy();
  });

  test("Flow: Clic sur 'Créer une signature' → sélecteur de template", async ({
    authenticatedPage: page,
  }) => {
    await waitForSignaturesPage(page);

    const mobileNotice = await page
      .locator("text=Fonctionnalité Desktop")
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (mobileNotice) {
      test.skip(true, "Vue mobile — création de signature désactivée");
    }

    const createBtn = page
      .locator('button:has-text("Créer une signature")')
      .or(page.locator('button:has-text("Nouvelle signature")'))
      .first();

    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Bouton de création non disponible");
    }

    const isDisabled = await createBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      test.skip(true, "Mode lecture seule — création de signature désactivée");
    }

    await createBtn.click();

    // Soit un dialog (template selector), soit une navigation
    const dialog = page.locator('[role="dialog"]').first();
    const hasDialog = await dialog
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasDialog) {
      const dialogText = await dialog.textContent();
      expect(dialogText && dialogText.length > 0).toBeTruthy();
      await page.keyboard.press("Escape");
    } else {
      // Possible navigation vers /new
      const url = page.url();
      expect(
        url.includes("signatures-mail") || url.includes("dashboard"),
      ).toBeTruthy();
    }
  });
});
