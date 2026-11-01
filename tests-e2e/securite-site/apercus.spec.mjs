/**
 * Aperçus de documents servis par le site (/api/document-preview/<type>/<id>
 * et /api/document-annex) : chaque type est vérifié de bout en bout (proxy du
 * site puis API).
 *   - visiteur sans session : 401 ;
 *   - autre entreprise (identifiants des documents d'un autre espace) : refus,
 *     aucun octet ;
 *   - rôle personnalisé sans « Voir » du module : refus ;
 *   - propriétaire et Membre (lecture seule, « Voir » partout) : accès (le
 *     document n'a pas de fichier en test, d'où « aucun fichier », 404) ;
 *   - identifiants mal formés : 400.
 * Plus l'envoi d'un justificatif SVG déguisé en PDF, refusé par l'API.
 *
 * Les documents visés sont posés au début du fichier dans l'espace
 * « Paramètres » (identifiants 5ec5…), sans fichier : aucun autre test ne
 * les lit.
 */
import { ObjectId } from "mongodb";
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApiFichier } from "../achats-banque.mjs";
import {
  connecte,
  SESSION_TOKEN_EDITEUR_ACHATS,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_MEMBRE_PARAMETRES,
  SESSION_TOKEN_PARAMETRES,
  SESSION_TOKEN_RECRUTEUR_PARAMETRES,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";

const ORG = COMPTES.parametres.organisation._id;
const ORG_SAISIE = COMPTES.saisieAchats.organisation._id;
const ident = (n) => new ObjectId(`5ec5${String(n).padStart(20, "0")}`);
const MARQUE = "Document e2e securite apercu";

// type de l'aperçu → [collection, document posé en base]
const DOCUMENTS = {
  purchaseInvoice: ["purchaseinvoices", { _id: ident(1), workspaceId: ORG, supplierName: MARQUE, files: [], status: "TO_PAY", amountTTC: 10 }],
  importedInvoice: ["imported_invoices", { _id: ident(2), workspaceId: ORG, status: "PENDING_REVIEW", file: null, vendor: { name: MARQUE } }],
  importedQuote: ["imported_quotes", { _id: ident(3), workspaceId: ORG, status: "PENDING_REVIEW", file: null, vendor: { name: MARQUE } }],
  importedPurchaseOrder: ["imported_purchase_orders", { _id: ident(4), workspaceId: ORG, status: "PENDING_REVIEW", file: null, vendor: { name: MARQUE } }],
  transaction: ["transactions", { _id: ident(5), workspaceId: ORG.toHexString(), description: MARQUE, amount: -10, receiptFiles: [], deletedAt: null }],
  quote: ["quotes", { _id: ident(6), workspaceId: ORG, status: "PENDING", prefix: "D-", number: "E2E-SEC-1" }],
  purchaseOrder: ["purchaseorders", { _id: ident(7), workspaceId: ORG, status: "PENDING", prefix: "BC-", number: "E2E-SEC-1" }],
  deliveryNote: ["deliverynotes", { _id: ident(8), workspaceId: ORG, status: "PENDING", prefix: "BL-", number: "E2E-SEC-1" }],
};
const FACTURE_SAISIE = { _id: ident(20), workspaceId: ORG_SAISIE, supplierName: MARQUE, files: [], status: "TO_PAY", amountTTC: 10 };

test.beforeAll(async () => {
  const db = await base();
  for (const [collection, doc] of Object.values(DOCUMENTS)) {
    await db.collection(collection).updateOne({ _id: doc._id }, { $setOnInsert: { ...doc, createdAt: new Date() } }, { upsert: true });
  }
  await db.collection("purchaseinvoices").updateOne({ _id: FACTURE_SAISIE._id }, { $setOnInsert: FACTURE_SAISIE }, { upsert: true });
});

const chemin = (type) => `/api/document-preview/${type}/${DOCUMENTS[type][1]._id.toHexString()}`;
const TYPES = Object.keys(DOCUMENTS);

test.describe("Aperçus de documents : sans session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const type of [...TYPES, "emailAttachment"]) {
    test(`${type} : 401, rien du document`, async ({ request }) => {
      const id = DOCUMENTS[type]?.[1]._id.toHexString() || ident(9).toHexString();
      const reponse = await request.get(`/api/document-preview/${type}/${id}`);
      expect(reponse.status()).toBe(401);
      expect(await reponse.text()).not.toContain(MARQUE);
    });
  }
});

for (const [qui, jeton, attendu] of [
  ["Autre entreprise", SESSION_TOKEN_INTRUS, [403, 404]],
  ["Rôle personnalisé sans « Voir » du module", SESSION_TOKEN_RECRUTEUR_PARAMETRES, [403]],
]) {
  test.describe(`Aperçus de documents : ${qui}`, () => {
    test.use({ storageState: connecte(jeton) });

    for (const type of TYPES) {
      test(`${type} : refusé, aucun octet`, async ({ request }) => {
        const reponse = await request.get(chemin(type));
        const corps = await reponse.text();
        expect(attendu, `${type} : statut ${reponse.status()} (${corps.slice(0, 120)})`).toContain(reponse.status());
        expect(reponse.headers()["content-type"] || "").toMatch(/json/);
        expect(corps).not.toContain(MARQUE);
        expect(corps).not.toContain("%PDF");
      });
    }

  });
}

for (const [qui, jeton] of [
  ["Propriétaire", SESSION_TOKEN_PARAMETRES],
  ["Membre (lecture seule)", SESSION_TOKEN_MEMBRE_PARAMETRES],
]) {
  test.describe(`Aperçus de documents : ${qui} de l'espace`, () => {
    test.use({ storageState: connecte(jeton) });

    for (const type of TYPES) {
      test(`${type} : accès accordé (aucun fichier en test, 404)`, async ({ request }) => {
        const reponse = await request.get(chemin(type));
        expect(reponse.status(), `${type} : ${(await reponse.text()).slice(0, 120)}`).toBe(404);
      });
    }
  });
}

test.describe("Annexes des documents : autre entreprise", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  test("Annexe de l'espace des autres : 403, aucun octet", async ({ request }) => {
    const reponse = await request.get(`/api/document-annex/${ORG.toHexString()}/3f2b8a40-1c2d-4e5f-8a9b-0c1d2e3f4a5b.pdf`);
    expect(reponse.status()).toBe(403);
    expect(await reponse.text()).not.toContain("%PDF");
  });
});

test.describe("Annexes des documents : sans session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Annexe : 401", async ({ request }) => {
    const reponse = await request.get(`/api/document-annex/${ORG.toHexString()}/3f2b8a40-1c2d-4e5f-8a9b-0c1d2e3f4a5b.pdf`);
    expect(reponse.status()).toBe(401);
  });
});

test.describe("Aperçus de documents : paramètres mal formés", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });

  const ID = DOCUMENTS.purchaseInvoice[1]._id.toHexString();
  const TX = DOCUMENTS.transaction[1]._id.toHexString();
  for (const [cas, url] of [
    ["type inconnu", `/api/document-preview/user/${ID}`],
    ["identifiant qui n'en est pas un", "/api/document-preview/purchaseInvoice/pas-un-identifiant"],
    ["identifiant avec opérateur", `/api/document-preview/purchaseInvoice/${encodeURIComponent('{"$ne":null}')}`],
    ["fileId invalide", `/api/document-preview/purchaseInvoice/${ID}?fileId=abc`],
    ["fileId avec chemin", `/api/document-preview/purchaseInvoice/${ID}?fileId=..%2F..%2Fx`],
    ["index négatif", `/api/document-preview/transaction/${TX}?index=-1`],
    ["index trop grand", `/api/document-preview/transaction/${TX}?index=99999`],
    ["index non numérique", `/api/document-preview/emailAttachment/${ID}?index=a`],
  ]) {
    test(`${cas} : 400`, async ({ request }) => {
      const reponse = await request.get(url);
      expect(reponse.status()).toBe(400);
    });
  }

  for (const [cas, fichier] of [
    ["nom qui n'est pas un identifiant", "x.pdf"],
    ["autre format", "3f2b8a40-1c2d-4e5f-8a9b-0c1d2e3f4a5b.svg"],
  ]) {
    test(`Annexe, ${cas} : 400`, async ({ request }) => {
      const reponse = await request.get(`/api/document-annex/${ORG.toHexString()}/${fichier}`);
      expect(reponse.status()).toBe(400);
    });
  }
});

test.describe("Justificatif déguisé : SVG annoncé comme PDF", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });

  const MUTATION = `mutation($id: ID!, $input: PurchaseInvoiceFileInput!) {
    addPurchaseInvoiceFile(purchaseInvoiceId: $id, input: $input) { id files { id mimetype } }
  }`;

  for (const [cas, nom, contenu] of [
    ["SVG nommé .pdf", "facture.pdf", '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__piege=1</script></svg>'],
    ["SVG nommé .svg", "facture.svg", '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__piege=1</script></svg>'],
    ["HTML nommé .pdf", "facture.pdf", "<html><body><script>window.__piege=1</script></body></html>"],
  ]) {
    test(`Éditeur, ${cas} : refusé, aucun justificatif ajouté`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelApiFichier(
        page,
        MUTATION,
        { id: FACTURE_SAISIE._id.toHexString(), input: { processOCR: false } },
        { cle: "input.file", nom, type: "application/pdf", contenu },
        { organisation: ORG_SAISIE.toHexString() },
      );
      expect(reponse.data?.addPurchaseInvoiceFile ?? null, "justificatif accepté").toBeNull();
      expect(reponse.errors.map((e) => e.message).join(" ")).toMatch(/Type de fichier non supporté/);
      const facture = await (await base()).collection("purchaseinvoices").findOne({ _id: FACTURE_SAISIE._id });
      expect(facture.files).toEqual([]);
    });
  }
});
