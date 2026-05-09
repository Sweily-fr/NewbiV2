/**
 * Invariants métier — phase 4 (audit exploratoire).
 *
 * Couvre 9 garde-fous backend identifiés par lecture directe du
 * resolver invoice.js + modèle Invoice. Cf AUDIT_EXPLORATOIRE.md
 * pour la grille complète des invariants observés vs déjà couverts.
 *
 * Catégorie compliance / data integrity :
 *   - T1  §updateInvoice — changement d'année sur finalized → REJETÉ
 *   - T2  markInvoiceAsPaid sur DRAFT  → REJETÉ
 *   - T3  markInvoiceAsPaid sur CANCELED → REJETÉ
 *   - T4  changeInvoiceStatus PENDING → DRAFT → REJETÉ (régression interdite)
 *
 * Catégorie validation/format :
 *   - T5  Prefix avec caractères non autorisés → REJETÉ (regex strict)
 *   - T6  dueDate < issueDate → REJETÉ (Mongoose validator)
 *
 * Catégorie createLinkedInvoice (devis → facture) :
 *   - T7  amount ≤ 0 → REJETÉ
 *   - T8  quote non-COMPLETED → REJETÉ
 *   - T9  amount > reste à facturer → REJETÉ
 *
 * Stratégie : tout en raw GraphQL — invariants serveurs, pas de UI
 * nécessaire. Cleanup en afterAll.
 */
import { test } from "../fixtures/auth.fixture";
import { expect, request as playwrightRequest } from "@playwright/test";
import {
  createInvoiceMutation,
  updateInvoiceMutation,
  changeInvoiceStatus,
  markInvoiceAsPaid,
  deleteInvoiceMutation,
  createQuoteMutation,
  changeQuoteStatus,
  createLinkedInvoiceMutation,
} from "./helpers/invoice-mutations";
import {
  buildInvoiceInput,
  buildItem,
  buildQuoteInput,
} from "./helpers/invoice-fixtures";

const createdInvoiceIds = [];
const createdQuoteIds = [];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test.describe("[Factures] Invariants métier (phase 4 audit exploratoire)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(90000);

  test.afterAll(async () => {
    if (createdInvoiceIds.length === 0 && createdQuoteIds.length === 0) return;
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    for (const id of createdInvoiceIds) {
      await deleteInvoiceMutation(apiContext, id).catch(() => {});
    }
    // Pas de mutation deleteQuote dans les helpers — les devis créés ici
    // restent en DB (acceptable : le seed ne les nettoie pas non plus).
    await apiContext.dispose();
  });

  test("Test 1 — Year change forbidden on finalized invoice (CRITIQUE compliance)", async ({
    authenticatedPage: page,
  }) => {
    // §updateInvoice (resolver invoice.js:1568-1583) — sur une facture
    // PENDING/COMPLETED/CANCELED, modifier issueDate vers une AUTRE année
    // doit être rejeté. C'est le garde-corps qui empêche la réécriture
    // silencieuse de l'année comptable d'une facture émise (= compliance FR).
    const { json: rInv } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "T1 anchor", unitPrice: 100 })],
        status: "PENDING",
      }),
    });
    expect(rInv.errors, JSON.stringify(rInv.errors)).toBeFalsy();
    const inv = rInv.data.createInvoice;
    createdInvoiceIds.push(inv.id);
    const yearNow = new Date().getFullYear();

    // Tenter de changer l'année (year+1)
    const newIssueYear = yearNow + 1;
    const newIssueDate = `${newIssueYear}-06-15`;
    const newDueDate = `${newIssueYear}-07-15`;

    const { json: rUpd } = await updateInvoiceMutation(page.request, inv.id, {
      issueDate: newIssueDate,
      dueDate: newDueDate,
    });

    expect(
      rUpd.errors,
      "Changer l'année sur une facture finalisée doit être rejeté (compliance FR)",
    ).toBeTruthy();
    const messages = rUpd.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /année|year|émission|finalisée|séquence|numérotation/i,
    );
  });

  test("Test 2 — markInvoiceAsPaid sur DRAFT rejeté (CRITIQUE)", async ({
    authenticatedPage: page,
  }) => {
    // §markInvoiceAsPaid (invoice.js:2487-2495) — un brouillon n'existe
    // pas comme document légal, donc ne peut pas être marqué comme payé.
    const { json: rDraft } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "T2 DRAFT", unitPrice: 50 })],
        status: "DRAFT",
      }),
    });
    expect(rDraft.errors, JSON.stringify(rDraft.errors)).toBeFalsy();
    const draft = rDraft.data.createInvoice;
    createdInvoiceIds.push(draft.id);

    const { json: paid } = await markInvoiceAsPaid(
      page.request,
      draft.id,
      todayISO(),
    );
    expect(
      paid.errors,
      "markInvoiceAsPaid sur un DRAFT doit être rejeté (status transition error)",
    ).toBeTruthy();
    const messages = paid.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /brouillon|draft|transition|payée|status/i,
    );
  });

  test("Test 3 — markInvoiceAsPaid sur CANCELED rejeté (CRITIQUE)", async ({
    authenticatedPage: page,
  }) => {
    // §markInvoiceAsPaid (invoice.js:2497-2503) — une facture annulée
    // ne peut pas être marquée comme payée (état comptable inconsistant).
    const { json: rPending } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "T3 to cancel", unitPrice: 100 })],
        status: "PENDING",
      }),
    });
    expect(rPending.errors, JSON.stringify(rPending.errors)).toBeFalsy();
    const inv = rPending.data.createInvoice;
    createdInvoiceIds.push(inv.id);

    const { json: cancel } = await changeInvoiceStatus(
      page.request,
      inv.id,
      "CANCELED",
    );
    expect(cancel.errors, JSON.stringify(cancel.errors)).toBeFalsy();

    const { json: paid } = await markInvoiceAsPaid(
      page.request,
      inv.id,
      todayISO(),
    );
    expect(
      paid.errors,
      "markInvoiceAsPaid sur une CANCELED doit être rejeté",
    ).toBeTruthy();
    const messages = paid.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /annulée|canceled|transition|payée|status/i,
    );
  });

  test("Test 4 — changeInvoiceStatus PENDING → DRAFT interdit (CRITIQUE régression)", async ({
    authenticatedPage: page,
  }) => {
    // §changeInvoiceStatus (invoice.js:2218-2225) — la régression d'une
    // PENDING vers DRAFT est interdite. Compliance : une facture émise
    // ne peut pas redevenir un brouillon (audit trail compromis).
    const { json: rPending } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "T4 PENDING", unitPrice: 100 })],
        status: "PENDING",
      }),
    });
    expect(rPending.errors, JSON.stringify(rPending.errors)).toBeFalsy();
    const inv = rPending.data.createInvoice;
    createdInvoiceIds.push(inv.id);

    const { json: change } = await changeInvoiceStatus(
      page.request,
      inv.id,
      "DRAFT",
    );
    expect(
      change.errors,
      "PENDING → DRAFT doit être rejeté (régression interdite)",
    ).toBeTruthy();
    const messages = change.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /transition|brouillon|draft|status/i,
    );
  });

  test("Test 5 — Prefix avec caractères non autorisés rejeté (ÉLEVÉ)", async ({
    authenticatedPage: page,
  }) => {
    // §createInvoice (invoice.js:875-884) — prefix doit matcher
    // /^[A-Za-z0-9-]*$/. Un prefix avec espace ou slash casse la concat
    // affichée `${prefix}${number}` et l'index unique.
    // On teste un préfixe avec espace (cas très probable user-input).
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "T5 invalid prefix", unitPrice: 50 })],
        status: "PENDING",
        prefix: "F 2026-",
      }),
    });
    expect(
      json.errors,
      "Un prefix contenant un espace doit être rejeté (regex /^[A-Za-z0-9-]*$/)",
    ).toBeTruthy();
    const messages = json.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /préfixe|prefix|caractère|autorisé|invalid/i,
    );
  });

  test("Test 6 — dueDate < issueDate rejeté (ÉLEVÉ — Mongoose validator)", async ({
    authenticatedPage: page,
  }) => {
    // §Invoice model (Invoice.js:64-72) — validator Mongoose :
    //   dueDate ≥ issueDate.
    // On crée un DRAFT (évite le validateInvoiceIssueDate du resolver
    // qui dépend de la latest invoice, hors scope ici) avec dueDate
    // 5 jours AVANT issueDate.
    const issueDate = todayISO();
    const dueDateBefore = shiftDaysISO(-5);

    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "T6 due before issue", unitPrice: 100 }),
        ],
        status: "DRAFT",
        issueDate,
        dueDate: dueDateBefore,
      }),
    });
    expect(
      json.errors,
      "dueDate antérieure à issueDate doit être rejeté (Invoice.js:64-72 validator)",
    ).toBeTruthy();
    // Le message top-level est générique "La facture contient des erreurs
    // de validation" — la précision est dans extensions.details (cf
    // createValidationError). On agrège tout le payload pour matcher.
    const fullPayload = JSON.stringify(json.errors).toLowerCase();
    expect(fullPayload).toMatch(
      /échéance|due.*date|postérieure|antérieure|émission|validation/i,
    );
  });

  test("Test 7 — createLinkedInvoice amount ≤ 0 rejeté (ÉLEVÉ)", async ({
    authenticatedPage: page,
  }) => {
    // §createLinkedInvoice (invoice.js:2658-2663) — amount doit être
    // > 0. Empêche les factures à 0€ ou négatives.
    // 1. Créer un devis COMPLETED (= acceptable pour conversion)
    const { json: rQuote } = await createQuoteMutation(page.request, {
      ...buildQuoteInput({
        items: [buildItem({ description: "T7 quote", unitPrice: 500 })],
        status: "PENDING",
      }),
    });
    expect(rQuote.errors, JSON.stringify(rQuote.errors)).toBeFalsy();
    const quote = rQuote.data.createQuote;
    createdQuoteIds.push(quote.id);
    const { json: rAccept } = await changeQuoteStatus(
      page.request,
      quote.id,
      "COMPLETED",
    );
    expect(rAccept.errors, JSON.stringify(rAccept.errors)).toBeFalsy();

    // 2. Tenter linked invoice avec amount = 0
    const { json: linked } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: 0,
      isDeposit: false,
    });
    expect(
      linked.errors,
      "createLinkedInvoice avec amount=0 doit être rejeté",
    ).toBeTruthy();
    const messages = linked.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /montant|amount|invalide|positif|invalid/i,
    );
  });

  test("Test 8 — createLinkedInvoice quote non-COMPLETED rejeté (ÉLEVÉ)", async ({
    authenticatedPage: page,
  }) => {
    // §createLinkedInvoice (invoice.js:2683-2690) — seul un devis
    // COMPLETED (= accepté par le client) peut générer une facture liée.
    const { json: rQuote } = await createQuoteMutation(page.request, {
      ...buildQuoteInput({
        items: [buildItem({ description: "T8 quote PENDING", unitPrice: 200 })],
        status: "PENDING",
      }),
    });
    expect(rQuote.errors, JSON.stringify(rQuote.errors)).toBeFalsy();
    const quote = rQuote.data.createQuote;
    createdQuoteIds.push(quote.id);
    expect(quote.status).toBe("PENDING");

    const { json: linked } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: 100,
      isDeposit: false,
    });
    expect(
      linked.errors,
      "createLinkedInvoice sur un devis PENDING doit être rejeté",
    ).toBeTruthy();
    const messages = linked.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(/accepté|completed|devis|status/i);
  });

  test("Test 9 — createLinkedInvoice amount > reste à facturer rejeté (ÉLEVÉ)", async ({
    authenticatedPage: page,
  }) => {
    // §createLinkedInvoice (invoice.js:2727-2738) — amount ne peut pas
    // dépasser `quote.finalTotalTTC - alreadyInvoiced`. Test :
    //   - Devis 600€ TTC (500HT × 1.20 TVA)
    //   - 1ère linked: 400€ TTC → reste 200€
    //   - Tenter 2ème linked: 300€ → rejet (200€ disponible)
    const { json: rQuote } = await createQuoteMutation(page.request, {
      ...buildQuoteInput({
        items: [
          buildItem({
            description: "T9 quote 600€",
            unitPrice: 500,
            vatRate: 20,
          }),
        ],
        status: "PENDING",
      }),
    });
    expect(rQuote.errors, JSON.stringify(rQuote.errors)).toBeFalsy();
    const quote = rQuote.data.createQuote;
    createdQuoteIds.push(quote.id);
    await changeQuoteStatus(page.request, quote.id, "COMPLETED");

    // 1ère linked invoice : 400€
    const { json: r1 } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: 400,
      isDeposit: false,
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdInvoiceIds.push(r1.data.createLinkedInvoice.invoice.id);

    // 2ème linked invoice : 300€ → dépasse les 200€ restants
    const { json: r2 } = await createLinkedInvoiceMutation(page.request, {
      quoteId: quote.id,
      amount: 300,
      isDeposit: false,
    });
    expect(
      r2.errors,
      "createLinkedInvoice 300€ avec reste 200€ doit être rejeté",
    ).toBeTruthy();
    const messages = r2.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /montant|amount|reste|dépasser|facturer/i,
    );
  });
});
