/**
 * Devis : droits vérifiés à l'API, pas seulement à l'écran (voir droits.mjs).
 * Toutes les opérations du schéma des devis (quote.graphql), des modèles de
 * devis, des devis importés et de la signature électronique, appelées par le
 * Membre, l'Éditeur, l'intrus et un visiteur sans session. Plus un texte
 * piégé écrit par l'Éditeur et ouvert par le propriétaire.
 */
import { test, expect } from "../outils.mjs";
import { BASE_URL, connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR } from "../config.mjs";
import { CLIENTS_VENTES, DEVIS_IMPORTES as I, DEVIS_VENTES as D, FACTURE_VENTES, MODELE_DEVIS_A_SUPPRIMER, SIGNATURES_CIBLES as S } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { ouvrir } from "../navigation.mjs";
import { article, CLIENT_API, ORG, ORG_ID, PDF_BASE64, PIEGE, verifierDroits } from "./droits.mjs";
import { epingler, ouvrirPanneau } from "./ventes.mjs";

const _id = (doc) => doc._id;
const devis = (doc) => ["quotes", { _id: _id(doc) }];
const signatures = (doc) => ["signaturerequests", { documentId: _id(doc) }];
const importe = (doc) => ["imported_quotes", { _id: _id(doc) }];
const signataire = { name: "Jean", surname: "Contrôle", email: "signataire-controle@e2e.test" };

const ECRITURES = [
  {
    nom: "Créer un devis",
    droit: "create",
    champ: "createQuote",
    requete: `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [article(`Devis créé par ${qui}`)], status: "DRAFT" } }),
    temoin: (qui) => ["quotes", { workspaceId: ORG_ID, "items.description": `Devis créé par ${qui}` }],
  },
  {
    nom: "Modifier un devis",
    droit: "edit",
    champ: "updateQuote",
    cible: true,
    requete: `mutation($id: ID!, $input: UpdateQuoteInput!) { updateQuote(id: $id, input: $input) { id } }`,
    variables: (_w, qui) => ({ id: id(D.cibleModifier), input: { headerNotes: `Modifié par ${qui}` } }),
    temoin: () => devis(D.cibleModifier),
  },
  {
    nom: "Supprimer un devis",
    droit: "delete",
    champ: "deleteQuote",
    cible: true,
    requete: `mutation($id: ID!) { deleteQuote(id: $id) }`,
    variables: () => ({ id: id(D.cibleSupprimer) }),
    temoin: () => devis(D.cibleSupprimer),
  },
  {
    nom: "Accepter un devis (changer son statut)",
    droit: "status",
    champ: "changeQuoteStatus",
    cible: true,
    requete: `mutation($id: ID!) { changeQuoteStatus(id: $id, status: COMPLETED) { id status } }`,
    variables: () => ({ id: id(D.cibleStatut) }),
    temoin: () => devis(D.cibleStatut),
  },
  {
    nom: "Valider un brouillon de devis",
    droit: "create",
    champ: "changeQuoteStatus",
    cible: true,
    requete: `mutation($id: ID!) { changeQuoteStatus(id: $id, status: PENDING) { id status } }`,
    variables: () => ({ id: id(D.cibleBrouillonValider) }),
    temoin: () => devis(D.cibleBrouillonValider),
  },
  {
    nom: "Convertir un devis en facture",
    droit: "convert",
    champ: "convertQuoteToInvoice",
    cible: true,
    requete: `mutation($id: ID!) { convertQuoteToInvoice(id: $id) { id } }`,
    variables: () => ({ id: id(D.cibleFacture) }),
    temoin: () => ["invoices", { "items.description": "Cible conversion en facture" }],
  },
  {
    nom: "Convertir un devis en bon de commande",
    droit: "convert",
    champ: "convertQuoteToPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { convertQuoteToPurchaseOrder(quoteId: $id, workspaceId: $w) { id } }`,
    variables: (w) => ({ id: id(D.cibleBc), w }),
    temoin: () => ["purchaseorders", { "items.description": "Cible conversion en bon de commande" }],
  },
  {
    nom: "Créer un bon de livraison depuis un devis",
    droit: "convert",
    champ: "createDeliveryNoteFromQuote",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { createDeliveryNoteFromQuote(quoteId: $id, workspaceId: $w) { id } }`,
    variables: (w) => ({ id: id(D.cibleBl), w }),
    temoin: () => ["deliverynotes", { "items.description": "Cible bon de livraison" }],
  },
  {
    nom: "Envoyer un devis par e-mail",
    droit: "send",
    externe: true,
    champ: "sendQuote",
    cible: true,
    requete: `mutation($id: ID!) { sendQuote(id: $id, email: "destinataire-controle@e2e.test") }`,
    variables: () => ({ id: id(D.cibleEnvoyer) }),
    temoin: () => devis(D.cibleEnvoyer),
  },
  {
    nom: "Envoyer un devis par e-mail (envoi réel, avec le PDF)",
    droit: "send",
    externe: true,
    champ: "sendQuoteEmail",
    cible: true,
    requete: `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendQuoteEmail(workspaceId: $w, input: $input) { success } }`,
    variables: (w, qui) => ({ w, input: { documentId: id(D.cibleEnvoyer), emailSubject: `Devis envoyé par ${qui}`, emailBody: "Bonjour", recipientEmail: "destinataire-controle@e2e.test" } }),
    temoin: () => devis(D.cibleEnvoyer),
  },
  {
    nom: "Enregistrer un devis comme modèle",
    droit: "create",
    champ: "saveQuoteAsTemplate",
    cible: true,
    requete: `mutation($w: ID, $input: SaveQuoteAsTemplateInput!) { saveQuoteAsTemplate(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { quoteId: id(D.cibleModele), name: `Modèle de ${qui}` } }),
    temoin: (qui) => ["quotetemplates", { name: `Modèle de ${qui}` }],
  },
  {
    nom: "Supprimer un modèle de devis",
    droit: "delete",
    champ: "deleteQuoteTemplate",
    cible: true,
    requete: `mutation($w: ID, $id: ID!) { deleteQuoteTemplate(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(MODELE_DEVIS_A_SUPPRIMER) }),
    temoin: () => ["quotetemplates", { _id: _id(MODELE_DEVIS_A_SUPPRIMER) }],
  },
  {
    nom: "Faire signer un devis",
    droit: "sign",
    externe: true,
    champ: "requestDocumentSignature",
    cible: true,
    requete: `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success message } }`,
    variables: () => ({ input: { documentType: "quote", documentId: id(D.cibleSigner), signers: [signataire], documentBase64: PDF_BASE64 } }),
    temoin: () => signatures(D.cibleSigner),
  },
  {
    nom: "Apposer le cachet de l'entreprise",
    droit: "sign",
    externe: true,
    champ: "sealQuoteDocument",
    cible: true,
    requete: `mutation($id: ID!) { sealQuoteDocument(quoteId: $id) { success message } }`,
    variables: () => ({ id: id(D.cibleCachet) }),
    temoin: () => signatures(D.cibleCachet),
  },
  {
    nom: "Annuler une demande de signature",
    droit: "sign",
    champ: "cancelSignature",
    cible: true,
    requete: `mutation($id: ID!) { cancelSignature(signatureId: $id) { success } }`,
    variables: () => ({ id: id(S.aAnnuler) }),
    temoin: () => ["signaturerequests", { _id: _id(S.aAnnuler) }],
  },
  {
    nom: "Relancer une signature en erreur",
    droit: "sign",
    champ: "retrySignature",
    cible: true,
    requete: `mutation($id: ID!) { retrySignature(signatureId: $id) { success } }`,
    variables: () => ({ id: id(S.aRelancer) }),
    temoin: () => ["signaturerequests", { _id: _id(S.aRelancer) }],
  },
  {
    nom: "Modifier un devis importé",
    droit: "edit",
    champ: "updateImportedQuote",
    cible: true,
    requete: `mutation($id: ID!, $input: UpdateImportedQuoteInput!) { updateImportedQuote(id: $id, input: $input) { id } }`,
    variables: (_w, qui) => ({ id: id(I.cibleModifier), input: { notes: `Modifié par ${qui}` } }),
    temoin: () => importe(I.cibleModifier),
  },
  {
    nom: "Valider un devis importé",
    droit: "edit",
    champ: "validateImportedQuote",
    cible: true,
    requete: `mutation($id: ID!) { validateImportedQuote(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleValider) }),
    temoin: () => importe(I.cibleValider),
  },
  {
    nom: "Convertir un devis importé en devis",
    droit: "edit",
    champ: "convertImportedQuoteToQuote",
    cible: true,
    requete: `mutation($id: ID!) { convertImportedQuoteToQuote(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleConvertir) }),
    temoin: () => importe(I.cibleConvertir),
  },
  {
    nom: "Rejeter un devis importé",
    droit: "edit",
    champ: "rejectImportedQuote",
    cible: true,
    requete: `mutation($id: ID!) { rejectImportedQuote(id: $id, reason: "contrôle") { id } }`,
    variables: () => ({ id: id(I.cibleRejeter) }),
    temoin: () => importe(I.cibleRejeter),
  },
  {
    nom: "Archiver un devis importé",
    droit: "edit",
    champ: "archiveImportedQuote",
    cible: true,
    requete: `mutation($id: ID!) { archiveImportedQuote(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleArchiver) }),
    temoin: () => importe(I.cibleArchiver),
  },
  {
    nom: "Supprimer un devis importé",
    droit: "delete",
    champ: "deleteImportedQuote",
    cible: true,
    requete: `mutation($id: ID!) { deleteImportedQuote(id: $id) }`,
    variables: () => ({ id: id(I.cibleSupprimer) }),
    temoin: () => importe(I.cibleSupprimer),
  },
  {
    nom: "Supprimer plusieurs devis importés",
    droit: "delete",
    champ: "deleteImportedQuotes",
    cible: true,
    nombre: true,
    requete: `mutation($ids: [ID!]!) { deleteImportedQuotes(ids: $ids) }`,
    variables: () => ({ ids: [id(I.cibleSupprimerPlusieurs)] }),
    temoin: () => importe(I.cibleSupprimerPlusieurs),
  },
];

const LECTURES = [
  ["Un devis", "quote", `query($w: ID!, $id: ID!) { quote(workspaceId: $w, id: $id) { id number client { name } } }`, (w) => ({ w, id: id(D.enAttente) })],
  ["La liste des devis", "quotes", `query($w: ID!) { quotes(workspaceId: $w, page: 1, limit: 100) { quotes { id number client { name } } totalCount } }`, (w) => ({ w })],
  ["Les statistiques des devis", "quoteStats", `query($w: ID!) { quoteStats(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Les soldes des devis", "quoteBalances", `query($w: ID!) { quoteBalances(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Le prochain numéro de devis", "nextQuoteNumber", `query($w: ID!) { nextQuoteNumber(workspaceId: $w, prefix: "D-CTRL") }`, (w) => ({ w })],
  ["Un devis par son numéro", "quoteByNumber", `query($w: ID!) { quoteByNumber(workspaceId: $w, number: "0001") { id number client { name } } }`, (w) => ({ w })],
  ["L'existence d'un numéro", "checkQuoteNumberExists", `query($w: ID!, $p: String!) { checkQuoteNumberExists(workspaceId: $w, number: "0001", prefix: $p) }`, (w) => ({ w, p: D.enAttente.prefix })],
  ["Le PDF archivé d'un devis", "quoteDocumentUrl", `query($w: ID!, $id: ID!) { quoteDocumentUrl(workspaceId: $w, quoteId: $id) }`, (w) => ({ w, id: id(D.enAttente) })],
  ["Les modèles de devis", "quoteTemplates", `query($w: ID) { quoteTemplates(workspaceId: $w) { id name } }`, (w) => ({ w })],
  ["Un devis importé", "importedQuote", `query($id: ID!) { importedQuote(id: $id) { id originalQuoteNumber } }`, () => ({ id: id(I.stable) })],
  ["Les devis importés", "importedQuotes", `query($w: ID!) { importedQuotes(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Les statistiques des devis importés", "importedQuoteStats", `query($w: ID!) { importedQuoteStats(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Le quota de signatures", "esignatureQuota", `query { esignatureQuota { plan used } }`, () => ({})],
  ["Une demande de signature", "getSignatureRequest", `query($id: ID!) { getSignatureRequest(id: $id) { id status } }`, () => ({ id: id(S.signee) })],
  ["Les demandes de signature d'un devis", "getSignatureRequests", `query($id: ID) { getSignatureRequests(documentId: $id) { id status } }`, () => ({ id: id(D.cibleCachet) })],
  ["Le statut de signature d'un devis", "getDocumentSignatureStatus", `query($id: ID!) { getDocumentSignatureStatus(documentType: "quote", documentId: $id) { id status } }`, () => ({ id: id(D.cibleCachet) })],
];

verifierDroits({
  titre: "Devis",
  lectures: LECTURES,
  ecritures: ECRITURES,
  temoinsFuite: [id(D.enAttente), id(D.cibleCachet), id(I.stable), id(S.signee), CLIENTS_VENTES.lumiere.name, "PROJ-VENTES-01", "DEV-IMP-001"],
});

/**
 * Texte piégé (XSS stockée) : l'Éditeur enregistre, par l'API, un devis dont
 * les notes, les conditions générales, la référence et les articles
 * contiennent du HTML qui exécute du code. Quand le propriétaire ouvre la
 * liste, le panneau du devis ou son éditeur, rien ne doit s'exécuter : la
 * surveillance échoue sur toute boîte de dialogue, et la page ne doit pas
 * porter la marque posée par le code.
 */

test.describe("Devis : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test.beforeAll(async ({ browser }) => {
    const contexte = await browser.newContext({ baseURL: BASE_URL, storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($id: ID!, $input: UpdateQuoteInput!) { updateQuote(id: $id, input: $input) { id } }`,
      {
        id: id(D.cibleXss),
        input: {
          headerNotes: `Notes ${PIEGE}`,
          footerNotes: `Bas de page ${PIEGE}`,
          termsAndConditions: `Conditions ${PIEGE}`,
          projectReference: "REF<b>piege</b>",
          items: [{ ...article(`Article ${PIEGE}`), details: `Détails ${PIEGE}` }],
        },
      },
      { organisation: ORG },
    );
    await contexte.close();
    expect(reponse.errors, "L'Éditeur doit pouvoir enregistrer le devis").toEqual([]);
  });

  const piegeExecute = (page) => page.evaluate(() => window.__piege ?? null);

  test("Liste des devis : le devis s'affiche, rien ne s'exécute", async ({ page }) => {
    await epingler(page, "devis", D.cibleXss);
    await page.waitForTimeout(1_000);
    expect(await piegeExecute(page), "Le code du devis s'est exécuté").toBeNull();
  });

  test("Panneau et aperçu du devis : le texte s'affiche comme du texte", async ({ page }) => {
    await ouvrirPanneau(page, "devis", D.cibleXss);
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du devis s'est exécuté").toBeNull();
    await expect(page.getByText("Conditions <img", { exact: false }).first(), "Les conditions s'affichent telles quelles").toBeVisible();
  });

  test("Éditeur du devis : le texte reste du texte", async ({ page }) => {
    await ouvrir(page, `/dashboard/outils/devis/${id(D.cibleXss)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
    await page.getByRole("button", { name: /Continuer/ }).click();
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du devis s'est exécuté").toBeNull();
  });
});

test.describe("Devis : une facture n'est pas un devis", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });

  test("Signature électronique d'une facture : refusée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success } }`,
      { input: { documentType: "invoice", documentId: id(FACTURE_VENTES), signers: [signataire], documentBase64: PDF_BASE64 } },
      { organisation: ORG, delai: 20_000 },
    );
    expect(reponse.data?.requestDocumentSignature?.success ?? null, "Une facture a été envoyée en signature").toBeNull();
    expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(/Seuls les devis/);
  });
});
