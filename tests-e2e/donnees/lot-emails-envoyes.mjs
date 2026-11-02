/**
 * Données du lot « collaboration » : E-mails envoyés (journal des envois,
 * suivi d'ouverture et de clic, événements de remise de Resend).
 *
 * Espace « Envois » (comptes 60 à 63, comptes-collaboration.mjs) :
 *   - propriétaire, « Membre » (lit les factures), un rôle personnalisé
 *     « Devis seulement » (voit les devis, pas les factures) ;
 *   - une autre entreprise « Autre Envoi » avec son propre envoi.
 * Chaque test qui modifie (ouverture, clic, remise) a sa facture et son envoi.
 */
import { DANS, MAINTENANT, oid } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot, roleLot } from "./comptes-collaboration.mjs";

export const COMPTES_ENVOIS = {
  proprietaire: compteLot(60, { email: "envois@e2e.test", name: "Hugo Envois", espace: "Envois Test SASU" }),
  autre: compteLot(63, { email: "autre-envoi@e2e.test", name: "Inès Autre", espace: "Autre Envoi SARL" }),
};

/** Rôle personnalisé : voit les devis et le kanban, jamais les factures. */
export const ROLE_DEVIS_SEULEMENT = roleLot(60, {
  de: COMPTES_ENVOIS.proprietaire,
  name: "Devis seulement",
  description: "Voit les devis, pas les factures",
  actions: { quotes: ["view"], kanban: ["view"] },
});

export const MEMBRES_ENVOIS = {
  membre: membreLot(61, { email: "envois-membre@e2e.test", name: "Léo Membre", de: COMPTES_ENVOIS.proprietaire, role: "viewer" }),
  devisSeulement: membreLot(62, {
    email: "envois-devis@e2e.test",
    name: "Dina Devis",
    de: COMPTES_ENVOIS.proprietaire,
    role: ROLE_DEVIS_SEULEMENT.role,
  }),
};

const ORG = COMPTES_ENVOIS.proprietaire.organisation._id;
const PROPRIO = COMPTES_ENVOIS.proprietaire.utilisateur._id;

/** Texte piégé du message personnalisé : il ne doit jamais s'exécuter dans l'aperçu. */
export const PIEGE_EMAIL =
  `<script>window.top.__xssEmail='script';</script>` +
  `<img src="x-email-piege" onerror="window.top.__xssEmail='onerror'">` +
  `<p>Bonjour, voici votre facture F-2026-0101. Bien cordialement, l’équipe Envois</p>`;

const CLIENT = {
  id: oid("emailDivers", 1).toHexString(),
  name: "Zoé O’Brien Conseil",
  email: "zoe@obrien.test",
  type: "COMPANY",
  siret: "55566677700018",
  vatNumber: "FR55555666777",
  isInternational: false,
  isBlocked: false,
  address: { fullName: "Zoé O’Brien Conseil", street: "12 rue du Bât. n° 4", city: "Nantes", postalCode: "44000", country: "France" },
  documentFields: [],
  hasDifferentShippingAddress: false,
};

const ENTREPRISE = {
  name: "Envois Test SASU",
  email: "facturation@envois.test",
  phone: "+33123456789",
  siret: "98765432100012",
  vatNumber: "FR98765432100",
  companyStatus: "SASU",
  capitalSocial: "10000",
  rcs: "Paris B 987 654 321",
  transactionCategory: "SERVICES",
  vatPaymentCondition: "NONE",
  vatFranchise: false,
  address: { street: "3 rue des Lilas", city: "Paris", postalCode: "75011", country: "France" },
};

/** Facture émise de l'espace « Envois », avec son suivi d'e-mail. */
function facture(n, numero, emailTracking = {}, champs = {}) {
  const ht = 1200;
  return {
    _id: oid("emailDocument", n),
    prefix: "F-2026",
    number: numero,
    status: "PENDING",
    issueDate: DANS(-3),
    issueYear: DANS(-3).getFullYear(),
    dueDate: DANS(27),
    paymentDate: null,
    invoiceType: "standard",
    isDeposit: false,
    situationNumber: 1,
    progressMode: "uniform",
    globalProgressPercentage: 100,
    depositAmount: 0,
    contractTotal: 0,
    client: CLIENT,
    companyInfo: ENTREPRISE,
    items: [
      {
        description: "Accompagnement éditorial",
        quantity: 1,
        unitPrice: ht,
        vatRate: 20,
        details: "",
        unit: "",
        discount: 0,
        discountType: "PERCENTAGE",
        progressPercentage: 100,
        vatExemptionText: "",
      },
    ],
    discount: 0,
    discountType: "PERCENTAGE",
    totalHT: ht,
    totalVAT: ht * 0.2,
    totalTTC: ht * 1.2,
    finalTotalHT: ht,
    finalTotalVAT: ht * 0.2,
    finalTotalTTC: ht * 1.2,
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    showBankDetails: false,
    bankDetails: null,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    appearance: { headerBgColor: "#5b50FF", headerTextColor: "#ffffff", textColor: "#000000" },
    clientPositionRight: false,
    paymentMethod: "BANK_TRANSFER",
    operationType: null,
    purchaseOrderNumber: "",
    retenueGarantie: 0,
    escompte: 0,
    isReverseCharge: false,
    isVatExempt: false,
    eInvoiceStatus: "NOT_SENT",
    eInvoiceFlowType: "NONE",
    eInvoiceEvents: [],
    eReportingStatus: "NOT_REPORTED",
    eReportingPaymentStatus: "NOT_APPLICABLE",
    facturXData: { profile: "EN16931", xmlGenerated: false },
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    abbySyncStatus: "NOT_SYNCED",
    emailTracking: { emailClickCount: 0, emailOpenCount: 0, emailSentAt: DANS(-1), ...emailTracking },
    linkedTransactionIds: [],
    workspaceId: ORG,
    createdBy: PROPRIO,
    createdAt: DANS(-3),
    updatedAt: MAINTENANT,
    ...champs,
  };
}

/** Jetons de suivi (pixel, lien) et identifiants Resend : un par test qui modifie. */
export const SUIVI = {
  ouverture: "e2eSuiviOuvertureFactureEnvois00000000000001",
  ouvertureUi: "e2eSuiviOuvertureAfficheeEnvois00000000000003",
  clic: "e2eSuiviClicFactureEnvois000000000000000000002",
  resendRejet: "e2e-resend-rejet-0000-0000-000000000001",
  resendOuverture: "e2e-resend-ouverture-0000-000000000002",
};

export const FACTURES_ENVOIS = {
  // Facture envoyée, cible de l'aperçu de l'e-mail (lecture seule).
  apercu: facture(1, "0101", { recipientEmail: "zoe@obrien.test", deliveryStatus: "DELIVERED", deliveredAt: DANS(-1) }),
  // Pixel d'ouverture : emailOpenCount +1, première ouverture datée.
  ouverture: facture(2, "0102", { trackingToken: SUIVI.ouverture }),
  // Pixel puis page de l'envoi : l'étape « Ouvert » est datée.
  ouvertureUi: facture(6, "0106", { trackingToken: SUIVI.ouvertureUi }),
  // Lien « Voir la facture » : renvoie vers le PDF en cache du document.
  clic: facture(3, "0103", { trackingToken: SUIVI.clic }, {
    cachedPdf: { key: "factures/F-2026-0103.pdf", url: "https://fichiers.e2e.invalid/factures/F-2026-0103.pdf", generatedAt: DANS(-1) },
  }),
  // Événement de remise non signé (webhook Resend) : ne doit rien changer.
  rejet: facture(4, "0104", {
    resendMessageId: SUIVI.resendRejet,
    recipientEmail: "zoe@obrien.test",
    senderEmail: "envois@e2e.test",
    deliveryStatus: "SENT",
  }),
  // Événement d'ouverture non signé (webhook Resend) : ne doit rien changer.
  ouvertureWebhook: facture(5, "0105", {
    resendMessageId: SUIVI.resendOuverture,
    recipientEmail: "zoe@obrien.test",
    deliveryStatus: "DELIVERED",
  }),
};

const envoi = (n, { documentType = "invoice", documentId, documentNumber, workspaceId = ORG, ...champs }) => ({
  _id: oid("emailEnvoi", n),
  workspaceId,
  documentType,
  documentId,
  documentNumber,
  sentAt: DANS(-1),
  senderEmail: "envois@e2e.test",
  from: "Envois Test SASU <noreply@newbi.test>",
  replyTo: "facturation@envois.test",
  to: "zoe@obrien.test",
  cc: [],
  bcc: [],
  subject: `Facture ${documentNumber}`,
  html: "<p>Bonjour, veuillez trouver votre document.</p>",
  attachments: [{ filename: `${documentNumber}.pdf`, size: 52_000, isDocument: true }],
  deliveryStatus: "SENT",
  createdAt: DANS(-1),
  updatedAt: DANS(-1),
  ...champs,
});

export const ENVOIS = {
  // Facture envoyée avec un message personnalisé piégé et des pièces jointes.
  facture: envoi(1, {
    documentId: FACTURES_ENVOIS.apercu._id,
    documentNumber: "F-2026-0101",
    subject: "Votre facture F-2026-0101 : accompagnement éditorial",
    cc: ["compta@obrien.test"],
    html: `<html><body>${PIEGE_EMAIL}</body></html>`,
    attachments: [
      { filename: "F-2026-0101.pdf", size: 52_000, isDocument: true },
      { filename: "page.html", size: 120, isDocument: false, storageKey: "email-attachments/e2e/page.html", contentType: "text/html" },
      { filename: "ancien-contrat.docx", size: 9_000, isDocument: false },
    ],
    deliveryStatus: "DELIVERED",
    deliveredAt: DANS(-1),
  }),
  // Second envoi du même document : la page propose « Envoi 1 » et « Envoi 2 ».
  factureRenvoi: envoi(2, {
    documentId: FACTURES_ENVOIS.apercu._id,
    documentNumber: "F-2026-0101",
    subject: "Relance : votre facture F-2026-0101",
    sentAt: MAINTENANT,
    to: "direction@obrien.test",
    deliveryStatus: "FAILED",
    deliveryFailedAt: MAINTENANT,
    deliveryFailureReason: "Adresse inexistante",
  }),
  // Devis envoyé : lisible par le rôle « Devis seulement ».
  devis: envoi(3, {
    documentType: "quote",
    documentId: oid("emailDocument", 20),
    documentNumber: "D-2026-0007",
    subject: "Votre devis D-2026-0007",
  }),
  // Envoi d'une autre entreprise : introuvable pour les autres espaces.
  autreEspace: envoi(4, {
    workspaceId: COMPTES_ENVOIS.autre.organisation._id,
    documentId: oid("emailDocument", 30),
    documentNumber: "F-AUTRE-0001",
    subject: "Facture confidentielle de l'autre entreprise",
    senderEmail: "autre-envoi@e2e.test",
  }),
  // Historique du pixel : l'ouverture d'un envoi est notée sur son journal.
  ouverture: envoi(5, {
    documentId: FACTURES_ENVOIS.ouverture._id,
    documentNumber: "F-2026-0102",
    trackingToken: SUIVI.ouverture,
  }),
  ouvertureUi: envoi(7, {
    documentId: FACTURES_ENVOIS.ouvertureUi._id,
    documentNumber: "F-2026-0106",
    trackingToken: SUIVI.ouvertureUi,
  }),
  // Journal de l'envoi visé par l'événement de rejet non signé.
  rejet: envoi(6, {
    documentId: FACTURES_ENVOIS.rejet._id,
    documentNumber: "F-2026-0104",
    resendMessageId: SUIVI.resendRejet,
  }),
};

/** Documents à écrire en base, par collection. */
export function donneesEmailsEnvoyes() {
  return {
    ...docsComptesLot({
      comptes: Object.values(COMPTES_ENVOIS),
      membres: Object.values(MEMBRES_ENVOIS),
      roles: [ROLE_DEVIS_SEULEMENT],
    }),
    invoices: Object.values(FACTURES_ENVOIS),
    document_email_logs: Object.values(ENVOIS),
  };
}
