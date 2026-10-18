/**
 * Factures pré-remplies de l'organisation « Liste », une par état, pour les
 * tests de la liste et des actions. Forme reprise d'une facture enregistrée
 * par l'éditeur (champs par défaut de l'API compris).
 */
import { CLIENTS, COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { entreprise, ligne, snapshotClient } from "./documents.mjs";

/** Une facture « telle qu'enregistrée », avec ses totaux calculés (compte « Liste » par défaut). */
export function facture({ n, numero, statut, emiseIlYa, echeanceDans, client, articles, payeeLe = null, creeeIlYa = 30 - n, compte = "liste" }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const ht = articles.reduce((t, a) => t + a.quantity * a.unitPrice, 0);
  const tva = articles.reduce((t, a) => t + (a.quantity * a.unitPrice * a.vatRate) / 100, 0);
  const emise = DANS(-emiseIlYa);
  return {
    _id: oid("facture", n),
    prefix: "F-092026",
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    dueDate: DANS(echeanceDans),
    paymentDate: payeeLe,
    invoiceType: "standard",
    isDeposit: false,
    situationNumber: 1,
    progressMode: "uniform",
    globalProgressPercentage: 100,
    depositAmount: 0,
    contractTotal: 0,
    client: snapshotClient(client),
    companyInfo: entreprise(compte),
    items: articles.map((a) => ({ details: "", unit: "", discount: 0, discountType: "PERCENTAGE", progressPercentage: 100, vatExemptionText: "", ...a })),
    discount: 0,
    discountType: "PERCENTAGE",
    totalHT: ht,
    totalVAT: tva,
    totalTTC: ht + tva,
    finalTotalHT: ht,
    finalTotalVAT: tva,
    finalTotalTTC: ht + tva,
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
    emailTracking: { emailClickCount: 0, emailOpenCount: 0 },
    linkedTransactionIds: [],
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-creeeIlYa),
    updatedAt: MAINTENANT,
  };
}

/** Les factures, par rôle dans les tests. */
export const FACTURES_LISTE = {
  brouillon: facture({ n: 101, numero: "DRAFT-0001", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: CLIENTS.gamma, articles: [ligne("Étude préalable", 1, 450)] }),
  brouillonASupprimer: facture({ n: 102, numero: "DRAFT-0002", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: CLIENTS.delta, articles: [ligne("Maquettes jetables", 1, 90)] }),
  brouillonAValider: facture({ n: 103, numero: "DRAFT-0003", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: CLIENTS.gamma, articles: [ligne("Mission à valider", 2, 250)] }),
  aEncaisser: facture({ n: 104, numero: "0001", statut: "PENDING", emiseIlYa: 10, echeanceDans: 20, client: CLIENTS.gamma, articles: [ligne("Conseil stratégique", 3, 400)] }),
  enRetard: facture({ n: 105, numero: "0002", statut: "PENDING", emiseIlYa: 45, echeanceDans: -15, client: CLIENTS.delta, articles: [ligne("Identité visuelle", 1, 1800)] }),
  payee: facture({ n: 106, numero: "0003", statut: "COMPLETED", emiseIlYa: 60, echeanceDans: -30, client: CLIENTS.gamma, articles: [ligne("Site vitrine", 1, 2500)], payeeLe: DANS(-35) }),
  annulee: facture({ n: 107, numero: "0004", statut: "CANCELED", emiseIlYa: 50, echeanceDans: -20, client: CLIENTS.delta, articles: [ligne("Mission annulée", 1, 700)] }),
  aMarquerPayee: facture({ n: 108, numero: "0005", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: CLIENTS.delta, articles: [ligne("Atelier à encaisser", 1, 600)] }),
  aAnnuler: facture({ n: 109, numero: "0006", statut: "PENDING", emiseIlYa: 4, echeanceDans: 26, client: CLIENTS.gamma, articles: [ligne("Prestation à annuler", 1, 350)] }),
};

/** Référence affichée d'une facture (« F-092026-0001 »), ou null pour un brouillon. */
export const reference = (f) => (f.status === "DRAFT" ? null : `${f.prefix}-${f.number}`);
