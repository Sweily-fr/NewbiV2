/**
 * Transactions : droits vérifiés à l'API (transactions, justificatifs,
 * rapprochement avec les factures de vente, paiements, comptes bancaires,
 * synchronisation) pour le Membre, l'Éditeur, une autre entreprise et un
 * visiteur (voir achats-banque-securite.mjs). Plus : les métriques bancaires
 * d'une entreprise ne sortent pas chez une autre, et un libellé piégé reste
 * du texte chez le propriétaire.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_INTRUS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { COMPTES_BANCAIRES, FACTURES_VENTE, METRIQUES_BANCAIRES, TRANSACTIONS, TRANSACTIONS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { ORG, ORG_INTRUS, ORG_SAISIE, PIEGE, avecSession, verifierDroits, verifierPiegeInerte } from "../achats-banque-securite.mjs";

const T = TRANSACTIONS;
const TS = TRANSACTIONS_SAISIE;
/** Données visées : « Achats » (Membre, intrus, visiteur) ou « Saisie Achats » (écritures permises de l'Éditeur). */
const CIBLES = {
  [ORG]: {
    modifier: T.carburant,
    justificatif: T.loyer,
    lier: [T.virementDelta, FACTURES_VENTE.aEncaisserDelta],
    delier: [T.virementGamma, FACTURES_VENTE.payeeGamma],
    ignorer: T.virementDelta,
    reintegrer: T.ignoree,
    rembourser: T.virementGamma,
    compte: COMPTES_BANCAIRES.achats,
  },
  [ORG_SAISIE]: {
    modifier: TS.editeur,
    justificatif: TS.editeurJustificatif,
    lier: [TS.editeurEncaissement, FACTURES_VENTE.editeur],
    delier: [TS.editeurEncaissementLie, FACTURES_VENTE.editeurLiee],
    ignorer: TS.editeurIgnorer,
    reintegrer: TS.editeurDesignorer,
    rembourser: TS.editeurEncaissement,
    compte: COMPTES_BANCAIRES.saisie,
  },
};
const cibles = (w) => CIBLES[w] || CIBLES[ORG];
const parId = (doc) => ({ _id: doc._id });
const transactionsDe = (w) => ["transactions", { workspaceId: w === ORG_SAISIE ? ORG_SAISIE : ORG }];
const comptesDe = (w) => ["accounts_bankings", { workspaceId: w === ORG_SAISIE ? ORG_SAISIE : ORG }];
const PDF = [...Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")];

const LECTURES = [
  { nom: "Les transactions", champ: "transactions", requete: `query($w: ID!) { transactions(workspaceId: $w, limit: 100) { id description amount } }`, variables: (w) => ({ w }) },
  { nom: "La page de transactions", champ: "transactionsPage", requete: `query($w: ID!) { transactionsPage(workspaceId: $w, page: 1, limit: 50) { items { id description } totalCount } }`, variables: (w) => ({ w }) },
  { nom: "Une transaction", champ: "transaction", requete: `query($id: ID!) { transaction(id: $id) { id description amount } }`, variables: () => ({ id: id(T.loyer) }) },
  { nom: "Une transaction par son identifiant bancaire", champ: "transactionByExternalId", requete: `query($e: String!) { transactionByExternalId(provider: BRIDGE, externalId: $e) { id description } }`, variables: () => ({ e: T.loyer.externalId }) },
  { nom: "Les comptes bancaires", champ: "bankingAccounts", requete: `query($w: ID!) { bankingAccounts(workspaceId: $w) { id name iban balance { current } } }`, variables: (w) => ({ w }) },
  { nom: "Un compte bancaire", champ: "bankingAccount", requete: `query($id: ID!) { bankingAccount(id: $id) { id name iban } }`, variables: () => ({ id: id(COMPTES_BANCAIRES.achats) }) },
  { nom: "Les suggestions de rapprochement", champ: "reconciliationSuggestions", requete: `query($w: ID!) { reconciliationSuggestions(workspaceId: $w) { suggestions { transaction { id description } } } }`, variables: (w) => ({ w }) },
  { nom: "Les transactions rattachables à une facture", champ: "transactionsForInvoice", requete: `query($id: ID!) { transactionsForInvoice(invoiceId: $id) { transactions { id description } } }`, variables: () => ({ id: id(FACTURES_VENTE.aEncaisserDelta) }) },
  { nom: "Les factures rattachables à une transaction", champ: "invoicesForTransaction", requete: `query($id: ID!) { invoicesForTransaction(transactionId: $id) { invoices { id number clientName } } }`, variables: () => ({ id: id(T.virementDelta) }) },
  { nom: "Les factures importées rattachables à une transaction", champ: "importedInvoicesForTransaction", requete: `query($id: ID!) { importedInvoicesForTransaction(transactionId: $id) { invoices { id } } }`, variables: () => ({ id: id(T.virementDelta) }) },
  {
    nom: "Les métriques des appels bancaires",
    champ: "apiMetrics",
    requete: `query($debut: DateTime!, $fin: DateTime!) { apiMetrics(filters: { startDate: $debut, endDate: $fin }) { id requestCount workspaceId } }`,
    variables: () => ({ debut: new Date(Date.now() - 10 * 86_400_000).toISOString(), fin: new Date().toISOString() }),
  },
];

const ECRITURES = [
  {
    nom: "Modifier une transaction (catégorie, libellé)",
    editeur: true,
    cible: true,
    champ: "updateTransaction",
    requete: `mutation($id: ID!, $input: UpdateTransactionInput!) { updateTransaction(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).modifier), input: { category: "repas", description: `Modifiée par ${qui}` } }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).modifier)],
  },
  {
    nom: "Retirer un justificatif",
    editeur: true,
    cible: true,
    champ: "removeTransactionReceiptFile",
    resultat: "succes",
    requete: `mutation($t: ID!, $w: ID!, $f: ID!) { removeTransactionReceiptFile(transactionId: $t, workspaceId: $w, fileId: $f) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).justificatif), w, f: id(cibles(w).justificatif.receiptFiles[0]) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).justificatif)],
  },
  {
    nom: "Ajouter un justificatif",
    editeur: true,
    externe: "stockage de fichiers",
    cible: true,
    champ: "uploadTransactionReceipt",
    resultat: "succes",
    requete: `mutation($t: ID!, $w: ID!, $files: [Upload!]!) { uploadTransactionReceipt(transactionId: $t, workspaceId: $w, files: $files) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).modifier), w, files: [null] }),
    fichier: { cle: "files.0", nom: "ticket.pdf", type: "application/pdf", contenu: PDF },
    temoin: (qui, w) => ["transactions", parId(cibles(w).modifier)],
  },
  {
    nom: "Décider de la facture proposée pour un justificatif",
    editeur: true,
    externe: "proposition de l'analyse des documents (OCR)",
    cible: true,
    champ: "confirmTransactionReceiptInvoice",
    resultat: "succes",
    requete: `mutation($t: ID!, $w: ID!, $f: ID!) { confirmTransactionReceiptInvoice(transactionId: $t, workspaceId: $w, fileId: $f, action: SKIP) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).justificatif), w, f: id(cibles(w).justificatif.receiptFiles[0]) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).justificatif)],
  },
  {
    nom: "Rapprocher une transaction d'une facture de vente",
    editeur: true,
    cible: true,
    champ: "linkTransactionToInvoice",
    resultat: "succes",
    requete: `mutation($t: ID!, $f: ID!) { linkTransactionToInvoice(input: { transactionId: $t, invoiceId: $f, origin: TRANSACTION }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).lier[0]), f: id(cibles(w).lier[1]) }),
    temoin: (qui, w) => ["invoices", parId(cibles(w).lier[1])],
  },
  {
    nom: "Délier une transaction d'une facture de vente",
    editeur: true,
    cible: true,
    champ: "unlinkTransactionFromInvoice",
    resultat: "succes",
    requete: `mutation($t: ID!, $f: ID!) { unlinkTransactionFromInvoice(input: { transactionId: $t, invoiceId: $f }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).delier[0]), f: id(cibles(w).delier[1]) }),
    temoin: (qui, w) => ["invoices", parId(cibles(w).delier[1])],
  },
  {
    nom: "Rapprocher une transaction d'une facture importée",
    editeur: true,
    externe: "aucune facture importée dans les données de test",
    cible: true,
    champ: "linkTransactionToImportedInvoice",
    resultat: "succes",
    requete: `mutation($t: ID!, $f: ID!) { linkTransactionToImportedInvoice(input: { transactionId: $t, importedInvoiceId: $f }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).lier[0]), f: id(cibles(w).lier[1]) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).lier[0])],
  },
  {
    nom: "Ignorer une transaction pour le rapprochement",
    editeur: true,
    cible: true,
    champ: "ignoreTransaction",
    resultat: "succes",
    requete: `mutation($t: ID!) { ignoreTransaction(input: { transactionId: $t }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).ignorer) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).ignorer)],
  },
  {
    nom: "Réintégrer une transaction ignorée",
    editeur: true,
    cible: true,
    champ: "unignoreTransaction",
    resultat: "succes",
    requete: `mutation($t: ID!) { unignoreTransaction(input: { transactionId: $t }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).reintegrer) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).reintegrer)],
  },
  {
    nom: "Créer un paiement",
    editeur: true,
    // Fournisseur bancaire simulé en CI : en prod, Bridge ne fait pas de paiement.
    externe: "paiements non proposés par la banque connectée",
    champ: "processPayment",
    resultat: "succes",
    requete: `mutation($input: ProcessPaymentInput!) { processPayment(input: $input) { success message } }`,
    variables: (w, qui) => ({ input: { amount: 12, currency: "EUR", description: `Paiement de ${qui}`, fromAccount: "e2e-compte-1", toAccount: "FR7630006000011234567890189" } }),
    temoin: (qui, w) => transactionsDe(w),
  },
  {
    nom: "Rembourser une transaction",
    editeur: true,
    externe: "remboursements non proposés par la banque connectée",
    cible: true,
    champ: "processRefund",
    resultat: "succes",
    requete: `mutation($t: ID!) { processRefund(input: { transactionId: $t, reason: "Test" }) { success message } }`,
    variables: (w) => ({ t: id(cibles(w).rembourser) }),
    temoin: (qui, w) => ["transactions", parId(cibles(w).rembourser)],
  },
  {
    nom: "Ajouter un compte bancaire",
    editeur: false,
    champ: "createBankingAccount",
    requete: `mutation($input: CreateAccountInput!) { createBankingAccount(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { type: CHECKING, holderName: `Compte de ${qui}`, holderEmail: `${qui}@e2e.test` } }),
    temoin: (qui, w) => comptesDe(w),
  },
  {
    nom: "Régler un compte bancaire",
    editeur: false,
    cible: true,
    champ: "updateBankingAccount",
    requete: `mutation($id: ID!) { updateBankingAccount(id: $id, input: { notifications: { lowBalance: { enabled: true, threshold: 1 } } }) { id } }`,
    variables: (w) => ({ id: id(cibles(w).compte) }),
    temoin: (qui, w) => ["accounts_bankings", parId(cibles(w).compte)],
  },
  {
    nom: "Supprimer un compte bancaire",
    editeur: false,
    cible: true,
    champ: "deleteBankingAccount",
    requete: `mutation($id: ID!) { deleteBankingAccount(id: $id) }`,
    variables: (w) => ({ id: id(cibles(w).compte) }),
    temoin: (qui, w) => ["accounts_bankings", parId(cibles(w).compte)],
  },
  {
    nom: "Actualiser le solde d'un compte",
    editeur: true,
    externe: "banque connectée (Bridge)",
    cible: true,
    champ: "syncAccountBalance",
    requete: `mutation($a: String!) { syncAccountBalance(accountId: $a) { current } }`,
    variables: (w) => ({ a: cibles(w).compte.externalId }),
    temoin: (qui, w) => ["accounts_bankings", parId(cibles(w).compte)],
  },
  {
    nom: "Synchroniser l'historique d'un compte",
    editeur: true,
    externe: "banque connectée (Bridge)",
    cible: true,
    champ: "syncTransactionHistory",
    requete: `mutation($a: String!) { syncTransactionHistory(accountId: $a) { id } }`,
    variables: (w) => ({ a: cibles(w).compte.externalId }),
    temoin: (qui, w) => transactionsDe(w),
  },
  {
    nom: "Synchroniser toutes les transactions",
    editeur: true,
    externe: "banque connectée (Bridge)",
    champ: "syncAllTransactions",
    requete: `mutation { syncAllTransactions(input: { fullSync: false }) { success transactions } }`,
    variables: () => ({}),
    temoin: (qui, w) => transactionsDe(w),
  },
];
// Valeur d'énumération GraphQL écrite telle quelle dans les variables.
var CHECKING = "CHECKING";

verifierDroits({
  fonctionnalite: "Transactions",
  lectures: LECTURES,
  ecritures: ECRITURES,
  fuites: [id(T.loyer), T.loyer.description, T.virementDelta.description, COMPTES_BANCAIRES.achats.iban, id(COMPTES_BANCAIRES.achats), id(FACTURES_VENTE.aEncaisserDelta)],
});

test.describe("Transactions : métriques bancaires d'une autre entreprise", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  const periode = { debut: new Date(Date.now() - 10 * 86_400_000).toISOString(), fin: new Date().toISOString() };
  const metrique = METRIQUES_BANCAIRES[0];

  test("Coûts et volumes d'appels bancaires : jamais ceux des autres entreprises", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const comparaison = await appelApi(
      page,
      `query($debut: DateTime!, $fin: DateTime!) { costComparison(startDate: $debut, endDate: $fin) { provider totalCost totalRequests } }`,
      periode,
      { organisation: ORG_INTRUS },
    );
    const stats = await appelApi(
      page,
      `query($debut: DateTime!, $fin: DateTime!) { providerStats(provider: BRIDGE, startDate: $debut, endDate: $fin) { totalRequests totalCost } }`,
      periode,
      { organisation: ORG_INTRUS },
    );
    // L'intrus n'a fait aucun appel bancaire : il ne doit voir que zéro.
    const recus = JSON.stringify([comparaison.data, stats.data]);
    expect.soft(recus, `Les ${metrique.requestCount} appels bancaires d'« Achats » sont renvoyés à une autre entreprise`).not.toContain(String(metrique.requestCount));
    expect.soft(recus, `Le coût des appels bancaires d'« Achats » (${metrique.cost.total} €) est renvoyé à une autre entreprise`).not.toContain(String(metrique.cost.total));
  });
});

/**
 * Libellé piégé (XSS stockée) : l'Éditeur modifie par l'API le libellé, le
 * fournisseur et les notes d'une transaction ; le propriétaire ouvre la liste
 * puis le tiroir de la transaction.
 */
test.describe("Transactions : un libellé piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });
  const LIBELLE = `${PIEGE}Libellé piégé`;

  test.beforeAll(async ({ browser }) => {
    const reponse = await avecSession(browser, SESSION_TOKEN_EDITEUR_ACHATS, (page) =>
      appelApi(
        page,
        `mutation($id: ID!, $input: UpdateTransactionInput!) { updateTransaction(id: $id, input: $input) { id } }`,
        { id: id(TS.piege), input: { description: LIBELLE, vendor: `${PIEGE}Fournisseur`, notes: `${PIEGE}Note`, category: `${PIEGE}` } },
        { organisation: ORG_SAISIE },
      ),
    );
    expect(reponse.errors, "L'Éditeur doit pouvoir modifier une transaction").toEqual([]);
  });

  test("Liste et tiroir de la transaction : le texte s'affiche, rien ne s'exécute", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/transactions", { pret: page.getByText("Libellé piégé").first() });
    await etape(page, "Liste", async () => {
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
    await etape(page, "Tiroir de la transaction", async () => {
      await ouvrir(page, `/dashboard/outils/transactions?transactionId=${id(TS.piege)}`, { pret: page.getByRole("dialog").getByText("Libellé piégé").first() });
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
  });
});

test.describe("Transactions : le tiroir d'une transaction des autres ne s'ouvre pas", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS), erreursConsoleAutorisees: /Transaction non trouvée|NOT_FOUND|GraphQL Error/ });

  test("Lien direct vers une transaction d'une autre entreprise : rien ne s'affiche", async ({ page }) => {
    await page.goto(`/dashboard/outils/transactions?transactionId=${id(T.loyer)}`);
    await page.waitForTimeout(4_000);
    const texte = await page.locator("body").innerText();
    expect(texte, "Le libellé de la transaction des autres est affiché").not.toContain(T.loyer.description);
    expect(texte, "Le montant de la transaction des autres est affiché").not.toMatch(/1\s?200,00/);
  });
});

export { COMPTES };
