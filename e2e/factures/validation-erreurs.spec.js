/**
 * Validation au submit — vérification des messages d'erreur côté UI.
 *
 * Couvre INVOICES_PAGE.md §17 (validation au submit).
 *
 * Approche : l'éditeur enhanced-invoice-form.jsx désactive les boutons
 * "Suivant" / "Créer la facture" quand le formulaire est invalide
 * (cf isStep1Valid / isStep2Valid). Les vraies erreurs métier
 * remontent du backend via toast OU via ValidationCallout (sticky top).
 *
 * Stratégie : pour chaque cas, vérifier que :
 *   - Soit le bouton de submit est disabled (validation côté UI)
 *   - Soit la mutation n'est pas envoyée / ne redirige pas
 *   - Soit un message d'erreur est visible (toast / callout / inline)
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS } from "../seed/test-data";
import { createInvoiceMutation } from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

const TEST_CLIENT = TEST_CLIENTS[0];

async function gotoEditor(page) {
  await page.goto("/dashboard/outils/factures/new", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Sélection d'un client").first()).toBeVisible({
    timeout: 30000,
  });
}

async function selectSeededClient(page) {
  const combobox = page.locator('button[role="combobox"]').first();
  await combobox.click();
  const option = page
    .locator(
      `[data-radix-popper-content-wrapper] button:has-text("${TEST_CLIENT.name}")`,
    )
    .first();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click();
  await page.waitForTimeout(500);
}

async function goToStep2(page) {
  await page.locator('button:has-text("Suivant")').first().click();
  await expect(page.locator("text=Articles et produits").first()).toBeVisible({
    timeout: 10000,
  });
}

test.describe("[Factures] Validation au submit (§17)", () => {
  test.setTimeout(90000);

  test("Test 1 — Pas de client sélectionné : bouton Suivant disabled", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);

    // §17.1 : isStep1Valid() exige un client.id pour activer "Suivant"
    // (cf enhanced-invoice-form.jsx:542-547). Sans sélection, le bouton
    // est désactivé.
    const nextBtn = page.locator('button:has-text("Suivant")').first();
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await expect(
      nextBtn,
      "Suivant doit être disabled tant que pas de client (cf §17.1)",
    ).toBeDisabled({ timeout: 5000 });
  });

  test("Test 2 — Items vides : bouton 'Créer la facture' disabled", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);

    // §17.5 : isStep2Valid() exige au moins un item avec description+qty+price
    // remplis. Sans aucun item, le bouton "Créer la facture" est disabled.
    const createBtn = page
      .locator('button:has-text("Créer la facture")')
      .first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await expect(
      createBtn,
      "Créer la facture doit être disabled sans items (cf §17.5)",
    ).toBeDisabled({ timeout: 5000 });
  });

  test("Test 3 — Remise globale > 100% : message d'erreur visible (validation RHF)", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);

    // Le champ #discount-value a max=100 quand discountType=PERCENTAGE
    // (cf DiscountsAndTotalsSection.jsx:121-125).
    const discountInput = page.locator("#discount-value");
    await expect(discountInput).toBeVisible({ timeout: 5000 });
    await discountInput.fill("150");
    // Trigger blur pour forcer la validation react-hook-form
    await discountInput.blur();
    await page.waitForTimeout(300);

    // Le message exact : "La remise ne peut pas dépasser 100%"
    // ou texte équivalent rendu par RHF.
    await expect(
      page.locator("text=/100\\s*%|dépasser|cent/i").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Test 4 — Article sans description : 'Créer la facture' reste disabled", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);

    // Ajouter un article SANS description (juste qty + prix)
    await page
      .getByRole("button", { name: /Ajouter un article/i })
      .first()
      .click();
    await page
      .getByText(/^Article 1$/)
      .first()
      .click();
    await expect(page.locator("#item-description-0")).toBeVisible({
      timeout: 5000,
    });
    // Description laissée volontairement vide
    const qtyInput = page.getByLabel("Quantité").first();
    await qtyInput.fill("1");
    await page.locator("#item-price-0").fill("100");
    await page.waitForTimeout(300);

    // §17.5 : isStep2Valid() exige item.description truthy.
    // Description vide → bouton disabled.
    const createBtn = page
      .locator('button:has-text("Créer la facture")')
      .first();
    await expect(
      createBtn,
      "Créer la facture doit être disabled sans description (cf §17.5)",
    ).toBeDisabled({ timeout: 5000 });
  });

  test("Test 5 — Livraison sans adresse : rejet backend via mutation", async ({
    authenticatedPage: page,
  }) => {
    // §17.4 : si billShipping=true, l'adresse de livraison est requise.
    // Le rejet est côté backend (resolver invoice.js) — on teste via la
    // mutation directement (l'UI désactive le toggle si pas d'adresse,
    // pas testable proprement sans simuler un état partiel).
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Avec livraison", unitPrice: 100 })],
        shipping: {
          billShipping: true,
          shippingAmountHT: 50,
          shippingVatRate: 20,
          // shippingAddress volontairement absent
        },
      }),
    });

    // Le backend doit refuser : soit ShippingInput refuse (champ requis),
    // soit le resolver lève une erreur métier.
    expect(
      json.errors,
      "Livraison facturée sans adresse doit être rejetée (§17.4)",
    ).toBeTruthy();
    expect(json.errors.length).toBeGreaterThan(0);
  });
});
