/**
 * Données du lot « achats-banque » (catalogue, factures d'achat, transactions, prévision).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e0a à e2e0f, e2eca à e2ecf).
 *
 * Trois organisations :
 *   - « Achats » (référence) : catalogue, factures d'achat, compte bancaire,
 *     transactions et prévision tels qu'un client les a ; aucun test ne les
 *     modifie (boutons, affichage, recherche, filtres, exports), avec son
 *     Éditeur et son Membre ;
 *   - « Saisie Achats » : tout ce qui crée, modifie ou supprime, une donnée
 *     par action (l'Éditeur y est aussi membre pour ses écritures permises) ;
 *   - « Achats Freelance » : offre d'entrée (5 champs personnalisés produits
 *     déjà créés) et un catalogue de plus de 100 produits.
 * Plus « Scénarios Test SASU » (sans session) : plafond de 5 scénarios, par l'API.
 * Mêmes formes qu'en prod (modèles Product, ProductCustomField, PurchaseInvoice,
 * Supplier, Transaction, AccountBanking, ManualCashflowEntry, ForecastScenario).
 */
import { COMPTES, MEMBRES, DANS, MAINTENANT, oid } from "./base.mjs";
import { SESSION_TOKEN_BANQUE_ACHATS, SESSION_TOKEN_COMPTABLE_ACHATS, SESSION_TOKEN_ROLE_ACHATS } from "../config.mjs";
import { facture } from "./factures-liste.mjs";
import { ligne } from "./documents.mjs";

const hex = (doc) => doc._id.toHexString();
/**
 * Jour calendaire, à minuit UTC, décalé de `n` jours : dates des opérations
 * bancaires (Bridge les donne ainsi) et des factures d'achat (saisies au jour).
 * Le site les lit en date calendaire, sans décalage de fuseau.
 */
export const jour = (n = 0) => new Date(Date.UTC(MAINTENANT.getUTCFullYear(), MAINTENANT.getUTCMonth(), MAINTENANT.getUTCDate() + n));
const arrondi = (n) => Math.round(n * 100) / 100;
/** Premier jour du mois, décalé de `mois` mois (prévisions mensuelles). */
const debutDeMois = (mois = 0) => new Date(MAINTENANT.getFullYear(), MAINTENANT.getMonth() + mois, 1, 12);

// --- Produits -------------------------------------------------------------------

function produit(n, compte, { name, reference = "", category = "", description = "", unitPrice, vatRate = 20, unit = "unité", linkedProducts = [], customFields = [], creeIlYa = 40 }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("produit", n),
    name,
    description,
    unitPrice,
    vatRate,
    unit,
    category,
    reference,
    showImageOnDocuments: true,
    linkedProducts,
    customFields,
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-creeIlYa),
    updatedAt: MAINTENANT,
  };
}

const lien = (cible, quantity, per = 1, rounding = "UP") => ({ productId: cible._id, quantity, per, rounding });

function champProduit(n, compte, { name, fieldType = "TEXT", order = 0, options = [] }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("champProduit", n),
    name,
    fieldType,
    description: "",
    options,
    placeholder: "",
    isRequired: false,
    order,
    isActive: true,
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-60),
    updatedAt: MAINTENANT,
  };
}

/** Champs personnalisés du catalogue de référence. */
export const CHAMPS_PRODUITS = {
  fournisseur: champProduit(1, "achats", { name: "Fournisseur habituel", order: 0 }),
  stock: champProduit(2, "achats", { name: "Stock", fieldType: "NUMBER", order: 1 }),
};
/** Offre d'entrée : la limite de 5 champs est atteinte. */
export const CHAMPS_FREELANCE_ACHATS = ["Couleur", "Taille", "Matière", "Garantie", "Poids"].map((name, i) => champProduit(10 + i, "freelanceAchats", { name, order: i }));
/** Champs de « Saisie Achats » (un à supprimer, un à renommer). */
export const CHAMPS_SAISIE = {
  aSupprimer: champProduit(20, "saisieAchats", { name: "Champ produit à supprimer", order: 0 }),
  aRenommer: champProduit(21, "saisieAchats", { name: "Champ produit à renommer", order: 1 }),
};

const colle = produit(4, "achats", { name: "Colle carrelage", reference: "COL-025", category: "Matériaux", description: "Sac de 25 kg, couvre 5 m²", unitPrice: 18, vatRate: 10, unit: "unité" });
const carrelage = produit(3, "achats", {
  name: "Carrelage grès cérame",
  reference: "CAR-060",
  category: "Matériaux",
  description: "Carreau 60 x 60, finition mate",
  unitPrice: 34.5,
  vatRate: 10,
  unit: "m²",
  linkedProducts: [lien(colle, 1, 5)],
});

/**
 * Catalogue de référence (« Achats ») : 15 produits, deux pages de 10. Noms,
 * références et catégories variés (accents, unités, TVA à 0 %, produit gratuit,
 * produits liés « 1 pour 5 m² »).
 */
export const PRODUITS = {
  audit: produit(1, "achats", { name: "Audit de sécurité", reference: "AUD-001", category: "Prestations", description: "Audit complet du système d'information", unitPrice: 1200, unit: "jour", customFields: [{ fieldId: CHAMPS_PRODUITS.fournisseur._id, value: "Cabinet Martin" }] }),
  cable: produit(2, "achats", { name: "Câble réseau 5 m", reference: "CAB-005", category: "Matériel", unitPrice: 8.9, customFields: [{ fieldId: CHAMPS_PRODUITS.stock._id, value: 42 }] }),
  carrelage,
  colle,
  developpement: produit(5, "achats", { name: "Développement web", reference: "DEV-001", category: "Prestations", description: "Prestation de développement web", unitPrice: 500, unit: "jour" }),
  ecran: produit(6, "achats", { name: "Écran 27 pouces", reference: "ECR-027", category: "Matériel", description: "Écran IPS 27 pouces", unitPrice: 289.99 }),
  formation: produit(7, "achats", { name: "Formation Excel", reference: "FOR-EXC", category: "Formation", description: "Organisme de formation exonéré", unitPrice: 350, vatRate: 0, unit: "jour" }),
  hebergement: produit(8, "achats", { name: "Hébergement annuel", reference: "HEB-12", category: "Abonnements", unitPrice: 120, unit: "année" }),
  livre: produit(9, "achats", { name: "Livre Comptabilité facile", reference: "LIV-001", category: "Fournitures", unitPrice: 24.9, vatRate: 5.5 }),
  maintenance: produit(10, "achats", { name: "Maintenance mensuelle", reference: "MNT-M", category: "Abonnements", unitPrice: 89, unit: "mois" }),
  pose: produit(11, "achats", {
    name: "Pose de carrelage",
    reference: "POS-CAR",
    category: "Prestations",
    description: "Pose collée, joints compris",
    unitPrice: 45,
    vatRate: 10,
    unit: "m²",
    linkedProducts: [lien(carrelage, 1, 1), lien(colle, 1, 5)],
  }),
  souris: produit(12, "achats", { name: "Souris sans fil", reference: "SOU-001", category: "Matériel", unitPrice: 24.99 }),
  support: produit(13, "achats", { name: "Support technique", reference: "SUP-H", category: "Prestations", unitPrice: 65, unit: "heure" }),
  tapis: produit(14, "achats", { name: "Tapis de souris", reference: "TAP-001", category: "Matériel", unitPrice: 9.9 }),
  visite: produit(15, "achats", { name: "Visite de chantier", description: "Offerte avant tout devis", unitPrice: 0 }),
};

/** « Saisie Achats » : un produit par action des tests du catalogue. */
const sousCouche = produit(109, "saisieAchats", { name: "Sous-couche parquet", reference: "SCP-10", category: "Matériaux", unitPrice: 4.5, vatRate: 10, unit: "m²" });
const cibleLiee = produit(103, "saisieAchats", { name: "Cible liée à supprimer", reference: "CIB-001", unitPrice: 12 });
export const PRODUITS_SAISIE = {
  aModifier: produit(101, "saisieAchats", { name: "Produit à modifier", reference: "MOD-001", category: "Prestations", unitPrice: 100 }),
  aSupprimer: produit(102, "saisieAchats", { name: "Produit à supprimer", reference: "SUP-001", unitPrice: 50 }),
  cibleLiee,
  parentLie: produit(104, "saisieAchats", { name: "Parent d'un lien", reference: "PAR-001", unitPrice: 30, linkedProducts: [lien(cibleLiee, 2, 1)] }),
  lotA: produit(105, "saisieAchats", { name: "Lot à supprimer A", reference: "LOT-A", unitPrice: 10 }),
  lotB: produit(106, "saisieAchats", { name: "Lot à supprimer B", reference: "LOT-B", unitPrice: 11 }),
  aCopier: produit(107, "saisieAchats", { name: "Produit à copier", reference: "COP-7781", unitPrice: 15 }),
  parquet: produit(108, "saisieAchats", { name: "Pose de parquet", reference: "PAR-M2", category: "Prestations", unitPrice: 38, vatRate: 10, unit: "m²" }),
  sousCouche,
  boeuf: produit(110, "saisieAchats", { name: "Bœuf bourguignon", reference: "BOE-001", category: "Traiteur", unitPrice: 14.5, vatRate: 10, unit: "personne(s)" }),
  doublon: produit(111, "saisieAchats", { name: "Produit déjà au catalogue", reference: "DEJ-001", unitPrice: 20 }),
  renommer: produit(112, "saisieAchats", { name: "Produit à renommer", reference: "REN-001", unitPrice: 21 }),
  champ: produit(113, "saisieAchats", { name: "Produit à compléter", reference: "CPL-001", unitPrice: 22 }),
  editeur: produit(114, "saisieAchats", { name: "Produit modifiable par l'Éditeur", reference: "EDI-001", unitPrice: 23 }),
  piege: produit(115, "saisieAchats", { name: "Produit piégé par un membre", reference: "PIE-001", unitPrice: 24 }),
  multiligne: produit(116, "saisieAchats", { name: "Produit description multiligne", reference: "MUL-001", description: "Première ligne\nDeuxième ligne", unitPrice: 25 }),
  formule: produit(117, "saisieAchats", { name: "=HYPERLINK(\"https://piege.example\";\"Cliquez\")", reference: "FOR-001", unitPrice: 26 }),
  symboles: produit(118, "saisieAchats", { name: "Produit aux symboles", reference: "SYM-001", description: "Prix < 10 € & délai > 2 jours <b>gras</b>", unitPrice: 27 }),
};

/** Catalogue de plus de 100 produits (offre d'entrée) : « Article 001 » à « Article 105 ». */
export const PRODUITS_VOLUMINEUX = Array.from({ length: 105 }, (_, i) =>
  produit(200 + i, "freelanceAchats", { name: `Article ${String(i + 1).padStart(3, "0")}`, reference: `ART-${String(i + 1).padStart(3, "0")}`, unitPrice: 10 + i }),
);

// --- Fournisseurs et factures d'achat ----------------------------------------------

function fournisseur(n, compte, name, defaultCategory = "OTHER") {
  const { utilisateur, organisation } = COMPTES[compte];
  return { _id: oid("fournisseur", n), name, defaultCategory, workspaceId: organisation._id, createdBy: utilisateur._id, createdAt: DANS(-90), updatedAt: MAINTENANT };
}

function fichier(n, compte, nom) {
  const { organisation } = COMPTES[compte];
  const cle = `${hex(organisation)}/purchase-invoices/${n}-${nom.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
  return {
    _id: oid("fichierAchats", n),
    filename: cle.split("/").pop(),
    originalFilename: nom,
    mimetype: "application/pdf",
    path: cle,
    size: 48213,
    url: `https://fichiers.e2e.invalid/${cle}`,
    ocrProcessed: false,
    ocrData: null,
    createdAt: DANS(-10),
    updatedAt: DANS(-10),
  };
}

/**
 * Une facture d'achat « telle qu'enregistrée » par la saisie manuelle :
 * TVA calculée depuis le HT et le taux, ou depuis un détail par taux.
 */
function factureAchat(n, compte, { fournisseur: f, numero = "", emiseIlYa, echeanceDans = null, ht = null, taux = 20, ttc = null, detail = [], statut, categorie = "OTHER", sousCategorie = null, devise = "EUR", fichiers = [], transactions = [], payeeIlYa = null, moyen = null, notes = "", reference = "" }) {
  const { utilisateur, organisation } = COMPTES[compte];
  let amountHT;
  let amountTVA;
  let vatRate = taux;
  if (detail.length >= 2) {
    amountHT = arrondi(detail.reduce((t, l) => t + l.baseHT, 0));
    amountTVA = arrondi(detail.reduce((t, l) => t + l.amountTVA, 0));
    vatRate = [...detail].sort((a, b) => b.baseHT - a.baseHT)[0].rate;
  } else if (ht !== null) {
    amountHT = ht;
    amountTVA = arrondi((ht * taux) / 100);
  } else {
    amountHT = arrondi(ttc / (1 + taux / 100));
    amountTVA = arrondi(ttc - amountHT);
  }
  const amountTTC = ttc ?? arrondi(amountHT + amountTVA);
  return {
    _id: oid("factureAchat", n),
    supplierName: f.name,
    supplierId: f._id,
    invoiceNumber: numero,
    issueDate: jour(-emiseIlYa),
    ...(echeanceDans !== null ? { dueDate: jour(echeanceDans) } : {}),
    amountHT,
    amountTVA,
    vatRate,
    vatBreakdown: detail,
    amountTTC,
    currency: devise,
    status: statut,
    category: categorie,
    subcategory: sousCategorie,
    tags: [],
    notes,
    internalReference: reference,
    files: fichiers,
    ocrMetadata: {},
    ...(payeeIlYa !== null ? { paymentDate: jour(-payeeIlYa) } : {}),
    ...(moyen ? { paymentMethod: moyen } : {}),
    linkedTransactionIds: transactions.map((t) => t._id),
    isReconciled: transactions.length > 0,
    source: "MANUAL",
    eInvoiceStatus: "NOT_APPLICABLE",
    eInvoicePaymentReportStatus: "NOT_APPLICABLE",
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-emiseIlYa),
    updatedAt: MAINTENANT,
  };
}

// --- Compte bancaire et transactions ------------------------------------------------

function compteBancaire(n, compte, { name, iban, solde }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("compteBancaire", n),
    externalId: `e2e-compte-${n}`,
    provider: "bridge",
    name,
    type: "checking",
    status: "active",
    balance: solde,
    currency: "EUR",
    iban,
    institutionName: "Banque Test",
    institutionLogo: null,
    workspaceId: hex(organisation),
    userId: utilisateur._id,
    lastSyncAt: MAINTENANT,
    transactionSync: { lastSyncAt: MAINTENANT, status: "complete", totalTransactions: 0, oldestTransactionDate: DANS(-120), newestTransactionDate: MAINTENANT, lastError: null, history: [] },
    createdAt: DANS(-120),
    updatedAt: MAINTENANT,
  };
}

export const COMPTES_BANCAIRES = {
  achats: compteBancaire(1, "achats", { name: "Compte courant pro", iban: "FR7630006000011234567890189", solde: 12345.67 }),
  achatsEpargne: compteBancaire(2, "achats", { name: "Livret pro", iban: "FR7630006000019876543210123", solde: 5000 }),
  saisie: compteBancaire(3, "saisieAchats", { name: "Compte courant saisie", iban: "FR7630006000015555555555512", solde: 8000 }),
  freelance: compteBancaire(4, "freelanceAchats", { name: "Compte pro freelance", iban: "FR7630006000017777777777734", solde: 2500 }),
};

function justificatif(n, compte, nom, { avecId = true } = {}) {
  const { utilisateur, organisation } = COMPTES[compte];
  const cle = `${hex(organisation)}/receipts/${n}-${nom.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
  return {
    ...(avecId ? { _id: oid("fichierAchats", n) } : {}),
    url: `https://fichiers.e2e.invalid/${cle}`,
    key: cle,
    filename: nom,
    mimetype: "application/pdf",
    size: 23456,
    uploadedAt: DANS(-3),
    uploadedBy: hex(utilisateur),
    ocrProcessed: true,
    ocrClaimedAt: null,
    ocrError: null,
    purchaseInvoiceId: null,
    ocrProposal: null,
  };
}

/**
 * Une transaction bancaire « telle que synchronisée » (Bridge) : montant
 * signé (débit négatif), libellé, catégorie fine du référentiel, liens de
 * rapprochement des deux côtés.
 */
function transaction(n, compte, { libelle, montant, ilYa, categorie = null, compteBancaire: cb, factures = [], facturesAchat = [], justificatifs = [], statut = null, moyen = null, reference = null, provider = "bridge" }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const liee = factures.length + facturesAchat.length > 0;
  const expense = categorie ? EXPENSE[categorie] || "OTHER" : null;
  return {
    _id: oid("transactionBancaire", n),
    externalId: `e2e-tx-${n}`,
    provider,
    type: montant > 0 ? "credit" : "debit",
    status: "completed",
    amount: montant,
    currency: "EUR",
    description: libelle,
    reference,
    descriptionIsManual: false,
    fromAccount: cb.externalId,
    workspaceId: hex(organisation),
    userId: utilisateur._id,
    date: jour(-ilYa),
    processedAt: jour(-ilYa),
    fees: { amount: 0, currency: "EUR" },
    metadata: moyen ? { paymentMethod: moyen } : {},
    linkedInvoiceIds: factures.map((f) => f._id),
    linkedPurchaseInvoiceIds: facturesAchat.map((f) => f._id),
    linkedImportedInvoiceIds: [],
    reconciliationLinks: [
      ...factures.map((f) => ({ documentType: "INVOICE", documentId: f._id, origin: "TRANSACTION", linkedAt: DANS(-ilYa + 1), linkedBy: hex(utilisateur) })),
      ...facturesAchat.map((f) => ({ documentType: "PURCHASE_INVOICE", documentId: f._id, origin: "DOCUMENT", linkedAt: DANS(-ilYa + 1), linkedBy: hex(utilisateur) })),
    ],
    linkedExpenseId: null,
    category: categorie,
    categoryIsManual: false,
    expenseCategory: expense,
    pcgAccount: { numero: null, intitule: null, confidence: null, isManual: false, manuallySetAt: null, manuallySetBy: null },
    reconciliationStatus: statut || (liee ? "matched" : "unmatched"),
    reconciliationDate: liee ? DANS(-ilYa + 1) : null,
    receiptRequired: montant < 0 && !liee && justificatifs.length === 0,
    receiptFiles: justificatifs,
    deletedAt: null,
    createdAt: DANS(-ilYa),
    updatedAt: MAINTENANT,
  };
}

// Catégorie large des transactions (categoryTaxonomy.js de newbi-api), pour les sous-catégories employées ici.
const EXPENSE = {
  logiciel: "SOFTWARE",
  saas: "SOFTWARE",
  loyer: "RENT",
  carburant: "TRAVEL",
  restaurant: "MEALS",
  telephone: "UTILITIES",
  comptabilite: "SERVICES",
  charges_sociales: "SALARIES",
  banque: "SERVICES",
  train: "TRAVEL",
  materiel: "HARDWARE",
  electricite: "UTILITIES",
  parking: "TRAVEL",
  abonnement: "SUBSCRIPTIONS",
  publicite: "MARKETING",
  hotel: "ACCOMMODATION",
  honoraires: "SERVICES",
  ventes: "SALES",
  bureau: "OFFICE_SUPPLIES",
  conseil: "SERVICES",
  sous_traitance: "SERVICES",
  communication: "MARKETING",
  services: "SERVICES",
  subventions: "GRANTS",
  autre: "OTHER",
};

// --- Clients et factures de vente (rapprochement d'un encaissement) -----------------

function client(n, compte, name, email) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("clientAchats", n),
    type: "COMPANY",
    name,
    email,
    siret: "12345678900011",
    vatNumber: "FR12123456789",
    isInternational: false,
    isBlocked: false,
    hasDifferentShippingAddress: false,
    address: { fullName: name, street: "4 rue du Commerce", city: "Lyon", postalCode: "69002", country: "France" },
    contacts: [],
    notes: [],
    customFields: [],
    activityLog: [],
    assignedMembers: [],
    createdBy: utilisateur._id,
    workspaceId: organisation._id,
    createdAt: DANS(-100),
    updatedAt: MAINTENANT,
  };
}

export const CLIENTS_ACHATS = {
  gamma: client(1, "achats", "Gamma Conseil", "compta@gamma-conseil.test"),
  delta: client(2, "achats", "Studio Delta Création", "bonjour@studio-delta.test"),
  saisie: client(3, "saisieAchats", "Client Encaissement SARL", "paiement@encaissement.test"),
};

function factureVente(n, compte, { numero, statut, emiseIlYa, echeanceDans, client: c, articles, payeeIlYa = null, transactions = [] }) {
  // Copie du client telle que l'éditeur l'enregistre (sans les champs propres à la fiche).
  const { _id, type, name, email, siret, vatNumber, isInternational, address } = c;
  const copie = { _id, type, name, email, siret, vatNumber, isInternational, isBlocked: false, address };
  return {
    ...facture({ n: 1, numero, statut, emiseIlYa, echeanceDans, client: copie, articles, payeeLe: payeeIlYa === null ? null : DANS(-payeeIlYa), creeeIlYa: emiseIlYa, compte }),
    _id: oid("factureVenteAchats", n),
    prefix: "F-2026",
    linkedTransactionIds: transactions.map((t) => t._id),
  };
}

// Identifiants des transactions de référence, pour lier les deux côtés avant de les créer.
const TX = (n) => ({ _id: oid("transactionBancaire", n) });
const FA = (n) => ({ _id: oid("factureAchat", n) });
const FV = (n) => ({ _id: oid("factureVenteAchats", n) });

export const FACTURES_VENTE = {
  payeeGamma: factureVente(1, "achats", { numero: "0101", statut: "COMPLETED", emiseIlYa: 20, echeanceDans: 10, client: CLIENTS_ACHATS.gamma, articles: [ligne("Conseil stratégique", 1, 1200)], payeeIlYa: 5, transactions: [TX(1)] }),
  aEncaisserDelta: factureVente(2, "achats", { numero: "0102", statut: "PENDING", emiseIlYa: 15, echeanceDans: 15, client: CLIENTS_ACHATS.delta, articles: [ligne("Identité visuelle", 1, 2000)] }),
  payeeGamma2: factureVente(3, "achats", { numero: "0103", statut: "COMPLETED", emiseIlYa: 70, echeanceDans: -40, client: CLIENTS_ACHATS.gamma, articles: [ligne("Mission d'accompagnement", 3, 1000)], payeeIlYa: 60, transactions: [TX(14)] }),
  // « Saisie Achats » : encaissement à rapprocher depuis la transaction.
  aRapprocher: factureVente(10, "saisieAchats", { numero: "0201", statut: "PENDING", emiseIlYa: 12, echeanceDans: 18, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation à encaisser", 1, 750)] }),
  liee: factureVente(11, "saisieAchats", { numero: "0202", statut: "COMPLETED", emiseIlYa: 30, echeanceDans: 0, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation encaissée", 1, 400)], payeeIlYa: 8, transactions: [TX(124)] }),
  // Rapprochements de l'Éditeur (sécurité des transactions).
  editeur: factureVente(12, "saisieAchats", { numero: "0203", statut: "PENDING", emiseIlYa: 6, echeanceDans: 24, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation de l'Éditeur", 1, 300)] }),
  editeurLiee: factureVente(13, "saisieAchats", { numero: "0204", statut: "COMPLETED", emiseIlYa: 15, echeanceDans: 15, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation liée de l'Éditeur", 1, 310)], payeeIlYa: 9, transactions: [TX(136)] }),
};

// --- Organisation de référence : fournisseurs, factures d'achat, transactions --------

const F = {
  adobe: fournisseur(1, "achats", "Adobe Systems", "SOFTWARE"),
  martin: fournisseur(2, "achats", "Cabinet Comptable Martin", "SERVICES"),
  tilleuls: fournisseur(3, "achats", "SCI des Tilleuls", "RENT"),
  provence: fournisseur(4, "achats", "Électricité de Provence", "ENERGY"),
  meta: fournisseur(5, "achats", "Méta Platforms Ireland", "MARKETING"),
  orange: fournisseur(6, "achats", "Orange Business", "TELECOMMUNICATIONS"),
  imprimerie: fournisseur(7, "achats", "Imprimerie Lumière", "MARKETING"),
  aws: fournisseur(8, "achats", "Amazon Web Services", "SOFTWARE"),
  cafe: fournisseur(9, "achats", "Restaurant Le Grand Café", "MEALS"),
  total: fournisseur(10, "achats", "TotalEnergies", "TRANSPORT"),
  leroy: fournisseur(11, "achats", "Leroy Merlin", "HARDWARE"),
  hotel: fournisseur(12, "achats", "Hôtel du Commerce", "OTHER"),
  bureau: fournisseur(13, "achats", "Fournitures Bureau Pro", "OFFICE_SUPPLIES"),
  remplissage: fournisseur(14, "achats", "Papeterie du Centre", "OFFICE_SUPPLIES"),
  guillemets: fournisseur(15, "achats", 'Boulangerie "Au Bon Pain"', "MEALS"),
};
export const FOURNISSEURS = F;

/** Factures d'achat de référence : chaque statut, catégorie, devise, détail par taux, justificatif, rapprochement. */
export const FACTURES_ACHAT = {
  adobe: factureAchat(1, "achats", { fournisseur: F.adobe, numero: "ADB-2026-0912", emiseIlYa: 4, ttc: 49.99, statut: "PAID", categorie: "SOFTWARE", sousCategorie: "logiciel", transactions: [TX(3)], payeeIlYa: 3, moyen: "DIRECT_DEBIT" }),
  martin: factureAchat(2, "achats", { fournisseur: F.martin, numero: "HON-T3-2026", emiseIlYa: 80, ht: 583.33, ttc: 700, statut: "PAID", categorie: "SERVICES", sousCategorie: "comptabilite", transactions: [TX(8), TX(9)], payeeIlYa: 45, moyen: "BANK_TRANSFER" }),
  tilleuls: factureAchat(3, "achats", { fournisseur: F.tilleuls, numero: "LOY-2026-10", emiseIlYa: 6, echeanceDans: 5, ht: 1000, statut: "TO_PAY", categorie: "RENT", sousCategorie: "loyer" }),
  provence: factureAchat(4, "achats", { fournisseur: F.provence, numero: "EDP-778812", emiseIlYa: 40, echeanceDans: -10, ttc: 78.4, statut: "OVERDUE", categorie: "UTILITIES", sousCategorie: "electricite" }),
  meta: factureAchat(5, "achats", { fournisseur: F.meta, numero: "FBADS-077-104", emiseIlYa: 9, ttc: 29, statut: "TO_PROCESS", categorie: "MARKETING", sousCategorie: "publicite" }),
  orange: factureAchat(6, "achats", { fournisseur: F.orange, numero: "ORA-0925", emiseIlYa: 42, ttc: 89, statut: "PAID", categorie: "TELECOMMUNICATIONS", sousCategorie: "telephone", payeeIlYa: 40, moyen: "DIRECT_DEBIT" }),
  imprimerie: factureAchat(7, "achats", {
    fournisseur: F.imprimerie,
    numero: "IMP-2026-118",
    emiseIlYa: 14,
    echeanceDans: 16,
    detail: [
      { rate: 20, baseHT: 300, amountTVA: 60 },
      { rate: 5.5, baseHT: 100, amountTVA: 5.5 },
    ],
    statut: "TO_PAY",
    categorie: "MARKETING",
    sousCategorie: "communication",
  }),
  aws: factureAchat(8, "achats", { fournisseur: F.aws, numero: "AWS-EU-55812", emiseIlYa: 11, echeanceDans: 19, ttc: 120, statut: "TO_PAY", categorie: "SOFTWARE", sousCategorie: "saas", devise: "USD" }),
  cafe: factureAchat(9, "achats", { fournisseur: F.cafe, numero: "GC-4471", emiseIlYa: 20, ttc: 132.5, taux: 10, statut: "PENDING", categorie: "MEALS", sousCategorie: "restaurant", fichiers: [fichier(1, "achats", "Facture Grand Café.pdf")] }),
  total: factureAchat(10, "achats", { fournisseur: F.total, emiseIlYa: 15, ttc: 64.8, statut: "TO_PROCESS", categorie: "TRANSPORT", sousCategorie: "carburant" }),
  leroy: factureAchat(11, "achats", { fournisseur: F.leroy, numero: "LM-99120", emiseIlYa: 10, ttc: 230, statut: "PAID", categorie: "HARDWARE", sousCategorie: "materiel", payeeIlYa: 10, moyen: "CREDIT_CARD" }),
  hotel: factureAchat(12, "achats", { fournisseur: F.hotel, numero: "HDC-2026-301", emiseIlYa: 7, echeanceDans: 20, ttc: 245, taux: 10, statut: "TO_PAY", categorie: "OTHER", sousCategorie: "hotel", notes: "Déplacement salon de Lyon" }),
  bureau: factureAchat(13, "achats", { fournisseur: F.bureau, numero: "FBP-7781", emiseIlYa: 120, ttc: 156, statut: "ARCHIVED", categorie: "OFFICE_SUPPLIES", sousCategorie: "bureau" }),
  guillemets: factureAchat(14, "achats", { fournisseur: F.guillemets, numero: "BAP-0930", emiseIlYa: 30, ttc: 24.6, taux: 5.5, statut: "PAID", categorie: "MEALS", sousCategorie: "repas", payeeIlYa: 30, moyen: "CREDIT_CARD", notes: 'Commande "réunion" de rentrée' }),
};

/** Factures de remplissage (anciennes, payées) : 28 factures en tout, deux pages de 25. */
export const FACTURES_ACHAT_REMPLISSAGE = Array.from({ length: 15 }, (_, i) =>
  factureAchat(30 + i, "achats", { fournisseur: F.remplissage, numero: `PDC-2025-${String(i + 1).padStart(3, "0")}`, emiseIlYa: 150 + i * 7, ttc: 40 + i, statut: "PAID", categorie: "OFFICE_SUPPLIES", sousCategorie: "bureau", payeeIlYa: 145 + i * 7, moyen: "CREDIT_CARD" }),
);

const CB = COMPTES_BANCAIRES.achats;
const CBE = COMPTES_BANCAIRES.achatsEpargne;
/**
 * Transactions de référence (25, deux pages de 20) : encaissements rapprochés
 * ou à rapprocher, dépenses catégorisées avec ou sans justificatif, une
 * facture payée en deux virements, une transaction ignorée, un compte épargne.
 */
export const TRANSACTIONS = {
  virementGamma: transaction(1, "achats", { libelle: "VIR SEPA GAMMA CONSEIL FACTURE F-2026-0101", montant: 1440, ilYa: 5, categorie: "honoraires", compteBancaire: CB, factures: [FV(1)], reference: "F-2026-0101" }),
  virementDelta: transaction(2, "achats", { libelle: "VIR SEPA STUDIO DELTA CREATION", montant: 2500, ilYa: 12, compteBancaire: CB }),
  adobe: transaction(3, "achats", { libelle: "PRLV SEPA ADOBE SYSTEMS", montant: -49.99, ilYa: 3, categorie: "logiciel", compteBancaire: CB, facturesAchat: [FA(1)], moyen: "DIRECT_DEBIT" }),
  loyer: transaction(4, "achats", { libelle: "PRLV LOYER SCI DES TILLEULS", montant: -1200, ilYa: 8, categorie: "loyer", compteBancaire: CB, justificatifs: [justificatif(10, "achats", "Quittance octobre.pdf")], moyen: "DIRECT_DEBIT" }),
  carburant: transaction(5, "achats", { libelle: "CB TOTALENERGIES 75 PARIS", montant: -64.8, ilYa: 15, categorie: "carburant", compteBancaire: CB }),
  restaurant: transaction(6, "achats", { libelle: "CB RESTAURANT LE GRAND CAFÉ", montant: -132.5, ilYa: 20, categorie: "restaurant", compteBancaire: CB }),
  orange: transaction(7, "achats", { libelle: "PRLV ORANGE PRO", montant: -89, ilYa: 40, categorie: "telephone", compteBancaire: CB, moyen: "DIRECT_DEBIT" }),
  martin1: transaction(8, "achats", { libelle: "VIR CABINET COMPTABLE MARTIN 1/2", montant: -350, ilYa: 45, categorie: "comptabilite", compteBancaire: CB, facturesAchat: [FA(2)], moyen: "BANK_TRANSFER" }),
  martin2: transaction(9, "achats", { libelle: "VIR CABINET COMPTABLE MARTIN 2/2", montant: -350, ilYa: 75, categorie: "comptabilite", compteBancaire: CB, facturesAchat: [FA(2)], moyen: "BANK_TRANSFER" }),
  ignoree: transaction(10, "achats", { libelle: "VIR SEPA REMBOURSEMENT CAUTION", montant: 980, ilYa: 50, compteBancaire: CB, statut: "ignored" }),
  amazon: transaction(11, "achats", { libelle: "CB AMAZON MARKETPLACE", montant: -18.9, ilYa: 2, compteBancaire: CB }),
  urssaf: transaction(12, "achats", { libelle: "PRLV URSSAF ILE DE FRANCE", montant: -2400, ilYa: 30, categorie: "charges_sociales", compteBancaire: CB, moyen: "DIRECT_DEBIT" }),
  frais: transaction(13, "achats", { libelle: "FRAIS TENUE DE COMPTE", montant: -15, ilYa: 33, categorie: "banque", compteBancaire: CB }),
  virementGamma2: transaction(14, "achats", { libelle: "VIR SEPA GAMMA CONSEIL", montant: 3600, ilYa: 60, categorie: "honoraires", compteBancaire: CB, factures: [FV(3)] }),
  train: transaction(15, "achats", { libelle: "CB SNCF CONNECT", montant: -45.6, ilYa: 25, categorie: "train", compteBancaire: CB }),
  remboursement: transaction(16, "achats", { libelle: "REMBOURSEMENT TROP-PERCU EDF", montant: 150, ilYa: 18, compteBancaire: CB }),
  leroy: transaction(17, "achats", { libelle: "CB LEROY MERLIN IVRY", montant: -230, ilYa: 10, categorie: "materiel", compteBancaire: CB }),
  edf: transaction(18, "achats", { libelle: "PRLV EDF PRO", montant: -78.4, ilYa: 35, categorie: "electricite", compteBancaire: CB, moyen: "DIRECT_DEBIT" }),
  parking: transaction(19, "achats", { libelle: "CB PARKING INDIGO", montant: -12, ilYa: 6, categorie: "parking", compteBancaire: CB }),
  acompte: transaction(20, "achats", { libelle: "VIR SEPA STUDIO DELTA ACOMPTE", montant: 500, ilYa: 70, categorie: "ventes", compteBancaire: CB }),
  publicite: transaction(21, "achats", { libelle: "CB FACEBK ADS META", montant: -29, ilYa: 9, categorie: "publicite", compteBancaire: CB }),
  spotify: transaction(22, "achats", { libelle: "CB SPOTIFY", montant: -9.99, ilYa: 1, categorie: "abonnement", compteBancaire: CB }),
  hotel: transaction(23, "achats", { libelle: "CB HOTEL DU COMMERCE LYON", montant: -245, ilYa: 7, categorie: "hotel", compteBancaire: CB }),
  epargne: transaction(24, "achats", { libelle: "VIREMENT VERS LIVRET PRO", montant: 1000, ilYa: 28, compteBancaire: CBE }),
  interets: transaction(25, "achats", { libelle: "INTERETS LIVRET PRO", montant: 12.5, ilYa: 55, compteBancaire: CBE }),
};

// --- « Saisie Achats » : factures d'achat et transactions à modifier -----------------

const FS = {
  payer: fournisseur(101, "saisieAchats", "Fournisseur à payer", "OTHER"),
  supprimer: fournisseur(102, "saisieAchats", "Fournisseur à supprimer", "OTHER"),
  rapprochee: fournisseur(103, "saisieAchats", "Fournisseur rapproché", "SOFTWARE"),
  groupe: fournisseur(104, "saisieAchats", "Fournisseur groupé", "OFFICE_SUPPLIES"),
  rapprocher: fournisseur(105, "saisieAchats", "Fournisseur à rapprocher", "SERVICES"),
  doublon: fournisseur(106, "saisieAchats", "Fournisseur Doublon", "OTHER"),
  justificatif: fournisseur(107, "saisieAchats", "Fournisseur avec justificatif", "OTHER"),
  editeur: fournisseur(108, "saisieAchats", "Fournisseur de l'Éditeur", "OTHER"),
  aFusionner: fournisseur(109, "saisieAchats", "Fournisseur à fusionner", "OTHER"),
  formule: fournisseur(110, "saisieAchats", '=HYPERLINK("https://piege.example";"Facture")', "OTHER"),
};
export const FOURNISSEURS_SAISIE = FS;
const CBS = COMPTES_BANCAIRES.saisie;

/** Factures d'achat de « Saisie Achats » : une par action. */
export const FACTURES_ACHAT_SAISIE = {
  aPayer: factureAchat(101, "saisieAchats", { fournisseur: FS.payer, numero: "PAY-001", emiseIlYa: 5, echeanceDans: 25, ttc: 120, statut: "TO_PAY", categorie: "OTHER", sousCategorie: "autre" }),
  aSupprimer: factureAchat(102, "saisieAchats", { fournisseur: FS.supprimer, numero: "SUP-001", emiseIlYa: 6, ttc: 75, statut: "TO_PROCESS" }),
  rapprocheeASupprimer: factureAchat(103, "saisieAchats", { fournisseur: FS.rapprochee, numero: "RAP-SUP-1", emiseIlYa: 7, ttc: 59.9, statut: "PAID", categorie: "SOFTWARE", sousCategorie: "logiciel", transactions: [TX(103)], payeeIlYa: 6 }),
  groupeStatut1: factureAchat(104, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-ST-1", emiseIlYa: 8, ttc: 31, statut: "TO_PAY" }),
  groupeStatut2: factureAchat(105, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-ST-2", emiseIlYa: 9, ttc: 32, statut: "TO_PAY" }),
  groupeCategorie1: factureAchat(106, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-CAT-1", emiseIlYa: 10, ttc: 33, statut: "TO_PROCESS" }),
  groupeCategorie2: factureAchat(107, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-CAT-2", emiseIlYa: 11, ttc: 34, statut: "TO_PROCESS" }),
  groupeSupprimer1: factureAchat(108, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-SUP-1", emiseIlYa: 12, ttc: 35, statut: "TO_PROCESS" }),
  groupeSupprimer2: factureAchat(109, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-SUP-2", emiseIlYa: 13, ttc: 36, statut: "TO_PROCESS" }),
  aRapprocher: factureAchat(110, "saisieAchats", { fournisseur: FS.rapprocher, numero: "RAP-110", emiseIlYa: 4, ttc: 210, statut: "TO_PAY", categorie: "SERVICES", sousCategorie: "conseil" }),
  deuxPaiements: factureAchat(111, "saisieAchats", { fournisseur: FS.rapprocher, numero: "RAP-111", emiseIlYa: 20, ttc: 600, statut: "TO_PAY", categorie: "SERVICES", sousCategorie: "sous_traitance" }),
  rapprocheeMontant: factureAchat(112, "saisieAchats", { fournisseur: FS.rapprochee, numero: "RAP-112", emiseIlYa: 15, ttc: 88, statut: "PAID", categorie: "SOFTWARE", sousCategorie: "logiciel", transactions: [TX(112)], payeeIlYa: 14 }),
  rapprocheeCategorie: factureAchat(113, "saisieAchats", { fournisseur: FS.rapprochee, numero: "RAP-113", emiseIlYa: 16, ttc: 66, statut: "PAID", categorie: "SOFTWARE", sousCategorie: "logiciel", transactions: [TX(113)], payeeIlYa: 15 }),
  avecJustificatif: factureAchat(114, "saisieAchats", { fournisseur: FS.justificatif, numero: "JUS-114", emiseIlYa: 3, ttc: 44, statut: "TO_PROCESS", fichiers: [fichier(114, "saisieAchats", "Justificatif à retirer.pdf")] }),
  doublonSource: factureAchat(115, "saisieAchats", { fournisseur: FS.doublon, numero: "DBL-2026-001", emiseIlYa: 2, ttc: 199, statut: "TO_PAY" }),
  delier: factureAchat(116, "saisieAchats", { fournisseur: FS.rapprochee, numero: "RAP-116", emiseIlYa: 18, ttc: 77, statut: "PAID", transactions: [TX(116)], payeeIlYa: 17 }),
  menuStatut: factureAchat(117, "saisieAchats", { fournisseur: FS.payer, numero: "MEN-ST-117", emiseIlYa: 3, ttc: 52, statut: "TO_PROCESS" }),
  menuCategorie: factureAchat(118, "saisieAchats", { fournisseur: FS.payer, numero: "MEN-CAT-118", emiseIlYa: 3, ttc: 53, statut: "TO_PROCESS" }),
  aModifier: factureAchat(119, "saisieAchats", { fournisseur: FS.payer, numero: "MOD-119", emiseIlYa: 3, ttc: 54, statut: "TO_PROCESS" }),
  depuisTransaction: factureAchat(120, "saisieAchats", { fournisseur: FS.rapprocher, numero: "RAP-120", emiseIlYa: 5, ttc: 145, statut: "TO_PAY", categorie: "SERVICES", sousCategorie: "conseil" }),
  // Écritures permises de l'Éditeur (sécurité) : une facture par opération.
  editeur: factureAchat(121, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-121", emiseIlYa: 3, ttc: 61, statut: "TO_PAY" }),
  editeurPayer: factureAchat(122, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-122", emiseIlYa: 3, ttc: 62, statut: "TO_PAY" }),
  editeurDelier: factureAchat(123, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-123", emiseIlYa: 9, ttc: 63, statut: "PAID", transactions: [TX(132)], payeeIlYa: 8 }),
  editeurToutDelier: factureAchat(124, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-124", emiseIlYa: 9, ttc: 64, statut: "PAID", transactions: [TX(133)], payeeIlYa: 8 }),
  editeurFichier: factureAchat(125, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-125", emiseIlYa: 3, ttc: 65, statut: "TO_PROCESS", fichiers: [fichier(125, "saisieAchats", "Justificatif de l'Éditeur.pdf")] }),
  editeurMarquer: factureAchat(126, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-126", emiseIlYa: 3, ttc: 66, statut: "TO_PAY" }),
  editeurStatutGroupe: factureAchat(127, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-127", emiseIlYa: 3, ttc: 67, statut: "TO_PROCESS" }),
  editeurCategorieGroupe: factureAchat(128, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-128", emiseIlYa: 3, ttc: 68, statut: "TO_PROCESS" }),
  editeurRapprocher: factureAchat(129, "saisieAchats", { fournisseur: FS.editeur, numero: "EDI-129", emiseIlYa: 3, ttc: 69, statut: "TO_PAY" }),
  piege: factureAchat(130, "saisieAchats", { fournisseur: FS.editeur, numero: "PIE-130", emiseIlYa: 2, ttc: 70, statut: "TO_PROCESS" }),
  formule: factureAchat(131, "saisieAchats", { fournisseur: FS.formule, numero: "=1+1", emiseIlYa: 2, ttc: 71, statut: "TO_PROCESS" }),
};

/** Transactions de « Saisie Achats » : une par action (catégoriser, rapprocher, justificatifs…). */
export const TRANSACTIONS_SAISIE = {
  rapprocheeASupprimer: transaction(103, "saisieAchats", { libelle: "PRLV LOGICIEL RAPPROCHE 103", montant: -59.9, ilYa: 6, categorie: "logiciel", compteBancaire: CBS, facturesAchat: [FA(103)] }),
  aRapprocher: transaction(110, "saisieAchats", { libelle: "VIR FOURNISSEUR A RAPPROCHER 110", montant: -210, ilYa: 3, categorie: "conseil", compteBancaire: CBS }),
  premierPaiement: transaction(111, "saisieAchats", { libelle: "VIR FOURNISSEUR A RAPPROCHER ACOMPTE", montant: -300, ilYa: 18, compteBancaire: CBS }),
  secondPaiement: transaction(115, "saisieAchats", { libelle: "VIR FOURNISSEUR A RAPPROCHER SOLDE", montant: -300, ilYa: 10, compteBancaire: CBS }),
  rapprocheeMontant: transaction(112, "saisieAchats", { libelle: "PRLV LOGICIEL RAPPROCHE 112", montant: -88, ilYa: 14, categorie: "logiciel", compteBancaire: CBS, facturesAchat: [FA(112)] }),
  rapprocheeCategorie: transaction(113, "saisieAchats", { libelle: "PRLV LOGICIEL RAPPROCHE 113", montant: -66, ilYa: 15, categorie: "logiciel", compteBancaire: CBS, facturesAchat: [FA(113)] }),
  delier: transaction(116, "saisieAchats", { libelle: "PRLV LOGICIEL RAPPROCHE 116", montant: -77, ilYa: 17, compteBancaire: CBS, facturesAchat: [FA(116)] }),
  aCategoriser: transaction(120, "saisieAchats", { libelle: "PRLV ENERGIE A CATEGORISER", montant: -95.3, ilYa: 4, compteBancaire: CBS }),
  libelleAModifier: transaction(121, "saisieAchats", { libelle: "CB LIBELLE A MODIFIER", montant: -19.9, ilYa: 4, compteBancaire: CBS }),
  encaissement: transaction(122, "saisieAchats", { libelle: "VIR SEPA CLIENT ENCAISSEMENT 0201", montant: 900, ilYa: 2, compteBancaire: CBS }),
  depuisTransaction: transaction(123, "saisieAchats", { libelle: "VIR FOURNISSEUR RAPPROCHER 120", montant: -145, ilYa: 2, compteBancaire: CBS }),
  encaissementLie: transaction(124, "saisieAchats", { libelle: "VIR SEPA CLIENT ENCAISSEMENT 0202", montant: 480, ilYa: 8, compteBancaire: CBS, factures: [FV(11)] }),
  justificatifARetirer: transaction(125, "saisieAchats", { libelle: "CB FOURNITURES JUSTIFIEES", montant: -27.4, ilYa: 5, categorie: "bureau", compteBancaire: CBS, justificatifs: [justificatif(125, "saisieAchats", "Ticket fournitures.pdf")] }),
  justificatifSansId: transaction(126, "saisieAchats", { libelle: "CB TICKET SANS IDENTIFIANT", montant: -13.2, ilYa: 5, categorie: "bureau", compteBancaire: CBS, justificatifs: [justificatif(126, "saisieAchats", "Ticket ancien.pdf", { avecId: false })] }),
  aIgnorer: transaction(127, "saisieAchats", { libelle: "VIR INTERNE A IGNORER", montant: 250, ilYa: 6, compteBancaire: CBS }),
  ignoree: transaction(128, "saisieAchats", { libelle: "VIR INTERNE DEJA IGNORE", montant: 260, ilYa: 7, compteBancaire: CBS, statut: "ignored" }),
  editeur: transaction(129, "saisieAchats", { libelle: "CB TRANSACTION DE L'EDITEUR", montant: -16.5, ilYa: 3, compteBancaire: CBS }),
  piege: transaction(130, "saisieAchats", { libelle: "CB TRANSACTION PIEGEE", montant: -17.5, ilYa: 3, compteBancaire: CBS }),
  formule: transaction(131, "saisieAchats", { libelle: "=1+1 VIREMENT FORMULE", montant: -18.5, ilYa: 3, compteBancaire: CBS }),
  // Écritures permises de l'Éditeur (sécurité des factures d'achat et des transactions).
  editeurDelier: transaction(132, "saisieAchats", { libelle: "PRLV EDITEUR A DELIER", montant: -63, ilYa: 8, compteBancaire: CBS, facturesAchat: [FA(123)] }),
  editeurToutDelier: transaction(133, "saisieAchats", { libelle: "PRLV EDITEUR A TOUT DELIER", montant: -64, ilYa: 8, compteBancaire: CBS, facturesAchat: [FA(124)] }),
  editeurRapprocher: transaction(134, "saisieAchats", { libelle: "PRLV EDITEUR A RAPPROCHER", montant: -69, ilYa: 2, compteBancaire: CBS }),
  editeurEncaissement: transaction(135, "saisieAchats", { libelle: "VIR SEPA EDITEUR ENCAISSEMENT", montant: 360, ilYa: 2, compteBancaire: CBS }),
  editeurEncaissementLie: transaction(136, "saisieAchats", { libelle: "VIR SEPA EDITEUR ENCAISSEMENT LIE", montant: 372, ilYa: 9, compteBancaire: CBS, factures: [FV(13)] }),
  editeurIgnorer: transaction(137, "saisieAchats", { libelle: "VIR EDITEUR A IGNORER", montant: 15, ilYa: 2, compteBancaire: CBS }),
  editeurDesignorer: transaction(138, "saisieAchats", { libelle: "VIR EDITEUR A REINTEGRER", montant: 16, ilYa: 2, compteBancaire: CBS, statut: "ignored" }),
  editeurJustificatif: transaction(139, "saisieAchats", { libelle: "CB EDITEUR JUSTIFICATIF", montant: -21, ilYa: 2, compteBancaire: CBS, justificatifs: [justificatif(139, "saisieAchats", "Ticket Éditeur.pdf")] }),
};

// --- Suggestions de rapprochement (offre d'entrée : deux suggestions seulement) ---------

const FF = {
  suggestionA: fournisseur(201, "freelanceAchats", "Hébergeur Suggestion", "SOFTWARE"),
  suggestionB: fournisseur(202, "freelanceAchats", "Assureur Suggestion", "INSURANCE"),
};
/** Débit du même montant qu'une facture d'achat à payer : une carte « Rattacher / Masquer » chacun. */
export const SUGGESTIONS = {
  facture: factureAchat(201, "freelanceAchats", { fournisseur: FF.suggestionA, numero: "HEB-SUG-1", emiseIlYa: 6, echeanceDans: 10, ttc: 39.9, statut: "TO_PAY", categorie: "SOFTWARE", sousCategorie: "saas" }),
  transaction: transaction(201, "freelanceAchats", { libelle: "PRLV HEBERGEUR SUGGESTION", montant: -39.9, ilYa: 2, compteBancaire: COMPTES_BANCAIRES.freelance }),
  factureMasquee: factureAchat(202, "freelanceAchats", { fournisseur: FF.suggestionB, numero: "ASS-SUG-2", emiseIlYa: 8, echeanceDans: 10, ttc: 77.7, statut: "TO_PAY", categorie: "INSURANCE", sousCategorie: "assurance" }),
  transactionMasquee: transaction(202, "freelanceAchats", { libelle: "PRLV ASSUREUR SUGGESTION", montant: -77.7, ilYa: 3, compteBancaire: COMPTES_BANCAIRES.freelance }),
};

// --- Prévision de trésorerie ----------------------------------------------------------

function saisie(n, compte, { name, type, category, subcategory = null, amount, debut = 0, fin = null, frequency = "MONTHLY", scenario = null, notes = "" }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("saisiePrevision", n),
    workspaceId: organisation._id,
    scenarioId: scenario ? scenario._id : null,
    name,
    type,
    category,
    subcategory,
    amount,
    amountDelta: 0,
    amountDeltaType: "AMOUNT",
    startDate: debutDeMois(debut),
    endDate: fin === null ? null : debutDeMois(fin),
    frequency,
    notes,
    excludedMonths: [],
    createdBy: utilisateur._id,
    createdAt: DANS(-20),
    updatedAt: MAINTENANT,
  };
}

function scenario(n, compte, { name, incomeMultiplier = 1, expenseMultiplier = 1 }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("scenarioPrevision", n),
    workspaceId: organisation._id,
    name,
    incomeMultiplier,
    expenseMultiplier,
    createdBy: utilisateur._id,
    recurrenceOverrides: [],
    hiddenManualEntryIds: [],
    excludedOccurrences: [],
    createdAt: DANS(-15),
    updatedAt: MAINTENANT,
  };
}

/** Organisation sans session (propriétaire : celui de « Saisie Achats »), testée par l'API seulement. */
const organisationApi = (n, nom) => ({
  _id: oid("organisation", n),
  name: nom,
  slug: nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
  companyName: nom,
  companyEmail: `facturation@org${n}.test`,
  companyPhone: "+33123456789",
  addressStreet: "1 rue de la Paix",
  addressCity: "Paris",
  addressZipCode: "75001",
  addressCountry: "France",
  siret: "98765432100012",
  legalForm: "SASU",
  vatNumber: "FR98765432100",
  capitalSocial: "10000",
  rcs: "Paris B 987 654 321",
});
/** Plafond de 5 scénarios. */
export const ORGANISATION_SCENARIOS = organisationApi(21, "Scénarios Test SASU");
/** Valeurs hors limites (scénarios) : ce qui y est accepté à tort ne gêne aucun autre test. */
export const ORGANISATION_BORNES = organisationApi(22, "Bornes Test SASU");

export const SCENARIOS = {
  optimiste: scenario(1, "achats", { name: "Optimiste", incomeMultiplier: 1.2, expenseMultiplier: 0.9 }),
  aSupprimer: scenario(10, "saisieAchats", { name: "Scénario à supprimer" }),
  aRenommer: scenario(11, "saisieAchats", { name: "Scénario à renommer", incomeMultiplier: 1.1 }),
  editeur: scenario(12, "saisieAchats", { name: "Scénario de l'Éditeur" }),
  // Offre d'entrée : cinq scénarios, le plafond est atteint à l'écran.
  ...Object.fromEntries(["Été", "Hiver", "Printemps", "Automne", "Année"].map((name, i) => [`freelance${i + 1}`, scenario(30 + i, "freelanceAchats", { name })])),
  // Quatre scénarios déjà créés : le 5e passe, le 6e doit être refusé.
  ...Object.fromEntries(
    ["Prudent", "Croissance", "Crise", "Stable"].map((name, i) => [
      `plafond${i + 1}`,
      { ...scenario(20 + i, "saisieAchats", { name }), workspaceId: ORGANISATION_SCENARIOS._id },
    ]),
  ),
};

/** Prévisions de référence (Base et scénario « Optimiste »). */
export const SAISIES = {
  loyer: saisie(1, "achats", { name: "Loyer bureau", type: "EXPENSE", category: "RENT", subcategory: "loyer", amount: 1200 }),
  logiciel: saisie(2, "achats", { name: "Abonnement logiciel de gestion", type: "EXPENSE", category: "SOFTWARE", subcategory: "logiciel", amount: 49.99 }),
  subvention: saisie(3, "achats", { name: "Subvention BPI", type: "INCOME", category: "OTHER_INCOME", subcategory: "subventions", amount: 5000, debut: 2, frequency: "ONCE" }),
  nouveauClient: saisie(4, "achats", { name: "Nouveau client récurrent", type: "INCOME", category: "SALES", subcategory: "services", amount: 2000, debut: 1, scenario: SCENARIOS.optimiste }),
};

/** Prévisions de « Saisie Achats » : une par action. */
export const SAISIES_SAISIE = {
  aModifier: saisie(101, "saisieAchats", { name: "Prévision à modifier", type: "EXPENSE", category: "SOFTWARE", subcategory: "logiciel", amount: 80 }),
  aSupprimer: saisie(102, "saisieAchats", { name: "Prévision à supprimer", type: "EXPENSE", category: "RENT", subcategory: "loyer", amount: 900 }),
  duScenario: saisie(103, "saisieAchats", { name: "Prévision du scénario à supprimer", type: "INCOME", category: "SALES", subcategory: "services", amount: 300, scenario: SCENARIOS.aSupprimer }),
  editeur: saisie(104, "saisieAchats", { name: "Prévision de l'Éditeur", type: "EXPENSE", category: "OTHER_EXPENSE", subcategory: "autre", amount: 40 }),
  piege: saisie(105, "saisieAchats", { name: "Prévision piégée", type: "EXPENSE", category: "OTHER_EXPENSE", subcategory: "autre", amount: 41 }),
  bornes: saisie(106, "saisieAchats", { name: "Prévision aux bornes", type: "EXPENSE", category: "OTHER_EXPENSE", subcategory: "autre", amount: 42 }),
};

const moisDansNMois = (n) => {
  const d = debutDeMois(n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function recurrence(n, compte, { partyName, type = "EXPENSE", category, montant, source = "TRANSACTION" }) {
  const { organisation } = COMPTES[compte];
  return {
    _id: oid("saisiePrevision", 500 + n),
    workspaceId: organisation._id,
    source,
    type,
    partyKey: partyName.toLowerCase(),
    partyName,
    category,
    categoryOverride: null,
    subcategoryOverride: null,
    amountOverride: null,
    frequencyOverride: null,
    labelOverride: null,
    averageAmount: montant,
    frequency: "MONTHLY",
    intervalDays: 30,
    occurrenceCount: 3,
    lastSeenDate: DANS(-10),
    lastSeenMonth: moisDansNMois(0),
    consecutiveMonths: 3,
    isActive: true,
    isMuted: false,
    excludedMonths: [],
    lastDetectedAt: DANS(-1),
    createdAt: DANS(-30),
    updatedAt: MAINTENANT,
  };
}

/** Récurrences détectées (dépenses mensuelles) : référence et actions de l'Éditeur. */
export const RECURRENCES = {
  orange: recurrence(1, "achats", { partyName: "Orange Pro", category: "telephone", montant: 89 }),
  editeurMuter: recurrence(10, "saisieAchats", { partyName: "Abonnement à couper", category: "abonnement", montant: 19 }),
  editeurModifier: recurrence(11, "saisieAchats", { partyName: "Abonnement à corriger", category: "abonnement", montant: 29 }),
};

function previsionMensuelle(n, compte, { category, type = "EXPENSE", montant, mois = 1 }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return { _id: oid("saisiePrevision", 700 + n), workspaceId: organisation._id, month: moisDansNMois(mois), category, type, forecastAmount: montant, notes: "", createdBy: utilisateur._id, createdAt: DANS(-10), updatedAt: MAINTENANT };
}

/** Prévisions par mois et par catégorie (ancien tableau de prévision, encore servi par l'API). */
export const PREVISIONS_MENSUELLES = {
  achats: previsionMensuelle(1, "achats", { category: "MARKETING", montant: 300 }),
  saisie: previsionMensuelle(2, "saisieAchats", { category: "MARKETING", montant: 150 }),
};

/** Métriques d'appels à la banque (Bridge) d'« Achats » : elles ne regardent que cette entreprise. */
export const METRIQUES_BANCAIRES = [
  {
    _id: oid("saisiePrevision", 900),
    provider: "bridge",
    endpoint: "/v3/aggregation/transactions",
    method: "GET",
    requestCount: 777,
    successCount: 770,
    errorCount: 7,
    responseTime: { total: 77700, average: 100, min: 40, max: 900 },
    cost: { total: 123.45, perRequest: 0.16, currency: "EUR" },
    date: new Date(DANS(-2).setHours(0, 0, 0, 0)),
    workspaceId: hex(COMPTES.achats.organisation),
    errors: [],
    metadata: {},
    createdAt: DANS(-2),
    updatedAt: DANS(-2),
  },
];

// --- Rôles, espace à l'abonnement échu, banque à déconnecter --------------------------
// Identifiants de ce bloc : type « membreAchats » (utilisateurs 200+, sessions 300+,
// rattachements 10+, espaces 80+, rôle 70, abonnements 60+), données des types du lot (n ≥ 150).

const utilisateurLot = (n, email, name) => ({ _id: oid("membreAchats", n), email, name });
const espaceLot = (n, nom) => ({ ...organisationApi(0, nom), _id: oid("membreAchats", n), companyEmail: `facturation@espace-lot-${n}.test` });

/** Comptes propres à ce bloc, hors du socle (sessions et rattachements écrits plus bas). */
export const COMPTES_LOT = {
  // Deux banques connectées (deux connexions Bridge), déconnectées par les tests de la banque.
  banque: { utilisateur: utilisateurLot(202, "banque-achats@e2e.test", "Bao Banque"), organisation: espaceLot(80, "Banque Test SASU"), token: SESSION_TOKEN_BANQUE_ACHATS },
  // Abonnement échu : son propriétaire est celui de « Saisie Achats » (contrôle de l'espace visé).
  expire: { utilisateur: COMPTES.saisieAchats.utilisateur, organisation: espaceLot(81, "Achats Expiré SASU") },
};
/** Rôle personnalisé de « Saisie Achats » : saisir et modifier des factures d'achat, sans « Marquer comme payée ». */
export const ROLE_SANS_PAIEMENT = {
  _id: oid("membreAchats", 70),
  role: `role_${oid("membreAchats", 70).toHexString()}`,
  name: "Saisie sans paiement",
  description: "Ajouter et modifier des factures d'achat, sans les marquer payées",
  actions: { purchaseInvoices: ["view", "create", "edit"], banking: ["view"] },
};
/** Membres invités de ce bloc : Comptable d'« Achats » (et de « Saisie Achats »), rôle personnalisé de « Saisie Achats ». */
export const MEMBRES_LOT = {
  comptable: { utilisateur: utilisateurLot(200, "comptable-achats@e2e.test", "Clémence Comptable"), token: SESSION_TOKEN_COMPTABLE_ACHATS, de: [["achats", "accountant"], ["saisieAchats", "accountant"]] },
  // Données personnelles (abonnement, parrainage, banque de son entreprise) : jamais montrées aux autres membres.
  role: {
    utilisateur: {
      ...utilisateurLot(201, "role-achats@e2e.test", "Rémi Rôle"),
      referralCode: "PARRAIN-E2E-PRIVE",
      subscription: { licence: true, trial: false, stripeCustomerId: "cus_e2e_prive" },
      company: { name: "Cabinet Rôle", bankDetails: { iban: "FR7630006000011234567890189", bic: "AGRIFRPP", bankName: "Banque Privée Test" } },
    },
    token: SESSION_TOKEN_ROLE_ACHATS,
    de: [["saisieAchats", ROLE_SANS_PAIEMENT.role]],
  },
};

/** Document d'un helper du lot, rangé dans un espace de ce bloc. */
function dansEspace(doc, compte, { chaine = false } = {}) {
  const { utilisateur, organisation } = COMPTES_LOT[compte];
  const ws = chaine ? hex(organisation) : organisation._id;
  return {
    ...doc,
    workspaceId: ws,
    ...("createdBy" in doc ? { createdBy: utilisateur._id } : {}),
    ...("userId" in doc ? { userId: utilisateur._id } : {}),
  };
}

// « Saisie Achats » : déliaisons de paires jamais liées (rien ne doit changer).
export const DELIAISONS = {
  // Factures de vente : annulée, brouillon numéroté, payée par chèque (aucune transaction).
  venteAnnulee: factureVente(20, "saisieAchats", { numero: "0220", statut: "CANCELED", emiseIlYa: 20, echeanceDans: 10, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation annulée", 1, 410)] }),
  venteBrouillon: { ...factureVente(21, "saisieAchats", { numero: "DRAFT-0007", statut: "DRAFT", emiseIlYa: 2, echeanceDans: 28, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation en brouillon", 1, 420)] }), prefix: "" },
  ventePayeeCheque: { ...factureVente(22, "saisieAchats", { numero: "0222", statut: "COMPLETED", emiseIlYa: 25, echeanceDans: 5, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation payée par chèque", 1, 430)], payeeIlYa: 4 }), paymentMethod: "CHECK" },
  // Facture d'achat payée en espèces, sans transaction.
  achatPayeEspeces: factureAchat(150, "saisieAchats", { fournisseur: FS.payer, numero: "ESP-150", emiseIlYa: 9, ttc: 44.4, statut: "PAID", payeeIlYa: 8, moyen: "CASH" }),
  // Une transaction ignorée par déliaison tentée.
  ignoreeVenteAnnulee: transaction(150, "saisieAchats", { libelle: "VIR INTERNE IGNORE DELIAISON 1", montant: 271, ilYa: 6, compteBancaire: CBS, statut: "ignored" }),
  ignoreeVenteBrouillon: transaction(151, "saisieAchats", { libelle: "VIR INTERNE IGNORE DELIAISON 2", montant: 272, ilYa: 6, compteBancaire: CBS, statut: "ignored" }),
  ignoreeVentePayee: transaction(152, "saisieAchats", { libelle: "VIR INTERNE IGNORE DELIAISON 3", montant: 273, ilYa: 6, compteBancaire: CBS, statut: "ignored" }),
  ignoreeAchat: transaction(153, "saisieAchats", { libelle: "PRLV IGNORE DELIAISON 4", montant: -44.4, ilYa: 6, compteBancaire: CBS, statut: "ignored" }),
  ignoreeImportee: transaction(154, "saisieAchats", { libelle: "VIR INTERNE IGNORE DELIAISON 5", montant: 275, ilYa: 6, compteBancaire: CBS, statut: "ignored" }),
};

/** Facture client importée (statut au choix, transactions rattachées ou non). */
function importeeLot(n, compte, { numero, client: nomClient, ttc, statut, transactions = [] }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const ht = arrondi(ttc / 1.2);
  return {
    _id: oid("factureVenteAchats", n),
    workspaceId: organisation._id,
    importedBy: utilisateur._id,
    status: statut,
    originalInvoiceNumber: numero,
    vendor: { name: organisation.companyName, normalizedName: organisation.companyName.toLowerCase(), address: "1 rue de la Paix", city: "Paris", postalCode: "75001", country: "France", siret: organisation.siret },
    client: { name: nomClient, email: null, address: "", city: "", postalCode: "" },
    invoiceDate: DANS(-30),
    dueDate: DANS(0),
    ...(statut === "COMPLETED" ? { paymentDate: DANS(-3) } : {}),
    totalHT: ht,
    totalVAT: arrondi(ttc - ht),
    totalTTC: ttc,
    currency: "EUR",
    items: [],
    category: "SERVICES",
    paymentMethod: "TRANSFER",
    file: { url: `https://fichiers.e2e.invalid/${hex(organisation)}/importees/${n}.pdf`, cloudflareKey: `${hex(organisation)}/importees/${n}.pdf`, originalFileName: `facture-importee-${n}.pdf`, mimeType: "application/pdf", fileSize: 1024 },
    source: "OCR_UPLOAD",
    isDuplicate: false,
    linkedTransactionIds: transactions.map((t) => t._id),
    createdAt: DANS(-30),
    updatedAt: DANS(-30),
  };
}
export const IMPORTEES_SAISIE = {
  payeeHorsBanque: importeeLot(150, "saisieAchats", { numero: "IMP-PAYEE-150", client: "Client importé payé", ttc: 275, statut: "COMPLETED" }),
  // Écritures permises de l'Éditeur : rapprocher, délier (paire liée), convertir en facture d'achat.
  editeurALier: importeeLot(151, "saisieAchats", { numero: "IMP-EDI-151", client: "Client importé à rapprocher", ttc: 330, statut: "VALIDATED" }),
  editeurLiee: importeeLot(152, "saisieAchats", { numero: "IMP-EDI-152", client: "Client importé rapproché", ttc: 340, statut: "COMPLETED", transactions: [TX(163)] }),
  editeurAConvertir: importeeLot(153, "saisieAchats", { numero: "IMP-EDI-153", client: "Fournisseur importé à convertir", ttc: 350, statut: "PENDING_REVIEW" }),
};
/**
 * « Achats » (référence, jamais modifiée) : deux factures importées validées,
 * cibles des écritures refusées (aucune à valider : l'onglet « Importées
 * Gmail » ne s'affiche pas sur la page des factures d'achat de référence).
 */
export const IMPORTEES_ACHATS = {
  validee: importeeLot(160, "achats", { numero: "IMP-ACH-160", client: "Client importé de référence", ttc: 2500, statut: "VALIDATED" }),
  aConvertir: importeeLot(161, "achats", { numero: "IMP-ACH-161", client: "Fournisseur importé de référence", ttc: 360, statut: "VALIDATED" }),
};
/** Transactions des écritures permises de l'Éditeur sur les factures importées. */
export const TRANSACTIONS_IMPORTEES = {
  editeurALier: transaction(162, "saisieAchats", { libelle: "VIR SEPA EDITEUR IMPORTEE A RAPPROCHER", montant: 330, ilYa: 2, compteBancaire: CBS }),
  editeurLiee: { ...transaction(163, "saisieAchats", { libelle: "VIR SEPA EDITEUR IMPORTEE RAPPROCHEE", montant: 340, ilYa: 3, compteBancaire: CBS }), linkedImportedInvoiceIds: [oid("factureVenteAchats", 152)], reconciliationStatus: "matched", reconciliationLinks: [{ documentType: "IMPORTED_INVOICE", documentId: oid("factureVenteAchats", 152), origin: "TRANSACTION", linkedAt: DANS(-2), linkedBy: hex(COMPTES.saisieAchats.utilisateur) }] },
};

// « Saisie Achats » : sens du paiement et transaction rattachée (rapprochements refusés).
const factureVenteSens = factureVente(23, "saisieAchats", { numero: "0223", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: CLIENTS_ACHATS.saisie, articles: [ligne("Prestation à encaisser (sens)", 1, 250)] });
const achatPayeLie = factureAchat(152, "saisieAchats", { fournisseur: FS.rapprochee, numero: "SENS-152", emiseIlYa: 8, ttc: 61.2, statut: "PAID", transactions: [TX(157)], payeeIlYa: 7 });
export const SENS = {
  factureVente: factureVenteSens,
  debitPourVente: transaction(155, "saisieAchats", { libelle: "PRLV SENS DEBIT VENTE", montant: -300, ilYa: 3, compteBancaire: CBS }),
  factureAchat: factureAchat(151, "saisieAchats", { fournisseur: FS.rapprocher, numero: "SENS-151", emiseIlYa: 6, ttc: 88.8, statut: "TO_PAY" }),
  creditPourAchat: transaction(156, "saisieAchats", { libelle: "VIR SEPA SENS CREDIT ACHAT", montant: 88.8, ilYa: 3, compteBancaire: CBS }),
  achatPayeLie,
  transactionLiee: transaction(157, "saisieAchats", { libelle: "PRLV SENS RATTACHEE", montant: -61.2, ilYa: 7, compteBancaire: CBS, facturesAchat: [achatPayeLie] }),
};

// « Saisie Achats » : « Marquer payées » sur une sélection mêlant une facture déjà payée.
const dejaPayeeGroupe = factureAchat(153, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-PAY-1", emiseIlYa: 130, ttc: 37, statut: "PAID", transactions: [TX(158)], payeeIlYa: 120, moyen: "BANK_TRANSFER" });
export const PAYEES_GROUPE = {
  dejaPayee: dejaPayeeGroupe,
  aPayer: factureAchat(154, "saisieAchats", { fournisseur: FS.groupe, numero: "GRP-PAY-2", emiseIlYa: 4, ttc: 38, statut: "TO_PAY" }),
  transaction: transaction(158, "saisieAchats", { libelle: "VIR FOURNISSEUR GROUPE PAYE", montant: -37, ilYa: 120, compteBancaire: CBS, facturesAchat: [dejaPayeeGroupe] }),
};

// « Saisie Achats » : rôle sans « Marquer comme payée », fusion de fiches, transaction trouvée après une saisie.
export const ROLE_ACHATS = {
  aPayer: factureAchat(155, "saisieAchats", { fournisseur: FS.payer, numero: "ROL-155", emiseIlYa: 3, ttc: 56.7, statut: "TO_PAY" }),
};
/** Facture saisie par le membre au rôle personnalisé : son auteur est lu par les autres membres. */
export const FACTURE_AUTEUR = { ...factureAchat(160, "saisieAchats", { fournisseur: FS.payer, numero: "AUT-160", emiseIlYa: 2, ttc: 58.9, statut: "TO_PROCESS" }), createdBy: oid("membreAchats", 201) };
export const FUSION = {
  cible: fournisseur(120, "saisieAchats", "Fusion Cible SARL", "OTHER"),
  source: fournisseur(121, "saisieAchats", "Fusion Source SARL", "OTHER"),
};
export const FUSION_FACTURE = factureAchat(156, "saisieAchats", { fournisseur: FUSION.source, numero: "FUS-156", emiseIlYa: 3, ttc: 57.8, statut: "TO_PROCESS" });
/** Débit déjà passé en banque, au libellé du fournisseur : proposé après la saisie de sa facture. */
export const CANDIDAT = {
  fournisseur: "Imprimerie Candidate",
  montant: 73.21,
  transaction: transaction(159, "saisieAchats", { libelle: "PRLV IMPRIMERIE CANDIDATE", montant: -73.21, ilYa: 1, compteBancaire: CBS }),
  refusFournisseur: "Papeterie Refusee",
  refusMontant: 74.32,
  refusTransaction: transaction(160, "saisieAchats", { libelle: "PRLV PAPETERIE REFUSEE", montant: -74.32, ilYa: 1, compteBancaire: CBS }),
};

// « Saisie Achats » : factures d'achat proposées depuis un justificatif (analyse déjà faite).
/** Justificatif dont l'analyse propose une facture d'achat, en attente de confirmation. */
function justificatifPropose(n, nom, valeurs, { doublon = null, raison = null } = {}) {
  return {
    ...justificatif(n, "saisieAchats", nom),
    ocrProcessed: true,
    ocrProposal: {
      values: { currency: "EUR", issueDate: jour(-4), ...valeurs },
      meta: { ocrSucceeded: true, ocrMetadata: { extractionQuality: "full", provider: "claude-vision", confidenceScore: 0.97 } },
      duplicateInvoiceId: doublon ? doublon._id : null,
      duplicateLinkTransaction: true,
      duplicateReason: raison,
      proposedAt: DANS(-1),
      dismissedAt: null,
    },
  };
}
const FP = {
  doublon: fournisseur(122, "saisieAchats", "Fournisseur Doublon Proposé", "OTHER"),
  apparu: fournisseur(123, "saisieAchats", "Fournisseur Apparu", "OTHER"),
};
const factureDoublonProposee = factureAchat(157, "saisieAchats", { fournisseur: FP.doublon, numero: "DUP-157", emiseIlYa: 5, ttc: 64.5, statut: "TO_PAY" });
const factureApparue = factureAchat(158, "saisieAchats", { fournisseur: FP.apparu, numero: "APP-168", emiseIlYa: 1, ttc: 71.3, statut: "TO_PAY" });
export const PROPOSITIONS = {
  fournisseurs: FP,
  factureDoublon: factureDoublonProposee,
  factureApparue,
  creer: transaction(164, "saisieAchats", {
    libelle: "CB ELECTRICITE PROPOSEE",
    montant: -96.6,
    ilYa: 3,
    compteBancaire: CBS,
    justificatifs: [justificatifPropose(164, "Facture électricité.pdf", { supplierName: "Electricite Generale du Sud", invoiceNumber: "PROP-164", amountHT: 80.5, amountTVA: 16.1, vatRate: 20, amountTTC: 96.6, subcategory: "electricite", category: "UTILITIES", paymentMethod: "CREDIT_CARD" })],
  }),
  deuxTauxDollars: transaction(165, "saisieAchats", {
    libelle: "CB CLOUD TOOLS USD",
    montant: -110.4,
    ilYa: 3,
    compteBancaire: CBS,
    justificatifs: [
      justificatifPropose(165, "Invoice Cloud Tools.pdf", {
        supplierName: "Cloud Tools Inc",
        invoiceNumber: "PROP-165",
        amountHT: 105,
        amountTVA: 13.75,
        vatRate: 20,
        vatBreakdown: [
          { rate: 20, baseHT: 55, amountTVA: 11 },
          { rate: 5.5, baseHT: 50, amountTVA: 2.75 },
        ],
        amountTTC: 118.75,
        currency: "USD",
      }),
    ],
  }),
  rattacher: transaction(166, "saisieAchats", {
    libelle: "PRLV FOURNISSEUR DOUBLON PROPOSE",
    montant: -64.5,
    ilYa: 2,
    compteBancaire: CBS,
    justificatifs: [justificatifPropose(166, "Facture doublon.pdf", { supplierName: "Fournisseur Doublon Proposé", invoiceNumber: "DUP-157", amountHT: 53.75, amountTVA: 10.75, vatRate: 20, amountTTC: 64.5 }, { doublon: factureDoublonProposee, raison: "NUMBER" })],
  }),
  ignorer: transaction(167, "saisieAchats", {
    libelle: "CB TICKET SANS FACTURE",
    montant: -8.4,
    ilYa: 2,
    compteBancaire: CBS,
    justificatifs: [justificatifPropose(167, "Ticket parking.pdf", { supplierName: "Parking du Centre", invoiceNumber: "PROP-167", amountHT: 7, amountTVA: 1.4, vatRate: 20, amountTTC: 8.4 })],
  }),
  doublonApparu: transaction(168, "saisieAchats", {
    libelle: "PRLV FOURNISSEUR APPARU",
    montant: -71.3,
    ilYa: 1,
    compteBancaire: CBS,
    justificatifs: [justificatifPropose(168, "Facture apparue.pdf", { supplierName: "Fournisseur Apparu", invoiceNumber: "APP-168", amountHT: 59.42, amountTVA: 11.88, vatRate: 20, amountTTC: 71.3 })],
  }),
  doubleClic: transaction(169, "saisieAchats", {
    libelle: "CB DOUBLE CLIC PROPOSE",
    montant: -33.3,
    ilYa: 2,
    compteBancaire: CBS,
    justificatifs: [justificatifPropose(169, "Facture double clic.pdf", { supplierName: "Fournisseur Double Clic", invoiceNumber: "DBL-169", amountHT: 27.75, amountTVA: 5.55, vatRate: 20, amountTTC: 33.3 })],
  }),
};

// « Saisie Achats » : valeurs refusées par l'API (une donnée par modification essayée).
const fournisseurValidation = fournisseur(124, "saisieAchats", "Fournisseur Validation", "OTHER");
export const VALIDATION = {
  fournisseur: fournisseurValidation,
  facture: factureAchat(159, "saisieAchats", { fournisseur: fournisseurValidation, numero: "VAL-159", emiseIlYa: 3, ttc: 59.9, statut: "TO_PROCESS" }),
  transaction: transaction(171, "saisieAchats", { libelle: "CB LIBELLE A BORNER", montant: -19.1, ilYa: 3, compteBancaire: CBS }),
};

// Offre d'entrée : imports OCR du mois épuisés (50 sur 50).
export const QUOTA_OCR_EPUISE = {
  _id: oid("membreAchats", 90),
  userId: COMPTES.freelanceAchats.utilisateur._id,
  workspaceId: COMPTES.freelanceAchats.organisation._id,
  plan: "FREELANCE",
  // Mois au format de l'API (date UTC), remis à zéro le 1er du mois suivant.
  month: MAINTENANT.toISOString().slice(0, 7),
  resetDate: new Date(Date.UTC(MAINTENANT.getUTCFullYear(), MAINTENANT.getUTCMonth() + 1, 1)),
  usedQuota: 50,
  extraImportsPurchased: 0,
  extraImportsUsed: 0,
  extraImportsSpent: 0,
  importHistory: [],
  purchaseHistory: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
};
/** Dépense de l'offre d'entrée pour y déposer un justificatif (quota épuisé). */
export const TRANSACTION_QUOTA = transaction(161, "freelanceAchats", { libelle: "CB DEPENSE QUOTA OCR", montant: -14.9, ilYa: 2, compteBancaire: COMPTES_BANCAIRES.freelance });

// « Achats Expiré » (abonnement échu) : une dépense avec un justificatif et sa facture proposée.
const justificatifExpire = {
  ...justificatif(170, "saisieAchats", "Ticket espace expiré.pdf"),
  url: `https://fichiers.e2e.invalid/${hex(COMPTES_LOT.expire.organisation)}/receipts/170-ticket.pdf`,
  key: `${hex(COMPTES_LOT.expire.organisation)}/receipts/170-ticket.pdf`,
  ocrProcessed: true,
  ocrProposal: { values: { supplierName: "Fournisseur Expiré", amountTTC: 23.4, amountHT: 19.5, amountTVA: 3.9, vatRate: 20, currency: "EUR" }, meta: { ocrSucceeded: true }, duplicateInvoiceId: null, duplicateLinkTransaction: true, duplicateReason: null, proposedAt: DANS(-1), dismissedAt: null },
};
export const COMPTE_BANCAIRE_EXPIRE = dansEspace(compteBancaire(170, "saisieAchats", { name: "Compte espace expiré", iban: "FR7630006000011111111111170", solde: 900 }), "expire", { chaine: true });
export const TRANSACTION_EXPIREE = dansEspace(
  transaction(170, "saisieAchats", { libelle: "CB DEPENSE ESPACE EXPIRE", montant: -23.4, ilYa: 2, compteBancaire: COMPTE_BANCAIRE_EXPIRE, justificatifs: [justificatifExpire] }),
  "expire",
  { chaine: true },
);

// « Banque Test » : deux connexions Bridge et les données qui doivent leur survivre.
const CBB = {
  aDeconnecter: { ...dansEspace(compteBancaire(180, "saisieAchats", { name: "Compte à déconnecter", iban: "FR7630006000018080808080801", solde: 3210.5 }), "banque", { chaine: true }), institutionName: "Banque Populaire Test", raw: { item_id: 9001, provider_id: 501 } },
  restant: { ...dansEspace(compteBancaire(181, "saisieAchats", { name: "Compte gardé jusqu'au bout", iban: "FR7630006000018181818181802", solde: 1500 }), "banque", { chaine: true }), institutionName: "Crédit Test", raw: { item_id: 9002, provider_id: 502 } },
};
export const COMPTES_BANCAIRES_BANQUE = CBB;
const clientBanque = dansEspace(client(10, "saisieAchats", "Client Banque SAS", "compta@client-banque.test"), "banque");
const fournisseurBanque = dansEspace(fournisseur(130, "saisieAchats", "Fournisseur Banque SARL", "SERVICES"), "banque");
const venteBanque = dansEspace(factureVente(30, "saisieAchats", { numero: "0301", statut: "COMPLETED", emiseIlYa: 20, echeanceDans: 10, client: clientBanque, articles: [ligne("Prestation encaissée (banque)", 1, 500)], payeeIlYa: 5, transactions: [TX(181)] }), "banque");
const achatBanque = dansEspace(factureAchat(180, "saisieAchats", { fournisseur: fournisseurBanque, numero: "BNQ-180", emiseIlYa: 10, ttc: 120, statut: "PAID", transactions: [TX(182)], payeeIlYa: 9, moyen: "DIRECT_DEBIT" }), "banque");
const enBanque = (doc) => dansEspace(doc, "banque", { chaine: true });
export const BANQUE = {
  client: clientBanque,
  fournisseur: fournisseurBanque,
  vente: venteBanque,
  achat: achatBanque,
  transactions: {
    justifiee: enBanque({
      ...transaction(180, "saisieAchats", { libelle: "CB PAPETERIE JUSTIFIEE", montant: -45.9, ilYa: 4, categorie: "bureau", compteBancaire: CBB.aDeconnecter, justificatifs: [justificatif(180, "saisieAchats", "Ticket papeterie.pdf")] }),
      categoryIsManual: true,
      description: "Papeterie du salon (libellé corrigé)",
      descriptionIsManual: true,
      metadata: { notes: "Note conservée à la déconnexion", paymentMethod: "CREDIT_CARD" },
    }),
    encaissement: enBanque(transaction(181, "saisieAchats", { libelle: "VIR SEPA CLIENT BANQUE", montant: 600, ilYa: 5, compteBancaire: CBB.aDeconnecter, factures: [venteBanque] })),
    prelevement: enBanque(transaction(182, "saisieAchats", { libelle: "PRLV FOURNISSEUR BANQUE", montant: -120, ilYa: 9, compteBancaire: CBB.aDeconnecter, facturesAchat: [achatBanque] })),
    ignoree: enBanque(transaction(183, "saisieAchats", { libelle: "VIR INTERNE IGNORE BANQUE", montant: 75, ilYa: 11, compteBancaire: CBB.aDeconnecter, statut: "ignored" })),
    autreBanque: enBanque(transaction(184, "saisieAchats", { libelle: "CB DEPENSE COMPTE RESTANT", montant: -30, ilYa: 3, categorie: "bureau", compteBancaire: CBB.restant, justificatifs: [justificatif(184, "saisieAchats", "Ticket compte restant.pdf")] })),
  },
};

function utilisateurPretLot({ _id, email, name, ...autres }) {
  return { ...autres, _id, email, name, emailVerified: true, role: "member", isActive: true, isDisabled: false, hasSeenOnboarding: true, onboardingStep: "completed", hasCompletedTutorial: true, createdAt: MAINTENANT, updatedAt: MAINTENANT };
}
const sessionLot = (n, token, utilisateur, organisationId) => ({
  _id: oid("membreAchats", n),
  token,
  userId: utilisateur._id,
  activeOrganizationId: organisationId.toHexString(),
  expiresAt: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ipAddress: "127.0.0.1",
  userAgent: "playwright-e2e",
});

/** Utilisateurs, sessions, espaces, abonnements, rattachements et rôle de ce bloc. */
function comptesDuBloc() {
  const { banque, expire } = COMPTES_LOT;
  const organisation = [banque.organisation, expire.organisation].map((org) => ({ ...org, logo: null, metadata: null, organizationType: "business", onboardingCompleted: true, sessionSettings: { maxSessions: 0 }, createdAt: DANS(-200) }));
  const abonnement = (n, org, statut, fin) => ({ _id: oid("membreAchats", n), referenceId: org._id.toHexString(), plan: "pme", status: statut, periodStart: DANS(-60), periodEnd: fin, createdAt: DANS(-60), updatedAt: MAINTENANT });
  const membres = [
    { _id: oid("membreAchats", 10), userId: banque.utilisateur._id, organizationId: banque.organisation._id, role: "owner", createdAt: MAINTENANT },
    { _id: oid("membreAchats", 11), userId: expire.utilisateur._id, organizationId: expire.organisation._id, role: "owner", createdAt: MAINTENANT },
  ];
  let m = 12;
  for (const membre of Object.values(MEMBRES_LOT)) {
    for (const [compte, role] of membre.de) membres.push({ _id: oid("membreAchats", m++), userId: membre.utilisateur._id, organizationId: COMPTES[compte].organisation._id, role, createdAt: MAINTENANT });
  }
  return {
    user: [banque.utilisateur, ...Object.values(MEMBRES_LOT).map((x) => x.utilisateur)].map(utilisateurPretLot),
    organization: organisation,
    subscription: [abonnement(60, banque.organisation, "active", DANS(30)), abonnement(61, expire.organisation, "canceled", DANS(-5))],
    member: membres,
    session: [
      sessionLot(300, banque.token, banque.utilisateur, banque.organisation._id),
      sessionLot(301, MEMBRES_LOT.comptable.token, MEMBRES_LOT.comptable.utilisateur, COMPTES.achats.organisation._id),
      sessionLot(302, MEMBRES_LOT.role.token, MEMBRES_LOT.role.utilisateur, COMPTES.saisieAchats.organisation._id),
    ],
    organizationRole: [
      {
        _id: ROLE_SANS_PAIEMENT._id,
        organizationId: COMPTES.saisieAchats.organisation._id,
        role: ROLE_SANS_PAIEMENT.role,
        permission: JSON.stringify({}),
        actions: ROLE_SANS_PAIEMENT.actions,
        catalogVersion: 2,
        name: ROLE_SANS_PAIEMENT.name,
        description: ROLE_SANS_PAIEMENT.description,
        createdAt: MAINTENANT,
        updatedAt: MAINTENANT,
      },
    ],
  };
}

// --- Assemblage -----------------------------------------------------------------------

/** Rattachements en plus des MEMBRES du socle : l'Éditeur dans « Saisie Achats », le propriétaire de « Saisie » dans « Scénarios ». */
function membresEnPlus() {
  return [
    { _id: oid("membreAchats", 1), userId: MEMBRES.editeurAchats.utilisateur._id, organizationId: COMPTES.saisieAchats.organisation._id, role: "member", createdAt: MAINTENANT },
    { _id: oid("membreAchats", 2), userId: COMPTES.saisieAchats.utilisateur._id, organizationId: ORGANISATION_SCENARIOS._id, role: "owner", createdAt: MAINTENANT },
    { _id: oid("membreAchats", 3), userId: COMPTES.saisieAchats.utilisateur._id, organizationId: ORGANISATION_BORNES._id, role: "owner", createdAt: MAINTENANT },
  ];
}

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesAchatsBanque() {
  const proprietaireScenarios = COMPTES.saisieAchats.utilisateur;
  const bloc = comptesDuBloc();
  return {
    user: bloc.user,
    session: bloc.session,
    organizationRole: bloc.organizationRole,
    organization: [
      ...bloc.organization,
      ...[ORGANISATION_SCENARIOS, ORGANISATION_BORNES].map((org) => ({
      ...org,
      logo: null,
      metadata: null,
      organizationType: "business",
      onboardingCompleted: true,
      sessionSettings: { maxSessions: 0 },
      createdAt: MAINTENANT,
    })),
    ],
    subscription: [
      ...bloc.subscription,
      ...[ORGANISATION_SCENARIOS, ORGANISATION_BORNES].map((org, i) => ({
      _id: oid("membreAchats", 50 + i),
      referenceId: org._id.toHexString(),
      plan: "pme",
      status: "active",
      periodStart: DANS(-1),
      periodEnd: DANS(30),
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    })),
    ],
    member: [...membresEnPlus(), ...bloc.member],
    products: [...Object.values(PRODUITS), ...Object.values(PRODUITS_SAISIE), ...PRODUITS_VOLUMINEUX],
    productcustomfields: [...Object.values(CHAMPS_PRODUITS), ...CHAMPS_FREELANCE_ACHATS, ...Object.values(CHAMPS_SAISIE)],
    suppliers: [...Object.values(F), ...Object.values(FS), ...Object.values(FF), ...Object.values(FUSION), ...Object.values(PROPOSITIONS.fournisseurs), VALIDATION.fournisseur, BANQUE.fournisseur],
    purchaseinvoices: [
      ...Object.values(FACTURES_ACHAT),
      ...FACTURES_ACHAT_REMPLISSAGE,
      ...Object.values(FACTURES_ACHAT_SAISIE),
      SUGGESTIONS.facture,
      SUGGESTIONS.factureMasquee,
      DELIAISONS.achatPayeEspeces,
      SENS.factureAchat,
      SENS.achatPayeLie,
      PAYEES_GROUPE.dejaPayee,
      PAYEES_GROUPE.aPayer,
      ROLE_ACHATS.aPayer,
      FACTURE_AUTEUR,
      FUSION_FACTURE,
      PROPOSITIONS.factureDoublon,
      PROPOSITIONS.factureApparue,
      VALIDATION.facture,
      BANQUE.achat,
    ],
    accounts_bankings: [...Object.values(COMPTES_BANCAIRES), COMPTE_BANCAIRE_EXPIRE, ...Object.values(COMPTES_BANCAIRES_BANQUE)],
    transactions: [
      ...Object.values(TRANSACTIONS),
      ...Object.values(TRANSACTIONS_SAISIE),
      SUGGESTIONS.transaction,
      SUGGESTIONS.transactionMasquee,
      ...[DELIAISONS.ignoreeVenteAnnulee, DELIAISONS.ignoreeVenteBrouillon, DELIAISONS.ignoreeVentePayee, DELIAISONS.ignoreeAchat, DELIAISONS.ignoreeImportee],
      SENS.debitPourVente,
      SENS.creditPourAchat,
      SENS.transactionLiee,
      PAYEES_GROUPE.transaction,
      CANDIDAT.transaction,
      CANDIDAT.refusTransaction,
      TRANSACTION_QUOTA,
      TRANSACTION_EXPIREE,
      ...Object.values(TRANSACTIONS_IMPORTEES),
      ...[PROPOSITIONS.creer, PROPOSITIONS.deuxTauxDollars, PROPOSITIONS.rattacher, PROPOSITIONS.ignorer, PROPOSITIONS.doublonApparu, PROPOSITIONS.doubleClic],
      VALIDATION.transaction,
      ...Object.values(BANQUE.transactions),
    ],
    clients: [...Object.values(CLIENTS_ACHATS), BANQUE.client],
    invoices: [...Object.values(FACTURES_VENTE), DELIAISONS.venteAnnulee, DELIAISONS.venteBrouillon, DELIAISONS.ventePayeeCheque, SENS.factureVente, BANQUE.vente],
    imported_invoices: [...Object.values(IMPORTEES_SAISIE), ...Object.values(IMPORTEES_ACHATS)],
    userocrquotas: [QUOTA_OCR_EPUISE],
    forecastscenarios: Object.values(SCENARIOS).map((s) => (s.workspaceId.equals(ORGANISATION_SCENARIOS._id) ? { ...s, createdBy: proprietaireScenarios._id } : s)),
    manualcashflowentries: [...Object.values(SAISIES), ...Object.values(SAISIES_SAISIE)],
    detectedrecurrences: Object.values(RECURRENCES),
    treasuryforecasts: Object.values(PREVISIONS_MENSUELLES),
    api_metrics: METRIQUES_BANCAIRES,
  };
}
