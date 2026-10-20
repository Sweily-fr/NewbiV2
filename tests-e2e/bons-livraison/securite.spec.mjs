/**
 * Bons de livraison : droits vérifiés à l'API (voir ../devis/droits.mjs).
 * Toutes les opérations du schéma des bons de livraison
 * (deliveryNote.graphql), par le Membre, l'Éditeur, l'intrus et un visiteur
 * sans session. Un bon de livraison ne porte jamais de prix : l'API ne doit
 * pas en exposer. Plus un texte piégé écrit par l'Éditeur et ouvert par le
 * propriétaire.
 */
import { test, expect } from "../outils.mjs";
import { BASE_URL, connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR } from "../config.mjs";
import { BL_VENTES as B, CLIENTS_VENTES, FACTURE_VENTES } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { ouvrir } from "../navigation.mjs";
import { CLIENT_API, ORG, ORG_ID, PIEGE, verifierDroits } from "../devis/droits.mjs";
import { epingler, ouvrirPanneau } from "../devis/ventes.mjs";

const _id = (doc) => doc._id;
const bl = (doc) => ["deliverynotes", { _id: _id(doc) }];
const ligneBl = (texte) => ({ description: texte, quantity: 2, unit: "unité" });

const ECRITURES = [
  {
    nom: "Créer un bon de livraison",
    droit: "create",
    champ: "createDeliveryNote",
    requete: `mutation($w: ID!, $input: CreateDeliveryNoteInput!) { createDeliveryNote(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [ligneBl(`Livraison créée par ${qui}`)], status: "DRAFT" } }),
    temoin: (qui) => ["deliverynotes", { workspaceId: ORG_ID, "items.description": `Livraison créée par ${qui}` }],
  },
  {
    nom: "Modifier un bon de livraison",
    droit: "edit",
    champ: "updateDeliveryNote",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!, $input: UpdateDeliveryNoteInput!) { updateDeliveryNote(id: $id, workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(B.cibleModifier), w, input: { carrier: `Transport de ${qui}` } }),
    temoin: () => bl(B.cibleModifier),
  },
  {
    nom: "Supprimer un bon de livraison",
    droit: "delete",
    champ: "deleteDeliveryNote",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { deleteDeliveryNote(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ id: id(B.cibleSupprimer), w }),
    temoin: () => bl(B.cibleSupprimer),
  },
  {
    nom: "Marquer un bon de livraison comme expédié",
    droit: "status",
    champ: "changeDeliveryNoteStatus",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { changeDeliveryNoteStatus(id: $id, workspaceId: $w, status: SHIPPED) { id status } }`,
    variables: (w) => ({ id: id(B.cibleStatut), w }),
    temoin: () => bl(B.cibleStatut),
  },
  {
    nom: "Enregistrer la réception d'un bon de livraison",
    droit: "status",
    champ: "recordDeliveryNoteReception",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!, $input: DeliveryNoteReceptionInput!) { recordDeliveryNoteReception(id: $id, workspaceId: $w, input: $input) { id status } }`,
    variables: (w, qui) => ({ id: id(B.cibleReception), w, input: { receivedBy: `Reçu par ${qui}`, receivedAt: new Date().toISOString() } }),
    temoin: () => bl(B.cibleReception),
  },
  {
    nom: "Facturer un bon de livraison",
    droit: "convert",
    champ: "createInvoiceFromDeliveryNote",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { createInvoiceFromDeliveryNote(deliveryNoteId: $id, workspaceId: $w) { id } }`,
    variables: (w) => ({ id: id(B.cibleFacture), w }),
    temoin: () => ["invoices", { "items.description": "Cible BL facture" }],
  },
  {
    nom: "Créer un bon de livraison depuis une facture",
    droit: "create",
    champ: "createDeliveryNoteFromInvoice",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { createDeliveryNoteFromInvoice(invoiceId: $id, workspaceId: $w) { id } }`,
    variables: (w) => ({ id: id(FACTURE_VENTES), w }),
    temoin: () => ["deliverynotes", { "items.description": "Facture à livrer" }],
  },
  {
    nom: "Envoyer un bon de livraison par e-mail",
    droit: "send",
    externe: true,
    champ: "sendDeliveryNote",
    cible: true,
    requete: `mutation($id: ID!, $w: ID!) { sendDeliveryNote(id: $id, workspaceId: $w, email: "destinataire-controle@e2e.test") }`,
    variables: (w) => ({ id: id(B.cibleEnvoyer), w }),
    temoin: () => bl(B.cibleEnvoyer),
  },
];

const LECTURES = [
  ["Un bon de livraison", "deliveryNote", `query($w: ID!, $id: ID!) { deliveryNote(workspaceId: $w, id: $id) { id number carrier client { name } } }`, (w) => ({ w, id: id(B.aExpedier) })],
  ["La liste des bons de livraison", "deliveryNotes", `query($w: ID!) { deliveryNotes(workspaceId: $w, page: 1, limit: 100) { deliveryNotes { id number carrier client { name } } totalCount } }`, (w) => ({ w })],
  ["Les statistiques des bons de livraison", "deliveryNoteStats", `query($w: ID!) { deliveryNoteStats(workspaceId: $w) { totalCount } }`, (w) => ({ w })],
  ["Le prochain numéro de bon de livraison", "nextDeliveryNumber", `query($w: ID!) { nextDeliveryNumber(workspaceId: $w, prefix: "BL-CTRL") }`, (w) => ({ w })],
  ["L'existence d'un numéro", "checkDeliveryNumberExists", `query($w: ID!, $p: String!) { checkDeliveryNumberExists(workspaceId: $w, number: "0001", prefix: $p) }`, (w) => ({ w, p: B.aExpedier.prefix })],
  ["Le PDF archivé d'un bon de livraison", "deliveryNoteDocumentUrl", `query($w: ID!, $id: ID!) { deliveryNoteDocumentUrl(workspaceId: $w, deliveryNoteId: $id) }`, (w) => ({ w, id: id(B.aExpedier) })],
];

verifierDroits({
  titre: "Bons de livraison",
  lectures: LECTURES,
  ecritures: ECRITURES,
  temoinsFuite: [id(B.aExpedier), CLIENTS_VENTES.lumiere.name, "VE000000001FR", "Transport Brouillon Stable"],
});

test.describe("Bons de livraison : jamais de prix", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test("L'API refuse de renvoyer un prix sur une ligne de bon de livraison", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `query($w: ID!, $id: ID!) { deliveryNote(workspaceId: $w, id: $id) { items { description unitPrice vatRate } } }`,
      { w: ORG, id: id(B.aExpedier) },
      { organisation: ORG },
    );
    expect(reponse.data?.deliveryNote ?? null, "Des prix sont renvoyés pour un bon de livraison").toBeNull();
    expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(/unitPrice|Cannot query field/);
  });

  test("Les lignes renvoyées ne contiennent que désignation, quantité et unité", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `query($w: ID!, $id: ID!) { deliveryNote(workspaceId: $w, id: $id) { items { description quantity unit } } }`,
      { w: ORG, id: id(B.aExpedier) },
      { organisation: ORG },
    );
    expect(reponse.errors).toEqual([]);
    expect(JSON.stringify(reponse.data), "Le prix caché en base (150) apparaît dans la réponse").not.toContain("150");
  });
});

test.describe("Bons de livraison : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test.beforeAll(async ({ browser }) => {
    const contexte = await browser.newContext({ baseURL: BASE_URL, storageState: connecte(SESSION_TOKEN_VENTES_EDITEUR) });
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($id: ID!, $w: ID!, $input: UpdateDeliveryNoteInput!) { updateDeliveryNote(id: $id, workspaceId: $w, input: $input) { id } }`,
      {
        id: id(B.cibleXss),
        w: ORG,
        input: {
          notes: `Instructions ${PIEGE}`,
          carrier: `Transporteur ${PIEGE}`,
          trackingNumber: "SUIVI<b>piege</b>",
          headerNotes: `Notes ${PIEGE}`,
          footerNotes: `Bas de page ${PIEGE}`,
          termsAndConditions: `Conditions ${PIEGE}`,
          items: [{ ...ligneBl(`Article ${PIEGE}`), details: `Détails ${PIEGE}` }],
        },
      },
      { organisation: ORG },
    );
    await contexte.close();
    expect(reponse.errors, "L'Éditeur doit pouvoir enregistrer le bon de livraison").toEqual([]);
  });

  const piegeExecute = (page) => page.evaluate(() => window.__piege ?? null);

  test("Liste des bons de livraison : rien ne s'exécute", async ({ page }) => {
    await epingler(page, "bl", B.cibleXss);
    await page.waitForTimeout(1_000);
    expect(await piegeExecute(page), "Le code du bon de livraison s'est exécuté").toBeNull();
  });

  test("Panneau et aperçu : le texte s'affiche comme du texte", async ({ page }) => {
    await ouvrirPanneau(page, "bl", B.cibleXss);
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du bon de livraison s'est exécuté").toBeNull();
  });

  test("Éditeur du bon de livraison : le texte reste du texte", async ({ page }) => {
    await ouvrir(page, `/dashboard/outils/bons-de-livraison/${id(B.cibleXss)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
    await page.getByRole("button", { name: /Continuer/ }).click();
    await page.waitForTimeout(1_500);
    expect(await piegeExecute(page), "Le code du bon de livraison s'est exécuté").toBeNull();
  });
});
