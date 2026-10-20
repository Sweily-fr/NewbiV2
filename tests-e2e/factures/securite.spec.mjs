/**
 * Factures, avoirs, récurrences, modèles, relances et paramètres de
 * facturation : droits vérifiés à l'API, pas seulement à l'écran. Chaque
 * opération GraphQL (schémas de newbi-api : invoice, creditNote,
 * invoiceRecurrence, invoiceTemplate, invoiceReminderSettings,
 * documentSettings, emailSettings, documentEmail,
 * importedInvoice, eInvoicing) est appelée directement, avec la session du
 * navigateur, comme le ferait quelqu'un qui contourne l'interface :
 *   - « Membre » (lecture seule) : lit tout, toute écriture est refusée ;
 *   - « Éditeur » : crée, modifie, envoie et encaisse ; ni suppression, ni
 *     annulation, ni relances, ni paramètres de l'entreprise
 *     (rolePermissions.js : EDITOR_EXCLUDED) ;
 *   - intrus (autre entreprise) : refus en visant l'organisation des
 *     autres, « introuvable » depuis la sienne avec leurs identifiants, et
 *     refus quand l'en-tête dit sa propre organisation mais l'argument
 *     workspaceId celle des autres ;
 *   - visiteur sans session : refus.
 * Un refus doit être explicite et la base doit rester identique. Les
 * opérations à fichier (archiveInvoicePdf, archiveCreditNotePdf,
 * uploadDocumentAnnex, importInvoiceDirect) demandent un envoi multipart :
 * elles ne sont pas couvertes ici (voir le rapport).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, BASE_URL, connecte, SESSION_TOKEN_FACTURES, SESSION_TOKEN_FACTURES_EDITEUR, SESSION_TOKEN_FACTURES_LECTEUR, SESSION_TOKEN_INTRUS } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { AVOIRS_FACTURES, CLIENTS_FACTURES, F, IMPORTEES, MODELES, RECURRENCES } from "../donnees/lot-factures.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { base } from "../base.mjs";

const ORG = id(COMPTES.factures.organisation);
const ORG_ID = COMPTES.factures.organisation._id;
const ORG_INTRUS = id(COMPTES.intrus.organisation);
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const DEMAIN = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const DANS_30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

const clientDe = (c) => ({
  id: id(c),
  name: c.name,
  email: c.email,
  type: c.type,
  ...(c.siret ? { siret: c.siret } : {}),
  ...(c.firstName ? { firstName: c.firstName, lastName: c.lastName } : {}),
  address: { street: c.address.street, city: c.address.city, postalCode: c.address.postalCode, country: c.address.country },
});
const article = (description, prix = 10) => ({ description, quantity: 1, unitPrice: prix, vatRate: 20, unit: "" });

/** Document(s) tels qu'en base, sans les dates de mise à jour : un refus ne doit rien changer. */
async function photo([collection, filtre]) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, __v, ...d }) => d));
}

const _id = (doc) => ({ _id: doc._id });
const parametres = (collection) => () => [collection, { workspaceId: { $in: [ORG_ID, ORG] } }];

/**
 * Opérations d'écriture. `editeur` : "permis" (son rôle le permet : la
 * réponse doit réussir), "refuse", ou "autorise" (le droit passe, l'issue
 * dépend d'un service externe coupé en test : seul le refus de droits est
 * exclu). `cible` : l'opération vise une donnée précise (variante
 * « depuis son organisation » de l'intrus). `workspace` : l'opération prend
 * l'organisation en argument (variante « en-tête de la sienne »).
 */
const ECRITURES = [
  {
    nom: "Créer une facture",
    champ: "createInvoice",
    editeur: "permis",
    workspace: true,
    requete: `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: { client: clientDe(CLIENTS_FACTURES.lumiere), items: [article(`Créée par ${qui}`)], issueDate: AUJOURDHUI, dueDate: DANS_30, status: "DRAFT" },
    }),
    temoin: (qui) => ["invoices", { workspaceId: ORG_ID, "items.description": `Créée par ${qui}` }],
  },
  {
    nom: "Modifier un brouillon",
    champ: "updateInvoice",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!, $input: UpdateInvoiceInput!) { updateInvoice(id: $id, workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, id: id(qui === "editeur" ? F.cibleEditeurModifier : F.cibleBrouillon), input: { footerNotes: `Modifiée par ${qui}` } }),
    temoin: (qui) => ["invoices", _id(qui === "editeur" ? F.cibleEditeurModifier : F.cibleBrouillon)],
  },
  {
    nom: "Supprimer un brouillon",
    champ: "deleteInvoice",
    editeur: "refuse",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { deleteInvoice(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ w, id: id(F.cibleBrouillon) }),
    temoin: () => ["invoices", _id(F.cibleBrouillon)],
  },
  {
    nom: "Envoyer une facture (sendInvoice)",
    champ: "sendInvoice",
    editeur: "permis",
    // L'API ne fait rien de plus que répondre « vrai » (envoi non implémenté).
    sansEffetEnBase: true,
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!, $e: String!) { sendInvoice(id: $id, workspaceId: $w, email: $e) }`,
    variables: (w, qui) => ({ w, id: id(F.cibleAttente), e: `${qui}@e2e.test` }),
    temoin: () => ["invoices", _id(F.cibleAttente)],
  },
  {
    nom: "Marquer une facture comme payée",
    champ: "markInvoiceAsPaid",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!, $d: String!) { markInvoiceAsPaid(id: $id, workspaceId: $w, paymentDate: $d) { id status } }`,
    variables: (w, qui) => ({ w, id: id(qui === "editeur" ? F.cibleEditeurPayer : F.cibleAttente), d: AUJOURDHUI }),
    temoin: (qui) => ["invoices", _id(qui === "editeur" ? F.cibleEditeurPayer : F.cibleAttente)],
  },
  {
    nom: "Annuler une facture",
    champ: "changeInvoiceStatus",
    editeur: "refuse",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { changeInvoiceStatus(id: $id, workspaceId: $w, status: CANCELED) { id status } }`,
    variables: (w) => ({ w, id: id(F.cibleAttente) }),
    temoin: () => ["invoices", _id(F.cibleAttente)],
  },
  {
    nom: "Valider un brouillon (changeInvoiceStatus)",
    champ: "changeInvoiceStatus",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { changeInvoiceStatus(id: $id, workspaceId: $w, status: PENDING) { id status } }`,
    variables: (w, qui) => ({ w, id: id(qui === "editeur" ? F.cibleEditeurValider : F.cibleBrouillon) }),
    temoin: (qui) => ["invoices", _id(qui === "editeur" ? F.cibleEditeurValider : F.cibleBrouillon)],
  },
  {
    nom: "Facturer un devis (createLinkedInvoice)",
    champ: "createLinkedInvoice",
    // Le droit passe (Transformer les devis + Créer des factures) ; le devis visé n'existe pas.
    editeur: "autorise",
    workspace: true,
    requete: `mutation($w: ID!, $q: ID!) { createLinkedInvoice(quoteId: $q, workspaceId: $w, amount: 100, isDeposit: true) { __typename } }`,
    variables: (w) => ({ w, q: id(F.cibleAttente) }),
    temoin: () => ["invoices", { workspaceId: ORG_ID, isDeposit: true }],
  },
  {
    nom: "Supprimer une facture liée à un devis",
    champ: "deleteLinkedInvoice",
    editeur: "refuse",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { deleteLinkedInvoice(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ w, id: id(F.cibleBrouillon) }),
    temoin: () => ["invoices", _id(F.cibleBrouillon)],
  },
  {
    nom: "Renvoyer une facture à la plateforme de facturation électronique",
    champ: "resendInvoiceToSuperPdp",
    editeur: "autorise",
    // Depuis son organisation, l'intrus est arrêté avant la facture : sa facturation électronique n'est pas activée.
    refus: /facturation électronique n'est pas activée/,
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $i: ID!) { resendInvoiceToSuperPdp(workspaceId: $w, invoiceId: $i) { __typename } }`,
    variables: (w) => ({ w, i: id(F.cibleAttente) }),
    temoin: () => ["invoices", _id(F.cibleAttente)],
  },
  {
    nom: "Envoyer une facture par e-mail",
    champ: "sendInvoiceEmail",
    // Le droit passe ; l'envoi lui-même échoue (aucun service d'e-mail en test).
    editeur: "autorise",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendInvoiceEmail(workspaceId: $w, input: $input) { success } }`,
    variables: (w, qui) => ({ w, input: { documentId: id(F.cibleAttente), emailSubject: `Facture envoyée par ${qui}`, emailBody: "Bonjour", recipientEmail: `${qui}@e2e.test` } }),
    temoin: () => ["invoices", _id(F.cibleAttente)],
  },
  {
    nom: "Régime de TVA de la facturation électronique",
    champ: "updateEInvoicingVatRegime",
    editeur: "refuse",
    workspace: true,
    requete: `mutation($w: ID!) { updateEInvoicingVatRegime(workspaceId: $w, vatRegime: "REEL_NORMAL") }`,
    variables: (w) => ({ w }),
    temoin: () => ["organization", { _id: ORG_ID }],
  },
  {
    nom: "Inscription à l'annuaire de la facturation électronique",
    champ: "registerEInvoicingDirectory",
    editeur: "refuse",
    workspace: true,
    requete: `mutation($w: ID!) { registerEInvoicingDirectory(workspaceId: $w) { __typename } }`,
    variables: (w) => ({ w }),
    temoin: () => ["organization", { _id: ORG_ID }],
  },
  {
    nom: "Créer un avoir",
    champ: "createCreditNote",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $input: CreateCreditNoteInput!) { createCreditNote(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: {
        originalInvoiceId: id(qui === "editeur" ? F.aCrediterParEditeur : F.cibleAttente),
        creditType: "COMMERCIAL_GESTURE",
        client: clientDe(qui === "editeur" ? CLIENTS_FACTURES.dumas : CLIENTS_FACTURES.dumas),
        items: [{ ...article(`Avoir de ${qui}`, 1), quantity: -1 }],
        issueDate: AUJOURDHUI,
        refundMethod: "NEXT_INVOICE",
      },
    }),
    temoin: (qui) => ["creditnotes", { workspaceId: ORG_ID, "items.description": `Avoir de ${qui}` }],
  },
  {
    nom: "Modifier un avoir",
    champ: "updateCreditNote",
    // Droit reconnu ; la réponse de l'API est en erreur pour tout le monde (test dédié plus bas).
    editeur: "autorise",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!, $input: UpdateCreditNoteInput!) { updateCreditNote(id: $id, workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, id: id(qui === "editeur" ? AVOIRS_FACTURES.editeur : AVOIRS_FACTURES.cible), input: { reason: `Avoir modifié par ${qui}` } }),
    temoin: (qui) => ["creditnotes", _id(qui === "editeur" ? AVOIRS_FACTURES.editeur : AVOIRS_FACTURES.cible)],
  },
  {
    nom: "Supprimer un avoir",
    champ: "deleteCreditNote",
    editeur: "refuse",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { deleteCreditNote(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ w, id: id(AVOIRS_FACTURES.cible) }),
    temoin: () => ["creditnotes", _id(AVOIRS_FACTURES.cible)],
  },
  {
    nom: "Envoyer un avoir par e-mail",
    champ: "sendCreditNoteEmail",
    editeur: "autorise",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendCreditNoteEmail(workspaceId: $w, input: $input) { success } }`,
    variables: (w, qui) => ({ w, input: { documentId: id(AVOIRS_FACTURES.cible), emailSubject: `Avoir envoyé par ${qui}`, emailBody: "Bonjour", recipientEmail: `${qui}@e2e.test` } }),
    temoin: () => ["creditnotes", _id(AVOIRS_FACTURES.cible)],
  },
  {
    nom: "Rendre une facture récurrente",
    champ: "saveInvoiceRecurrence",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $i: ID!, $input: InvoiceRecurrenceInput!) { saveInvoiceRecurrence(workspaceId: $w, invoiceId: $i, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      i: id(qui === "editeur" ? F.cibleEditeurRecurrence : F.cibleAttente),
      input: { frequency: "MONTHLY", interval: 1, startDate: DEMAIN, emailSubject: `Récurrence de ${qui}` },
    }),
    temoin: (qui) => ["invoicerecurrences", { sourceInvoiceId: (qui === "editeur" ? F.cibleEditeurRecurrence : F.cibleAttente)._id }],
  },
  {
    nom: "Suspendre une récurrence",
    champ: "setInvoiceRecurrenceStatus",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID!, $id: ID!) { setInvoiceRecurrenceStatus(workspaceId: $w, id: $id, status: PAUSED) { id status } }`,
    variables: (w, qui) => ({ w, id: id(qui === "editeur" ? RECURRENCES.cibleEditeur : RECURRENCES.cible) }),
    temoin: (qui) => ["invoicerecurrences", _id(qui === "editeur" ? RECURRENCES.cibleEditeur : RECURRENCES.cible)],
  },
  {
    nom: "Enregistrer une facture comme modèle",
    champ: "saveInvoiceAsTemplate",
    editeur: "permis",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID, $input: SaveInvoiceAsTemplateInput!) { saveInvoiceAsTemplate(input: $input, workspaceId: $w) { id } }`,
    variables: (w, qui) => ({ w, input: { invoiceId: id(F.cibleAttente), name: `Modèle de ${qui}` } }),
    temoin: (qui) => ["invoicetemplates", { workspaceId: ORG_ID, name: `Modèle de ${qui}` }],
  },
  {
    nom: "Supprimer un modèle",
    champ: "deleteInvoiceTemplate",
    editeur: "refuse",
    cible: true,
    workspace: true,
    requete: `mutation($w: ID, $id: ID!) { deleteInvoiceTemplate(id: $id, workspaceId: $w) }`,
    variables: (w) => ({ w, id: id(MODELES.cible) }),
    temoin: () => ["invoicetemplates", _id(MODELES.cible)],
  },
  {
    nom: "Régler les relances automatiques",
    champ: "updateInvoiceReminderSettings",
    editeur: "refuse",
    requete: `mutation($input: InvoiceReminderSettingsInput!) { updateInvoiceReminderSettings(input: $input) { id } }`,
    variables: (_w, qui) => ({ input: { enabled: true, firstReminderDays: 3, secondReminderDays: 9, emailSubject: `Relance réglée par ${qui}` } }),
    temoin: parametres("invoiceremindersettings"),
  },
  {
    nom: "Paramètres par défaut des factures (saveDocumentSettings)",
    champ: "saveDocumentSettings",
    editeur: "refuse",
    requete: `mutation($input: DocumentSettingsInput!) { saveDocumentSettings(input: $input) { __typename } }`,
    variables: (_w, qui) => ({ input: { documentType: "INVOICE", defaultFooterNotes: `Bas de page de ${qui}` } }),
    temoin: parametres("documentsettings"),
  },
  {
    nom: "Expéditeur et modèles d'e-mail (updateEmailSettings)",
    champ: "updateEmailSettings",
    editeur: "refuse",
    workspace: true,
    requete: `mutation($w: ID, $input: EmailSettingsInput!) { updateEmailSettings(workspaceId: $w, input: $input) { __typename } }`,
    variables: (w, qui) => ({ w, input: { fromEmail: `${qui}@e2e.test`, fromName: `Expéditeur ${qui}`, invoiceEmailTemplate: `Modèle de ${qui}` } }),
    temoin: parametres("emailsettings"),
  },
  {
    nom: "Modifier une facture importée",
    champ: "updateImportedInvoice",
    editeur: "permis",
    cible: true,
    requete: `mutation($id: ID!, $input: UpdateImportedInvoiceInput!) { updateImportedInvoice(id: $id, input: $input) { id } }`,
    variables: (_w, qui) => ({ id: id(qui === "editeur" ? IMPORTEES.editeurModifier : IMPORTEES.cible), input: { notes: `Note de ${qui}` } }),
    temoin: (qui) => ["imported_invoices", _id(qui === "editeur" ? IMPORTEES.editeurModifier : IMPORTEES.cible)],
  },
  {
    nom: "Valider une facture importée",
    champ: "validateImportedInvoice",
    editeur: "permis",
    cible: true,
    requete: `mutation($id: ID!) { validateImportedInvoice(id: $id) { id status } }`,
    variables: (_w, qui) => ({ id: id(qui === "editeur" ? IMPORTEES.editeurValider : IMPORTEES.cible) }),
    temoin: (qui) => ["imported_invoices", _id(qui === "editeur" ? IMPORTEES.editeurValider : IMPORTEES.cible)],
  },
  {
    nom: "Rejeter une facture importée",
    champ: "rejectImportedInvoice",
    editeur: "permis",
    cible: true,
    requete: `mutation($id: ID!, $r: String) { rejectImportedInvoice(id: $id, reason: $r) { id status } }`,
    variables: (_w, qui) => ({ id: id(qui === "editeur" ? IMPORTEES.editeurRejeter : IMPORTEES.cible), r: `Rejet de ${qui}` }),
    temoin: (qui) => ["imported_invoices", _id(qui === "editeur" ? IMPORTEES.editeurRejeter : IMPORTEES.cible)],
  },
  {
    nom: "Archiver une facture importée",
    champ: "archiveImportedInvoice",
    editeur: "permis",
    cible: true,
    requete: `mutation($id: ID!) { archiveImportedInvoice(id: $id) { id status } }`,
    variables: (_w, qui) => ({ id: id(qui === "editeur" ? IMPORTEES.editeurArchiver : IMPORTEES.cible) }),
    temoin: (qui) => ["imported_invoices", _id(qui === "editeur" ? IMPORTEES.editeurArchiver : IMPORTEES.cible)],
  },
  {
    nom: "Supprimer une facture importée",
    champ: "deleteImportedInvoice",
    editeur: "refuse",
    cible: true,
    requete: `mutation($id: ID!) { deleteImportedInvoice(id: $id) }`,
    variables: () => ({ id: id(IMPORTEES.cible) }),
    temoin: () => ["imported_invoices", _id(IMPORTEES.cible)],
  },
  {
    nom: "Supprimer plusieurs factures importées",
    champ: "deleteImportedInvoices",
    editeur: "refuse",
    cible: true,
    // Renvoie un nombre : 0 suppression vaut refus.
    nombre: true,
    requete: `mutation($ids: [ID!]!) { deleteImportedInvoices(ids: $ids) }`,
    variables: () => ({ ids: [id(IMPORTEES.cible)] }),
    temoin: () => ["imported_invoices", _id(IMPORTEES.cible)],
  },
];

/** Lectures : [nom, champ, requête, variables(w)] ; null permis pour les valeurs qui peuvent manquer. */
const LECTURES = [
  ["Une facture", "invoice", `query($w: ID!, $id: ID!) { invoice(id: $id, workspaceId: $w) { id number client { name } } }`, (w) => ({ w, id: id(F.attente) })],
  ["La liste des factures", "invoices", `query($w: ID!) { invoices(workspaceId: $w, page: 1, limit: 100) { invoices { id number client { name } } totalCount } }`, (w) => ({ w })],
  ["Les compteurs des factures", "invoiceStats", `query($w: ID!) { invoiceStats(workspaceId: $w) { totalCount totalAmount } }`, (w) => ({ w })],
  ["Les soldes des factures", "invoiceBalances", `query($w: ID!) { invoiceBalances(workspaceId: $w) { totalBilled totalPaid } }`, (w) => ({ w })],
  ["Le prochain numéro de facture", "nextInvoiceNumber", `query($w: ID!) { nextInvoiceNumber(workspaceId: $w, prefix: "F-092026") }`, (w) => ({ w })],
  ["La date de la dernière facture", "latestInvoiceIssueDate", `query($w: ID!) { latestInvoiceIssueDate(workspaceId: $w) }`, (w) => ({ w })],
  ["Un numéro de facture existe-t-il", "checkInvoiceNumberExists", `query($w: ID!) { checkInvoiceNumberExists(workspaceId: $w, number: "0001", prefix: "F-092026") }`, (w) => ({ w })],
  ["Les références de situation", "situationReferences", `query($w: ID!) { situationReferences(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Les factures de situation d'un devis", "situationInvoicesByQuoteRef", `query($w: ID!) { situationInvoicesByQuoteRef(workspaceId: $w, purchaseOrderNumber: "D-092026-0001") { id } }`, (w) => ({ w })],
  ["L'adresse du PDF d'une facture", "invoiceDocumentUrl", `query($w: ID!, $i: ID!) { invoiceDocumentUrl(workspaceId: $w, invoiceId: $i) }`, (w) => ({ w, i: id(F.attente) })],
  ["Un avoir", "creditNote", `query($w: ID!, $id: ID!) { creditNote(id: $id, workspaceId: $w) { id number reason } }`, (w) => ({ w, id: id(AVOIRS_FACTURES.existant) })],
  ["La liste des avoirs", "creditNotes", `query($w: ID!) { creditNotes(workspaceId: $w, page: 1, limit: 100) { __typename } }`, (w) => ({ w })],
  ["Les avoirs d'une facture", "creditNotesByInvoice", `query($w: ID!, $i: ID!) { creditNotesByInvoice(invoiceId: $i, workspaceId: $w) { id number } }`, (w) => ({ w, i: id(F.avecAvoir) })],
  ["Les compteurs des avoirs", "creditNoteStats", `query($w: ID!) { creditNoteStats(workspaceId: $w) { __typename } }`, (w) => ({ w })],
  ["Le prochain numéro d'avoir", "nextCreditNoteNumber", `query($w: ID!) { nextCreditNoteNumber(workspaceId: $w) }`, (w) => ({ w })],
  ["L'adresse du PDF d'un avoir", "creditNoteDocumentUrl", `query($w: ID!, $c: ID!) { creditNoteDocumentUrl(workspaceId: $w, creditNoteId: $c) }`, (w) => ({ w, c: id(AVOIRS_FACTURES.existant) })],
  ["Les factures récurrentes", "invoiceRecurrences", `query($w: ID!) { invoiceRecurrences(workspaceId: $w) { id sourceInvoice { clientName } } }`, (w) => ({ w })],
  ["Les modèles de factures", "invoiceTemplates", `query($w: ID) { invoiceTemplates(workspaceId: $w) { id name } }`, (w) => ({ w })],
  ["Les réglages des relances", "getInvoiceReminderSettings", `query { getInvoiceReminderSettings { id emailSubject } }`, () => ({})],
  ["Les paramètres par défaut des factures", "getDocumentSettings", `query { getDocumentSettings(documentType: INVOICE) { __typename } }`, () => ({})],
  ["L'expéditeur des e-mails", "getEmailSettings", `query($w: ID) { getEmailSettings(workspaceId: $w) { fromEmail } }`, (w) => ({ w })],
  ["Une facture importée", "importedInvoice", `query($id: ID!) { importedInvoice(id: $id) { id originalInvoiceNumber } }`, () => ({ id: id(IMPORTEES.validee) })],
  ["Les factures importées", "importedInvoices", `query($w: ID!) { importedInvoices(workspaceId: $w, page: 1, limit: 100) { invoices { id originalInvoiceNumber } total } }`, (w) => ({ w })],
  ["Les compteurs des factures importées", "importedInvoiceStats", `query($w: ID!) { importedInvoiceStats(workspaceId: $w) { __typename } }`, (w) => ({ w })],
];
/** Lectures dont la valeur peut légitimement être vide (null) pour un membre. */
const PEUT_ETRE_VIDE = new Set(["invoiceDocumentUrl", "creditNoteDocumentUrl", "getDocumentSettings"]);

/** Une réponse ne contient aucune donnée de l'organisation « Factures ». */
function sansFuite(reponse) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const doc of [F.attente, F.cibleAttente, AVOIRS_FACTURES.existant, IMPORTEES.validee, RECURRENCES.active, MODELES.maintenance]) {
    expect(texte, `Fuite : un identifiant de l'organisation « Factures » renvoyé à l'intrus`).not.toContain(id(doc));
  }
  for (const nom of [CLIENTS_FACTURES.lumiere.name, CLIENTS_FACTURES.dumas.name, F.attente.items[0].description, MODELES.maintenance.name]) {
    expect(texte, `Fuite : « ${nom} » renvoyé à l'intrus`).not.toContain(nom);
  }
}

const estRefusDeDroits = (reponse) =>
  reponse.errors.some((e) => /^(FORBIDDEN|UNAUTHENTICATED)$/.test(e.extensions?.code || "") || /n'avez pas la permission|n'êtes pas membre/i.test(e.message));

/**
 * `entete` : organisation annoncée dans l'en-tête, quand elle diffère de
 * celle passée en argument. L'API peut alors travailler dans l'organisation
 * de l'en-tête (la sienne, validée) : seul compte que rien ne bouge chez les
 * autres et que rien de chez eux ne revienne.
 */
async function refusSansEffet(page, op, qui, w, { entete = w } = {}) {
  const avant = await photo(op.temoin(qui));
  const reponse = await appelApi(page, op.requete, op.variables(w, qui), { organisation: entete, delai: 15_000 });
  expect(reponse.sansReponse, `${op.nom} (${qui}) : l'API n'a pas répondu en 15 s`).toBe(false);
  if (entete !== w) {
    sansFuite(reponse);
  } else if (op.nombre && reponse.data?.[op.champ] === 0) {
    // « 0 suppression » : refus silencieux mais sans effet, vérifié par le témoin.
  } else if (op.refus && reponse.errors.some((e) => op.refus.test(e.message)) && !reponse.data?.[op.champ]) {
    // Refus propre à l'opération, sans donnée renvoyée.
  } else {
    verifierRefus(reponse, op.champ, `${op.nom} (${qui})`);
  }
  expect(await photo(op.temoin(qui)), `${op.nom} (${qui}) : la base a changé malgré le refus`).toBe(avant);
}

test.describe("Factures : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_LECTEUR) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Peut lire les factures, avoirs, récurrences, modèles et réglages", async ({ page }) => {
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      expect.soft(reponse.errors, `${nom} : le Membre doit pouvoir lire`).toEqual([]);
      if (!PEUT_ETRE_VIDE.has(champ)) expect.soft(reponse.data?.[champ], `${nom} : aucune donnée renvoyée au Membre`).not.toBeNull();
    }
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "lecteur", ORG);
    });
  }
});

test.describe("Factures : droits du rôle « Éditeur »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const op of ECRITURES) {
    if (op.editeur === "permis") {
      test(`${op.nom} : permis`, async ({ page }) => {
        const avant = await photo(op.temoin("editeur"));
        const reponse = await appelApi(page, op.requete, op.variables(ORG, "editeur"), { organisation: ORG, delai: 15_000 });
        expect(reponse.errors, `${op.nom} : l'Éditeur doit pouvoir le faire`).toEqual([]);
        expect(reponse.data?.[op.champ], `${op.nom} : réponse vide`).toBeTruthy();
        if (!op.sansEffetEnBase) expect(await photo(op.temoin("editeur")), `${op.nom} : rien n'a changé en base`).not.toBe(avant);
      });
    } else if (op.editeur === "autorise") {
      test(`${op.nom} : le droit de l'Éditeur est reconnu`, async ({ page }) => {
        const reponse = await appelApi(page, op.requete, op.variables(ORG, "editeur"), { organisation: ORG, delai: 15_000 });
        expect(reponse.sansReponse, `${op.nom} : l'API n'a pas répondu en 15 s`).toBe(false);
        expect(estRefusDeDroits(reponse), `${op.nom} : refusé à l'Éditeur pour une question de droits (${JSON.stringify(reponse.errors).slice(0, 300)})`).toBe(false);
      });
    } else {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "editeur", ORG);
      });
    }
  }
});

test.describe("Factures : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const [nom, champ, requete, variables] of LECTURES) {
    test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", async () => {
        const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
        sansFuite(reponse);
        verifierRefus(reponse, champ, `${nom} (organisation des autres)`);
      });
      await etape(page, "Depuis sa propre organisation, avec leurs identifiants", async () => {
        sansFuite(await appelApi(page, requete, variables(ORG_INTRUS), { organisation: ORG_INTRUS }));
      });
      await etape(page, "En-tête de sa propre organisation, organisation des autres en argument", async () => {
        sansFuite(await appelApi(page, requete, variables(ORG), { organisation: ORG_INTRUS }));
      });
    });
  }

  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", () => refusSansEffet(page, op, "intrus", ORG));
      if (op.cible) await etape(page, "Depuis sa propre organisation, avec leurs identifiants", () => refusSansEffet(page, op, "intrus", ORG_INTRUS));
      if (op.workspace) await etape(page, "En-tête de sa propre organisation, organisation des autres en argument", () => refusSansEffet(page, op, "intrus", ORG, { entete: ORG_INTRUS }));
    });
  }

  test("Brouillon de l'intrus qui pointe vers un client des autres : aucune donnée de ce client ne revient", async ({ page }) => {
    const c = CLIENTS_FACTURES.lumiere;
    const creer = await appelApi(
      page,
      `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id client { name email address { street } } } }`,
      {
        w: ORG_INTRUS,
        input: {
          client: { id: id(c), name: "Client de l'intrus", email: "client@intrus.test", type: "COMPANY", address: { street: "1 rue de l'Intrus", city: "Paris", postalCode: "75001", country: "France" } },
          items: [article("Brouillon de l'intrus")],
          issueDate: AUJOURDHUI,
          dueDate: DANS_30,
          status: "DRAFT",
        },
      },
      { organisation: ORG_INTRUS },
    );
    const factureId = creer.data?.createInvoice?.id;
    const relue = factureId
      ? await appelApi(page, `query($w: ID!, $id: ID!) { invoice(id: $id, workspaceId: $w) { client { name email address { street city } } } }`, { w: ORG_INTRUS, id: factureId }, { organisation: ORG_INTRUS })
      : creer;
    const texte = JSON.stringify([creer.data, relue.data]);
    expect(texte, "Le nom du client des autres revient à l'intrus").not.toContain(c.name);
    expect(texte, "L'e-mail du client des autres revient à l'intrus").not.toContain(c.email);
    expect(texte, "L'adresse du client des autres revient à l'intrus").not.toContain(c.address.street);
  });

  test.describe(() => {
    // Refus attendus de l'API, que le site écrit dans la console.
    test.use({ erreursConsoleAutorisees: /Facture non trouvée|introuvable|NOT_FOUND|FORBIDDEN|403|404|permission/i });
    test("La consultation d'une facture des autres ne montre rien", async ({ page }) => {
      await page.goto(`/dashboard/outils/factures/${id(F.attente)}`);
      await page.waitForTimeout(4_000);
      const texte = await page.locator("body").innerText();
      expect(texte, "Un article de la facture des autres est affiché").not.toContain(F.attente.items[0].description);
      expect(texte, "Le montant de la facture des autres est affiché").not.toContain("1 080,00");
    });

    test("L'éditeur d'un brouillon des autres ne montre rien", async ({ page }) => {
      await page.goto(`/dashboard/outils/factures/${id(F.brouillon)}/editer`);
      await page.waitForTimeout(4_000);
      const texte = await page.locator("body").innerText();
      expect(texte, "Un article du brouillon des autres est affiché").not.toContain(F.brouillon.items[0].description);
    });

    test("L'avoir d'une facture des autres ne s'affiche pas", async ({ page }) => {
      await page.goto(`/dashboard/outils/factures/${id(F.avecAvoir)}/avoir/${id(AVOIRS_FACTURES.existant)}`);
      await page.waitForTimeout(4_000);
      const texte = await page.locator("body").innerText();
      expect(texte, "Le motif de l'avoir des autres est affiché").not.toContain(AVOIRS_FACTURES.existant.reason);
    });

    test("Le PDF et les données d'impression d'une facture des autres sont refusés", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const chemin of [
        `/api/invoices/data/${id(F.attente)}`,
        `/api/credit-notes/data/${id(AVOIRS_FACTURES.existant)}`,
        `/api/document-preview/invoice/${id(F.attente)}`,
        `/api/document-preview/creditNote/${id(AVOIRS_FACTURES.existant)}`,
      ]) {
        const reponse = await page.request.get(chemin);
        expect.soft(reponse.status(), `${chemin} : accessible à une autre entreprise`).toBeGreaterThanOrEqual(400);
        const corps = await reponse.text();
        expect.soft(corps, `${chemin} : renvoie des données des autres`).not.toContain(F.attente.client.name);
      }
    });
  });
});

test.describe("Factures : sans session, rien", () => {
  // Refus attendus : le jeton est refusé (401), l'API répond « non authentifié ».
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), { organisation: ORG });
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`).toBeNull();
    }
    for (const op of ECRITURES) {
      const avant = await photo(op.temoin("visiteur"));
      const reponse = await appelApi(page, op.requete, op.variables(ORG, "visiteur"), { organisation: ORG, delai: 15_000 });
      expect.soft(reponse.data?.[op.champ] ?? null, `${op.nom} : accepté sans session`).toBeNull();
      expect.soft(await photo(op.temoin("visiteur")), `${op.nom} : la base a changé sans session`).toBe(avant);
    }
  });

  test("PDF et données d'impression : refusés sans session", async ({ page }) => {
    for (const chemin of [`/api/invoices/data/${id(F.attente)}`, `/api/credit-notes/data/${id(AVOIRS_FACTURES.existant)}`, `/api/document-preview/invoice/${id(F.attente)}`]) {
      const reponse = await page.request.get(`${BASE_URL}${chemin}`);
      expect.soft(reponse.status(), `${chemin} : accessible sans session`).toBeGreaterThanOrEqual(400);
      expect.soft(await reponse.text(), `${chemin} : renvoie des données sans session`).not.toContain(F.attente.client.name);
    }
    const pdf = await page.request.get(`${API_URL}/invoices/${id(F.attente)}/document-pdf`);
    expect.soft(pdf.status(), "PDF de l'API accessible sans session").toBeGreaterThanOrEqual(400);
  });
});

/**
 * Règle de l'application (« une facture émise est immuable », app mobile et
 * site) : une facture émise ne se supprime pas et un avoir non plus, même par
 * un appel direct à l'API. L'interface ne propose la suppression que pour
 * les brouillons.
 */
test.describe("Factures : une facture émise ne disparaît pas", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
  const SUPPRIMER = `mutation($w: ID!, $id: ID!) { deleteInvoice(id: $id, workspaceId: $w) }`;

  for (const [cas, f] of [
    ["en attente", F.emiseASupprimerApi],
    ["annulée", F.annuleeASupprimerApi],
  ]) {
    test(`Supprimer une facture ${cas} par l'API : refusé, la facture reste (numéro ${f.number})`, async ({ page }) => {
      const reponse = await appelApi(page, SUPPRIMER, { w: ORG, id: id(f) }, { organisation: ORG });
      const restante = await (await base()).collection("invoices").findOne({ _id: f._id });
      expect(restante, `La facture ${cas} ${f.prefix}-${f.number} a été supprimée : trou dans la numérotation (réponse ${JSON.stringify(reponse.data)})`).not.toBeNull();
      expect(reponse.data?.deleteInvoice ?? null, "L'API annonce la suppression").toBeNull();
    });
  }

  test("Supprimer un avoir par l'API : refusé, l'avoir reste", async ({ page }) => {
    const a = AVOIRS_FACTURES.aSupprimerApi;
    const reponse = await appelApi(page, `mutation($w: ID!, $id: ID!) { deleteCreditNote(id: $id, workspaceId: $w) }`, { w: ORG, id: id(a) }, { organisation: ORG });
    const restant = await (await base()).collection("creditnotes").findOne({ _id: a._id });
    expect(restant, `L'avoir ${a.prefix}-${a.number} a été supprimé : trou dans la numérotation des avoirs (réponse ${JSON.stringify(reponse.data)})`).not.toBeNull();
  });
});

test.describe("Factures : une facture émise ne se modifie pas", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });

  test("Changer le montant d'une facture émise par l'API : refusé (elle se corrige par un avoir)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const f = F.emiseAModifierApi;
    const reponse = await appelApi(
      page,
      `mutation($w: ID!, $id: ID!, $input: UpdateInvoiceInput!) { updateInvoice(id: $id, workspaceId: $w, input: $input) { id finalTotalTTC } }`,
      { w: ORG, id: id(f), input: { items: [{ ...article(f.items[0].description, 9999) }] } },
      { organisation: ORG },
    );
    const apres = await (await base()).collection("invoices").findOne({ _id: f._id });
    expect(apres.finalTotalTTC, `Le montant de la facture émise ${f.prefix}-${f.number} a changé (réponse ${JSON.stringify(reponse.data)})`).toBe(f.finalTotalTTC);
  });
});

/**
 * Texte piégé (XSS stockée) : l'Éditeur enregistre par l'API une facture,
 * un avoir, une récurrence et un modèle dont chaque texte contient du HTML
 * qui exécute du code, avec une marque par champ. Le propriétaire les ouvre :
 * rien ne doit s'exécuter ; sinon le message dit quels champs.
 */
test.describe("Factures : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });
  // L'image piégée n'existe pas : le navigateur la demande (404) avant de lancer le code.
  test.use({ erreursConsoleAutorisees: /x-piege/ });
  const piege = (champ) => `<img src="x-piege-${champ}" onerror="(window.__piege = window.__piege || []).push('${champ}')">`;
  const MARQUE = "Piège XSS facture";
  let factureId = null;
  let avoirId = null;
  const acceptations = {};

  test.beforeAll(async ({ browser }) => {
    const contexte = await browser.newContext({ baseURL: BASE_URL, storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    const creer = await appelApi(
      page,
      `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id } }`,
      {
        w: ORG,
        input: {
          client: clientDe(CLIENTS_FACTURES.lumiere),
          items: [{ ...article(`${MARQUE} ${piege("nom de l'article")}`), details: `Détails ${piege("détails de l'article")}` }],
          headerNotes: `Notes ${piege("notes d'en-tête")}`,
          footerNotes: `Bas de page ${piege("notes de bas de page")}`,
          termsAndConditions: `Conditions ${piege("conditions générales")}`,
          issueDate: AUJOURDHUI,
          dueDate: DANS_30,
          status: "PENDING",
        },
      },
      { organisation: ORG },
    );
    factureId = creer.data?.createInvoice?.id ?? null;
    acceptations.facture = creer;
    if (factureId) {
      const avoir = await appelApi(
        page,
        `mutation($w: ID!, $input: CreateCreditNoteInput!) { createCreditNote(workspaceId: $w, input: $input) { id } }`,
        {
          w: ORG,
          input: {
            originalInvoiceId: factureId,
            creditType: "CORRECTION",
            reason: `Motif ${piege("motif de l'avoir")}`,
            client: clientDe(CLIENTS_FACTURES.lumiere),
            items: [{ ...article(`Avoir ${piege("article de l'avoir")}`, 1), quantity: -1, details: `Détails ${piege("détails de l'avoir")}` }],
            issueDate: AUJOURDHUI,
          },
        },
        { organisation: ORG },
      );
      avoirId = avoir.data?.createCreditNote?.id ?? null;
      acceptations.avoir = avoir;
      acceptations.recurrence = await appelApi(
        page,
        `mutation($w: ID!, $i: ID!, $input: InvoiceRecurrenceInput!) { saveInvoiceRecurrence(workspaceId: $w, invoiceId: $i, input: $input) { id } }`,
        { w: ORG, i: factureId, input: { frequency: "MONTHLY", interval: 1, startDate: DEMAIN, emailSubject: `Objet ${piege("objet de la récurrence")}`, emailBody: `Message ${piege("message de la récurrence")}` } },
        { organisation: ORG },
      );
      acceptations.modele = await appelApi(
        page,
        `mutation($w: ID, $input: SaveInvoiceAsTemplateInput!) { saveInvoiceAsTemplate(input: $input, workspaceId: $w) { id } }`,
        { w: ORG, input: { invoiceId: factureId, name: `Modèle ${piege("nom du modèle")}`, description: `Description ${piege("description du modèle")}` } },
        { organisation: ORG },
      );
    }
    await contexte.close();
  });

  test("L'Éditeur enregistre les textes piégés tels quels ou l'API les refuse avec un message", async () => {
    for (const [nom, reponse] of Object.entries(acceptations)) {
      if (reponse.errors.length) expect.soft(reponse.errors.map((e) => e.message).join(" | "), `${nom} : refus sans explication`).not.toBe("");
    }
    expect(factureId, `Facture piégée refusée : ${JSON.stringify(acceptations.facture?.errors).slice(0, 300)}`).toBeTruthy();
  });

  async function pasExecute(page) {
    await page.waitForTimeout(2_000);
    const executes = await page.evaluate(() => [...new Set(window.__piege || [])]);
    expect(executes, `Du code s'est exécuté depuis : ${executes.join(", ")}`).toEqual([]);
  }

  test("Panneau de la facture (aperçu) : rien ne s'exécute", async ({ page }) => {
    test.skip(!factureId, "Facture piégée non créée");
    await ouvrir(page, `/dashboard/outils/factures?id=${factureId}`, { pret: page.getByRole("heading", { name: "Factures clients" }) });
    await page.getByText(MARQUE).first().waitFor({ timeout: 20_000 }).catch(() => {});
    await pasExecute(page);
  });

  test("Consultation de la facture : rien ne s'exécute", async ({ page }) => {
    test.skip(!factureId, "Facture piégée non créée");
    await ouvrir(page, `/dashboard/outils/factures/${factureId}`);
    await pasExecute(page);
  });

  test("Liste des factures seule (sans panneau) : rien ne s'exécute", async ({ page }) => {
    test.skip(!factureId, "Facture piégée non créée");
    await ouvrir(page, "/dashboard/outils/factures", { pret: page.getByRole("heading", { name: "Factures clients" }) });
    await pasExecute(page);
  });

  test("Onglet « Récurrentes » et fenêtre de la récurrence : rien ne s'exécute", async ({ page }) => {
    test.skip(!factureId, "Facture piégée non créée");
    await ouvrir(page, "/dashboard/outils/factures", { pret: page.getByRole("heading", { name: "Factures clients" }) });
    await page.getByRole("tab", { name: /^Récurrentes/ }).click();
    const gerer = page.getByRole("row").filter({ hasText: CLIENTS_FACTURES.lumiere.name }).getByRole("button", { name: "Gérer" }).first();
    if (await gerer.isVisible().catch(() => false)) await gerer.click();
    await pasExecute(page);
  });

  test("Avoir piégé ouvert par le propriétaire : rien ne s'exécute", async ({ page }) => {
    test.skip(!avoirId, "Avoir piégé non créé");
    await ouvrir(page, `/dashboard/outils/factures/${factureId}/avoir/${avoirId}`);
    await page.getByRole("button", { name: "Suivant" }).click().catch(() => {});
    await pasExecute(page);
  });

  test("Nouvelle facture, menu des modèles : le nom piégé reste du texte", async ({ page }) => {
    test.skip(!acceptations.modele?.data?.saveInvoiceAsTemplate, "Modèle piégé non créé");
    await ouvrir(page, "/dashboard/outils/factures/new", { pret: page.getByText("Sélection d'un client").first() });
    const modeles = page.locator("main button[title='Modèles']");
    if (await modeles.isVisible().catch(() => false)) await modeles.click();
    await pasExecute(page);
  });
});
