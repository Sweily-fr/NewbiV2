/**
 * Numérotation séquentielle — invariants R2 / R3 / §4 / §44.
 *
 * Backend (cf newbi-api/src/models/DocumentCounter.js + utils/documentNumbers.js) :
 *   - DocumentCounter persiste un `lastNumber` par (type, prefix, workspaceId).
 *   - À chaque getNextNumber : resync sur max(existing) puis $inc atomique.
 *   - getExistingMaxNumber filtre status ∈ {PENDING, COMPLETED, CANCELED}
 *     → les DRAFT NE comptent PAS dans le max.
 *   - Index unique (prefix, number, workspaceId, issueYear) → R2 + R3.
 *
 * Stratégie : préfixes uniques par run (suffixe Date.now() tronqué) pour
 * isoler chaque test du DocumentCounter persistant entre runs. afterAll
 * supprime les factures créées (mais pas le DocumentCounter — il reste,
 * inerte, jusqu'à ce qu'une nouvelle facture ressuscite le préfixe).
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
  // Limite Mongoose: prefix ≤ 10 chars (Invoice.js:35-37). On combine label
  // 3-4 chars + 4 derniers digits du timestamp + tiret final.
  const stamp = String(Date.now()).slice(-4);
  return `${label}${stamp}-`;
}

test.describe("[Factures] Numérotation séquentielle (§4 R2/R3, §44)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(90000);

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

  test("Test 1 — Préfixe neuf, aucune facture : nextInvoiceNumber = '0001' (§4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 — pour un préfixe jamais utilisé, le prochain numéro = 0001.
    // On utilise un préfixe unique par run pour ne pas hériter d'un
    // DocumentCounter résiduel.
    const prefix = uniquePrefix("S1");
    const { json } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    expect(json.data.nextInvoiceNumber).toBe("0001");
  });

  test("Test 2 — Après PENDING #0001, prochain numéro = '0002' (§4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 — séquentialité stricte : count up by 1.
    const prefix = uniquePrefix("S2");
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S2 #1", unitPrice: 100 })],
        status: "PENDING",
        prefix,
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdIds.push(r1.data.createInvoice.id);
    expect(r1.data.createInvoice.number).toBe("0001");

    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(q.data.nextInvoiceNumber).toBe("0002");
  });

  test("Test 3 — 5 PENDING successives : numéros 0001..0005, next = '0006' (§4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 — invariant cumulatif. Pas de saut.
    const prefix = uniquePrefix("S3");
    for (let i = 1; i <= 5; i++) {
      const { json } = await createInvoiceMutation(page.request, {
        ...buildInvoiceInput({
          items: [buildItem({ description: `S3 #${i}`, unitPrice: 100 })],
          status: "PENDING",
          prefix,
        }),
      });
      expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
      createdIds.push(json.data.createInvoice.id);
      expect(json.data.createInvoice.number).toBe(String(i).padStart(4, "0"));
    }

    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(q.data.nextInvoiceNumber).toBe("0006");
  });

  test("Test 4 — Gap volontaire : seulement #0010 existe → next = '0011' (§44 auto-réparation)", async ({
    authenticatedPage: page,
  }) => {
    // §44 — auto-réparation du compteur : si seul 0010 existe (pas de
    // 0001-0009), getExistingMaxNumber renvoie 10, le DocumentCounter se
    // resync à 10, le prochain $inc renvoie 0011 (pas 0001).
    const prefix = uniquePrefix("S4");
    const { json: r10 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S4 #10 manuel", unitPrice: 100 })],
        status: "PENDING",
        prefix,
        number: "0010",
      }),
    });
    expect(r10.errors, JSON.stringify(r10.errors)).toBeFalsy();
    createdIds.push(r10.data.createInvoice.id);
    expect(r10.data.createInvoice.number).toBe("0010");

    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(
      q.data.nextInvoiceNumber,
      "Auto-réparation §44 : compteur resync sur max(existing)=10, next=0011",
    ).toBe("0011");
  });

  test("Test 5 — Préfixes parallèles : compteurs indépendants (R2)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R2 — chaque préfixe a son propre compteur. Créer 3 factures sous
    // F-A et 1 sous F-B doit donner next(F-A)='0004' et next(F-B)='0002'.
    const prefixA = uniquePrefix("S5A");
    const prefixB = uniquePrefix("S5B");
    expect(prefixA).not.toBe(prefixB);

    for (let i = 0; i < 3; i++) {
      const { json } = await createInvoiceMutation(page.request, {
        ...buildInvoiceInput({
          items: [buildItem({ description: `S5A #${i + 1}`, unitPrice: 100 })],
          status: "PENDING",
          prefix: prefixA,
        }),
      });
      expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
      createdIds.push(json.data.createInvoice.id);
    }
    const { json: rB } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S5B #1", unitPrice: 100 })],
        status: "PENDING",
        prefix: prefixB,
      }),
    });
    expect(rB.errors, JSON.stringify(rB.errors)).toBeFalsy();
    createdIds.push(rB.data.createInvoice.id);

    const { json: qA } = await nextInvoiceNumber(page.request, {
      prefix: prefixA,
      autoNumbering: false,
    });
    expect(qA.data.nextInvoiceNumber).toBe("0004");

    const { json: qB } = await nextInvoiceNumber(page.request, {
      prefix: prefixB,
      autoNumbering: false,
    });
    expect(qB.data.nextInvoiceNumber).toBe("0002");
  });

  test("Test 6 — Reset par année (§4 R3) : préfixes annuels distincts → compteurs indépendants", async ({
    authenticatedPage: page,
  }) => {
    // §4 R3 — au changement d'année, l'utilisateur change le prefix
    // (F-2026- → F-2027-). Le DocumentCounter étant scoped par
    // (type, prefix, workspaceId), le compteur du nouveau prefix repart
    // à 0001 indépendamment de la séquence de l'année précédente.
    //
    // ⚠️ ÉCART INDEX vs RESOLVER (R14) : l'index Mongoose unique inclut
    // `issueYear`, ce qui autoriserait techniquement deux factures avec
    // même (prefix, number) sur années différentes. Mais le resolver
    // createInvoice (invoice.js:1131-1142) pré-vérifie via une query
    // qui IGNORE issueYear — il rejette dès que (prefix, number) existe,
    // peu importe l'année. Donc R3 ne marche en pratique que via prefixes
    // distincts (convention F-YYYY-).
    //
    // Ce test fixe la convention pratique : 2 prefixes annuels, 2
    // compteurs indépendants.
    const prefixYear1 = uniquePrefix("Y1");
    const prefixYear2 = uniquePrefix("Y2");
    expect(prefixYear1).not.toBe(prefixYear2);

    // Créer 99 factures sous Y1- est trop coûteux. On force juste une
    // facture avec number='0099' pour simuler une fin d'année.
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S6 fin année", unitPrice: 100 })],
        status: "PENDING",
        prefix: prefixYear1,
        number: "0099",
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdIds.push(r1.data.createInvoice.id);
    expect(r1.data.createInvoice.number).toBe("0099");

    // Au changement d'année : nouveau prefix → counter neuf
    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "S6 début nouvelle année", unitPrice: 100 }),
        ],
        status: "PENDING",
        prefix: prefixYear2,
        // pas de number → backend génère depuis le compteur
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    createdIds.push(r2.data.createInvoice.id);
    expect(
      r2.data.createInvoice.number,
      "Nouveau prefix annuel = compteur repart à 0001 (R3)",
    ).toBe("0001");
  });

  test("Test 7 — Suppression d'une PENDING au milieu : pas de réutilisation du numéro (§4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 séquentialité : créer 0001 0002 0003, supprimer 0002, créer
    // une nouvelle PENDING → numéro = 0004 (PAS 0002 réutilisé). Garantit
    // l'audit trail comptable (pas de réécriture).
    const prefix = uniquePrefix("S7");
    const ids = [];
    for (let i = 1; i <= 3; i++) {
      const { json } = await createInvoiceMutation(page.request, {
        ...buildInvoiceInput({
          items: [buildItem({ description: `S7 #${i}`, unitPrice: 100 })],
          status: "PENDING",
          prefix,
        }),
      });
      expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
      ids.push(json.data.createInvoice.id);
      createdIds.push(json.data.createInvoice.id);
    }

    // Supprimer la #2 (au milieu). PENDING peut être supprimée
    // (resolver invoice.js:2127 ne bloque que COMPLETED).
    const { json: del } = await deleteInvoiceMutation(page.request, ids[1]);
    expect(del.errors, JSON.stringify(del.errors)).toBeFalsy();

    // Créer une nouvelle → doit recevoir 0004, pas 0002
    const { json: r4 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "S7 next-after-delete", unitPrice: 100 }),
        ],
        status: "PENDING",
        prefix,
      }),
    });
    expect(r4.errors, JSON.stringify(r4.errors)).toBeFalsy();
    createdIds.push(r4.data.createInvoice.id);
    expect(
      r4.data.createInvoice.number,
      "Pas de réutilisation : suppression du milieu ne libère pas le numéro",
    ).toBe("0004");
  });

  test("Test 8 — DRAFT n'incrémente PAS le compteur séquentiel des PENDING (§44)", async ({
    authenticatedPage: page,
  }) => {
    // §44 — getExistingMaxNumber filtre status ∈ {PENDING, COMPLETED,
    // CANCELED}. Donc un DRAFT (numéro temporaire DRAFT-NNNN) n'avance pas
    // le compteur séquentiel. Créer un DRAFT puis demander next →
    // toujours '0001'.
    const prefix = uniquePrefix("S8");

    const { json: rDraft } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S8 DRAFT", unitPrice: 100 })],
        status: "DRAFT",
        prefix,
      }),
    });
    expect(rDraft.errors, JSON.stringify(rDraft.errors)).toBeFalsy();
    createdIds.push(rDraft.data.createInvoice.id);
    // DRAFT a un numéro DRAFT-XXXX (jamais purement numérique)
    expect(rDraft.data.createInvoice.number).toMatch(/^DRAFT-/);

    const { json: q } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    expect(
      q.data.nextInvoiceNumber,
      "DRAFT ne doit pas avancer le compteur PENDING (cf §44 / getExistingMaxNumber filtre status)",
    ).toBe("0001");
  });

  test("Test 9 — autoNumbering=true : compteur global ignore le préfixe (§4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 — quand autoNumbering=true, nextInvoiceNumber scanne toutes les
    // factures du workspace, ignore le filtre prefix. Le résultat
    // dépend du max global du workspace ; on le teste contre un préfixe
    // fraîchement utilisé pour éviter de buter sur un état inconnu.
    const prefix = uniquePrefix("S9");
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "S9 #1", unitPrice: 100 })],
        status: "PENDING",
        prefix,
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    createdIds.push(r1.data.createInvoice.id);

    const { json: qPerPrefix } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: false,
    });
    const { json: qGlobal } = await nextInvoiceNumber(page.request, {
      prefix,
      autoNumbering: true,
    });

    // Per-prefix counter : '0002' (1 facture sous ce préfixe + 1).
    expect(qPerPrefix.data.nextInvoiceNumber).toBe("0002");

    // Global counter : ≥ '0002'. Avec d'autres factures préexistantes au
    // workspace, il est probablement bien plus élevé. On asserte juste
    // qu'il est ≥ per-prefix (mode global ne descend pas en-dessous).
    expect(Number(qGlobal.data.nextInvoiceNumber)).toBeGreaterThanOrEqual(
      Number(qPerPrefix.data.nextInvoiceNumber),
    );
  });
});
