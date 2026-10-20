/**
 * Bons de commande : droits vérifiés à l'API (voir ../devis/droits.mjs).
 * Toutes les opérations du schéma des bons de commande
 * (purchaseOrder.graphql), de leurs modèles et des bons importés, par le
 * Membre, l'Éditeur, l'intrus et un visiteur sans session. Plus un texte
 * piégé écrit par l'Éditeur et ouvert par le propriétaire.
 */
import { test, expect } from "../outils.mjs";
import { BASE_URL, connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR } from "../config.mjs";
import { BC_IMPORTES as I, BC_VENTES as B, CLIENTS_VENTES, MODELE_BC_VENTES } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { ouvrir } from "../navigation.mjs";
import { article, CLIENT_API, ORG, ORG_ID, PIEGE, verifierDroits } from "../devis/droits.mjs";
import { epingler, ouvrirPanneau } from "../devis/ventes.mjs";

const _id = (doc) => doc._id;
const bc = (doc) => ["purchaseorders", { _id: _id(doc) }];
const importe = (doc) => ["imported_purchase_orders", { _id: _id(doc) }];

const ECRITURES = [
  {
    nom: "Créer un bon de commande",
    droit: "create",
    champ: "createPurchaseOrder",
    requete: `mutation($w: ID!, $input: CreatePurchaseOrderInput!) { createPurchaseOrder(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [article(`Bon créé par ${qui}`)], status: "DRAFT" } }),
    temoin: (qui) => ["purchaseorders", { workspaceId: ORG_ID, "items.description": `Bon créé par ${qui}` }],
  },
  {
    nom: "Modifier un bon de commande",
    droit: "edit",
    champ: "updatePurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!, $input: UpdatePurchaseOrderInput!) { updatePurchaseOrder(id: $id, workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(B.cibleModifier), w, input: { headerNotes: `Modifié par ${qui}` } }),
    temoin: () => bc(B.cibleModifier),
  },
  {
    nom: "Supprimer un bon de commande",
    droit: "delete",
    champ: "deletePurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { deletePurchaseOrder(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ id: id(B.cibleSupprimer), w }),
    temoin: () => bc(B.cibleSupprimer),
  },
  {
    nom: "Valider un bon de commande (changer son statut)",
    droit: "status",
    champ: "changePurchaseOrderStatus",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { changePurchaseOrderStatus(id: $id, workspaceId: $w, status: VALIDATED) { id status } }`,
    variables: (w) => ({ id: id(B.cibleStatut), w }),
    temoin: () => bc(B.cibleStatut),
  },
  {
    nom: "Convertir un bon de commande en facture",
    droit: "convert",
    champ: "convertPurchaseOrderToInvoice",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { convertPurchaseOrderToInvoice(id: $id, workspaceId: $w) { id } }`,
    variables: (w) => ({ id: id(B.cibleFacture), w }),
    temoin: () => ["invoices", { "items.description": "Cible BC facture" }],
  },
  {
    nom: "Envoyer un bon de commande par e-mail",
    droit: "send",
    externe: true,
    champ: "sendPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { sendPurchaseOrder(id: $id, workspaceId: $w, email: "destinataire-controle@e2e.test") }`,
    variables: (w) => ({ id: id(B.cibleEnvoyer), w }),
    temoin: () => bc(B.cibleEnvoyer),
  },
  {
    nom: "Envoyer un bon de commande par e-mail (envoi réel, avec le PDF)",
    droit: "send",
    externe: true,
    champ: "sendPurchaseOrderEmail",
    cible: true,
    requete: `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendPurchaseOrderEmail(workspaceId: $w, input: $input) { success } }`,
    variables: (w, qui) => ({ w, input: { documentId: id(B.cibleEnvoyer), emailSubject: `Bon envoyé par ${qui}`, emailBody: "Bonjour", recipientEmail: "destinataire-controle@e2e.test" } }),
    temoin: () => bc(B.cibleEnvoyer),
  },
  {
    nom: "Enregistrer un bon de commande comme modèle",
    droit: "create",
    champ: "savePurchaseOrderAsTemplate",
    cible: true,
    requete: `mutation($w: ID, $input: SavePurchaseOrderAsTemplateInput!) { savePurchaseOrderAsTemplate(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { purchaseOrderId: id(B.cibleModele), name: `Modèle de commande de ${qui}` } }),
    temoin: (qui) => ["purchaseordertemplates", { name: `Modèle de commande de ${qui}` }],
  },
  {
    nom: "Supprimer un modèle de bon de commande",
    droit: "delete",
    champ: "deletePurchaseOrderTemplate",
    cible: true,
    requete: `mutation($w: ID, $id: ID!) { deletePurchaseOrderTemplate(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(MODELE_BC_VENTES) }),
    temoin: () => ["purchaseordertemplates", { _id: _id(MODELE_BC_VENTES) }],
  },
  {
    nom: "Modifier un bon de commande importé",
    droit: "edit",
    champ: "updateImportedPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!, $input: UpdateImportedPurchaseOrderInput!) { updateImportedPurchaseOrder(id: $id, input: $input) { id } }`,
    variables: (_w, qui) => ({ id: id(I.cibleModifier), input: { notes: `Modifié par ${qui}` } }),
    temoin: () => importe(I.cibleModifier),
  },
  {
    nom: "Valider un bon de commande importé",
    droit: "edit",
    champ: "validateImportedPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!) { validateImportedPurchaseOrder(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleValider) }),
    temoin: () => importe(I.cibleValider),
  },
  {
    nom: "Convertir un bon de commande importé",
    droit: "edit",
    champ: "convertImportedPurchaseOrderToPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!) { convertImportedPurchaseOrderToPurchaseOrder(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleConvertir) }),
    temoin: () => importe(I.cibleConvertir),
  },
  {
    nom: "Rejeter un bon de commande importé",
    droit: "edit",
    champ: "rejectImportedPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!) { rejectImportedPurchaseOrder(id: $id, reason: "contrôle") { id } }`,
    variables: () => ({ id: id(I.cibleRejeter) }),
    temoin: () => importe(I.cibleRejeter),
  },
  {
    nom: "Archiver un bon de commande importé",
    droit: "edit",
    champ: "archiveImportedPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!) { archiveImportedPurchaseOrder(id: $id) { id } }`,
    variables: () => ({ id: id(I.cibleArchiver) }),
    temoin: () => importe(I.cibleArchiver),
  },
  {
    nom: "Supprimer un bon de commande importé",
    droit: "delete",
    champ: "deleteImportedPurchaseOrder",
    cible: true,
    requete: `mutation($id: ID!) { deleteImportedPurchaseOrder(id: $id) }`,
    variables: () => ({ id: id(I.cibleSupprimer) }),
    temoin: () => importe(I.cibleSupprimer),
  },
  {
    nom: "Supprimer plusieurs bons de commande importés",
    droit: "delete",
    champ: "deleteImportedPurchaseOrders",
    cible: true,
    nombre: true,
    requete: `mutation($ids: [ID!]!) { deleteImportedPurchaseOrders(ids: $ids) }`,
    variables: () => ({ ids: [id(I.cibleSupprimerPlusieurs)] }),
    temoin: () => importe(I.cibleSupprimerPlusieurs),
  },
];

const LECTURES = [
  ["Un bon de commande", "purchaseOrder", `query($w: ID!, $id: ID!) { purchaseOrder(workspaceId: $w, id: $id) { id number client { name } } }`, (w) => ({ w, id: id(B.enAttente) })],
  ["La liste des bons de commande", "purchaseOrders", `query($w: ID!) { purchaseOrders(workspaceId: $w, page: 1, limit: 100) { purchaseOrders { id number client { name } } totalCount } }`, (w) => ({ w })],
  ["Les statistiques des bons de commande", "purchaseOrderStats", `query($w: ID!) { purchaseOrderStats(workspaceId: $w) { totalCount totalAmount } }`, (w) => ({ w })],
  ["Le prochain numéro de bon de commande", "nextPurchaseOrderNumber", `query($w: ID!) { nextPurchaseOrderNumber(workspaceId: $w, prefix: "BC-CTRL") }`, (w) => ({ w })],
  ["L'existence d'un numéro", "checkPurchaseOrderNumberExists", `query($w: ID!, $p: String!) { checkPurchaseOrderNumberExists(workspaceId: $w, number: "0001", prefix: $p) }`, (w) => ({ w, p: B.enAttente.prefix })],
  ["Le PDF archivé d'un bon de commande", "purchaseOrderDocumentUrl", `query($w: ID!, $id: ID!) { purchaseOrderDocumentUrl(workspaceId: $w, purchaseOrderId: $id) }`, (w) => ({ w, id: id(B.enAttente) })],
  ["Les modèles de bons de commande", "purchaseOrderTemplates", `query($w: ID) { purchaseOrderTemplates(workspaceId: $w) { id name } }`, (w) => ({ w })],
  ["Un bon de commande importé", "importedPurchaseOrder", `query($id: ID!) { importedPurchaseOrder(id: $id) { id originalPurchaseOrderNumber } }`, () => ({ id: id(I.stable) })],
  ["Les bons de commande importés", "importedPurchaseOrders", `query($w: ID!) { importedPurchaseOrders(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Les statistiques des bons importés", "importedPurchaseOrderStats", `query($w: ID!) { importedPurchaseOrderStats(workspaceId: $w) { __typename } }`, (w) => ({ w })],
];

verifierDroits({
  titre: "Bons de commande",
  lectures: LECTURES,
  ecritures: ECRITURES,
  temoinsFuite: [id(B.enAttente), id(I.stable), CLIENTS_VENTES.lumiere.name, "D-REF-0001", "BC-IMP-001", MODELE_BC_VENTES.name],
});

test.describe("Bons de commande : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test.beforeAll(async ({ browser }) => {
    const contexte = await browser.newContext({ baseURL: BASE_URL, storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($id: ID!, $w: ID!, $input: UpdatePurchaseOrderInput!) { updatePurchaseOrder(id: $id, workspaceId: $w, input: $input) { id } }`,
      {
        id: id(B.cibleXss),
        w: ORG,
        input: {
          headerNotes: `Notes ${PIEGE}`,
          footerNotes: `Bas de page ${PIEGE}`,
          termsAndConditions: `Conditions ${PIEGE}`,
          purchaseOrderNumber: "REF<b>piege</b>",
          items: [{ ...article(`Article ${PIEGE}`), details: `Détails ${PIEGE}` }],
        },
      },
      { organisation: ORG },
    );
    await contexte.close();
    expect(reponse.errors, "L'Éditeur doit pouvoir enregistrer le bon de commande").toEqual([]);
  });

  const piegeExecute = (page) => page.evaluate(() => window.__piege ?? null);

  test("Liste des bons de commande : rien ne s'exécute", async ({ page }) => {
    await epingler(page, "bc", B.cibleXss);
    await page.waitForTimeout(1_000);
    expect(await piegeExecute(page), "Le code du bon de commande s'est exécuté").toBeNull();
  });

  test("Panneau et aperçu : le texte s'affiche comme du texte", async ({ page }) => {
    await ouvrirPanneau(page, "bc", B.cibleXss);
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du bon de commande s'est exécuté").toBeNull();
    await expect(page.getByText("Conditions <img", { exact: false }).first(), "Les conditions s'affichent telles quelles").toBeVisible();
  });

  test("Éditeur du bon de commande : le texte reste du texte", async ({ page }) => {
    await ouvrir(page, `/dashboard/outils/bons-commande/${id(B.cibleXss)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
    await page.getByRole("button", { name: /Continuer/ }).click();
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du bon de commande s'est exécuté").toBeNull();
  });
});
