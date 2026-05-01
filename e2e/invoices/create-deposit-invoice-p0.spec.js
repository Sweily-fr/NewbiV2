/**
 * P0 — Création facture d'acompte (compliance FR).
 *
 * Une facture d'acompte est marquée `isDeposit: true` côté backend et doit
 * porter la mention "FACTURE D'ACOMPTE" sur le PDF. Elle a sa propre
 * numérotation mais reste autonome : pas de calcul auto solde/acompte,
 * l'utilisateur saisit directement le montant.
 *
 * Réutilise l'éditeur /factures/new qui passe au P0 facture standard.
 * Différence: le Select "Type de facture" est mis sur "Facture d'acompte".
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS } from "../seed/test-data";

const TEST_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS

test.describe("[P0][Factures] Acompte (compliance FR)", () => {
  test("Crée une facture d'acompte avec isDeposit=true et statut PENDING", async ({
    authenticatedPage: page,
  }) => {
    await test.step("Aller sur /factures/new", async () => {
      await page.goto("/dashboard/outils/factures/new", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await expect(
        page.locator("text=Sélection d'un client").first(),
      ).toBeVisible({ timeout: 30000 });
    });

    await test.step("Sélectionner le client", async () => {
      const combobox = page.locator('button[role="combobox"]').first();
      await combobox.click();
      const clientOption = page
        .locator(
          `[data-radix-popper-content-wrapper] button:has-text("${TEST_CLIENT.name}")`,
        )
        .first();
      await expect(clientOption).toBeVisible({ timeout: 10000 });
      await clientOption.click();
      await page.waitForTimeout(500);
    });

    await test.step("Choisir le type 'Facture d'acompte'", async () => {
      await page.locator("#invoice-type").click();
      await page
        .getByRole("option", { name: /Facture d'acompte/i })
        .first()
        .click();
    });

    await test.step("Passer à l'étape 2", async () => {
      await page.locator('button:has-text("Suivant")').first().click();
      await expect(
        page.locator("text=Articles et produits").first(),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Ajouter et saisir un article (acompte 500€ HT)", async () => {
      await page.getByRole("button", { name: /Ajouter un article/i }).click();
      await page
        .getByText(/^Article 1$/)
        .first()
        .click();
      await expect(page.locator("#item-description-0")).toBeVisible({
        timeout: 5000,
      });
      await page.locator("#item-description-0").fill("Acompte 30% projet X");
      await page.getByLabel("Quantité").first().fill("1");
      await page.locator("#item-price-0").fill("500");
      await page.waitForTimeout(300);
    });

    const mutationPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/graphql") &&
        res.request().postData()?.includes("CreateInvoice") &&
        !res.request().postData()?.includes("IntrospectionQuery"),
      { timeout: 20000 },
    );

    await test.step("Valider la facture d'acompte", async () => {
      await page.getByRole("button", { name: /Créer la facture/i }).click();
    });

    const response = await mutationPromise;
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();
    const invoice = body.data?.createInvoice;
    expect(invoice).toBeTruthy();

    // Invariant central : flag isDeposit = true (compliance FR)
    expect(invoice.isDeposit).toBe(true);

    // Status PENDING (pas DRAFT)
    expect(invoice.status).toBe("PENDING");

    // Format prefix/number standard
    expect(invoice.prefix).toMatch(/^F-\d{6}$/);
    expect(invoice.number).toMatch(/^\d{4}$/);

    // Total TTC = 500 × 1.20 = 600
    expect(Number(invoice.totalTTC)).toBeCloseTo(600, 2);

    await test.step("Vérifier la redirection vers la liste", async () => {
      await page.waitForURL("**/dashboard/outils/factures", {
        timeout: 30000,
      });
    });
  });
});
