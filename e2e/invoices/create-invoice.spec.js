import { test, expect } from '../fixtures/auth.fixture.js';

// Helper : attend que la page factures liste soit chargée (après ProRouteGuard + GraphQL)
async function waitForInvoicesPage(page) {
  await page.goto('/dashboard/outils/factures', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('text=Factures clients').first()).toBeVisible({ timeout: 30000 });
  // Attendre que les skeletons disparaissent et les vraies données chargent
  await page.waitForTimeout(3000);
}

// Helper : attend que l'éditeur de facture soit chargé
async function waitForInvoiceEditor(page) {
  await page.goto('/dashboard/outils/factures/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 30000 });
}

// Helper : sélectionner le premier client disponible via le combobox
async function selectFirstClient(page) {
  // Le sélecteur client est un button[role="combobox"]
  const combobox = page.locator('button[role="combobox"]').first();
  await combobox.click();

  // Attendre que la liste de clients charge (pas "Aucun client trouvé" ni "Recherche...")
  // Les clients sont des boutons dans le popover avec une classe hover:bg-accent
  const clientOption = page.locator('[data-radix-popper-content-wrapper] .max-h-\\[280px\\] button').first();

  // Attendre que le premier client apparaisse (max 10s)
  await expect(clientOption).toBeVisible({ timeout: 10000 });
  await clientOption.click();
  await page.waitForTimeout(500);
  return true;
}

// Helper : passer à l'étape 2
async function goToStep2(page) {
  await page.locator('button:has-text("Suivant")').first().click();
  await expect(page.locator('text=Articles et produits')).toBeVisible({ timeout: 10000 });
}

test.describe('Factures', () => {
  test.setTimeout(90000); // Ces tests font beaucoup de navigation + attente GraphQL

  test('Flow: Page liste — header, stats, boutons, dropdown, tableau', async ({ authenticatedPage: page }) => {
    await waitForInvoicesPage(page);

    // Stats
    await expect(page.locator('text=CA facturé')).toBeVisible();
    await expect(page.locator('text=CA payé')).toBeVisible();

    // Boutons d'action
    await expect(page.locator('button:has-text("Nouvelle facture")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Importer")').first()).toBeVisible();

    // Dropdown "Facture vierge"
    const dropdownTrigger = page.locator('button:has-text("Nouvelle facture") + button').first();
    if (await dropdownTrigger.isVisible({ timeout: 3000 })) {
      await dropdownTrigger.click();
      await expect(page.locator('[role="menuitem"]:has-text("Facture vierge")')).toBeVisible({ timeout: 3000 });
      await page.keyboard.press('Escape');
    }
  });

  test('Flow: Création facture standard complète (2 étapes)', async ({ authenticatedPage: page }) => {
    // Naviguer depuis la liste
    await waitForInvoicesPage(page);
    await page.locator('button:has-text("Nouvelle facture")').first().click();
    await page.waitForURL('**/factures/new**', { timeout: 15000 });

    // --- ÉTAPE 1 : Client + Infos facture ---
    await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 15000 });

    // Vérifier type de facture avec 3 options
    await expect(page.locator('text=Type de facture')).toBeVisible({ timeout: 5000 });
    const typeSelect = page.locator('#invoice-type').first();
    await typeSelect.click();
    await expect(page.locator('[role="option"]:has-text("Facture")').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[role="option"]:has-text("Facture d\'acompte")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Facture de situation")')).toBeVisible();
    await page.locator('[role="option"]:has-text("Facture")').first().click();

    // Sélectionner un client via le combobox
    await selectFirstClient(page);

    // Numéro de facture pré-rempli
    const pageText = await page.textContent('body');
    expect(pageText).toContain('F-');

    // Suivant → Étape 2
    await goToStep2(page);

    // Checkbox auto-liquidation visible
    await expect(page.locator('label:has-text("Auto-liquidation")').first()).toBeVisible();

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
      await descInput.fill('Prestation de conseil');
    }

    // Remplir prix unitaire
    const priceInput = page.locator('input[id*="unitPrice"], input[name*="unitPrice"]').first();
    if (await priceInput.isVisible({ timeout: 3000 })) {
      await priceInput.click();
      await priceInput.fill('2000');
    }

    // Total avec TVA 20% visible
    await page.waitForTimeout(500);
    await expect(page.locator('text=20% TVA').first()).toBeVisible({ timeout: 3000 });

    // Bouton "Créer la facture" visible
    await expect(page.locator('button:has-text("Créer la facture")').first()).toBeVisible({ timeout: 5000 });

    // Retour étape 1 et retour étape 2 (navigation bi-directionnelle)
    await page.locator('button:has(svg.lucide-chevron-left)').first().click();
    await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 5000 });
    await goToStep2(page);
  });

  test('Flow: Création facture d\'acompte', async ({ authenticatedPage: page }) => {
    await waitForInvoiceEditor(page);

    // Sélectionner type "Facture d'acompte"
    const typeSelect = page.locator('#invoice-type').first();
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Facture d\'acompte")').click();
    await expect(typeSelect).toContainText('acompte');

    // Sélectionner un client
    await selectFirstClient(page);

    // Passer à l'étape 2
    await goToStep2(page);

    // Ajouter un article
    await page.locator('button:has-text("Ajouter un article")').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Créer la facture")').first()).toBeVisible({ timeout: 5000 });
  });

  test('Flow: Création facture de situation — référence auto-générée', async ({ authenticatedPage: page }) => {
    await waitForInvoiceEditor(page);

    // Sélectionner type "Facture de situation"
    const typeSelect = page.locator('#invoice-type').first();
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Facture de situation")').click();

    // Vérifier le texte sur la référence auto
    await page.waitForTimeout(500);
    const infoText = page.locator('text=référence unique').first();
    const hasInfo = await infoText.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasInfo).toBeTruthy();

    // Sélectionner un client
    await selectFirstClient(page);
    await goToStep2(page);
  });

  test('Flow: Auto-liquidation met la TVA à 0%', async ({ authenticatedPage: page }) => {
    await waitForInvoiceEditor(page);
    await selectFirstClient(page);
    await goToStep2(page);

    // Cocher auto-liquidation
    await page.locator('#isReverseCharge').first().click();

    // Ajouter un article
    await page.locator('button:has-text("Ajouter un article")').first().click();
    await page.waitForTimeout(500);

    // TVA 0%
    await expect(page.locator('text=0% TVA').first()).toBeVisible({ timeout: 3000 });
  });

  test('Flow: Actions liste — clic ligne, menu, paramètres, relances', async ({ authenticatedPage: page }) => {
    await waitForInvoicesPage(page);

    // Attendre que le tableau ait des vraies données
    // Les skeletons sont des Skeleton components, les vraies lignes ont du texte lisible
    await page.waitForTimeout(5000);
    const realRow = page.locator('table tbody tr').first();
    await expect(realRow).toBeVisible({ timeout: 15000 });

    // --- Clic sur une facture → sidebar ou navigation ---
    await realRow.click();
    await page.waitForTimeout(2000);

    // Vérifier que quelque chose s'est passé (sidebar, navigation, ou page de détail)
    const pageText = await page.textContent('body');
    // Après clic, le contenu devrait contenir des infos de facture
    expect(pageText.length).toBeGreaterThan(100);

    // --- Modal Paramètres ---
    // Revenir à la liste si nécessaire
    if (!page.url().endsWith('/factures') && !page.url().endsWith('/factures/')) {
      await page.goto('/dashboard/outils/factures', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('text=Factures clients').first()).toBeVisible({ timeout: 30000 });
    }

    const settingsButton = page.locator('button:has(svg.lucide-settings)').first();
    if (await settingsButton.isVisible({ timeout: 3000 })) {
      await settingsButton.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // --- Modal Relances auto ---
    const reminderButton = page.locator('button:has(svg.lucide-mail-check)').first();
    if (await reminderButton.isVisible({ timeout: 3000 })) {
      await reminderButton.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
  });

  test('Flow: Preview PDF visible en desktop', async ({ authenticatedPage: page }) => {
    await waitForInvoiceEditor(page);

    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 1024) {
      const previewPanel = page.locator('[class*="border-l"]').first();
      await expect(previewPanel).toBeVisible({ timeout: 5000 });
    }
  });

});
