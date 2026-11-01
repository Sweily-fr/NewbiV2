/**
 * Devis, bons de commande et de livraison : espace sans abonnement (essai
 * terminé), en lecture seule. Les lectures restent permises ; chaque
 * écriture de la fonctionnalité appelée directement par l'API est refusée
 * (« abonnement inactif ») et la base ne bouge pas.
 *
 * Organisation « Ventes Expirée » (donnees/lot-devis-bc-bl.mjs).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES_EXPIREE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { AUTOMATISATIONS_VENTES, DOCUMENTS_EXPIREE as E } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { appelApiFichier } from "../achats-banque.mjs";
import { PDF_BASE64, photo } from "./droits.mjs";

const W = id(COMPTES.ventesExpiree.organisation);
const W_ID = COMPTES.ventesExpiree.organisation._id;
const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
const LECTURE_SEULE = /SUBSCRIPTION_READ_ONLY|abonnement est inactif/;
const pdf = { cle: "file", nom: "document.pdf", type: "application/pdf", contenu: Buffer.from(PDF_BASE64, "base64").toString("latin1") };

const ECRITURES = [
  {
    nom: "Faire signer un devis",
    champ: "requestDocumentSignature",
    requete: `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success } }`,
    variables: () => ({ input: { documentType: "quote", documentId: id(E.enAttente), signers: [{ name: "Jean", surname: "Lecture", email: "lecture-seule@e2e.test" }], documentBase64: PDF_BASE64 } }),
    temoin: ["signaturerequests", { documentId: E.enAttente._id }],
  },
  {
    nom: "Créer un bon de livraison depuis un devis",
    champ: "createDeliveryNoteFromQuote",
    requete: `mutation($id: ID!, $w: ID!) { createDeliveryNoteFromQuote(quoteId: $id, workspaceId: $w) { id } }`,
    variables: () => ({ id: id(E.accepte), w: W }),
    temoin: ["deliverynotes", { workspaceId: W_ID }],
  },
  {
    nom: "Facturer un bon de livraison",
    champ: "createInvoiceFromDeliveryNote",
    requete: `mutation($id: ID!, $w: ID!) { createInvoiceFromDeliveryNote(deliveryNoteId: $id, workspaceId: $w) { id } }`,
    variables: () => ({ id: id(E.bl), w: W }),
    temoin: ["invoices", { workspaceId: W_ID }],
  },
  {
    nom: "Convertir un devis en bon de commande",
    champ: "convertQuoteToPurchaseOrder",
    requete: `mutation($id: ID!, $w: ID!) { convertQuoteToPurchaseOrder(quoteId: $id, workspaceId: $w) { id } }`,
    variables: () => ({ id: id(E.accepte), w: W }),
    temoin: ["purchaseorders", { workspaceId: W_ID }],
  },
  {
    nom: "Lancer une automatisation sur un devis",
    champ: "processAutomationDocument",
    requete: `mutation($w: ID!, $a: ID!, $d: ID!) { processAutomationDocument(workspaceId: $w, automationId: $a, documentId: $d, documentType: "quote") { success } }`,
    variables: () => ({ w: W, a: id(AUTOMATISATIONS_VENTES.expiree), d: id(E.enAttente) }),
    temoin: ["shareddocuments", { workspaceId: W_ID }],
  },
  {
    nom: "Archiver le PDF d'un devis",
    champ: "archiveQuotePdf",
    fichier: true,
    requete: `mutation($w: ID!, $id: ID!, $file: Upload!) { archiveQuotePdf(workspaceId: $w, quoteId: $id, file: $file) { id } }`,
    variables: () => ({ w: W, id: id(E.enAttente), file: null }),
    temoin: ["quotes", { _id: E.enAttente._id }],
  },
  {
    nom: "Envoyer une annexe de devis",
    champ: "uploadDocumentAnnex",
    fichier: true,
    requete: `mutation($w: ID!, $file: Upload!) { uploadDocumentAnnex(workspaceId: $w, documentType: QUOTE, file: $file) { success annex { key } } }`,
    variables: () => ({ w: W, file: null }),
    temoin: ["quotes", { workspaceId: W_ID }],
  },
];

test.describe("Devis, bons de commande et de livraison : espace sans abonnement (lecture seule)", () => {
  // Espace en lecture seule : des requêtes du tableau de bord sont refusées (402), défaut suivi à part.
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EXPIREE), erreursConsoleAutorisees: /status of 40[0-9]|\/api\/auth\/token/ });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Les lectures restent permises", async ({ page }) => {
    for (const [champ, requete, variables] of [
      ["quote", `query($w: ID!, $id: ID!) { quote(workspaceId: $w, id: $id) { id number } }`, { w: W, id: id(E.enAttente) }],
      ["quotes", `query($w: ID!) { quotes(workspaceId: $w, page: 1, limit: 10) { totalCount } }`, { w: W }],
      ["deliveryNotes", `query($w: ID!) { deliveryNotes(workspaceId: $w, page: 1, limit: 10) { totalCount } }`, { w: W }],
    ]) {
      const reponse = await appelApi(page, requete, variables, { organisation: W, delai: 20_000 });
      expect.soft(reponse.errors, `${champ} : lecture refusée`).toEqual([]);
      expect.soft(reponse.data?.[champ], `${champ} : rien renvoyé`).toBeTruthy();
    }
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé (abonnement inactif), base inchangée`, async ({ page }) => {
      const avant = await photo(op.temoin);
      const reponse = op.fichier
        ? await appelApiFichier(page, op.requete, op.variables(), pdf, { organisation: W })
        : await appelApi(page, op.requete, op.variables(), { organisation: W, delai: 20_000 });
      const valeur = reponse.data?.[op.champ];
      expect(Boolean(valeur) && valeur.success !== false, `${op.nom} : accepté sans abonnement`).toBe(false);
      expect(messages(reponse), "Le refus doit annoncer l'abonnement inactif").toMatch(LECTURE_SEULE);
      expect(await photo(op.temoin), `${op.nom} : la base a changé`).toBe(avant);
    });
  }
});
