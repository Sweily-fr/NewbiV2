/**
 * P0 — Avoirs (Credit notes) backend invariants via raw GraphQL.
 *
 * Bypass complet de l'UI parce que /factures/<id>/avoir/nouveau a une race
 * Apollo non résolue (~17 hooks parallèles, voir e2e/TODO.md). Ce spec
 * teste les invariants compliance FR au niveau backend uniquement :
 *
 *   Test 1 — CreateCreditNote sur facture PENDING : succès, status=CREATED,
 *     originalInvoice.id préservé, total ≤ total facture originale.
 *   Test 2 — CreateCreditNote sur facture DRAFT : rejet (compliance FR).
 *   Test 3 — CreateCreditNote avec montant > facture : rejet (sum check).
 *
 * DETTE TECHNIQUE : un test UI doit être ajouté quand la race Apollo sera
 * résolue (voir e2e/credit-notes/credit-note-p0.spec.js skippé + TODO.md).
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { TEST_INVOICES, TEST_CLIENTS, IDS } from "../seed/test-data";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";
const WORKSPACE_ID = IDS.organizationId.toString();

const pendingInvoice = TEST_INVOICES.find((i) => i.status === "PENDING");
const draftInvoice = TEST_INVOICES.find((i) => i.status === "DRAFT");
if (!pendingInvoice || !draftInvoice) {
  throw new Error("Test seed missing: needs both PENDING and DRAFT invoices");
}
const PENDING_INVOICE_ID = pendingInvoice._id.toString();
const DRAFT_INVOICE_ID = draftInvoice._id.toString();
const PENDING_INVOICE_TOTAL = 3780; // de seed (TEST_INVOICES[1].finalTotalTTC)

// ClientInput minimal valide — copié du seed pour cohérence avec la facture source
const TEST_CLIENT = TEST_CLIENTS[0]; // Entreprise Alpha SAS
const CLIENT_INPUT = {
  name: TEST_CLIENT.name,
  email: TEST_CLIENT.email,
  type: "COMPANY",
  siret: TEST_CLIENT.siret,
  vatNumber: TEST_CLIENT.vatNumber,
  address: {
    street: TEST_CLIENT.address.street,
    city: TEST_CLIENT.address.city,
    postalCode: TEST_CLIENT.address.postalCode,
    country: TEST_CLIENT.address.country,
  },
};

const CREATE_CREDIT_NOTE_QUERY = `
  mutation CreateCreditNote($workspaceId: ID!, $input: CreateCreditNoteInput!) {
    createCreditNote(workspaceId: $workspaceId, input: $input) {
      id
      number
      prefix
      status
      creditType
      originalInvoice { id }
      totalTTC
      finalTotalTTC
    }
  }
`;

function buildVariables(originalInvoiceId, items, opts = {}) {
  return {
    workspaceId: WORKSPACE_ID,
    input: {
      originalInvoiceId,
      creditType: opts.creditType || "CORRECTION",
      reason: opts.reason || "Test E2E P0 avoir",
      client: CLIENT_INPUT,
      items,
      issueDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      refundMethod: opts.refundMethod || "NEXT_INVOICE",
    },
  };
}

test.describe("[P0][Avoirs] Backend invariants (raw GraphQL)", () => {
  // SKIP — Le modèle CreditNote applique un hook d'encryption AES-256-GCM sur
  // les bank details (IBAN/BIC) à la sauvegarde (CreditNote.js:2,394 +
  // utils/encryption.js:8). Ce hook exige `DATA_ENCRYPTION_KEY` dans les env
  // vars du backend. Cette variable n'est PAS dans newbi-api/.env (vérifié au
  // 1er mai 2026) → toute mutation createCreditNote throw INTERNAL_SERVER_ERROR
  // "DATA_ENCRYPTION_KEY environment variable is required".
  //
  // La signature mutation, le seed (invoicePending PENDING 3780€, invoiceDraft
  // DRAFT) et la logique des assertions sont validés. Re-enable dès que
  // DATA_ENCRYPTION_KEY est ajouté à newbi-api/.env (à coordonner avec Dylan,
  // c'est de la config infra, pas du code applicatif).
  test.skip();

  test("Test 1 — Avoir partiel sur facture PENDING : succès, lien vers facture originale, total ≤ original", async ({
    authenticatedPage: page,
  }) => {
    const items = [
      {
        description: "Remboursement partiel",
        quantity: 1,
        unitPrice: -100, // négatif pour avoir
        vatRate: 20,
        unit: "unité",
      },
    ];

    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "CreateCreditNote",
        variables: buildVariables(PENDING_INVOICE_ID, items),
        query: CREATE_CREDIT_NOTE_QUERY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.errors, JSON.stringify(body.errors)).toBeFalsy();

    const creditNote = body.data?.createCreditNote;
    expect(creditNote, "createCreditNote payload missing").toBeTruthy();
    expect(creditNote.status).toBe("CREATED");
    expect(creditNote.originalInvoice?.id).toBe(PENDING_INVOICE_ID);

    // Total avoir doit être ≤ total facture originale (compliance FR)
    const creditTotal = Math.abs(Number(creditNote.totalTTC));
    expect(creditTotal).toBeLessThanOrEqual(PENDING_INVOICE_TOTAL);
    expect(creditTotal).toBeGreaterThan(0);
  });

  test("Test 2 — Avoir sur facture DRAFT : rejet (compliance FR — pas d'avoir sur brouillon)", async ({
    authenticatedPage: page,
  }) => {
    const items = [
      {
        description: "Test rejet DRAFT",
        quantity: 1,
        unitPrice: -50,
        vatRate: 20,
        unit: "unité",
      },
    ];

    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "CreateCreditNote",
        variables: buildVariables(DRAFT_INVOICE_ID, items),
        query: CREATE_CREDIT_NOTE_QUERY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Doit échouer : le backend doit refuser un avoir sur facture DRAFT
    if (body.data?.createCreditNote) {
      expect.fail(
        `COMPLIANCE FAIL — credit note created on DRAFT invoice. Should be rejected. Got: ${JSON.stringify(body.data.createCreditNote)}`,
      );
    }
    expect(body.errors).toBeTruthy();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  test("Test 3 — Avoir avec montant > facture originale : rejet (sum check compliance FR)", async ({
    authenticatedPage: page,
  }) => {
    // Tente un avoir de 5000€ sur une facture de 3780€
    const items = [
      {
        description: "Tentative dépassement",
        quantity: 1,
        unitPrice: -5000,
        vatRate: 20,
        unit: "unité",
      },
    ];

    const response = await page.request.post(GRAPHQL_URL, {
      headers: { "x-workspace-id": WORKSPACE_ID },
      data: {
        operationName: "CreateCreditNote",
        variables: buildVariables(PENDING_INVOICE_ID, items),
        query: CREATE_CREDIT_NOTE_QUERY,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    if (body.data?.createCreditNote) {
      const total = Math.abs(Number(body.data.createCreditNote.totalTTC));
      if (total > PENDING_INVOICE_TOTAL) {
        expect.fail(
          `COMPLIANCE FAIL — credit note total (${total}€) > original invoice (${PENDING_INVOICE_TOTAL}€). Should be rejected.`,
        );
      }
    }
    expect(body.errors).toBeTruthy();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
