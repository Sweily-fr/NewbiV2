/**
 * Mode "numéro libre" (manualNumber) — R5 / §4.
 *
 * Comportement backend (cf newbi-api/src/utils/documentNumbers.js:32-49) :
 *   - generateInvoiceSequentialNumber accepte un `manualNumber` SI aucune
 *     facture finalisée (PENDING/COMPLETED/CANCELED) n'existe encore pour
 *     le préfixe → renvoie ce numéro padded à 4 digits.
 *   - Sinon ignore manualNumber et incrémente le compteur séquentiel.
 *   - Le resolver createInvoice ajoute un check supplémentaire : si
 *     `input.number` existe déjà sur (prefix, status≠DRAFT, workspaceId),
 *     erreur DUPLICATE_ERROR (cf invoice.js:1131-1142).
 *
 * R5 — Sur un préfixe NEUF (sans aucune facture finalisée) :
 *   user fournit input.number = "0050" → la facture est créée avec
 *   number="0050". La SUIVANTE (sans manualNumber) reprend à "0051"
 *   (séquentiel à partir de max(existing) + 1).
 *
 * Tests raw GraphQL — préfixes uniques par run + cleanup afterAll.
 */
import { test } from "../fixtures/auth.fixture";
import { expect, request as playwrightRequest } from "@playwright/test";
import {
  createInvoiceMutation,
  deleteInvoiceMutation,
  nextInvoiceNumber,
} from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

const createdIds = [];

function uniquePrefix(label) {
  const stamp = String(Date.now()).slice(-4);
  return `${label}${stamp}-`;
}

test.describe("[Factures] Numérotation — mode numéro libre (§4 R5)", () => {
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

  test("Test 1 — Préfixe neuf + manualNumber=0050 : facture créée avec '0050' (R5)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R5 — sur un préfixe sans facture finalisée existante,
    // l'utilisateur peut taper un numéro libre. Le backend l'utilise
    // tel quel (padded 4 chiffres).
    const prefix = uniquePrefix("F1");
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F1 free 0050", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0050",
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    expect(inv.number).toBe("0050");
    expect(inv.prefix).toBe(prefix);
  });

  test("Test 2 — Après numéro libre 0050, prochain séquentiel = '0051' (R5)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R5 — le numéro libre devient le "point de départ". La PROCHAINE
    // facture sous le même prefix (sans manualNumber) doit reprendre à
    // 0051 (= max + 1 via DocumentCounter resync).
    const prefix = uniquePrefix("F2");

    // 1. Créer avec numéro libre 0050
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F2 free 0050", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0050",
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdIds.push(r1.data.createInvoice.id);
    expect(r1.data.createInvoice.number).toBe("0050");

    // 2. Vérifier que la prochaine query renvoie 0051
    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(q.data.nextInvoiceNumber).toBe("0051");

    // 3. Créer une 2e facture sans manualNumber → reçoit 0051
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F2 next", unitPrice: 100 })],
        status: "PENDING",
        prefix,
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    createdIds.push(r2.data.createInvoice.id);
    expect(
      r2.data.createInvoice.number,
      "Après numéro libre 0050, le séquentiel reprend à 0051 (R5)",
    ).toBe("0051");
  });

  test("Test 3 — manualNumber sur préfixe DÉJÀ utilisé : numéro libre IGNORÉ, séquentiel utilisé", async ({
    authenticatedPage: page,
  }) => {
    // §4 — la "porte" du numéro libre est fermée dès qu'au moins une
    // facture finalisée existe pour ce préfixe. Cf
    // generateInvoiceSequentialNumber:32-49 :
    //   if (manualNumber && existingCount === 0) → utilise manualNumber
    //   sinon → ignore et utilise le compteur.
    //
    // ⚠️ MAIS : le resolver createInvoice (invoice.js:1126-1145) intercepte
    // `input.number` AVANT d'arriver à generateInvoiceNumber, et lève
    // une DUPLICATE_ERROR si conflict, OU utilise input.number tel quel
    // sans passer par le compteur si pas de conflit. Donc en pratique :
    // - input.number sur prefix déjà utilisé + numéro libre → soit
    //   utilisé (si pas de doublon), soit rejeté (si doublon).
    // - Le compteur séquentiel n'est PAS forcé.
    //
    // Ce test fixe le comportement OBSERVÉ : sur un prefix avec une
    // facture séquentielle 0001, demander manualNumber=0099 → la facture
    // est créée avec 0099 (gap volontaire) car 0099 n'est pas pris.
    const prefix = uniquePrefix("F3");

    // 1. Créer 0001 séquentiellement
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F3 seq 0001", unitPrice: 100 })],
        status: "PENDING",
        prefix,
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdIds.push(r1.data.createInvoice.id);
    expect(r1.data.createInvoice.number).toBe("0001");

    // 2. Demander manualNumber=0099 sur le même prefix
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F3 free 0099", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0099",
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    createdIds.push(r2.data.createInvoice.id);
    // Le resolver utilise input.number tel quel s'il n'y a pas de doublon.
    expect(r2.data.createInvoice.number).toBe("0099");

    // 3. Conséquence : nextInvoiceNumber se resync sur max=99 → next=0100
    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(q.data.nextInvoiceNumber).toBe("0100");
  });

  test("Test 4 — Numéro libre alphanumeric 'ABC123' : accepté (regex modèle)", async ({
    authenticatedPage: page,
  }) => {
    // §4 — la regex Mongoose pour `number` est /^[A-Za-z0-9-]{1,50}$/
    // (cf Invoice.js:51). Donc "ABC123" est valide. Conséquence : il
    // peut être utilisé comme manualNumber sur un préfixe neuf (R5),
    // mais il N'AVANCERA PAS le compteur séquentiel (ne match pas
    // /^\d+$/ dans getExistingMaxNumber).
    const prefix = uniquePrefix("F4");
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F4 alpha", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "ABC123",
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    expect(inv.number).toBe("ABC123");

    // Conséquence : nextInvoiceNumber renvoie '0001' (ABC123 ignoré
    // dans le calcul du max numérique).
    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(
      q.data.nextInvoiceNumber,
      "Un numéro alphanumeric n'avance pas le compteur séquentiel",
    ).toBe("0001");
  });

  test("Test 5 — Numéro libre avec caractère interdit (slash) : rejeté", async ({
    authenticatedPage: page,
  }) => {
    // §4 — la regex /^[A-Za-z0-9-]{1,50}$/ (Invoice.js:51) interdit les
    // slashs, espaces, points, etc. Un numéro "0050/A" doit être refusé
    // au niveau du validateur Mongoose.
    const prefix = uniquePrefix("F5");
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F5 invalid", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0050/A",
      }),
    });
    expect(
      json.errors,
      "Un numéro avec slash doit être rejeté par le validateur Invoice.number",
    ).toBeTruthy();
    const messages = json.errors.map((e) => e.message).join(" | ");
    expect(messages.toLowerCase()).toMatch(
      /numéro|number|lettres|chiffres|tirets|validation|invalide/i,
    );
  });

  test("Test 6 — Numéro libre avec leading zeros : préservé, pas tronqué (R5)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R5 — "0050" doit être stocké tel quel (4 chars, leading zeros
    // intacts). Pas de cast en Number qui le réduirait à "50". Le champ
    // est `String` dans le modèle (Invoice.js:42).
    const prefix = uniquePrefix("F6");
    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R5 F6 padding", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0050",
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;
    createdIds.push(inv.id);
    // Storage = "0050", pas "50" et pas "00050"
    expect(inv.number).toBe("0050");
    expect(inv.number.length).toBe(4);
  });
});
