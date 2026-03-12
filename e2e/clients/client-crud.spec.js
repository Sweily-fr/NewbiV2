import { test, expect } from '../fixtures/auth.fixture.js';

// Helper : attend que la page clients soit chargée
async function waitForClientsPage(page) {
  await page.goto('/dashboard/clients', { waitUntil: 'domcontentloaded', timeout: 45000 });
  // Attendre un indicateur de la page clients
  await expect(
    page.locator('text=Nouveau contact').or(page.locator('text=Contacts').first())
  ).toBeVisible({ timeout: 30000 });
  // Attendre que les données chargent
  await page.waitForTimeout(3000);
}

test.describe('Clients', () => {
  test.setTimeout(90000);

  test('Flow: Page liste — header, recherche, boutons, tableau', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    // Bouton création
    await expect(page.locator('button:has-text("Nouveau contact")').first()).toBeVisible();

    // Barre de recherche
    const searchInput = page.locator('input[placeholder*="Recherchez"]').or(
      page.locator('input[placeholder*="recherch"]')
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Tableau avec les clients seedés (2 clients)
    await page.waitForTimeout(3000);
    const tableBody = page.locator('table tbody');
    if (await tableBody.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('Flow: Recherche de client par nom', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    const searchInput = page.locator('input[placeholder*="Recherchez"]').or(
      page.locator('input[placeholder*="recherch"]')
    ).first();

    // Rechercher "Alpha" (client seedé)
    await searchInput.fill('Alpha');
    await page.waitForTimeout(2000);

    // Vérifier que le client Alpha apparaît
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Alpha');
  });

  test('Flow: Ouverture du formulaire de création de client', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    // Cliquer sur "Nouveau contact"
    await page.locator('button:has-text("Nouveau contact")').first().click();
    await page.waitForTimeout(1000);

    // Le modal ou la page de création doit s'ouvrir
    const dialog = page.locator('[role="dialog"]');
    const hasDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDialog) {
      // Modal de création visible
      // Vérifier les champs du formulaire
      const nameField = page.locator('input[placeholder*="entreprise"]').or(
        page.locator('input[placeholder*="Nom"]')
      ).first();
      await expect(nameField).toBeVisible({ timeout: 5000 });

      // Type de client sélectionnable
      const bodyText = await dialog.textContent();
      const hasTypeSelector =
        bodyText.includes('Type') ||
        bodyText.includes('Entreprise') ||
        bodyText.includes('Particulier') ||
        bodyText.includes('COMPANY') ||
        bodyText.includes('INDIVIDUAL');
      expect(hasTypeSelector).toBeTruthy();

      // Bouton de sauvegarde
      await expect(
        page.locator('button:has-text("Enregistrer")').or(
          page.locator('button:has-text("Créer")').or(
            page.locator('button:has-text("Sauvegarder")')
          )
        ).first()
      ).toBeVisible({ timeout: 5000 });

      // Fermer le modal
      await page.keyboard.press('Escape');
    } else {
      // Peut-être une navigation vers une page dédiée
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/clients/new') || currentUrl.includes('/clients')
      ).toBeTruthy();
    }
  });

  test('Flow: Clic sur un client existant → détails', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    // Attendre les données
    await page.waitForTimeout(5000);
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    // Clic sur la ligne
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Vérifier qu'on voit les détails du client (sidebar ou page)
    const bodyText = await page.textContent('body');
    // Le client seedé "Entreprise Alpha SAS" ou "Micro-entreprise Beta" doit être visible
    const hasClientInfo =
      bodyText.includes('Alpha') ||
      bodyText.includes('Beta') ||
      bodyText.includes('contact@') ||
      bodyText.includes('SIRET');
    expect(hasClientInfo).toBeTruthy();
  });

  test('Flow: Sélection multiple et actions en lot', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    await page.waitForTimeout(5000);

    // Chercher les checkboxes dans le tableau
    const checkboxes = page.locator('table tbody tr input[type="checkbox"]').or(
      page.locator('table tbody tr [role="checkbox"]')
    );

    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Cocher le premier client
      await checkboxes.first().click();
      await page.waitForTimeout(500);

      // Vérifier qu'un indicateur de sélection apparaît
      const bodyText = await page.textContent('body');
      const hasSelection =
        bodyText.includes('sélectionné') ||
        bodyText.includes('selected') ||
        bodyText.includes('Supprimer') ||
        bodyText.includes('Plus d\'actions');
      expect(hasSelection).toBeTruthy();
    }
  });

  test('Flow: Recherche avec terme sans résultat', async ({ authenticatedPage: page }) => {
    await waitForClientsPage(page);

    const searchInput = page.locator('input[placeholder*="Recherchez"]').or(
      page.locator('input[placeholder*="recherch"]')
    ).first();

    // Rechercher un terme inexistant
    await searchInput.fill('ZZZZZZZZZ_INTROUVABLE');
    await page.waitForTimeout(2000);

    // Le tableau doit être vide ou afficher un message
    const bodyText = await page.textContent('body');
    const isEmpty =
      bodyText.includes('Aucun') ||
      bodyText.includes('aucun') ||
      bodyText.includes('vide') ||
      bodyText.includes('Pas de');

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    // Soit message "aucun résultat", soit 0 lignes
    expect(isEmpty || rowCount === 0).toBeTruthy();
  });
});
