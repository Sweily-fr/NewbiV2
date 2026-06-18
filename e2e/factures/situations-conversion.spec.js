/**
 * Workflows complexes — situations BTP, conversion devis → facture, conflits.
 *
 * Couvre INVOICES_PAGE.md :
 *   - §30 createLinkedInvoice (conversion devis → facture)
 *   - §30.3 / §46.19 factures liées illimitées, plafonnées au montant du devis
 *   - §21.1 acompte unique par devis
 *   - §31 factures de situation avec validation cumul ≤ contractTotal
 *   - §43.1 / §43.2 conflits DRAFT/DRAFT (rename silencieux du 1er)
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import {
  createInvoiceMutation,
  createQuoteMutation,
  changeQuoteStatus,
  createLinkedInvoiceMutation,
  getInvoiceById,
} from "./helpers/invoice-mutations";
import {
  buildInvoiceInput,
  buildQuoteInput,
  buildItem,
} from "./helpers/invoice-fixtures";

// Crée un devis COMPLETED prêt à être converti via createLinkedInvoice.
// On utilise un devis isolé (créé à la volée) plutôt que le seed
// `quoteCompleted` partagé entre tests, pour éviter de saturer le reste
// à facturer en cas de re-runs.
async function createCompletedQuote(request, items, overrides = {}) {
  const { json: r1 } = await createQuoteMutation(request, {
    ...buildQuoteInput({ items, status: "PENDING", ...overrides }),
  });
  expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
  const quote = r1.data.createQuote;

  // Transition PENDING → COMPLETED (status valide pour createLinkedInvoice)
  const { json: r2 } = await changeQuoteStatus(request, quote.id, "COMPLETED");
  expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
  // Re-fetch pour avoir le finalTotalTTC à jour
  return { ...quote, status: "COMPLETED" };
}

test.describe("[Factures] Workflows situations + conversion + conflits", () => {
  test.setTimeout(60000);

  test("Test 1 — Conversion devis COMPLETED en facture liée (§30)", async ({
    authenticatedPage: page,
  }) => {
    // Devis 1000€ HT × 1.20 = 1200€ TTC
    const quote = await createCompletedQuote(page.request, [
      buildItem({
        description: "Prestation devis §30",
        quantity: 1,
        unitPrice: 1000,
        vatRate: 20,
      }),
    ]);
    expect(quote.status).toBe("COMPLETED");
    const expectedTotal = Number(quote.finalTotalTTC || quote.totalTTC);
    expect(expectedTotal).toBeCloseTo(1200, 2);

    // Conversion : facture liée pour le total complet
    const { json } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: expectedTotal,
      isDeposit: false,
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();

    const result = json.data.createLinkedInvoice;
    expect(result.invoice).toBeTruthy();
    expect(result.quote.id).toBe(quote.id);

    const invoice = result.invoice;
    // §30 : invoice générée avec prefix F-YYYYMM, status DRAFT (line 2758)
    expect(invoice.prefix).toMatch(/^F-\d{6}$/);
    expect(["DRAFT", "PENDING"]).toContain(invoice.status);
    expect(Number(invoice.finalTotalTTC)).toBeCloseTo(expectedTotal, 2);
    // Lien au devis : purchaseOrderNumber set par le resolver
    expect(invoice.purchaseOrderNumber).toBeTruthy();
    // Le client est préservé depuis le devis
    expect(invoice.client?.name).toBeTruthy();
  });

  test("Test 2 — §46.19 factures liées illimitées, plafonnées au reste à facturer", async ({
    authenticatedPage: page,
  }) => {
    // Devis 1200€ TTC, divisible en 4 parts
    const quote = await createCompletedQuote(page.request, [
      buildItem({
        description: "Devis pour test factures liées illimitées",
        quantity: 1,
        unitPrice: 1000,
        vatRate: 20,
      }),
    ]);
    const total = Number(quote.finalTotalTTC || quote.totalTTC);
    expect(total).toBeCloseTo(1200, 2);

    // FP critique : amount est interprété TTC, le resolver fait
    //   unitPriceHT = amount / 1.20
    // puis recalcule finalTotalTTC = unitPriceHT × 1.20. Pour éviter les
    // erreurs de précision flottante, on choisit des amounts MULTIPLES DE 6
    // (1.20 = 6/5, donc amount/1.20 est entier ssi amount est multiple de 6).
    // 4 factures liées : l'ancienne limite de 3 a été supprimée.
    //   inv1 : 360€ (HT 300)
    //   inv2 : 360€ (HT 300)
    //   inv3 : 240€ (HT 200)
    //   inv4 : 240€ (HT 200) — solde, cumul exactement 1200
    const amounts = [360, 360, 240, 240];

    for (let i = 0; i < amounts.length; i++) {
      const { json } = await createLinkedInvoiceMutation(page.request, {
        quoteId: quote.id,
        amount: amounts[i],
        isDeposit: false,
      });
      expect(
        json.errors,
        `Facture liée #${i + 1} (amount=${amounts[i]}) doit réussir : ${JSON.stringify(json.errors)}`,
      ).toBeFalsy();
    }

    // 5e tentative alors que tout est facturé → rejet "reste à facturer" dépassé
    const { json: rejected } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: 100,
      isDeposit: false,
    });
    expect(
      rejected.errors,
      "Une facture dépassant le reste à facturer doit être rejetée (§46.19)",
    ).toBeTruthy();
    expect(rejected.errors.length).toBeGreaterThan(0);
    const messages = rejected.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(/reste à facturer|dépasser/i);
  });

  test("Test 3 — §21.1 un seul acompte par devis", async ({
    authenticatedPage: page,
  }) => {
    const quote = await createCompletedQuote(page.request, [
      buildItem({
        description: "Devis pour test acompte unique",
        quantity: 1,
        unitPrice: 1000,
        vatRate: 20,
      }),
    ]);
    const total = Number(quote.finalTotalTTC || quote.totalTTC);

    // 1er acompte 30% du total
    const { json: r1 } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: total * 0.3,
      isDeposit: true,
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    expect(r1.data.createLinkedInvoice.invoice.isDeposit).toBe(true);

    // 2e tentative d'acompte → rejet "Acompte déjà existant" (resolver:2717)
    const { json: r2 } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: total * 0.2,
      isDeposit: true,
    });
    expect(
      r2.errors,
      "Un 2e acompte sur le même devis doit être rejeté (§21.1)",
    ).toBeTruthy();
    const messages = r2.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /acompte.*déjà|seul.*acompte|déjà existant/i,
    );
  });

  test("Test 4 — §31 facture de situation : cumul TTC ≤ contractTotal", async ({
    authenticatedPage: page,
  }) => {
    // §31.3 : la validation cumul compare la somme TTC déjà facturée + cette
    // nouvelle facture vs contractTotal. Subtilité (resolver:899-967) :
    //   - input.contractTotal est IGNORÉ par le resolver.
    //   - Le contractTotal est dérivé soit du devis associé (si purchaseOrder
    //     Number = prefix-number d'un devis), soit des items de la 1ère
    //     situation existante.
    //
    // Approche : on crée un devis COMPLETED de 12000€ TTC, puis on l'utilise
    // comme purchaseOrderNumber pour les situations. Le resolver retrouve
    // le devis et fixe contractTotal = 12000.

    const quote = await createCompletedQuote(page.request, [
      buildItem({
        description: "Devis chantier §31",
        quantity: 1,
        unitPrice: 10000, // 10000 HT × 1.20 = 12000 TTC
        vatRate: 20,
      }),
    ]);
    const contractTotal = Number(quote.finalTotalTTC || quote.totalTTC);
    expect(contractTotal).toBeCloseTo(12000, 2);
    const purchaseOrderNumber = `${quote.prefix}-${quote.number}`;

    // Situation 1 : 6000€ TTC (50%)
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Situation 1 §31",
            quantity: 1,
            unitPrice: 5000, // 5000 HT × 1.20 = 6000 TTC
            vatRate: 20,
          }),
        ],
        status: "PENDING",
        invoiceType: "situation",
        purchaseOrderNumber,
        situationNumber: 1,
        situationReference: purchaseOrderNumber,
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    expect(Number(r1.data.createInvoice.finalTotalTTC)).toBeCloseTo(6000, 2);

    // Situation 2 : 4800€ TTC (40%, cumul 90% — OK car ≤ 12000)
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Situation 2 §31",
            quantity: 1,
            unitPrice: 4000, // 4000 HT × 1.20 = 4800 TTC
            vatRate: 20,
          }),
        ],
        status: "PENDING",
        invoiceType: "situation",
        purchaseOrderNumber,
        situationNumber: 2,
        situationReference: purchaseOrderNumber,
      }),
    });
    expect(
      r2.errors,
      `Situation 2 (cumul 90%) doit réussir : ${JSON.stringify(r2.errors)}`,
    ).toBeFalsy();

    // Situation 3 : 3600€ TTC (cumul 14400 > 12000) → rejet §31.3
    const { json: r3 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Situation 3 §31 — dépasse",
            quantity: 1,
            unitPrice: 3000, // 3000 HT × 1.20 = 3600 TTC
            vatRate: 20,
          }),
        ],
        status: "PENDING",
        invoiceType: "situation",
        purchaseOrderNumber,
        situationNumber: 3,
        situationReference: purchaseOrderNumber,
      }),
    });
    expect(
      r3.errors,
      "Situation 3 (cumul 120%) doit être rejetée (>contractTotal, §31.3)",
    ).toBeTruthy();
    const messages = r3.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /contrat|dépasse|montant.*total|reste.*disponible/i,
    );
  });

  test("Test 5 — §43 conflit DRAFT/DRAFT : 2e DRAFT renomme le 1er", async ({
    authenticatedPage: page,
  }) => {
    // Couvre §43.1 (deux brouillons réservant le même numéro). Démontre le
    // rename silencieux du 1er en DRAFT-{n}-{timestamp} (resolver:1075-1100).
    // Différent de pieges-critiques Test 3 par : préfixe différent + assertion
    // sur le timestamp du rename.
    const PREFIX = "F-E2E43";
    const NUMBER = "0077";

    // 1er DRAFT avec manualNumber=0077
    const t0 = Date.now();
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Draft 1 §43", unitPrice: 100 })],
        status: "DRAFT",
        prefix: PREFIX,
        number: NUMBER,
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    const draft1 = r1.data.createInvoice;
    expect(draft1.number).toBe(`DRAFT-${NUMBER}`);

    // 2e DRAFT avec le même manualNumber
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Draft 2 §43", unitPrice: 200 })],
        status: "DRAFT",
        prefix: PREFIX,
        number: NUMBER,
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    const draft2 = r2.data.createInvoice;
    // §43.2 : draft2 prend le numéro convoité
    expect(draft2.number).toBe(`DRAFT-${NUMBER}`);

    // Re-fetch draft1 : doit avoir été renommé DRAFT-{NUMBER}-{timestamp}
    const { json: getJson } = await getInvoiceById(page.request, draft1.id);
    expect(getJson.errors).toBeFalsy();
    const refreshed = getJson.data.invoice;
    expect(refreshed.status).toBe("DRAFT");
    expect(refreshed.number).toMatch(new RegExp(`^DRAFT-${NUMBER}-\\d+$`));
    // Sanity : le timestamp embarqué est postérieur à t0
    const timestampMatch = refreshed.number.match(
      new RegExp(`^DRAFT-${NUMBER}-(\\d+)$`),
    );
    expect(timestampMatch).toBeTruthy();
    const renamedAt = parseInt(timestampMatch[1], 10);
    expect(renamedAt).toBeGreaterThanOrEqual(t0);
  });
});
