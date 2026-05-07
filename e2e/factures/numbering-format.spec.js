/**
 * Format préfixe + numéro — invariants R1 / R2 (§4 INVOICES_PAGE.md).
 *
 * R1 — Format préfixe libre (toute combinaison de caractères, dans la limite
 *      de 10 chars imposée par le validateur Mongoose, cf
 *      `newbi-api/src/models/Invoice.js:35-37`).
 * R2 — Unicité = (prefix, number, workspaceId, issueYear). Deux factures
 *      avec préfixes différents peuvent partager le même number ; deux
 *      factures avec même (prefix, number) sur la même année du même
 *      workspace sont rejetées (cf index unique
 *      `prefix_number_workspaceId_year_unique`, Invoice.js:537-549).
 *
 * Tests raw GraphQL — chaque facture créée est trackée et supprimée dans
 * `afterAll` pour ne pas polluer latestInvoiceIssueDate / les compteurs
 * DocumentCounter (cf R11).
 */
import { test } from "../fixtures/auth.fixture";
import { expect, request as playwrightRequest } from "@playwright/test";
import {
  createInvoiceMutation,
  deleteInvoiceMutation,
} from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

const createdIds = [];

// Préfixes uniques par run pour ne pas hériter du DocumentCounter d'un run
// précédent (le compteur est persistant inter-runs même si on supprime les
// factures, cf DocumentCounter.lastNumber). Limite Mongoose : prefix ≤ 10
// chars (Invoice.js:35-37). On compose label (2-3 chars) + 6 derniers
// digits du timestamp + tiret final = ≤ 10 chars exactement.
function uniquePrefix(label) {
  const stamp = String(Date.now()).slice(-6);
  return `${label}${stamp}-`;
}

test.describe("[Factures] Numérotation — format préfixe (§4 R1, R2)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(60000);

  test.afterAll(async () => {
    if (createdIds.length === 0) return;
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    for (const id of createdIds) {
      await deleteInvoiceMutation(apiContext, id).catch(() => {});
    }
    await apiContext.dispose();
  });

  test("Test 1 — Préfixe avec tirets et chiffres : F-2026- accepté (R1)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R1 : préfixe libre tant qu'il respecte la limite 10 chars du
    // validateur Mongoose. "F-2026-" = 7 chars, OK.
    const prefix = "F-2026-";
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "R1 prefix F-2026-", unitPrice: 100 }),
        ],
        status: "PENDING",
        prefix,
        // Pas de number → backend génère le séquentiel (per-prefix counter)
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    expect(inv.prefix).toBe(prefix);
    expect(inv.number).toMatch(/^\d{4}$/);
  });

  test("Test 2 — Préfixe sans tiret : INVOICE-1- accepté (R1)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R1 : préfixe peut être n'importe quoi. "INVOICE-1-" = 10 chars,
    // exactement la limite haute du validateur.
    const prefix = "INVOICE-1-";
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "R1 prefix INVOICE", unitPrice: 100 }),
        ],
        status: "PENDING",
        prefix,
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    expect(inv.prefix).toBe(prefix);
  });

  test("Test 3 — Préfixe vide (chaîne vide) : tombe sur le default F-YYYYMM (R1)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R1 + Mongoose default (Invoice.js:27-32) : si prefix === "" est
    // coercé/falsy, le default function génère "F-YYYYMM" automatiquement.
    // On ne passe pas prefix dans l'input pour tomber sur le default.
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "R1 default prefix", unitPrice: 100 }),
        ],
        status: "PENDING",
        // prefix omis volontairement
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    // Default = F-YYYYMM (Invoice.js:30) — 7 chars
    expect(inv.prefix).toMatch(/^F-\d{6}$/);
  });

  test("Test 4 — Mêmes numéros sur préfixes différents : les 2 sont créées (R2)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R2 : (prefix, number, year) — deux préfixes distincts peuvent
    // porter le même number "0001". L'index unique inclut prefix.
    const prefixA = uniquePrefix("FA");
    const prefixB = uniquePrefix("FB");
    // Comme uniquePrefix utilise le même timestamp, on désambiguïse :
    expect(prefixA).not.toBe(prefixB);

    const { json: jsonA } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R2 prefixA", unitPrice: 100 })],
        status: "PENDING",
        prefix: prefixA,
        number: "0001",
      }),
    });
    expect(jsonA.errors, JSON.stringify(jsonA.errors)).toBeFalsy();
    createdIds.push(jsonA.data.createInvoice.id);
    expect(jsonA.data.createInvoice.number).toBe("0001");

    const { json: jsonB } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R2 prefixB", unitPrice: 100 })],
        status: "PENDING",
        prefix: prefixB,
        number: "0001",
      }),
    });
    expect(jsonB.errors, JSON.stringify(jsonB.errors)).toBeFalsy();
    createdIds.push(jsonB.data.createInvoice.id);
    expect(jsonB.data.createInvoice.number).toBe("0001");

    expect(jsonA.data.createInvoice.id).not.toBe(jsonB.data.createInvoice.id);
  });

  test("Test 5 — Même (prefix, number) sur même année : la 2e est rejetée (R2 / DUPLICATE_ERROR)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R2 : l'index unique (prefix, number, workspaceId, issueYear)
    // bloque la collision. Le resolver pré-vérifie aussi (cf
    // invoice.js:1131-1142) et lève DUPLICATE_ERROR avec le wording
    // "Le numéro de facture {prefix}{number} existe déjà".
    const prefix = uniquePrefix("FD");
    const number = "0042";

    const { json: jsonA } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R2 dup A", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number,
      }),
    });
    expect(jsonA.errors, JSON.stringify(jsonA.errors)).toBeFalsy();
    createdIds.push(jsonA.data.createInvoice.id);

    // 2e tentative — même prefix + même number → doit échouer
    const { json: jsonB } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R2 dup B", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number,
      }),
    });

    expect(
      jsonB.errors,
      "Collision (prefix, number) sur même année doit être rejetée (R2)",
    ).toBeTruthy();
    expect(jsonB.errors.length).toBeGreaterThan(0);
    const messages = jsonB.errors.map((e) => e.message).join(" | ");
    // Wording resolver invoice.js:1140 : "Le numéro de facture ... existe déjà"
    expect(messages).toMatch(/existe déjà|déjà|DUPLICATE/i);
  });

  test("Test 6 — Préfixe trop long (> 10 chars) : rejeté par le validateur (Invoice.js:35)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R1 + contrainte technique modèle : prefix.length ≤ 10. Un préfixe
    // de 11 chars doit être rejeté par Mongoose à la sauvegarde.
    const prefix = "TOOLONGPRE-"; // 11 chars
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R1 too long", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0001",
      }),
    });
    expect(
      json.errors,
      `Prefix de ${prefix.length} chars doit être rejeté (limite 10)`,
    ).toBeTruthy();
    const messages = json.errors.map((e) => e.message).join(" | ");
    // Wording validateur Mongoose : "Le préfixe ne doit pas dépasser 10 caractères"
    expect(messages.toLowerCase()).toMatch(
      /préfixe|prefix|10|dépasser|caractère|validation/i,
    );
  });
});
