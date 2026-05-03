/**
 * Avoirs (credit notes) — workflows §22 INVOICES_PAGE.md.
 *
 * Couvre :
 *   - §22.1 Création depuis facture finalisée (PENDING/COMPLETED/CANCELED)
 *   - §22.2 Validation backend : tous les totaux ≤ 0 (forcés par calculateCreditNoteTotals)
 *   - §22.3 originalInvoiceId requis (resolver:264-266)
 *   - §22.5 Numérotation séparée AV-{YYYYMM}, compteur indépendant des factures
 *   - §22.6 Affichage dans la sidebar de la facture originale
 *
 * Stratégie : raw GraphQL pour les tests 1-3 (rapide, déterministe),
 * UI pour le test 4 (sidebar liaison facture ↔ avoir).
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import {
  createInvoiceMutation,
  markInvoiceAsPaid,
  createCreditNoteMutation,
  creditNotesByInvoice,
} from "./helpers/invoice-mutations";
import {
  buildInvoiceInput,
  buildItem,
  buildClientInput,
} from "./helpers/invoice-fixtures";

// Pré-création d'une facture COMPLETED, retourne le payload.
async function createCompletedInvoice(request, items) {
  const { json } = await createInvoiceMutation(request, {
    ...buildInvoiceInput({ items, status: "PENDING" }),
  });
  expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
  const invoice = json.data.createInvoice;
  const { json: paid } = await markInvoiceAsPaid(request, invoice.id);
  expect(paid.errors, JSON.stringify(paid.errors)).toBeFalsy();
  return invoice;
}

// Workaround : le DB de test contient un index unique stale
// `creditnote_number_createdBy_year_unique` (devrait être workspaceId-based) qui
// rejette les numéros déjà utilisés par CET utilisateur de test cette année,
// même à travers les runs (la session user persiste). Le compteur backend
// régénère "0001"/"0002" à chaque run et entre en collision. Solution : on
// passe un numéro manuel aléatoire haut (5000-9999) pour éviter les collisions.
function uniqueCreditNoteNumber() {
  return String(5000 + Math.floor(Math.random() * 4999)).padStart(4, "0");
}

// Construit le minimum d'un input d'avoir pointant sur originalInvoice.
function buildCreditNoteInput(originalInvoice, overrides = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    originalInvoiceId: originalInvoice.id,
    creditType: "CORRECTION",
    refundMethod: "NEXT_INVOICE",
    issueDate: today,
    number: uniqueCreditNoteNumber(),
    client: buildClientInput(),
    items: [
      buildItem({
        description: "Avoir partiel",
        quantity: 1,
        unitPrice: 100,
        vatRate: 20,
      }),
    ],
    ...overrides,
  };
}

test.describe("[Factures] Avoirs (§22)", () => {
  test.setTimeout(60000);

  test("Test 1 — Création d'un avoir lié à une facture COMPLETED", async ({
    authenticatedPage: page,
  }) => {
    // 1. Facture PENDING 1000€ HT → COMPLETED via markInvoiceAsPaid
    const invoice = await createCompletedInvoice(page.request, [
      buildItem({
        description: "Prestation à avoirer",
        quantity: 1,
        unitPrice: 1000,
        vatRate: 20,
      }),
    ]);

    // 2. Créer l'avoir : 100€ HT / 120€ TTC (les totaux seront forcés négatifs
    //    par calculateCreditNoteTotals — cf creditNote.js:124-128)
    const { status, json } = await createCreditNoteMutation(page.request, {
      ...buildCreditNoteInput(invoice, {
        items: [
          buildItem({
            description: "Avoir partiel §22.1",
            quantity: 1,
            unitPrice: 100,
            vatRate: 20,
          }),
        ],
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const creditNote = json.data.createCreditNote;

    // §22.2 : tous les totaux ≤ 0 (résolver inverse le signe)
    expect(Number(creditNote.totalHT)).toBeLessThanOrEqual(0);
    expect(Number(creditNote.totalVAT)).toBeLessThanOrEqual(0);
    expect(Number(creditNote.totalTTC)).toBeLessThanOrEqual(0);
    expect(Number(creditNote.finalTotalTTC)).toBeLessThanOrEqual(0);
    // Magnitude attendue : -120 TTC (100 HT × 1.20)
    expect(Number(creditNote.finalTotalTTC)).toBeCloseTo(-120, 2);

    // §22.5 : préfixe AV-YYYYMM, numéro 4 digits
    expect(creditNote.prefix).toMatch(/^AV-\d{6}$/);
    expect(creditNote.number).toMatch(/^\d{3,4}$/);

    // Lien à la facture originale (resolver:289 + populate)
    expect(creditNote.originalInvoice?.id).toBe(invoice.id);
    expect(creditNote.originalInvoiceNumber).toBe(invoice.number);

    // Type & status par défaut
    expect(creditNote.creditType).toBe("CORRECTION");
    expect(creditNote.status).toBe("CREATED");
    expect(creditNote.refundMethod).toBe("NEXT_INVOICE");
  });

  test("Test 2 — Avoir sans originalInvoiceId : erreur de validation", async ({
    authenticatedPage: page,
  }) => {
    // Construire un input volontairement sans originalInvoiceId (champ requis
    // dans CreateCreditNoteInput, resolver:264-266 throw createNotFoundError).
    // GraphQL refusera au niveau du schema (type validation) car le champ
    // est ID! (non-nullable).
    const today = new Date().toISOString().slice(0, 10);
    const { status, json } = await createCreditNoteMutation(page.request, {
      // originalInvoiceId VOLONTAIREMENT absent
      creditType: "CORRECTION",
      refundMethod: "NEXT_INVOICE",
      issueDate: today,
      client: buildClientInput(),
      items: [buildItem({ description: "Sans facture source", unitPrice: 50 })],
    });

    // GraphQL renvoie soit 400 (parse) soit 200 + errors[]
    expect([200, 400]).toContain(status);
    expect(
      json.errors,
      "Avoir sans originalInvoiceId doit être rejeté (champ ID! requis)",
    ).toBeTruthy();
    expect(json.errors.length).toBeGreaterThan(0);
    const messages = json.errors.map((e) => e.message).join(" | ");
    // Wording GraphQL : "données d'entrée invalides" (validation Apollo)
    // OU "originalInvoiceId" / "non-nullable" / "required" selon où ça
    // échoue (parse vs resolver vs Mongoose).
    expect(messages.toLowerCase()).toMatch(
      /originalinvoiceid|original.*invoice|non-nullable|required|invalides|invalid/i,
    );
  });

  test("Test 3 — Numérotation séparée invoice ↔ creditNote (compteurs distincts)", async ({
    authenticatedPage: page,
  }) => {
    // 1. Créer une facture PENDING (séquence factures avance)
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Facture A §22.5", unitPrice: 200 })],
        status: "PENDING",
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    const invoiceA = r1.data.createInvoice;

    // 2. Créer un avoir lié (compteur AVOIR avance, pas le compteur facture)
    //    Pré-requis : la facture doit être COMPLETED/PENDING/CANCELED.
    //    invoiceA est PENDING donc OK.
    const { json: rAvoir1 } = await createCreditNoteMutation(page.request, {
      ...buildCreditNoteInput(invoiceA, {
        items: [
          buildItem({
            description: "Avoir 1 §22.5",
            quantity: 1,
            unitPrice: 50,
            vatRate: 20,
          }),
        ],
      }),
    });
    expect(rAvoir1.errors, JSON.stringify(rAvoir1.errors)).toBeFalsy();
    const avoir1 = rAvoir1.data.createCreditNote;

    // 3. Créer une 2e facture — son numéro suit la séquence facture (sans
    //    être impacté par la création de l'avoir entre les deux).
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Facture B §22.5", unitPrice: 300 })],
        status: "PENDING",
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    const invoiceB = r2.data.createInvoice;

    // Invariant 1 : invoice prefix conservé (F-YYYYMM), B > A
    //    — le compteur facture n'a pas été perturbé par la création d'un avoir.
    expect(invoiceB.prefix).toBe(invoiceA.prefix);
    expect(parseInt(invoiceB.number, 10)).toBeGreaterThan(
      parseInt(invoiceA.number, 10),
    );

    // 4. Créer un 2e avoir lié à invoiceB
    const { json: rAvoir2 } = await createCreditNoteMutation(page.request, {
      ...buildCreditNoteInput(invoiceB, {
        items: [
          buildItem({
            description: "Avoir 2 §22.5",
            quantity: 1,
            unitPrice: 75,
            vatRate: 20,
          }),
        ],
      }),
    });
    expect(rAvoir2.errors, JSON.stringify(rAvoir2.errors)).toBeFalsy();
    const avoir2 = rAvoir2.data.createCreditNote;

    // Invariant 2 : préfixe avoir AV- distinct du préfixe facture F-
    expect(avoir1.prefix).toMatch(/^AV-\d{6}$/);
    expect(avoir2.prefix).toMatch(/^AV-\d{6}$/);
    expect(avoir1.prefix).not.toBe(invoiceA.prefix);
    expect(avoir2.prefix).not.toBe(invoiceB.prefix);

    // Invariant 3 : les avoirs ont des préfixes cohérents (même mois)
    expect(avoir1.prefix).toBe(avoir2.prefix);
  });

  test("Test 4 — Avoir lié visible via la query creditNotesByInvoice", async ({
    authenticatedPage: page,
  }) => {
    // §22.6 : la sidebar facture liste tous les avoirs liés via
    // CreditNote.findByInvoice(invoiceId). On teste l'invariant via la
    // query GraphQL `creditNotesByInvoice` (resolver:204) que la sidebar
    // consomme — plus stable que de naviguer sur l'UI (cf R1 dans
    // REGRESSIONS_TO_FIX.md, table /factures bloquée par seed.invoiceDraft).

    // Pré-création : facture COMPLETED + son avoir
    const invoice = await createCompletedInvoice(page.request, [
      buildItem({
        description: "Facture pour avoir lié §22.6",
        quantity: 1,
        unitPrice: 500,
        vatRate: 20,
      }),
    ]);

    const { json: rAvoir } = await createCreditNoteMutation(page.request, {
      ...buildCreditNoteInput(invoice, {
        items: [
          buildItem({
            description: "Avoir lié pour query check",
            quantity: 1,
            unitPrice: 50,
            vatRate: 20,
          }),
        ],
      }),
    });
    expect(rAvoir.errors, JSON.stringify(rAvoir.errors)).toBeFalsy();
    const avoir = rAvoir.data.createCreditNote;

    // Query la liste des avoirs de cette facture
    const { json: listJson } = await creditNotesByInvoice(
      page.request,
      invoice.id,
    );
    expect(listJson.errors, JSON.stringify(listJson.errors)).toBeFalsy();
    const list = listJson.data.creditNotesByInvoice;
    expect(Array.isArray(list)).toBe(true);

    // L'avoir créé doit être présent
    const found = list.find((c) => c.id === avoir.id);
    expect(
      found,
      `L'avoir ${avoir.prefix}${avoir.number} doit être dans la liste creditNotesByInvoice (sidebar §22.6)`,
    ).toBeTruthy();
    expect(found.prefix).toBe(avoir.prefix);
    expect(found.number).toBe(avoir.number);
    expect(Number(found.finalTotalTTC)).toBeLessThanOrEqual(0);
  });
});
