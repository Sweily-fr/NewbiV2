/**
 * Devis, bons de commande et de livraison : rôles « Comptable » et
 * personnalisés de l'organisation « Ventes », vérifiés à l'API (le masquage
 * des boutons ne suffit pas).
 *
 *   - Comptable : lit toutes les ventes ; ne crée, ne modifie, ne fait signer
 *     ni n'archive rien ; une automatisation qu'il lance ne remplace pas le
 *     PDF en cache d'un devis ;
 *   - rôle limité à une page (bons de livraison, devis ou bons de commande en
 *     lecture) : les documents liés d'une autre page (factures, devis, prix)
 *     ne lui sont pas renvoyés ;
 *   - rôle « Saisie » (crée, sans statut ni factures) : pas de bon de
 *     livraison recopié d'une facture, pas de document créé directement
 *     accepté, livré ou importé.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  connecte,
  SESSION_TOKEN_VENTES_COMPTABLE,
  SESSION_TOKEN_VENTES_PERSO_BC,
  SESSION_TOKEN_VENTES_PERSO_BL,
  SESSION_TOKEN_VENTES_PERSO_DEVIS,
  SESSION_TOKEN_VENTES_PERSO_SAISIE,
} from "../config.mjs";
import { MEMBRES } from "../donnees/base.mjs";
import {
  AUTOMATISATIONS_VENTES,
  BC_VENTES as BC,
  BL_VENTES as BL,
  DEVIS_VENTES as D,
  FACTURE_VENTES,
  LIENS_VENTES,
} from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { appelApiFichier } from "../achats-banque.mjs";
import { article, CLIENT_API, ORG, ORG_ID, PDF_BASE64, photo, refusSansEffet } from "./droits.mjs";

const _id = (doc) => doc._id;
const devis = (doc) => ["quotes", { _id: _id(doc) }];
const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
const REFUS = /FORBIDDEN|permission|autoris/i;
const appel = (page, requete, variables) => appelApi(page, requete, variables, { organisation: ORG, delai: 20_000 });

test.describe("Devis, bons de commande et de livraison : rôle « Comptable »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_COMPTABLE) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Peut tout lire : devis, bons de commande, bons de livraison, modèles, signatures", async ({ page }) => {
    const lectures = [
      ["quote", `query($w: ID!, $id: ID!) { quote(workspaceId: $w, id: $id) { id number } }`, { w: ORG, id: id(D.enAttente) }],
      ["quotes", `query($w: ID!) { quotes(workspaceId: $w, page: 1, limit: 10) { totalCount } }`, { w: ORG }],
      ["purchaseOrder", `query($w: ID!, $id: ID!) { purchaseOrder(workspaceId: $w, id: $id) { id number } }`, { w: ORG, id: id(BC.enAttente) }],
      ["purchaseOrders", `query($w: ID!) { purchaseOrders(workspaceId: $w, page: 1, limit: 10) { totalCount } }`, { w: ORG }],
      ["deliveryNote", `query($w: ID!, $id: ID!) { deliveryNote(workspaceId: $w, id: $id) { id number } }`, { w: ORG, id: id(BL.aExpedier) }],
      ["deliveryNotes", `query($w: ID!) { deliveryNotes(workspaceId: $w, page: 1, limit: 10) { totalCount } }`, { w: ORG }],
      ["quoteTemplates", `query($w: ID) { quoteTemplates(workspaceId: $w) { id } }`, { w: ORG }],
      ["getSignatureRequests", `query($id: ID) { getSignatureRequests(documentId: $id) { id } }`, { id: id(D.cibleCachet) }],
    ];
    for (const [champ, requete, variables] of lectures) {
      const reponse = await appel(page, requete, variables);
      expect.soft(reponse.errors, `${champ} : le Comptable doit pouvoir lire`).toEqual([]);
      expect.soft(reponse.data?.[champ], `${champ} : rien renvoyé au Comptable`).toBeTruthy();
    }
  });

  const ECRITURES = [
    {
      nom: "Créer un devis",
      champ: "createQuote",
      requete: `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id } }`,
      variables: (w) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [article("Devis créé par le Comptable")], status: "DRAFT" } }),
      temoin: () => ["quotes", { workspaceId: ORG_ID, "items.description": "Devis créé par le Comptable" }],
    },
    {
      nom: "Modifier un devis",
      champ: "updateQuote",
      requete: `mutation($id: ID!, $input: UpdateQuoteInput!) { updateQuote(id: $id, input: $input) { id } }`,
      variables: () => ({ id: id(D.cibleModifier), input: { headerNotes: "Modifié par le Comptable" } }),
      temoin: () => devis(D.cibleModifier),
    },
    {
      nom: "Accepter un devis",
      champ: "changeQuoteStatus",
      requete: `mutation($id: ID!) { changeQuoteStatus(id: $id, status: COMPLETED) { id } }`,
      variables: () => ({ id: id(D.cibleStatut) }),
      temoin: () => devis(D.cibleStatut),
    },
    {
      nom: "Faire signer un devis",
      champ: "requestDocumentSignature",
      requete: `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success } }`,
      variables: () => ({
        input: { documentType: "quote", documentId: id(D.cibleSigner), signers: [{ name: "Jean", surname: "Comptable", email: "signataire-comptable@e2e.test" }], documentBase64: PDF_BASE64 },
      }),
      temoin: () => ["signaturerequests", { documentId: _id(D.cibleSigner) }],
    },
    {
      nom: "Facturer un bon de livraison",
      champ: "createInvoiceFromDeliveryNote",
      requete: `mutation($id: ID!, $w: ID!) { createInvoiceFromDeliveryNote(deliveryNoteId: $id, workspaceId: $w) { id } }`,
      variables: (w) => ({ id: id(BL.cibleFacture), w }),
      temoin: () => ["invoices", { workspaceId: ORG_ID, purchaseOrderNumber: `${BL.cibleFacture.prefix}-${BL.cibleFacture.number}` }],
    },
    {
      nom: "Enregistrer un devis comme modèle",
      champ: "saveQuoteAsTemplate",
      requete: `mutation($w: ID, $input: SaveQuoteAsTemplateInput!) { saveQuoteAsTemplate(workspaceId: $w, input: $input) { id } }`,
      variables: (w) => ({ w, input: { quoteId: id(D.cibleModele), name: "Modèle du Comptable" } }),
      temoin: () => ["quotetemplates", { name: "Modèle du Comptable" }],
    },
  ];

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé, base inchangée`, async ({ page }) => {
      await refusSansEffet(page, op, "comptable", ORG);
    });
  }

  test("Archiver le PDF d'un devis : refusé, archive inchangée", async ({ page }) => {
    const avant = await photo(devis(D.enAttente));
    const reponse = await appelApiFichier(
      page,
      `mutation($w: ID!, $id: ID!, $file: Upload!) { archiveQuotePdf(workspaceId: $w, quoteId: $id, file: $file) { id } }`,
      { w: ORG, id: id(D.enAttente), file: null },
      { cle: "file", nom: "devis.pdf", type: "application/pdf", contenu: Buffer.from(PDF_BASE64, "base64").toString("latin1") },
      { organisation: ORG },
    );
    expect(reponse.data?.archiveQuotePdf ?? null, "Archive remplacée par le Comptable").toBeNull();
    expect(messages(reponse)).toMatch(REFUS);
    expect(await photo(devis(D.enAttente))).toBe(avant);
  });

  test("Envoyer une annexe de devis : refusé", async ({ page }) => {
    const reponse = await appelApiFichier(
      page,
      `mutation($w: ID!, $file: Upload!) { uploadDocumentAnnex(workspaceId: $w, documentType: QUOTE, file: $file) { success annex { key } } }`,
      { w: ORG, file: null },
      { cle: "file", nom: "cgv.pdf", type: "application/pdf", contenu: Buffer.from(PDF_BASE64, "base64").toString("latin1") },
      { organisation: ORG },
    );
    expect(reponse.data?.uploadDocumentAnnex?.annex ?? null, "Annexe enregistrée par le Comptable").toBeNull();
    expect(messages(reponse)).toMatch(REFUS);
  });

  test("Automatisation lancée sur un devis avec un PDF fourni : le PDF en cache du devis reste celui du serveur", async ({ page }) => {
    const cible = LIENS_VENTES.devisPdfEnCache;
    const faux = Buffer.from("%PDF-1.4\n% PDF fourni par le navigateur, autre IBAN\n%%EOF").toString("base64");
    await appel(
      page,
      `mutation($w: ID!, $a: ID!, $d: ID!, $pdf: String) { processAutomationDocument(workspaceId: $w, automationId: $a, documentId: $d, documentType: "quote", pdfBase64: $pdf) { success } }`,
      { w: ORG, a: id(AUTOMATISATIONS_VENTES.ventes), d: id(cible), pdf: faux },
    );
    const apres = await (await base()).collection("quotes").findOne({ _id: cible._id });
    expect(apres.cachedPdf, "Le PDF en cache du devis a été remplacé").toEqual(cible.cachedPdf);
  });
});

test.describe("Devis, bons de commande et de livraison : rôles personnalisés, documents liés", () => {
  /** Réponse refusée, ou documents liés absents (null, liste vide). */
  function sansDocumentsLies(reponse, champ, liens, contexte) {
    const doc = reponse.data?.[champ];
    if (!doc) {
      expect(messages(reponse), `${contexte} : ni document ni refus expliqué`).toMatch(REFUS);
      return;
    }
    for (const lien of liens) {
      const valeur = doc[lien];
      const vide = valeur === null || valeur === undefined || (Array.isArray(valeur) && valeur.length === 0);
      expect.soft(vide, `${contexte} : « ${lien} » renvoyé (${JSON.stringify(valeur)?.slice(0, 160)})`).toBe(true);
    }
  }

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_PERSO_BL) });
    test("Bons de livraison en lecture seule : ni le devis, ni ses prix, ni les factures du bon", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appel(
        page,
        `query($w: ID!, $id: ID!) { deliveryNote(workspaceId: $w, id: $id) { id number sourceQuote { finalTotalTTC items { unitPrice } } sourceInvoice { finalTotalTTC } linkedInvoices { finalTotalTTC } } }`,
        { w: ORG, id: id(LIENS_VENTES.bl) },
      );
      expect(reponse.data?.deliveryNote?.number, "Le bon de livraison lui-même doit rester lisible").toBe(LIENS_VENTES.bl.number);
      sansDocumentsLies(reponse, "deliveryNote", ["sourceQuote", "sourceInvoice", "linkedInvoices"], "Bon de livraison");
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_PERSO_DEVIS) });
    test("Devis en lecture seule : ni ses factures, ni ses bons de commande et de livraison", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appel(
        page,
        `query($w: ID!, $id: ID!) { quote(workspaceId: $w, id: $id) { id number convertedToInvoice { finalTotalTTC } linkedInvoices { finalTotalTTC } linkedPurchaseOrders { finalTotalTTC } linkedDeliveryNotes { id number } } }`,
        { w: ORG, id: id(LIENS_VENTES.devis) },
      );
      expect(reponse.data?.quote?.number, "Le devis lui-même doit rester lisible").toBe(LIENS_VENTES.devis.number);
      sansDocumentsLies(reponse, "quote", ["convertedToInvoice", "linkedInvoices", "linkedPurchaseOrders", "linkedDeliveryNotes"], "Devis");
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_PERSO_BC) });
    test("Bons de commande en lecture seule : ni le devis d'origine, ni les factures", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appel(
        page,
        `query($w: ID!, $id: ID!) { purchaseOrder(workspaceId: $w, id: $id) { id number sourceQuote { finalTotalTTC } linkedInvoices { finalTotalTTC } } }`,
        { w: ORG, id: id(LIENS_VENTES.bc) },
      );
      expect(reponse.data?.purchaseOrder?.number, "Le bon de commande lui-même doit rester lisible").toBe(LIENS_VENTES.bc.number);
      sansDocumentsLies(reponse, "purchaseOrder", ["sourceQuote", "linkedInvoices"], "Bon de commande");
    });
  });
});

test.describe("Devis, bons de commande et de livraison : rôle personnalisé « Saisie » (sans statut ni factures)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_PERSO_SAISIE) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
  const saisie = MEMBRES.ventesPersoSaisie.utilisateur._id;

  test("Bon de livraison recopié d'une facture : refusé sans « Voir » sur les factures", async ({ page }) => {
    await refusSansEffet(
      page,
      {
        nom: "Bon de livraison depuis une facture",
        champ: "createDeliveryNoteFromInvoice",
        requete: `mutation($id: ID!, $w: ID!) { createDeliveryNoteFromInvoice(invoiceId: $id, workspaceId: $w) { id } }`,
        variables: (w) => ({ id: id(FACTURE_VENTES), w }),
        temoin: () => ["deliverynotes", { sourceInvoice: FACTURE_VENTES._id, createdBy: saisie }],
      },
      "saisie",
      ORG,
    );
  });

  for (const statut of ["COMPLETED", "IMPORTED"]) {
    test(`Devis créé directement au statut ${statut} : refusé sans le droit d'accepter`, async ({ page }) => {
      const nom = `Devis créé au statut ${statut}`;
      await refusSansEffet(
        page,
        {
          nom,
          champ: "createQuote",
          requete: `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id status } }`,
          variables: (w) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [article(nom)], status: statut } }),
          temoin: () => ["quotes", { workspaceId: ORG_ID, "items.description": nom }],
        },
        "saisie",
        ORG,
      );
    });
  }

  test("Bon de commande créé directement livré : refusé sans le droit de changer le statut", async ({ page }) => {
    const nom = "Bon de commande créé livré";
    await refusSansEffet(
      page,
      {
        nom,
        champ: "createPurchaseOrder",
        requete: `mutation($w: ID!, $input: CreatePurchaseOrderInput!) { createPurchaseOrder(workspaceId: $w, input: $input) { id status } }`,
        variables: (w) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [article(nom)], status: "DELIVERED" } }),
        temoin: () => ["purchaseorders", { workspaceId: ORG_ID, "items.description": nom }],
      },
      "saisie",
      ORG,
    );
  });
});
