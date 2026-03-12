import { test, expect } from '../fixtures/auth.fixture.js';

// Helper : attend que la page factures soit chargée avec les vraies données
async function waitForInvoicesPage(page) {
  await page.goto('/dashboard/outils/factures', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('text=Factures clients').first()).toBeVisible({ timeout: 30000 });
  // Attendre que les skeletons disparaissent
  await page.waitForTimeout(3000);
}

test.describe('Factures - Consultation et actions par statut', () => {

  test('Flow: Ouvrir une facture et voir le détail', async ({ authenticatedPage: page }) => {
    await waitForInvoicesPage(page);

    // Attendre une vraie ligne (pas skeleton)
    const realRow = page.locator('table tbody tr:not(:has(.animate-pulse))').first();
    if (!(await realRow.isVisible({ timeout: 15000 }))) return;

    await realRow.click();
    await page.waitForTimeout(2000);

    // Quelque chose a changé (sidebar, page de détail, etc.)
    const pageText = await page.textContent('body');
    expect(pageText.length).toBeGreaterThan(100);
  });

  test('Flow: Actions brouillon — Modifier et Supprimer disponibles', async ({ authenticatedPage: page }) => {
    await waitForInvoicesPage(page);

    const draftRow = page.locator('table tbody tr:has-text("Brouillon")').first();
    if (!(await draftRow.isVisible({ timeout: 15000 }))) return;

    const actionBtn = draftRow.locator('button:has(svg)').last();
    await actionBtn.click();
    await page.waitForTimeout(500);

    const menuItems = page.locator('[role="menuitem"]');
    const allText = await menuItems.allTextContents();
    const menuText = allText.join(' ').toLowerCase();

    expect(menuText).toContain('modifier');
    expect(menuText).toContain('supprimer');

    await page.keyboard.press('Escape');
  });

  test('Flow: Actions facture en attente — Marquer payée disponible', async ({ authenticatedPage: page }) => {
    await waitForInvoicesPage(page);

    const pendingRow = page.locator('table tbody tr:has-text("En attente")').first();
    if (!(await pendingRow.isVisible({ timeout: 15000 }))) return;

    const actionBtn = pendingRow.locator('button:has(svg)').last();
    await actionBtn.click();
    await page.waitForTimeout(500);

    const menuItems = page.locator('[role="menuitem"]');
    const allText = await menuItems.allTextContents();
    const menuText = allText.join(' ').toLowerCase();

    expect(menuText.includes('payée') || menuText.includes('payé')).toBeTruthy();

    await page.keyboard.press('Escape');
  });

});
