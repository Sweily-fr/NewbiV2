import { test, expect } from "../fixtures/auth.fixture.js";

// Helper : attend que la page factures soit chargée avec les vraies données
async function waitForInvoicesPage(page) {
  await page.goto("/dashboard/outils/factures", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Factures clients").first()).toBeVisible({
    timeout: 30000,
  });
  // Wait for the data-fetching GraphQL response instead of an arbitrary timeout
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

test.describe("Factures - Consultation et actions par statut", () => {
  test("Flow: Actions brouillon — Modifier et Supprimer disponibles", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoicesPage(page);

    const draftRow = page
      .locator('table tbody tr:has-text("Brouillon")')
      .first();
    if (!(await draftRow.isVisible({ timeout: 15000 }))) return;

    const actionBtn = draftRow.locator("button:has(svg)").last();
    await actionBtn.click();
    await page
      .locator('[role="menuitem"]')
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    const menuItems = page.locator('[role="menuitem"]');
    const allText = await menuItems.allTextContents();
    const menuText = allText.join(" ").toLowerCase();

    expect(menuText).toContain("modifier");
    expect(menuText).toContain("supprimer");

    await page.keyboard.press("Escape");
  });

  test("Flow: Actions facture en attente — Marquer payée disponible", async ({
    authenticatedPage: page,
  }) => {
    await waitForInvoicesPage(page);

    const pendingRow = page
      .locator('table tbody tr:has-text("En attente")')
      .first();
    if (!(await pendingRow.isVisible({ timeout: 15000 }))) return;

    const actionBtn = pendingRow.locator("button:has(svg)").last();
    await actionBtn.click();
    await page
      .locator('[role="menuitem"]')
      .first()
      .waitFor({ state: "visible", timeout: 5000 });

    const menuItems = page.locator('[role="menuitem"]');
    const allText = await menuItems.allTextContents();
    const menuText = allText.join(" ").toLowerCase();

    expect(
      menuText.includes("payée") || menuText.includes("payé"),
    ).toBeTruthy();

    await page.keyboard.press("Escape");
  });
});
