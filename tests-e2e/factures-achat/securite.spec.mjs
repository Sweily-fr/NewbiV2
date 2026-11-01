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
import { BASE_URL, connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_FREELANCE_ACHATS, SESSION_TOKEN_INTRUS, SESSION_TOKEN_ROLE_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import {
  FACTURES_ACHAT,
  FACTURES_ACHAT_SAISIE,
  FOURNISSEURS,
  FOURNISSEURS_SAISIE,
  FACTURE_AUTEUR,
  FUSION,
  FUSION_FACTURE,
  IMPORTEES_ACHATS,
  IMPORTEES_SAISIE,
  QUOTA_OCR_EPUISE,
  ROLE_ACHATS,
  TRANSACTIONS,
  TRANSACTIONS_SAISIE,
  TRANSACTION_QUOTA,
} from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { ORG, ORG_INTRUS, ORG_SAISIE, PIEGE, appelApiFichier, avecSession, connecteAchats, photo, verifierDroits, verifierDroitsComptable, verifierPiegeInerte } from "../achats-banque.mjs";

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
    convertir: IMPORTEES_ACHATS.aConvertir,
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
    convertir: IMPORTEES_SAISIE.editeurAConvertir,
  },
};
const PDF = [...Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")];
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

// Comptable : factures d'achat en lecture seule, chaque écriture lui est refusée (comptable: false).
const ECRITURES = [
  {
    comptable: false,
    nom: "Créer une facture d'achat",
    editeur: true,
    champ: "createPurchaseInvoice",
    requete: `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, supplierName: `Fournisseur créé par ${qui}`, issueDate: aujourdhui(), amountHT: 10, amountTVA: 2, vatRate: 20, amountTTC: 12, forceCreate: true } }),
    temoin: (qui) => ["purchaseinvoices", { supplierName: `Fournisseur créé par ${qui}` }],
  },
  {
    comptable: false,
    nom: "Modifier une facture d'achat",
    editeur: true,
    cible: true,
    champ: "updatePurchaseInvoice",
    requete: `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).modifier), input: { notes: `Modifiée par ${qui}` } }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
  {
    comptable: false,
    nom: "Passer une facture payée en la modifiant",
    editeur: true,
    cible: true,
    champ: "updatePurchaseInvoice",
    requete: `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id status } }`,
    variables: (w) => ({ id: id(cibles(w).payerParModification), input: { status: "PAID" } }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).payerParModification)],
  },
  {
    comptable: false,
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
    comptable: false,
    nom: "Marquer une facture d'achat payée",
    editeur: true,
    cible: true,
    champ: "markPurchaseInvoiceAsPaid",
    requete: `mutation($id: ID!) { markPurchaseInvoiceAsPaid(id: $id, paymentMethod: BANK_TRANSFER) { id status } }`,
    variables: (w) => ({ id: id(cibles(w).marquer) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).marquer)],
  },
  {
    comptable: false,
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
    comptable: false,
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
    comptable: false,
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
    comptable: false,
    nom: "Rapprocher une facture d'une transaction",
    editeur: true,
    cible: true,
    champ: "reconcilePurchaseInvoice",
    requete: `mutation($id: ID!, $t: [ID!]!) { reconcilePurchaseInvoice(purchaseInvoiceId: $id, transactionIds: $t, origin: DOCUMENT) { id isReconciled } }`,
    variables: (w) => ({ id: id(cibles(w).rapprocher[0]), t: [id(cibles(w).rapprocher[1])] }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).rapprocher[1])],
  },
  {
    comptable: false,
    nom: "Délier une transaction d'une facture",
    editeur: true,
    cible: true,
    champ: "unlinkPurchaseInvoiceFromTransaction",
    requete: `mutation($id: ID!, $t: ID!) { unlinkPurchaseInvoiceFromTransaction(purchaseInvoiceId: $id, transactionId: $t) { id } }`,
    variables: (w) => ({ id: id(cibles(w).delier[0]), t: id(cibles(w).delier[1]) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).delier[1])],
  },
  {
    comptable: false,
    nom: "Délier toutes les transactions d'une facture",
    editeur: true,
    cible: true,
    champ: "unreconcilePurchaseInvoice",
    requete: `mutation($id: ID!) { unreconcilePurchaseInvoice(purchaseInvoiceId: $id) { id } }`,
    variables: (w) => ({ id: id(cibles(w).toutDelier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).toutDelier)],
  },
  {
    comptable: false,
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
    comptable: false,
    nom: "Retirer un justificatif",
    editeur: true,
    cible: true,
    champ: "removePurchaseInvoiceFile",
    requete: `mutation($id: ID!, $f: ID!) { removePurchaseInvoiceFile(purchaseInvoiceId: $id, fileId: $f) { id } }`,
    variables: (w) => ({ id: id(cibles(w).retirerFichier), f: id(cibles(w).retirerFichier.files[0]) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).retirerFichier)],
  },
  {
    comptable: false,
    nom: "Créer une fiche fournisseur",
    editeur: true,
    champ: "createSupplier",
    requete: `mutation($input: CreateSupplierInput!) { createSupplier(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, name: `Fiche créée par ${qui}`, iban: "FR7630006000011234567890189" } }),
    temoin: (qui) => ["suppliers", { name: `Fiche créée par ${qui}` }],
  },
  {
    comptable: false,
    nom: "Modifier une fiche fournisseur",
    editeur: true,
    cible: true,
    champ: "updateSupplier",
    requete: `mutation($id: ID!, $input: UpdateSupplierInput!) { updateSupplier(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).fournisseur), input: { notes: `Modifiée par ${qui}`, iban: "FR7630006000019999999999999" } }),
    temoin: (qui, w) => ["suppliers", parId(cibles(w).fournisseur)],
  },
  {
    comptable: false,
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
    comptable: false,
    nom: "Fusionner des fiches fournisseurs",
    editeur: true,
    cible: true,
    champ: "mergeSuppliers",
    requete: `mutation($cible: ID!, $sources: [ID!]!) { mergeSuppliers(targetId: $cible, sourceIds: $sources) { id } }`,
    variables: (w) => ({ cible: id(cibles(w).fusion[0]), sources: [id(cibles(w).fusion[1])] }),
    temoin: (qui, w) => ["suppliers", { _id: { $in: cibles(w).fusion.map((f) => f._id) } }],
  },
  {
    comptable: false,
    nom: "Synchroniser les factures électroniques reçues",
    editeur: true,
    externe: "plateforme de facturation électronique",
    champ: "syncPurchaseInvoicesFromSuperPdp",
    requete: `mutation($w: ID!) { syncPurchaseInvoicesFromSuperPdp(workspaceId: $w) { success imported } }`,
    variables: (w) => ({ w }),
    temoin: (qui, w) => ["purchaseinvoices", { source: "SUPERPDP" }],
  },
  {
    comptable: false,
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
    comptable: false,
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
    comptable: false,
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
    comptable: false,
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
    comptable: false,
    nom: "Relancer l'analyse de tous les justificatifs",
    editeur: true,
    externe: "analyse des documents (OCR)",
    cible: true,
    champ: "reanalyzePurchaseInvoiceFiles",
    requete: `mutation($id: ID!) { reanalyzePurchaseInvoiceFiles(id: $id) { distinctCount } }`,
    variables: (w) => ({ id: id(cibles(w).retirerFichier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).retirerFichier)],
  },
{
    comptable: false,
    nom: "Analyser un document pour créer une facture (OCR)",
    editeur: true,
    externe: "analyse des documents (OCR)",
    champ: "processDocumentOcr",
    requete: `mutation($file: Upload!, $w: String!) { processDocumentOcr(file: $file, workspaceId: $w) { success message metadata { documentUrl } } }`,
    variables: (w) => ({ file: null, w }),
    fichier: { cle: "file", nom: "facture.pdf", type: "application/pdf", contenu: PDF },
    temoin: (qui, w) => ["purchaseinvoices", { workspaceId: new ObjectId(w) }],
  },
  {
    comptable: false,
    nom: "Analyser un document déjà envoyé (OCR)",
    editeur: true,
    externe: "analyse des documents (OCR)",
    champ: "processDocumentOcrFromUrl",
    requete: `mutation($u: String!, $w: String!) { processDocumentOcrFromUrl(cloudflareUrl: $u, fileName: "facture.pdf", mimeType: "application/pdf", workspaceId: $w) { success message } }`,
    variables: (w) => ({ u: `https://fichiers.e2e.invalid/${w}/ocr/facture.pdf`, w }),
    temoin: (qui, w) => ["purchaseinvoices", { workspaceId: new ObjectId(w) }],
  },
  {
    nom: "Convertir une facture importée en facture d'achat",
    editeur: true,
    cible: true,
    champ: "convertImportedInvoiceToPurchaseInvoice",
    requete: `mutation($id: ID!) { convertImportedInvoiceToPurchaseInvoice(id: $id, forceCreate: true) { id } }`,
    variables: (w) => ({ id: id(cibles(w).convertir) }),
    temoin: (qui, w) => ["imported_invoices", parId(cibles(w).convertir)],
  },
  {
    comptable: false,
    nom: "Envoyer une facture d'achat à Qonto",
    editeur: false,
    cible: true,
    champ: "syncPurchaseInvoiceToQonto",
    resultat: "succes",
    requete: `mutation($id: ID!) { syncPurchaseInvoiceToQonto(purchaseInvoiceId: $id) { success message } }`,
    variables: (w) => ({ id: id(cibles(w).modifier) }),
    temoin: (qui, w) => ["purchaseinvoices", parId(cibles(w).modifier)],
  },
];

const FUITES = [id(FA.hotel), FA.hotel.supplierName, FA.meta.supplierName, FA.meta.invoiceNumber, id(FOURNISSEURS.adobe), FOURNISSEURS.adobe.name, id(TRANSACTIONS.loyer), TRANSACTIONS.loyer.description];

verifierDroits({
  fonctionnalite: "Factures d'achat",
  lectures: LECTURES,
  ecritures: ECRITURES,
  fuites: FUITES,
});

verifierDroitsComptable({ fonctionnalite: "Factures d'achat", lectures: LECTURES, ecritures: ECRITURES });

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
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });
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
    await ouvrir(page, "/dashboard/outils/factures-achat", { pret: page.getByRole("tab", { name: /^Toutes/ }) });
    await page.getByPlaceholder("Recherchez par fournisseur, n° facture ou montant...").fill("Fournisseur piégé");
    await page.waitForTimeout(800);
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

/**
 * Rôle personnalisé « Saisie sans paiement » (« Saisie Achats ») : il ajoute
 * et modifie des factures d'achat, sans « Marquer comme payée ». Aucun
 * chemin ne doit lui permettre d'enregistrer une facture payée.
 */
test.describe("Factures d'achat : rôle personnalisé sans « Marquer comme payée »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_ROLE_ACHATS) });
  const facture = ROLE_ACHATS.aPayer;
  const temoin = ["purchaseinvoices", parId(facture)];
  const creer = (page, input) =>
    appelApi(page, `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id status } }`, { input: { workspaceId: ORG_SAISIE, issueDate: aujourdhui(), amountTTC: 41.5, forceCreate: true, ...input } }, { organisation: ORG_SAISIE, delai: 15_000 });
  const enBase = (nom) => base().then((db) => db.collection("purchaseinvoices").findOne({ supplierName: nom }));

  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Créer une facture à payer : permis (le rôle peut ajouter)", async ({ page }) => {
    const reponse = await creer(page, { supplierName: "Fournisseur du rôle (à payer)", status: "TO_PAY" });
    expect(reponse.errors.map((e) => e.message).join(" | ")).toBe("");
    expect((await enBase("Fournisseur du rôle (à payer)"))?.status).toBe("TO_PAY");
  });

  test("Créer une facture déjà payée : refusé, rien en base", async ({ page }) => {
    const reponse = await creer(page, { supplierName: "Fournisseur du rôle (payée)", status: "PAID", paymentDate: aujourdhui() });
    expect(reponse.data?.createPurchaseInvoice ?? null, "La facture payée a été créée sans le droit « Marquer comme payée »").toBeNull();
    expect(await enBase("Fournisseur du rôle (payée)")).toBeNull();
  });

  test("Passer une facture payée en la modifiant : refusé, rien ne change", async ({ page }) => {
    const avant = await photo(temoin);
    const reponse = await appelApi(page, `mutation($id: ID!) { updatePurchaseInvoice(id: $id, input: { status: PAID }) { id status } }`, { id: id(facture) }, { organisation: ORG_SAISIE, delai: 15_000 });
    expect(reponse.data?.updatePurchaseInvoice ?? null).toBeNull();
    expect(await photo(temoin)).toBe(avant);
  });

  test("« Marquer payées » sur plusieurs factures : refusé, rien ne change", async ({ page }) => {
    const avant = await photo(temoin);
    const reponse = await appelApi(page, `mutation($ids: [ID!]!) { bulkUpdatePurchaseInvoiceStatus(ids: $ids, status: PAID) { success updatedCount } }`, { ids: [id(facture)] }, { organisation: ORG_SAISIE, delai: 15_000 });
    expect(reponse.data?.bulkUpdatePurchaseInvoiceStatus?.updatedCount ?? 0).toBe(0);
    expect(await photo(temoin)).toBe(avant);
  });

  test("Marquer une facture payée : refusé, rien ne change", async ({ page }) => {
    const avant = await photo(temoin);
    const reponse = await appelApi(page, `mutation($id: ID!) { markPurchaseInvoiceAsPaid(id: $id) { id status } }`, { id: id(facture) }, { organisation: ORG_SAISIE, delai: 15_000 });
    expect(reponse.data?.markPurchaseInvoiceAsPaid ?? null).toBeNull();
    expect(await photo(temoin)).toBe(avant);
  });
});

/**
 * Une autre entreprise envoie l'en-tête de son propre espace (dont elle est
 * bien membre) et l'identifiant d'« Achats » dans les paramètres : l'API ne
 * doit lire que l'espace dont elle a vérifié l'appartenance.
 */
test.describe("Factures d'achat : l'en-tête de son espace n'ouvre pas celui des autres", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  const LECTURES_PAR_ESPACE = [
    ...LECTURES.filter((l) => ["purchaseInvoices", "purchaseInvoiceStats", "purchaseInvoiceReconciliationSuggestions", "purchaseInvoiceDuplicates", "suppliers"].includes(l.champ)),
    {
      nom: "Les transactions proches d'un reçu (app mobile)",
      champ: "matchTransactionsForReceipt",
      requete: `query($w: ID!, $d: DateTime!) { matchTransactionsForReceipt(workspaceId: $w, amount: 1200, date: $d, vendor: "SCI des Tilleuls") { count candidates { transaction { id description } } } }`,
      variables: (w) => ({ w, d: TRANSACTIONS.loyer.date.toISOString() }),
    },
  ];

  for (const l of LECTURES_PAR_ESPACE) {
    test(`« ${l.nom} » d'« Achats » avec l'en-tête de son espace : rien des autres`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelApi(page, l.requete, l.variables(ORG), { organisation: ORG_INTRUS, delai: 15_000 });
      const texte = JSON.stringify(reponse.data ?? {});
      for (const f of FUITES) expect.soft(texte, `« ${f} » renvoyé à une autre entreprise`).not.toContain(f);
      // Seules ses propres factures (créées par d'autres tests de l'intrus) peuvent sortir.
      if (l.champ === "purchaseInvoices" && reponse.data?.purchaseInvoices) {
        const siennes = await (await base()).collection("purchaseinvoices").countDocuments({ workspaceId: new ObjectId(ORG_INTRUS) });
        expect(reponse.data.purchaseInvoices.totalCount, "Des factures d'« Achats » sont comptées pour une autre entreprise").toBeLessThanOrEqual(siennes);
      }
      if (l.champ === "matchTransactionsForReceipt" && reponse.data?.matchTransactionsForReceipt) {
        expect(reponse.data.matchTransactionsForReceipt.count).toBe(0);
      }
    });
  }
});

/**
 * Aperçu des justificatifs par le proxy du site (/api/document-preview) :
 * la réponse de refus arrive avant toute lecture du fichier, sans contenu.
 */
test.describe("Factures d'achat : aperçu des justificatifs des autres refusé", () => {
  const apercu = (page, chemin) => page.request.get(`${BASE_URL}/api/document-preview/${chemin}`, { failOnStatusCode: false, maxRedirects: 0 });
  const nonServi = async (reponse, contexte, statuts) => {
    expect(statuts, `${contexte} : réponse ${reponse.status()}`).toContain(reponse.status());
    const corps = await reponse.body();
    expect(corps.subarray(0, 5).toString(), `${contexte} : un fichier est servi`).not.toBe("%PDF-");
  };

  test.describe("une autre entreprise", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

    test("Justificatif d'une facture d'achat, d'une transaction, facture importée d'« Achats » : refusés", async ({ page }) => {
      await nonServi(await apercu(page, `purchaseInvoice/${id(FA.cafe)}?fileId=${id(FA.cafe.files[0])}`), "Justificatif de facture d'achat", [403, 404]);
      await nonServi(await apercu(page, `transaction/${id(TRANSACTIONS.loyer)}?fileId=${id(TRANSACTIONS.loyer.receiptFiles[0])}`), "Justificatif de transaction", [403, 404]);
      await nonServi(await apercu(page, `importedInvoice/${id(IMPORTEES_ACHATS.validee)}`), "Facture importée", [403, 404]);
    });
  });

  test.describe("le propriétaire de « Saisie Achats »", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });

    test("Justificatif d'une autre facture du même espace, identifiant invalide ou index hors limites : refusés", async ({ page }) => {
      await nonServi(await apercu(page, `purchaseInvoice/${id(FAS.aPayer)}?fileId=${id(FAS.editeurFichier.files[0])}`), "Fichier d'une autre facture", [404]);
      await nonServi(await apercu(page, `purchaseInvoice/${id(FAS.editeurFichier)}?fileId=pas-un-identifiant`), "Identifiant de fichier invalide", [400]);
      await nonServi(await apercu(page, `transaction/${id(TRANSACTIONS_SAISIE.justificatifARetirer)}?index=9999`), "Index hors limites", [400, 404]);
      await nonServi(await apercu(page, `factureInconnue/${id(FAS.aPayer)}`), "Type inconnu", [400]);
    });
  });

  test.describe("sans session", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("Justificatif d'« Achats » sans cookie : 401", async ({ page }) => {
      await nonServi(await apercu(page, `purchaseInvoice/${id(FA.cafe)}?fileId=${id(FA.cafe.files[0])}`), "Sans session", [401]);
    });
  });
});

/** Fusion de fiches fournisseurs par l'Éditeur de « Saisie Achats ». */
test.describe("Factures d'achat : fusion de fiches fournisseurs", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });
  const fusionner = (page, cible, sources) =>
    appelApi(page, `mutation($cible: ID!, $sources: [ID!]!) { mergeSuppliers(targetId: $cible, sourceIds: $sources) { id name } }`, { cible: id(cible), sources: sources.map(id) }, { organisation: ORG_SAISIE, delai: 15_000 });
  const fiche = (f) => base().then((db) => db.collection("suppliers").findOne({ _id: f._id }));

  test("La fiche cible citée parmi les sources est gardée, la source fusionnée, ses factures passent sur la cible", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await fusionner(page, FUSION.cible, [FUSION.cible, FUSION.source]);
    expect(reponse.errors.map((e) => e.message).join(" | ")).toBe("");
    expect(await fiche(FUSION.cible), "La fiche cible a été supprimée par la fusion").not.toBeNull();
    expect(await fiche(FUSION.source)).toBeNull();
    const facture = await (await base()).collection("purchaseinvoices").findOne({ _id: FUSION_FACTURE._id });
    expect({ fiche: String(facture.supplierId), nom: facture.supplierName }).toEqual({ fiche: id(FUSION.cible), nom: FUSION.cible.name });
  });

  test("Une fiche d'une autre entreprise parmi les sources : elle n'est pas supprimée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const temoin = ["suppliers", { _id: FOURNISSEURS.remplissage._id }];
    const avant = await photo(temoin);
    await fusionner(page, FOURNISSEURS_SAISIE.editeur, [FOURNISSEURS.remplissage]);
    expect(await photo(temoin), "La fiche fournisseur d'« Achats » a été supprimée ou modifiée").toBe(avant);
  });
});

/**
 * Quota d'analyses (OCR) de l'offre d'entrée : 50 par mois, déjà consommés.
 * L'analyse d'une facture d'achat et le dépôt d'un justificatif (analysé
 * aussitôt) doivent être refusés avant d'appeler le moteur d'analyse.
 */
test.describe("Factures d'achat : quota d'analyses de l'offre épuisé", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_ACHATS), erreursConsoleAutorisees: /Quota OCR/ });
  const ESPACE = id(COMPTES.freelanceAchats.organisation);
  const quota = () => base().then((db) => db.collection("userocrquotas").findOne({ _id: QUOTA_OCR_EPUISE._id }));

  test("Analyser une facture d'achat : refusé « Quota OCR épuisé », le compteur ne bouge pas", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApiFichier(page, `mutation($file: Upload!, $w: String!) { processDocumentOcr(file: $file, workspaceId: $w) { success message } }`, { file: null, w: ESPACE }, { cle: "file", nom: "facture.pdf", type: "application/pdf", contenu: PDF }, { organisation: ESPACE });
    const texte = [reponse.data?.processDocumentOcr?.message, ...reponse.errors.map((e) => e.message)].filter(Boolean).join(" | ");
    expect(reponse.data?.processDocumentOcr?.success ?? false).toBe(false);
    expect(texte, "L'analyse est lancée malgré le quota épuisé").toMatch(/Quota OCR/i);
    expect((await quota()).usedQuota).toBe(QUOTA_OCR_EPUISE.usedQuota);
  });

  test("Déposer un justificatif sur une dépense : refusé « Quota OCR épuisé », rien n'est ajouté", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const temoin = ["transactions", { _id: TRANSACTION_QUOTA._id }];
    const avant = await photo(temoin);
    const reponse = await appelApiFichier(
      page,
      `mutation($t: ID!, $w: ID!, $files: [Upload!]!) { uploadTransactionReceipt(transactionId: $t, workspaceId: $w, files: $files) { success message } }`,
      { t: id(TRANSACTION_QUOTA), w: ESPACE, files: [null] },
      { cle: "files.0", nom: "ticket.pdf", type: "application/pdf", contenu: PDF },
      { organisation: ESPACE },
    );
    const texte = [reponse.data?.uploadTransactionReceipt?.message, ...reponse.errors.map((e) => e.message)].filter(Boolean).join(" | ");
    expect(texte, "Le justificatif est envoyé à l'analyse malgré le quota épuisé").toMatch(/Quota OCR/i);
    expect(await photo(temoin)).toBe(avant);
  });
});

/** L'auteur d'une facture d'achat lu par un autre membre : son identité, rien de personnel. */
test.describe("Factures d'achat : l'auteur d'une facture ne livre pas ses données personnelles", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });

  test("Abonnement, code de parrainage et banque de l'entreprise de l'auteur : jamais renvoyés", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `query($id: ID!) { purchaseInvoice(id: $id) { id createdBy { id email referralCode subscription { stripeCustomerId } company { name bankDetails { iban bankName } } } } }`,
      { id: id(FACTURE_AUTEUR) },
      { organisation: ORG_SAISIE, delai: 15_000 },
    );
    expect(reponse.data?.purchaseInvoice?.id, reponse.errors.map((e) => e.message).join(" | ")).toBe(id(FACTURE_AUTEUR));
    const texte = JSON.stringify(reponse.data);
    for (const prive of ["cus_e2e_prive", "PARRAIN-E2E-PRIVE", "FR7630006000011234567890189", "Banque Privée Test", "Cabinet Rôle"]) {
      expect.soft(texte, `« ${prive} » renvoyé à un autre membre`).not.toContain(prive);
    }
  });
});
