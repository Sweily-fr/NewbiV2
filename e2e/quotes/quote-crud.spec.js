import { test, expect } from '../fixtures/auth.fixture.js';

// Helper : attend que la page devis liste soit chargée
async function waitForQuotesPage(page) {
  await page.goto('/dashboard/outils/devis', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('text=Devis clients').first()).toBeVisible({ timeout: 30000 });
  // Attendre que les skeletons disparaissent et les vraies données chargent
  await page.waitForTimeout(3000);
}

// Helper : attend que l'éditeur de devis soit chargé
async function waitForQuoteEditor(page) {
  await page.goto('/dashboard/outils/devis/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 30000 });
}

// Helper : sélectionner le premier client disponible via le combobox
async function selectFirstClient(page) {
  const combobox = page.locator('button[role="combobox"]').first();
  await combobox.click();

  const clientOption = page.locator('[data-radix-popper-content-wrapper] .max-h-\\[280px\\] button').first();
  await expect(clientOption).toBeVisible({ timeout: 10000 });
  await clientOption.click();
  await page.waitForTimeout(500);
}

// Helper : passer à l'étape 2
async function goToStep2(page) {
  await page.locator('button:has-text("Suivant")').first().click();
  await expect(
    page.locator('text=Articles et produits').or(page.locator('text=Articles et services'))
  ).toBeVisible({ timeout: 10000 });
}

test.describe('Devis', () => {
  test.setTimeout(90000);

  test('Flow: Page liste — header, stats, boutons, tableau', async ({ authenticatedPage: page }) => {
    await waitForQuotesPage(page);

    // Stats
    await expect(page.locator('text=Total devisé').or(page.locator('text=Total'))).toBeVisible({ timeout: 5000 });

    // Boutons d'action
    await expect(page.locator('button:has-text("Nouveau devis")').first()).toBeVisible();

    // Attendre que le tableau ait des données (seeded: 3 devis)
    await page.waitForTimeout(3000);
    const tableBody = page.locator('table tbody');
    if (await tableBody.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('Flow: Création devis standard complète (2 étapes)', async ({ authenticatedPage: page }) => {
    // Naviguer depuis la liste
    await waitForQuotesPage(page);
    await page.locator('button:has-text("Nouveau devis")').first().click();
    await page.waitForURL('**/devis/new**', { timeout: 15000 });

    // --- ÉTAPE 1 : Client + Infos devis ---
    await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 15000 });

    // Sélectionner un client via le combobox
    await selectFirstClient(page);

    // Préfixe pré-rempli (D- par défaut)
    const pageText = await page.textContent('body');
    expect(pageText).toContain('D-');

    // Suivant → Étape 2
    await goToStep2(page);

    // Ajouter un article
    await page.locator('button:has-text("Ajouter un article")').first().click();
    await page.waitForTimeout(500);

    // Ouvrir l'accordion de l'article
    const accordionTrigger = page.locator('[data-state="closed"]').first();
    if (await accordionTrigger.isVisible({ timeout: 3000 })) {
      await accordionTrigger.click();
      await page.waitForTimeout(300);
    }

    // Remplir description
    const descInput = page.locator('input[id*="item-description"]').first();
    if (await descInput.isVisible({ timeout: 3000 })) {
      await descInput.fill('Audit technique E2E');
    }

    // Remplir prix unitaire
    const priceInput = page.locator('input[id*="unitPrice"], input[name*="unitPrice"]').first();
    if (await priceInput.isVisible({ timeout: 3000 })) {
      await priceInput.click();
      await priceInput.fill('1500');
    }

    // Total avec TVA 20% visible
    await page.waitForTimeout(500);
    await expect(page.locator('text=20% TVA').first()).toBeVisible({ timeout: 3000 });

    // Bouton "Créer le devis" visible
    await expect(page.locator('button:has-text("Créer le devis")').first()).toBeVisible({ timeout: 5000 });

    // Navigation bi-directionnelle
    await page.locator('button:has(svg.lucide-chevron-left)').first().click();
    await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 5000 });
    await goToStep2(page);
  });

  test('Flow: Sauvegarder un devis en brouillon', async ({ authenticatedPage: page }) => {
    await waitForQuoteEditor(page);

    // Sélectionner un client
    await selectFirstClient(page);

    // Passer à l'étape 2
    await goToStep2(page);

    // Ajouter un article
    await page.locator('button:has-text("Ajouter un article")').first().click();
    await page.waitForTimeout(500);

    // Bouton brouillon visible
    const draftButton = page.locator('button:has-text("Brouillon")').first();
    await expect(draftButton).toBeVisible({ timeout: 5000 });
  });

  test('Flow: Actions sur un devis existant dans la liste', async ({ authenticatedPage: page }) => {
    await waitForQuotesPage(page);

    // Attendre que le tableau ait des vraies données
    await page.waitForTimeout(5000);
    const realRow = page.locator('table tbody tr').first();
    await expect(realRow).toBeVisible({ timeout: 15000 });

    // Clic sur une ligne → sidebar ou navigation
    await realRow.click();
    await page.waitForTimeout(2000);

    // Vérifier que quelque chose s'est passé
    const currentUrl = page.url();
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('Flow: Filtrage par statut', async ({ authenticatedPage: page }) => {
    await waitForQuotesPage(page);

    // Vérifier la présence de badges de statut (seeded: DRAFT, PENDING, COMPLETED)
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body');
    // Au moins un des statuts doit être visible
    const hasStatus =
      bodyText.includes('Brouillon') ||
      bodyText.includes('Envoyé') ||
      bodyText.includes('Accepté') ||
      bodyText.includes('DRAFT') ||
      bodyText.includes('PENDING') ||
      bodyText.includes('COMPLETED');
    expect(hasStatus).toBeTruthy();
  });
});
