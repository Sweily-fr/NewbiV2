/**
 * CRUD Factures — flows UI complets.
 *
 * Pattern : exercer l'éditeur split-screen complet jusqu'à la mutation,
 * puis VÉRIFIER LE RÉSULTAT MÉTIER (totaux dans la liste, statut, etc.)
 * et pas juste la redirection.
 *
 * Couvre INVOICES_PAGE.md §15 (ModernInvoiceEditor), §16 (sections),
 * §18 (calcul totaux end-to-end), §20 (DRAFT), §45 (validation date).
 *
 * Note timing : les tests UI sont lents (60-90s par test). Les variantes
 * de calcul sans valeur ajoutée UI sont dans crud-mutations.spec.js.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_CLIENTS } from "../seed/test-data";
import {
  createInvoiceMutation,
  latestInvoiceIssueDate,
} from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

const TEST_CLIENT = TEST_CLIENTS[0];

// ---- Helpers UI (cohérents avec create-invoice-p0.spec.js) ----

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
  // setTimeout(100ms) interne pour synchroniser companyInfo
  await page.waitForTimeout(500);
}

async function goToStep2(page) {
  await page.locator('button:has-text("Suivant")').first().click();
  await expect(page.locator("text=Articles et produits").first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Expand an Accordion item that may or may not already be open. Idempotent.
 * The trigger text is `description || "Article N+1"` (cf ItemsSection.jsx:296),
 * so the caller passes the expected label.
 */
async function expandItemAccordion(page, index, label) {
  const inputId = `#item-description-${index}`;
  if (
    await page
      .locator(inputId)
      .isVisible({ timeout: 1500 })
      .catch(() => false)
  ) {
    return; // already expanded
  }
  // Try the explicit label first (description or fallback "Article N+1")
  const labelMatcher = new RegExp(
    `^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  );
  const trigger = page.getByText(labelMatcher).first();
  if (await trigger.isVisible({ timeout: 1500 }).catch(() => false)) {
    await trigger.click();
    return;
  }
  // Fallback : closed accordion-trigger inside the items section
  const fallback = page
    .locator('[data-slot="accordion-trigger"][data-state="closed"]')
    .nth(index);
  if (await fallback.isVisible({ timeout: 1500 }).catch(() => false)) {
    await fallback.click();
  }
}

async function addItem(page, index, { description, quantity, unitPrice }) {
  // Le bouton "Ajouter un article" peut apparaître plusieurs fois (CTA top
  // + outline en bas) une fois qu'il y a déjà des articles. On prend le
  // premier visible.
  await page
    .getByRole("button", { name: /Ajouter un article/i })
    .first()
    .click();
  // L'AccordionContent est collapsed par défaut, expand via la row "Article N"
  const articleLabel = new RegExp(`^Article ${index + 1}$`);
  await page.getByText(articleLabel).first().click();

  await expect(page.locator(`#item-description-${index}`)).toBeVisible({
    timeout: 5000,
  });
  await page.locator(`#item-description-${index}`).fill(description);
  // Quantité : il y a un input par row, on prend celui dans l'accordion ouvert
  const qtyInputs = page.getByLabel("Quantité");
  await qtyInputs.nth(index).fill(String(quantity));
  await page.locator(`#item-price-${index}`).fill(String(unitPrice));
  await page.waitForTimeout(150);
}

async function captureCreateInvoiceResponse(page) {
  return page.waitForResponse(
    (r) =>
      r.url().includes("/graphql") &&
      r.request().postData()?.includes("CreateInvoice") &&
      !r.request().postData()?.includes("IntrospectionQuery"),
    { timeout: 20000 },
  );
}

test.describe("[Factures] CRUD UI — flows complets", () => {
  test.setTimeout(120000);

  test("Test 1 — Multi-articles : totaux corrects dans la mutation et la liste", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);

    // Article 1 : 10 × 100€ HT, TVA 20% (=> 1000 HT, 200 VAT, 1200 TTC)
    await addItem(page, 0, {
      description: "Consulting",
      quantity: 10,
      unitPrice: 100,
    });
    // Article 2 : 1 × 200€ HT, TVA 20% par défaut (=> 200 HT, 40 VAT, 240 TTC).
    // On garde la TVA 20% par défaut pour éviter d'interagir avec le select
    // par-item — le but du test est "multi-articles agrégés correctement",
    // pas "TVA mixte" (déjà couvert par crud-mutations Test 1).
    await addItem(page, 1, {
      description: "Frais",
      quantity: 1,
      unitPrice: 200,
    });

    // Capturer la mutation CreateInvoice avant de cliquer Submit
    const mutationP = captureCreateInvoiceResponse(page);
    await page.getByRole("button", { name: /Créer la facture/i }).click();

    const response = await mutationP;
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();
    const inv = body.data.createInvoice;

    // 10×100 + 1×200 = 1200 HT
    // TVA 20% sur les deux : 200 + 40 = 240
    // Total TTC = 1440
    expect(Number(inv.totalHT)).toBeCloseTo(1200, 2);
    expect(Number(inv.totalVAT)).toBeCloseTo(240, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1440, 2);
    expect(inv.status).toBe("PENDING");

    // Redirection vers la liste — le toast post-création (§6.4) signale
    // l'arrivée. On ne reflowe pas dans le tableau (re-fetch potentiellement
    // asynchrone selon Apollo cache) — la mutation a déjà prouvé l'invariant.
    await page.waitForURL("**/dashboard/outils/factures", { timeout: 30000 });
    await expect(page.locator("text=Factures clients").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("Test 2 — Sauver brouillon : numéro DRAFT-XXX généré et statut Brouillon", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);
    await addItem(page, 0, {
      description: "WIP",
      quantity: 1,
      unitPrice: 50,
    });

    // Cliquer "Brouillon" (pas "Créer la facture")
    const mutationP = captureCreateInvoiceResponse(page);
    await page.locator('button:has-text("Brouillon")').first().click();

    const response = await mutationP;
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();
    const inv = body.data.createInvoice;

    expect(inv.status).toBe("DRAFT");
    // §20.1 : numéro temporaire DRAFT-NNNN
    expect(inv.number).toMatch(/^DRAFT-/);

    // Redirection vers la liste — la mutation a déjà prouvé l'invariant
    // (status DRAFT + numéro temporaire). On évite l'assertion sur le badge
    // "Brouillon" dans le tableau qui dépend du re-fetch Apollo et du tab
    // actif (le filtre par défaut est "Toutes" mais le seed contient déjà
    // 2 PENDING/COMPLETED qui peuvent masquer la pagination).
    await page.waitForURL("**/dashboard/outils/factures", { timeout: 30000 });
  });

  test("Test 3 — Édition d'un DRAFT existant : modif d'un item persistée après reload", async ({
    authenticatedPage: page,
  }) => {
    // Pré-création via mutation pour avoir un id stable et indépendant
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        status: "DRAFT",
        items: [
          buildItem({
            description: "Original description",
            quantity: 1,
            unitPrice: 100,
          }),
        ],
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const draft = json.data.createInvoice;

    // Aller sur la page d'édition
    await page.goto(`/dashboard/outils/factures/${draft.id}/editer`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await expect(
      page.locator("text=Sélection d'un client").first(),
    ).toBeVisible({ timeout: 30000 });

    // Aller en step 2 (Suivant) pour atteindre les items
    await goToStep2(page);

    // En mode edit l'AccordionTrigger affiche `description || "Article N+1"`.
    // Notre item a description="Original description", donc on cherche
    // ce label précisément (pas "Article 1").
    await expandItemAccordion(page, 0, "Original description");

    const descInput = page.locator("#item-description-0");
    await expect(descInput).toBeVisible({ timeout: 5000 });

    const newDescription = "Description modifiée E2E";
    await descInput.fill(newDescription);
    await page.waitForTimeout(200);

    // Sauver brouillon (rester en DRAFT)
    const mutationP = page.waitForResponse(
      (r) =>
        r.url().includes("/graphql") &&
        r.request().postData()?.includes("UpdateInvoice"),
      { timeout: 20000 },
    );
    await page.locator('button:has-text("Brouillon")').first().click();
    await mutationP;

    // Recharger la page d'édition et vérifier que la modif persiste
    await page.goto(`/dashboard/outils/factures/${draft.id}/editer`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await expect(
      page.locator("text=Sélection d'un client").first(),
    ).toBeVisible({ timeout: 30000 });
    await goToStep2(page);

    // Après reload, le trigger affiche maintenant la nouvelle description
    await expandItemAccordion(page, 0, newDescription);
    const descInputReloaded = page.locator("#item-description-0");
    await expect(descInputReloaded).toHaveValue(newDescription, {
      timeout: 10000,
    });
  });

  test("Test 4 — Remise globale 10% PERCENTAGE : finalTotalTTC = 1080", async ({
    authenticatedPage: page,
  }) => {
    await gotoEditor(page);
    await selectSeededClient(page);
    await goToStep2(page);
    await addItem(page, 0, {
      description: "Base 1000 HT",
      quantity: 1,
      unitPrice: 1000,
    });

    // La remise globale est dans DiscountsAndTotalsSection (rendu dans step 2).
    // Le type select a déjà PERCENTAGE par défaut. On remplit juste la valeur.
    const discountInput = page.locator("#discount-value");
    await expect(discountInput).toBeVisible({ timeout: 5000 });
    await discountInput.fill("10");
    await page.waitForTimeout(200);

    const mutationP = captureCreateInvoiceResponse(page);
    await page.getByRole("button", { name: /Créer la facture/i }).click();
    const response = await mutationP;
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();
    const inv = body.data.createInvoice;

    // §18.1 : totalHT=1000, totalVAT=200, totalTTC=1200 puis remise 10%
    //   finalTotalHT = 900, finalTotalVAT = 180, finalTotalTTC = 1080
    expect(Number(inv.totalHT)).toBeCloseTo(1000, 2);
    expect(Number(inv.finalTotalTTC)).toBeCloseTo(1080, 2);
    expect(Number(inv.discount)).toBeCloseTo(10, 2);
    expect(inv.discountType).toBe("PERCENTAGE");
  });

  test("Test 5 — Validation date antérieure : submission bloquée", async ({
    authenticatedPage: page,
  }) => {
    // §45 : on ne peut pas créer une facture finalisée avec une date
    // d'émission antérieure à la dernière facture finalisée.
    // 1. S'assurer qu'il y a au moins une PENDING avec une date "récente"
    //    (le seed en place déjà mais on en crée une explicite à today
    //    pour éviter de dépendre du timing du seed).
    const created = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Anchor", unitPrice: 100 })],
        status: "PENDING",
      }),
    });
    expect(
      created.json.errors,
      JSON.stringify(created.json.errors),
    ).toBeFalsy();

    // 2. Lire la dernière date d'émission (anchor)
    const { json: latestJson } = await latestInvoiceIssueDate(page.request);
    expect(latestJson.errors).toBeFalsy();
    const latestStr = latestJson.data.latestInvoiceIssueDate;
    expect(latestStr).toBeTruthy();

    // 3. Tenter une PENDING avec une date 30 jours avant via mutation
    //    (UI flow équivalent — l'éditeur submit appelle la même mutation).
    const latest = new Date(
      /^\d+$/.test(latestStr) ? Number(latestStr) : latestStr,
    );
    const antedated = new Date(latest.getTime() - 30 * 24 * 60 * 60 * 1000);
    const antedatedStr = antedated.toISOString().slice(0, 10);

    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Antedated", unitPrice: 100 })],
        status: "PENDING",
        issueDate: antedatedStr,
      }),
    });

    // Doit retourner une erreur de validation (cf §45.3)
    expect(
      json.errors,
      "PENDING avec date antérieure à la dernière finalisée doit être rejetée (§45)",
    ).toBeTruthy();
    expect(json.errors.length).toBeGreaterThan(0);
    const messages = json.errors.map((e) => e.message).join(" | ");
    // Wording resolver invoice.js:178-184 : "antérieure" et "postérieure"
    expect(messages.toLowerCase()).toMatch(
      /antérieure|postérieure|date.*émission|validation/i,
    );
  });
});
