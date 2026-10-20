/**
 * Factures d'achat : droits vérifiés à l'API (factures, justificatifs,
 * paiement, actions groupées, rapprochement, fournisseurs, facture
 * électronique, nouvelle analyse) pour le Membre, l'Éditeur, une autre
 * entreprise et un visiteur (voir achats-banque.mjs). Plus : un
 * justificatif d'un autre espace ne peut pas être rattaché, et un texte
 * piégé écrit par l'Éditeur reste du texte chez le propriétaire.
 */
import { ObjectId } from "mongodb";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_INTRUS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { FACTURES_ACHAT, FACTURES_ACHAT_SAISIE, FOURNISSEURS, FOURNISSEURS_SAISIE, TRANSACTIONS, TRANSACTIONS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { ORG, ORG_INTRUS, ORG_SAISIE, PIEGE, avecSession, photo, verifierDroits, verifierPiegeInerte } from "../achats-banque.mjs";

const FA = FACTURES_ACHAT;
const FAS = FACTURES_ACHAT_SAISIE;
/** Données visées : « Achats » (Membre, intrus, visiteur) ou « Saisie Achats » (écritures permises de l'Éditeur). */
const CIBLES = {
  [ORG]: {
    modifier: FA.hotel,
    payerParModification: FA.tilleuls,
    supprimer: FA.meta,
    marquer: FA.provence,
    statutGroupe: FA.tilleuls,
    categorieGroupe: FA.hotel,
    supprimerGroupe: FA.meta,
    rapprocher: [FA.tilleuls, TRANSACTIONS.loyer],
    delier: [FA.adobe, TRANSACTIONS.adobe],
    toutDelier: FA.martin,
    ajouterFichier: FA.hotel,
    retirerFichier: FA.cafe,
    fournisseur: FOURNISSEURS.hotel,
    supprimerFournisseur: FOURNISSEURS.bureau,
    fusion: [FOURNISSEURS.adobe, FOURNISSEURS.remplissage],
  },
  [ORG_SAISIE]: {
    modifier: FAS.editeur,
    payerParModification: FAS.editeurPayer,
    supprimer: FAS.editeur,
    marquer: FAS.editeurMarquer,
    statutGroupe: FAS.editeurStatutGroupe,
    categorieGroupe: FAS.editeurCategorieGroupe,
    supprimerGroupe: FAS.editeur,
    rapprocher: [FAS.editeurRapprocher, TRANSACTIONS_SAISIE.editeurRapprocher],
    delier: [FAS.editeurDelier, TRANSACTIONS_SAISIE.editeurDelier],
    toutDelier: FAS.editeurToutDelier,
    ajouterFichier: FAS.editeur,
    retirerFichier: FAS.editeurFichier,
    fournisseur: FOURNISSEURS_SAISIE.editeur,
    supprimerFournisseur: FOURNISSEURS_SAISIE.editeur,
    fusion: [FOURNISSEURS_SAISIE.editeur, FOURNISSEURS_SAISIE.aFusionner],
  },
};
const cibles = (w) => CIBLES[w] || CIBLES[ORG];
const parId = (doc) => ({ _id: doc._id });
const aujourdhui = () => new Date().toISOString().slice(0, 10);

const LECTURES = [
  { nom: "Une facture d'achat", champ: "purchaseInvoice", requete: `query($id: ID!) { purchaseInvoice(id: $id) { id supplierName amountTTC } }`, variables: () => ({ id: id(FA.hotel) }) },
  { nom: "La liste des factures d'achat", champ: "purchaseInvoices", requete: `query($w: ID!) { purchaseInvoices(workspaceId: $w, page: 1, limit: 100) { items { id supplierName } totalCount } }`, variables: (w) => ({ w }) },
  { nom: "Les totaux des factures d'achat", champ: "purchaseInvoiceStats", requete: `query($w: ID!) { purchaseInvoiceStats(workspaceId: $w) { totalToPay totalUnpaid } }`, variables: (w) => ({ w }) },
  { nom: "Les transactions proposées pour une facture", champ: "purchaseInvoiceReconciliationMatches", requete: `query($id: ID!) { purchaseInvoiceReconciliationMatches(purchaseInvoiceId: $id) { transactionId description } }`, variables: () => ({ id: id(FA.tilleuls) }) },
  { nom: "Les suggestions de rapprochement", champ: "purchaseInvoiceReconciliationSuggestions", requete: `query($w: ID!) { purchaseInvoiceReconciliationSuggestions(workspaceId: $w) { suggestions { transaction { id description } } } }`, variables: (w) => ({ w }) },
  { nom: "Les transactions rattachables à une facture", champ: "transactionsForPurchaseInvoice", requete: `query($id: ID!) { transactionsForPurchaseInvoice(purchaseInvoiceId: $id) { transactions { id description amount } } }`, variables: () => ({ id: id(FA.tilleuls) }) },
  { nom: "La transaction trouvée pour une facture", champ: "purchaseInvoiceReconcileCandidate", peutEtreVide: true, requete: `query($id: ID!) { purchaseInvoiceReconcileCandidate(purchaseInvoiceId: $id) { id description } }`, variables: () => ({ id: id(FA.tilleuls) }) },
  { nom: "Les factures rattachables à une transaction", champ: "purchaseInvoicesForTransaction", requete: `query($id: ID!) { purchaseInvoicesForTransaction(transactionId: $id) { purchaseInvoices { id supplierName } } }`, variables: () => ({ id: id(TRANSACTIONS.loyer) }) },
  {
    nom: "Les doublons d'une facture",
    champ: "purchaseInvoiceDuplicates",
    requete: `query($w: ID!, $input: PurchaseInvoiceDuplicateCheckInput!) { purchaseInvoiceDuplicates(workspaceId: $w, input: $input) { id supplierName invoiceNumber } }`,
    variables: (w) => ({ w, input: { supplierName: FA.meta.supplierName, invoiceNumber: FA.meta.invoiceNumber, amountTTC: FA.meta.amountTTC } }),
  },
  { nom: "Une fiche fournisseur", champ: "supplier", requete: `query($id: ID!) { supplier(id: $id) { id name iban } }`, variables: () => ({ id: id(FOURNISSEURS.adobe) }) },
  { nom: "Les fournisseurs", champ: "suppliers", requete: `query($w: ID!) { suppliers(workspaceId: $w) { items { id name } } }`, variables: (w) => ({ w }) },
];

const ECRITURES = [
  {
    nom: "Créer une facture d'achat",
    editeur: true,
    champ: "createPurchaseInvoice",
    requete: `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, supplierName: `Fournisseur créé par ${qui}`, issueDate: aujourdhui(), amountHT: 10, amountTVA: 2, vatRate: 20, amountTTC: 12, forceCreate: true } }),
    temoin: (qui) => ["purchaseinvoices", { supplierName: `Fournisseur créé par ${qui}` }],
  },
  {
    nom: "Modifier une facture d'achat",
    editeur: true,
    cible: true,
    champ: "updatePurchaseInvoice",
    requete: `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).modifier), input: { notes: `Modifiée par ${qui}` } }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
  {
    nom: "Passer une facture payée en la modifiant",
    editeur: true,
    cible: true,
    champ: "updatePurchaseInvoice",
    requete: `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id status } }`,
    variables: (w) => ({ id: id(cibles(w).payerParModification), input: { status: "PAID" } }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).payerParModification)],
  },
  {
    nom: "Supprimer une facture d'achat",
    editeur: false,
    cible: true,
    champ: "deletePurchaseInvoice",
    resultat: "succes",
    requete: `mutation($id: ID!) { deletePurchaseInvoice(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).supprimer) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).supprimer)],
  },
  {
    nom: "Marquer une facture d'achat payée",
    editeur: true,
    cible: true,
    champ: "markPurchaseInvoiceAsPaid",
    requete: `mutation($id: ID!) { markPurchaseInvoiceAsPaid(id: $id, paymentMethod: BANK_TRANSFER) { id status } }`,
    variables: (w) => ({ id: id(cibles(w).marquer) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).marquer)],
  },
  {
    nom: "Changer le statut de plusieurs factures",
    editeur: true,
    cible: true,
    champ: "bulkUpdatePurchaseInvoiceStatus",
    resultat: "nombre",
    requete: `mutation($ids: [ID!]!) { bulkUpdatePurchaseInvoiceStatus(ids: $ids, status: PENDING) { success updatedCount message } }`,
    variables: (w) => ({ ids: [id(cibles(w).statutGroupe)] }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).statutGroupe)],
  },
  {
    nom: "Catégoriser plusieurs factures",
    editeur: true,
    cible: true,
    champ: "bulkCategorizePurchaseInvoices",
    resultat: "nombre",
    requete: `mutation($ids: [ID!]!) { bulkCategorizePurchaseInvoices(ids: $ids, subcategory: "logiciel") { success updatedCount message } }`,
    variables: (w) => ({ ids: [id(cibles(w).categorieGroupe)] }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).categorieGroupe)],
  },
  {
    nom: "Supprimer plusieurs factures",
    editeur: false,
    cible: true,
    champ: "bulkDeletePurchaseInvoices",
    resultat: "nombre",
    requete: `mutation($ids: [ID!]!) { bulkDeletePurchaseInvoices(ids: $ids) { success updatedCount message } }`,
    variables: (w) => ({ ids: [id(cibles(w).supprimerGroupe)] }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).supprimerGroupe)],
  },
  {
    nom: "Rapprocher une facture d'une transaction",
    editeur: true,
    cible: true,
    champ: "reconcilePurchaseInvoice",
    requete: `mutation($id: ID!, $t: [ID!]!) { reconcilePurchaseInvoice(purchaseInvoiceId: $id, transactionIds: $t, origin: DOCUMENT) { id isReconciled } }`,
    variables: (w) => ({ id: id(cibles(w).rapprocher[0]), t: [id(cibles(w).rapprocher[1])] }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).rapprocher[1])],
  },
  {
    nom: "Délier une transaction d'une facture",
    editeur: true,
    cible: true,
    champ: "unlinkPurchaseInvoiceFromTransaction",
    requete: `mutation($id: ID!, $t: ID!) { unlinkPurchaseInvoiceFromTransaction(purchaseInvoiceId: $id, transactionId: $t) { id } }`,
    variables: (w) => ({ id: id(cibles(w).delier[0]), t: id(cibles(w).delier[1]) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).delier[1])],
  },
  {
    nom: "Délier toutes les transactions d'une facture",
    editeur: true,
    cible: true,
    champ: "unreconcilePurchaseInvoice",
    requete: `mutation($id: ID!) { unreconcilePurchaseInvoice(purchaseInvoiceId: $id) { id } }`,
    variables: (w) => ({ id: id(cibles(w).toutDelier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).toutDelier)],
  },
  {
    nom: "Rattacher un justificatif déjà envoyé",
    editeur: true,
    cible: true,
    champ: "addPurchaseInvoiceFile",
    requete: `mutation($id: ID!, $input: PurchaseInvoiceFileInput!) { addPurchaseInvoiceFile(purchaseInvoiceId: $id, input: $input) { id } }`,
    // Fichier de l'espace visé (seul un fichier de l'espace de l'appelant est accepté).
    variables: (w, qui) => ({ id: id(cibles(w).ajouterFichier), input: { cloudflareUrl: `https://fichiers.e2e.invalid/${w}/ocr/justificatif-${qui}.pdf`, fileName: `justificatif-${qui}.pdf`, mimeType: "application/pdf", fileSize: 1024, processOCR: false } }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).ajouterFichier)],
  },
  {
    nom: "Retirer un justificatif",
    editeur: true,
    cible: true,
    champ: "removePurchaseInvoiceFile",
    requete: `mutation($id: ID!, $f: ID!) { removePurchaseInvoiceFile(purchaseInvoiceId: $id, fileId: $f) { id } }`,
    variables: (w) => ({ id: id(cibles(w).retirerFichier), f: id(cibles(w).retirerFichier.files[0]) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).retirerFichier)],
  },
  {
    nom: "Créer une fiche fournisseur",
    editeur: true,
    champ: "createSupplier",
    requete: `mutation($input: CreateSupplierInput!) { createSupplier(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, name: `Fiche créée par ${qui}`, iban: "FR7630006000011234567890189" } }),
    temoin: (qui) => ["suppliers", { name: `Fiche créée par ${qui}` }],
  },
  {
    nom: "Modifier une fiche fournisseur",
    editeur: true,
    cible: true,
    champ: "updateSupplier",
    requete: `mutation($id: ID!, $input: UpdateSupplierInput!) { updateSupplier(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).fournisseur), input: { notes: `Modifiée par ${qui}`, iban: "FR7630006000019999999999999" } }),
    temoin: (qui, w) => ["suppliers", parId(cibles(w).fournisseur)],
  },
  {
    nom: "Supprimer une fiche fournisseur",
    editeur: false,
    cible: true,
    champ: "deleteSupplier",
    resultat: "succes",
    requete: `mutation($id: ID!) { deleteSupplier(id: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).supprimerFournisseur) }),
    temoin: (qui, w) => ["suppliers", parId(cibles(w).supprimerFournisseur)],
  },
  {
    nom: "Fusionner des fiches fournisseurs",
    editeur: true,
    cible: true,
    champ: "mergeSuppliers",
    requete: `mutation($cible: ID!, $sources: [ID!]!) { mergeSuppliers(targetId: $cible, sourceIds: $sources) { id } }`,
    variables: (w) => ({ cible: id(cibles(w).fusion[0]), sources: [id(cibles(w).fusion[1])] }),
    temoin: (qui, w) => ["suppliers", { _id: { $in: cibles(w).fusion.map((f) => f._id) } }],
  },
  {
    nom: "Synchroniser les factures électroniques reçues",
    editeur: true,
    externe: "plateforme de facturation électronique",
    champ: "syncPurchaseInvoicesFromSuperPdp",
    requete: `mutation($w: ID!) { syncPurchaseInvoicesFromSuperPdp(workspaceId: $w) { success imported } }`,
    variables: (w) => ({ w }),
    temoin: (qui, w) => ["purchaseinvoices", { source: "SUPERPDP" }],
  },
  {
    nom: "Accepter une facture électronique reçue",
    editeur: true,
    externe: "plateforme de facturation électronique",
    cible: true,
    champ: "acknowledgePurchaseInvoiceEInvoice",
    requete: `mutation($id: ID!) { acknowledgePurchaseInvoiceEInvoice(id: $id) { id } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
  {
    nom: "Refuser une facture électronique reçue",
    editeur: true,
    externe: "plateforme de facturation électronique",
    cible: true,
    champ: "refusePurchaseInvoiceEInvoice",
    requete: `mutation($id: ID!) { refusePurchaseInvoiceEInvoice(id: $id, reason: "Test") { id } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
  {
    nom: "Signaler un litige sur une facture électronique",
    editeur: true,
    externe: "plateforme de facturation électronique",
    cible: true,
    champ: "submitPurchaseInvoiceEInvoiceEvent",
    requete: `mutation($id: ID!) { submitPurchaseInvoiceEInvoiceEvent(id: $id, statusCode: "fr:207", reason: "Test") { id } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
  {
    nom: "Relancer l'analyse d'un justificatif",
    editeur: true,
    externe: "analyse des documents (OCR)",
    cible: true,
    champ: "reanalyzePurchaseInvoice",
    requete: `mutation($id: ID!) { reanalyzePurchaseInvoice(id: $id) { supplierName amountTTC } }`,
    variables: (w) => ({ id: id(cibles(w).retirerFichier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).retirerFichier)],
  },
  {
    nom: "Relancer l'analyse de tous les justificatifs",
    editeur: true,
    externe: "analyse des documents (OCR)",
    cible: true,
    champ: "reanalyzePurchaseInvoiceFiles",
    requete: `mutation($id: ID!) { reanalyzePurchaseInvoiceFiles(id: $id) { distinctCount } }`,
    variables: (w) => ({ id: id(cibles(w).retirerFichier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).retirerFichier)],
  },
];

verifierDroits({
  fonctionnalite: "Factures d'achat",
  lectures: LECTURES,
  ecritures: ECRITURES,
  fuites: [id(FA.hotel), FA.hotel.supplierName, FA.meta.supplierName, FA.meta.invoiceNumber, id(FOURNISSEURS.adobe), FOURNISSEURS.adobe.name, id(TRANSACTIONS.loyer), TRANSACTIONS.loyer.description],
});

test.describe("Factures d'achat : rien ne passe d'un espace à l'autre", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  test("Rattacher le justificatif d'un autre espace à sa facture : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const creee = await appelApi(
      page,
      `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id } }`,
      { input: { workspaceId: ORG_INTRUS, supplierName: "Fournisseur de l'intrus", issueDate: aujourdhui(), amountTTC: 10, forceCreate: true } },
      { organisation: ORG_INTRUS },
    );
    const factureIntrus = creee.data?.createPurchaseInvoice?.id;
    expect(factureIntrus, `L'intrus doit pouvoir créer sa propre facture (${creee.errors.map((e) => e.message).join(" | ")})`).toBeTruthy();
    const fichierDesAutres = FA.cafe.files[0].url;
    const reponse = await appelApi(
      page,
      `mutation($id: ID!, $input: PurchaseInvoiceFileInput!) { addPurchaseInvoiceFile(purchaseInvoiceId: $id, input: $input) { id files { url } } }`,
      { id: factureIntrus, input: { cloudflareUrl: fichierDesAutres, fileName: "vole.pdf", mimeType: "application/pdf", fileSize: 1000, processOCR: false } },
      { organisation: ORG_INTRUS },
    );
    expect(JSON.stringify(reponse.data ?? {}), "Le justificatif d'un autre espace est rattaché").not.toContain(fichierDesAutres);
    const doc = await (await base()).collection("purchaseinvoices").findOne({ _id: new ObjectId(factureIntrus) });
    expect((doc?.files || []).map((f) => f.url), "Le justificatif d'un autre espace est enregistré sur la facture de l'intrus").not.toContain(fichierDesAutres);
  });

  test("Rapprocher sa facture d'une transaction d'un autre espace : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const creee = await appelApi(
      page,
      `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id } }`,
      { input: { workspaceId: ORG_INTRUS, supplierName: "Autre fournisseur de l'intrus", issueDate: aujourdhui(), amountTTC: 1200, forceCreate: true } },
      { organisation: ORG_INTRUS },
    );
    const factureIntrus = creee.data?.createPurchaseInvoice?.id;
    expect(factureIntrus).toBeTruthy();
    const temoin = ["transactions", { _id: TRANSACTIONS.loyer._id }];
    const avant = await photo(temoin);
    const reponse = await appelApi(
      page,
      `mutation($id: ID!, $t: [ID!]!) { reconcilePurchaseInvoice(purchaseInvoiceId: $id, transactionIds: $t) { id } }`,
      { id: factureIntrus, t: [id(TRANSACTIONS.loyer)] },
      { organisation: ORG_INTRUS },
    );
    expect(reponse.data?.reconcilePurchaseInvoice ?? null, "La transaction d'un autre espace a été rapprochée").toBeNull();
    expect(await photo(temoin), "La transaction d'un autre espace a changé").toBe(avant);
  });
});

/**
 * Texte piégé (XSS stockée) : l'Éditeur enregistre par l'API un nom de
 * fournisseur, un numéro et des notes qui contiennent du HTML exécutable ;
 * le propriétaire ouvre la liste puis la fiche de la facture.
 */
test.describe("Factures d'achat : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const FOURNISSEUR_PIEGE = `${PIEGE}Fournisseur piégé`;

  test.beforeAll(async ({ browser }) => {
    const reponse = await avecSession(browser, SESSION_TOKEN_EDITEUR_ACHATS, (page) =>
      appelApi(
        page,
        `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id } }`,
        { id: id(FAS.piege), input: { supplierName: FOURNISSEUR_PIEGE, invoiceNumber: `${PIEGE}N°`, notes: `${PIEGE} Note interne`, internalReference: `${PIEGE}` } },
        { organisation: ORG_SAISIE },
      ),
    );
    expect(reponse.errors, "L'Éditeur doit pouvoir modifier une facture d'achat").toEqual([]);
  });

  test("Liste et fiche de la facture : le texte s'affiche, rien ne s'exécute", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/factures-achat", { pret: page.getByText("Fournisseur piégé").first() });
    await etape(page, "Liste", async () => {
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
    await etape(page, "Fiche de la facture", async () => {
      await ouvrir(page, `/dashboard/outils/factures-achat?id=${id(FAS.piege)}`, { pret: page.getByRole("dialog").getByText("Fournisseur piégé").first() });
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
  });
});
