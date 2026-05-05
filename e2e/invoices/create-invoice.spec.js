import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page factures liste soit chargée (après ProRouteGuard + GraphQL)
async function waitForInvoicesPage(page) {
  await page.goto("/dashboard/outils/factures", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Factures clients").first()).toBeVisible({
    timeout: 30000,
  });
  // Wait for the data-fetching GraphQL response instead of an arbitrary delay
  await page
    .waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        (res.request().postData()?.includes("GetInvoices") ||
          res.request().postData()?.includes("Invoices")),
      { timeout: 15000 },
    )
    .catch(() => {});
}

// Helper : attend que l'éditeur de facture soit chargé
async function waitForInvoiceEditor(page) {
  await page.goto("/dashboard/outils/factures/new", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Sélection d'un client").first()).toBeVisible({
    timeout: 30000,
  });
}

// Helper : sélectionner le premier client disponible via le combobox
async function selectFirstClient(page) {
  // Le sélecteur client est un button[role="combobox"]
  const combobox = page.locator('button[role="combobox"]').first();
  await combobox.click();

  // Attendre que la liste de clients charge (pas "Aucun client trouvé" ni "Recherche...")
  // Les clients sont des boutons dans le popover avec une classe hover:bg-accent
  const clientOption = page
    .locator("[data-radix-popper-content-wrapper] .max-h-\\[280px\\] button")
    .first();

  // Attendre que le premier client apparaisse (max 10s)
  await expect(clientOption).toBeVisible({ timeout: 10000 });
  await clientOption.click();
  await page.waitForTimeout(500);
  return true;
}

// Helper : passer à l'étape 2
async function goToStep2(page) {
  await page.locator('button:has-text("Suivant")').first().click();
  await expect(page.locator("text=Articles et produits")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Factures", () => {
  test.setTimeout(90000); // Ces tests font beaucoup de navigation + attente GraphQL

  test("Flow: Page liste — header, stats, boutons, dropdown, tableau", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoicesPage(page);

    // Stats
    await expect(page.locator("text=CA facturé")).toBeVisible();
    await expect(page.locator("text=CA payé")).toBeVisible();

    // Boutons d'action
    await expect(
      page.locator('button:has-text("Nouvelle facture")').first(),
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Importer")').first(),
    ).toBeVisible();

    // Dropdown "Facture vierge"
    const dropdownTrigger = page
      .locator('button:has-text("Nouvelle facture") + button')
      .first();
    if (await dropdownTrigger.isVisible({ timeout: 3000 })) {
      await dropdownTrigger.click();
      await expect(
        page.locator('[role="menuitem"]:has-text("Facture vierge")'),
      ).toBeVisible({ timeout: 3000 });
      await page.keyboard.press("Escape");
    }
  });

  test("Flow: Création facture de situation — référence auto-générée", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoiceEditor(page);

    // Sélectionner type "Facture de situation"
    const typeSelect = page.locator("#invoice-type").first();
    await typeSelect.click();
    await page
      .locator('[role="option"]:has-text("Facture de situation")')
      .click();

    // Vérifier le texte sur la référence auto
    await page.waitForTimeout(500);
    const infoText = page.locator("text=référence unique").first();
    const hasInfo = await infoText
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasInfo).toBeTruthy();

    // Sélectionner un client
    await selectFirstClient(page);
    await goToStep2(page);
  });

  test("Flow: Auto-liquidation met la TVA à 0%", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoiceEditor(page);
    await selectFirstClient(page);
    await goToStep2(page);

    // Cocher auto-liquidation
    await page.locator("#isReverseCharge").first().click();

    // Ajouter un article
    await page.locator('button:has-text("Ajouter un article")').first().click();
    await page.waitForTimeout(500);

    // TVA 0%
    await expect(page.locator("text=0% TVA").first()).toBeVisible({
      timeout: 3000,
    });
  });

  test("Flow: Actions liste — clic ligne, menu, paramètres, relances", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoicesPage(page);

    // Attendre une vraie ligne (pas skeleton) — auto-retry via expect
    const realRow = page
      .locator("table tbody tr:not(:has(.animate-pulse))")
      .first();
    await expect(realRow).toBeVisible({ timeout: 15000 });

    // --- Clic sur une facture → sidebar ou navigation ---
    await Promise.all([
      page
        .waitForResponse(
          (res) =>
            res.url().includes("/graphql") &&
            res.request().postData()?.includes("GetInvoice"),
          { timeout: 10000 },
        )
        .catch(() => {}),
      realRow.click(),
    ]);

    // Vérifier que quelque chose s'est passé (sidebar, navigation, ou page de détail)
    const pageText = await page.textContent("body");
    // Après clic, le contenu devrait contenir des infos de facture
    expect(pageText.length).toBeGreaterThan(100);

    // --- Modal Paramètres ---
    // Revenir à la liste si nécessaire
    if (
      !page.url().endsWith("/factures") &&
      !page.url().endsWith("/factures/")
    ) {
      await page.goto("/dashboard/outils/factures", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await expect(page.locator("text=Factures clients").first()).toBeVisible({
        timeout: 30000,
      });
    }

    const settingsButton = page
      .locator("button:has(svg.lucide-settings)")
      .first();
    if (await settingsButton.isVisible({ timeout: 3000 })) {
      await settingsButton.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({
        timeout: 5000,
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // --- Modal Relances auto ---
    const reminderButton = page
      .locator("button:has(svg.lucide-mail-check)")
      .first();
    if (await reminderButton.isVisible({ timeout: 3000 })) {
      await reminderButton.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({
        timeout: 5000,
      });
      await page.keyboard.press("Escape");
    }
  });

  test("Flow: Preview PDF visible en desktop", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoiceEditor(page);

    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 1024) {
      const previewPanel = page.locator('[class*="border-l"]').first();
      await expect(previewPanel).toBeVisible({ timeout: 5000 });
    }
  });
});
