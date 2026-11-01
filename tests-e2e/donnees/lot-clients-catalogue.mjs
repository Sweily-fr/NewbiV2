/**
 * Données du lot « clients-catalogue » : des espaces à part, pour que les
 * parcours qui modifient en masse (automatisations, suppressions, droits des
 * rôles personnalisés) ne touchent jamais « Clients » ni ses listes comptées
 * par les autres tests.
 *
 *   - DROITS : un propriétaire, un Comptable, un Membre, un Éditeur et un
 *     membre par rôle personnalisé (listes, segments, notes, import,
 *     blocage) ; une liste, un segment, un champ date et une automatisation
 *     d'e-mails ;
 *   - INTEGRITE : contacts et documents des parcours qui vérifient la base
 *     (documents émis non réécrits, fiche enregistrée sans changement,
 *     contact bloqué, suppression, notes, automatisations de listes…) ;
 *   - VOLUME : 600 contacts (page des contacts bloqués) et 60 devis et
 *     60 bons de commande (onglets de la fiche) ;
 *   - CATALOGUE : produits et champs produits des contrôles de l'API.
 *
 * Identifiants : préfixes du lot (base.mjs, « Lot clients-catalogue »).
 */
import { DANS, MAINTENANT, oid } from "./base.mjs";

/** Jeton de session d'un compte du lot. */
export const jetonCc = (n) => `e2eSessionTokenNewbiClientsCatalogue${n}Uniquement`;

function compteCc(n, { email, name, espace, plan = "pme" }) {
  return {
    n,
    utilisateur: { _id: oid("utilisateurCc", n), email, name },
    organisation: {
      _id: oid("espaceCc", n),
      name: espace,
      companyName: espace,
      companyEmail: `facturation@cc${n}.test`,
    },
    plan,
    token: jetonCc(n),
  };
}

function membreCc(n, { email, name, de, role }) {
  return { n, utilisateur: { _id: oid("utilisateurCc", n), email, name }, organisationId: de.organisation._id, role, token: jetonCc(n) };
}

function roleCc(n, { de, name, actions }) {
  const _id = oid("roleCc", n);
  return { _id, role: `role_${_id.toHexString()}`, organizationId: de.organisation._id, name, description: "", actions };
}

export const COMPTES_CC = {
  droits: compteCc(1, { email: "cc-droits@e2e.test", name: "Dora Droits", espace: "Contacts Droits SAS" }),
  integrite: compteCc(10, { email: "cc-integrite@e2e.test", name: "Inès Intégrité", espace: "Contacts Intégrité SAS" }),
  volume: compteCc(20, { email: "cc-volume@e2e.test", name: "Victor Volume", espace: "Contacts Volume SAS" }),
  catalogue: compteCc(30, { email: "cc-catalogue@e2e.test", name: "Cléo Catalogue", espace: "Catalogue Contrôles SAS" }),
  // Automatisations de listes qui déplacent tous les contacts : espace à part.
  automatisations: compteCc(40, { email: "cc-automatisations@e2e.test", name: "Alix Automatisations", espace: "Contacts Automatisations SAS" }),
};

export const ROLES_CC = {
  listes: roleCc(1, { de: COMPTES_CC.droits, name: "Listes seulement", actions: { clientLists: ["view"] } }),
  listesEdition: roleCc(2, { de: COMPTES_CC.droits, name: "Listes, modification", actions: { clientLists: ["view", "edit"] } }),
  segments: roleCc(3, { de: COMPTES_CC.droits, name: "Segments seulement", actions: { clientSegments: ["view"] } }),
  notes: roleCc(4, { de: COMPTES_CC.droits, name: "Notes des contacts", actions: { clients: ["view", "notes"] } }),
  import: roleCc(5, { de: COMPTES_CC.droits, name: "Import des contacts", actions: { clients: ["view", "import"] } }),
  blocage: roleCc(6, { de: COMPTES_CC.droits, name: "Blocage des contacts", actions: { clients: ["view", "block"] } }),
};

const de = COMPTES_CC.droits;
export const MEMBRES_CC = {
  comptable: membreCc(2, { email: "cc-comptable@e2e.test", name: "Coralie Comptable", de, role: "accountant" }),
  membre: membreCc(3, { email: "cc-membre@e2e.test", name: "Malo Membre", de, role: "viewer" }),
  editeur: membreCc(4, { email: "cc-editeur@e2e.test", name: "Edgar Éditeur", de, role: "member" }),
  listes: membreCc(5, { email: "cc-listes@e2e.test", name: "Lise Listes", de, role: ROLES_CC.listes.role }),
  listesEdition: membreCc(6, { email: "cc-listes-edition@e2e.test", name: "Léon Listes", de, role: ROLES_CC.listesEdition.role }),
  segments: membreCc(7, { email: "cc-segments@e2e.test", name: "Sarah Segments", de, role: ROLES_CC.segments.role }),
  notes: membreCc(8, { email: "cc-notes@e2e.test", name: "Noémie Notes", de, role: ROLES_CC.notes.role }),
  import: membreCc(9, { email: "cc-import@e2e.test", name: "Ivan Import", de, role: ROLES_CC.import.role }),
  blocage: membreCc(11, { email: "cc-blocage@e2e.test", name: "Basile Blocage", de, role: ROLES_CC.blocage.role }),
};

// --- Contacts ------------------------------------------------------------------

/** Adresse telle que l'interface l'enregistre (sous-document avec _id). */
const adresse = (n, champs = {}) => ({
  _id: oid("diversCc", 5000 + n),
  fullName: "",
  street: "12 rue des Tests",
  city: "Lyon",
  postalCode: "69002",
  country: "France",
  ...champs,
});

function contactCc(n, compte, { name, email, ...champs }) {
  return {
    _id: oid("contactCc", n),
    type: "COMPANY",
    name,
    email,
    siret: "41234567800017",
    isInternational: false,
    isBlocked: false,
    hasDifferentShippingAddress: false,
    contacts: [],
    notes: [],
    customFields: [],
    activity: [],
    assignedMembers: [],
    address: adresse(n),
    createdBy: compte.utilisateur._id,
    workspaceId: compte.organisation._id,
    createdAt: DANS(-(1000 - n) / 10),
    updatedAt: DANS(-5),
    ...champs,
  };
}

const D = COMPTES_CC.droits;
const I = COMPTES_CC.integrite;
const V = COMPTES_CC.volume;

export const CONTACTS_DROITS = {
  perso: contactCc(1, D, {
    name: "Fiche Personnelle SARL",
    email: "secret-perso@droits.test",
    phone: "+33600000001",
    notes: [{ id: oid("diversCc", 1).toHexString(), content: "Note confidentielle du contact", userId: D.utilisateur._id, userName: D.utilisateur.name, createdAt: DANS(-3), updatedAt: DANS(-3) }],
  }),
  notes: contactCc(2, D, { name: "Contact à annoter par rôle SARL", email: "notes@droits.test" }),
  bloquer: contactCc(3, D, { name: "Contact à bloquer par rôle SARL", email: "bloquer@droits.test" }),
  modifier: contactCc(4, D, { name: "Contact à modifier par rôle SARL", email: "modifier@droits.test" }),
  liste: contactCc(5, D, { name: "Contact à lister par rôle SARL", email: "lister@droits.test" }),
};

export const CONTACTS_INTEGRITE = {
  // Documents émis : jamais réécrits ; brouillon : mis à jour, champs gardés.
  documents: contactCc(101, I, { name: "Maison Émise SARL", email: "emise@integrite.test", siret: "52345678900012" }),
  // Fiche ouverte et enregistrée sans changement.
  inchange: contactCc(102, I, { name: "Fiche Inchangée SARL", email: "inchangee@integrite.test" }),
  // Contact bloqué : ni nouveau document, ni envoi.
  bloque: contactCc(103, I, { name: "Contact Bloqué Intégrité SARL", email: "bloque@integrite.test", isBlocked: true, blockedReason: "Impayés", blockedAt: DANS(-2) }),
  // Suppression : rangé dans deux listes.
  dansListes: contactCc(104, I, { name: "Contact rangé deux fois SARL", email: "listes@integrite.test" }),
  // Suppression refusée : un bon de livraison seulement, un avoir seulement.
  avecBl: contactCc(105, I, { name: "Contact avec bon de livraison SARL", email: "bl@integrite.test" }),
  avecAvoir: contactCc(106, I, { name: "Contact avec avoir SARL", email: "avoir@integrite.test" }),
  activite: contactCc(107, I, { name: "Contact au journal SARL", email: "journal@integrite.test" }),
  notesLongues: contactCc(108, I, { name: "Contact aux notes longues SARL", email: "notes-longues@integrite.test" }),
  raison: contactCc(109, I, { name: "Contact à bloquer longuement SARL", email: "raison@integrite.test" }),
  // Automatisations de listes : dans « Prospects » et une liste par défaut.
  prospect: contactCc(110, I, { name: "Prospect Rangé SARL", email: "prospect@integrite.test" }),
  // « Devis accepté » et « Facture payée » (montant minimum).
  devisAccepte: contactCc(111, I, { name: "Client au devis accepté SARL", email: "devis-accepte@integrite.test" }),
  facturePayee: contactCc(112, I, { name: "Client aux factures payées SARL", email: "factures-payees@integrite.test" }),
  // Segments « Assigné à ».
  assigne: contactCc(113, I, { name: "Contact Assigné SARL", email: "assigne@integrite.test", assignedMembers: [I.utilisateur._id.toHexString()] }),
  nonAssigne: contactCc(114, I, { name: "Contact Sans Assigné SARL", email: "sans-assigne@integrite.test", assignedMembers: [] }),
  // Export : textes lus comme des formules par un tableur.
  formule: contactCc(115, I, {
    name: "+Formule Plus SARL",
    email: "formule@integrite.test",
    contactFunction: '=HYPERLINK("https://piege.example";"x")',
    contactDepartment: "@SUM(1)",
  }),
  symboles: contactCc(116, I, { name: "Dupont <&> Fils SARL", email: "symboles@integrite.test", contactFunction: "R&D <direction>" }),
  // Champs personnalisés contrôlés par l'API.
  champs: contactCc(117, I, { name: "Contact aux champs contrôlés SARL", email: "champs@integrite.test" }),
};

const A = COMPTES_CC.automatisations;
export const CONTACTS_AUTOMATISATIONS = {
  rangeUn: contactCc(401, A, { name: "Contact rangé un SARL", email: "range-un@automatisations.test" }),
  rangeDeux: contactCc(402, A, { name: "Contact rangé deux SARL", email: "range-deux@automatisations.test" }),
};

// --- Listes, segments, champs, automatisations ------------------------------------

const dans = (compte) => ({ workspaceId: compte.organisation._id, createdBy: compte.utilisateur._id, createdAt: DANS(-20), updatedAt: MAINTENANT });
const liste = (n, compte, name, clients, extra = {}) => ({ _id: oid("listeCc", n), name, description: "", clients: clients.map((c) => c._id), color: "#5b50FF", isDefault: false, ...dans(compte), ...extra });

export const LISTES_CC = {
  droits: liste(1, D, "Liste des droits par rôle", [CONTACTS_DROITS.perso]),
  aSupprimerComptable: liste(2, D, "Liste à supprimer par le comptable", []),
  vip: liste(10, I, "VIP", []),
  prospects: liste(11, I, "Prospects", [CONTACTS_INTEGRITE.prospect, CONTACTS_INTEGRITE.dansListes]),
  parDefaut: liste(12, I, "Clients", [CONTACTS_INTEGRITE.prospect, CONTACTS_INTEGRITE.dansListes], { isDefault: true }),
  actifs: liste(13, I, "Clients actifs", []),
  gros: liste(14, I, "Gros clients", []),
  vipA: liste(40, A, "VIP", []),
  prospectsA: liste(41, A, "Prospects", [CONTACTS_AUTOMATISATIONS.rangeUn, CONTACTS_AUTOMATISATIONS.rangeDeux]),
  parDefautA: liste(42, A, "Clients", [CONTACTS_AUTOMATISATIONS.rangeUn], { isDefault: true }),
};

const segment = (n, compte, name, rules) => ({ _id: oid("segmentCc", n), name, description: "", matchType: "all", rules, color: "#5b50FF", ...dans(compte) });
export const SEGMENTS_CC = {
  droits: segment(1, D, "Segment des droits par rôle", [{ field: "name", operator: "contains", value: "Personnelle" }]),
  lyonnais: segment(10, I, "Lyonnais", [{ field: "address.city", operator: "equals", value: "Lyon" }]),
};

const champ = (n, compte, name, fieldType, extra = {}) => ({
  _id: oid("champCc", n),
  name,
  fieldType,
  description: "",
  options: [],
  placeholder: "",
  isRequired: false,
  order: n,
  showOnDocuments: false,
  isActive: true,
  ...extra,
  ...dans(compte),
});
export const CHAMPS_CC = {
  renouvellement: champ(1, D, "Date de renouvellement", "DATE"),
  aSupprimerComptable: champ(2, D, "Champ à supprimer par le comptable", "TEXT"),
  anniversaire: champ(10, I, "Date d'anniversaire", "DATE"),
  email: champ(11, I, "E-mail de facturation", "EMAIL"),
  nombre: champ(12, I, "Effectif", "NUMBER"),
  date: champ(13, I, "Date de signature", "DATE"),
  choix: champ(14, I, "Taille", "SELECT", { options: [{ label: "TPE", value: "tpe", color: "#5b50FF" }, { label: "PME", value: "pme", color: "#10b981" }] }),
  multi: champ(15, I, "Canaux", "MULTISELECT", { options: [{ label: "Web", value: "web", color: "#5b50FF" }, { label: "Salon", value: "salon", color: "#10b981" }] }),
};

const crm = (n, compte, { name, customFieldId, isActive = false }) => ({
  _id: oid("automatisationCc", n),
  name,
  description: "",
  customFieldId,
  timing: { type: "ON_DATE", daysOffset: 0, sendHour: 9 },
  email: { fromName: "", fromEmail: "", replyTo: "", subject: "Rappel {customFieldName}", body: "Bonjour {clientName}" },
  isActive,
  stats: { totalSent: 0, lastSentAt: null },
  ...dans(compte),
});
export const CRM_CC = {
  droits: crm(1, D, { name: "Relance de renouvellement", customFieldId: CHAMPS_CC.renouvellement._id }),
  aSupprimerProprietaire: crm(2, D, { name: "Relance à supprimer", customFieldId: CHAMPS_CC.renouvellement._id }),
  anniversaire: crm(10, I, { name: "Souhaiter l'anniversaire", customFieldId: CHAMPS_CC.anniversaire._id, isActive: true }),
};

// --- Documents ------------------------------------------------------------------

function entrepriseCc(compte) {
  const o = compte.organisation;
  return {
    name: o.companyName,
    email: o.companyEmail,
    phone: "+33123456789",
    siret: "98765432100012",
    vatNumber: "FR98765432100",
    companyStatus: "SASU",
    capitalSocial: "10000",
    rcs: "Paris B 987 654 321",
    transactionCategory: "SERVICES",
    vatPaymentCondition: "NONE",
    vatFranchise: false,
    address: { street: "1 rue de la Paix", city: "Paris", postalCode: "75001", country: "France" },
  };
}

const copieClient = (c, extra = {}) => ({
  id: c._id.toHexString(),
  type: c.type,
  name: c.name,
  email: c.email,
  siret: c.siret,
  isInternational: false,
  hasDifferentShippingAddress: false,
  address: { street: c.address.street, city: c.address.city, postalCode: c.address.postalCode, country: c.address.country },
  documentFields: [],
  ...extra,
});

/** Document de vente (facture, devis, bon de commande) avec une ligne. */
function docCc(type, n, compte, { client, statut, numero, montant = 100, creeIlYa = 10, clientExtra = {}, extra = {} }) {
  const ht = montant;
  const tva = Math.round(montant * 20) / 100;
  const emise = DANS(-creeIlYa);
  return {
    _id: oid(type, n),
    prefix: { factureCc: "F-CC", devisCc: "D-CC", bcCc: "BC-CC" }[type],
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    client: copieClient(client, clientExtra),
    companyInfo: entrepriseCc(compte),
    items: [{ description: "Prestation de test", quantity: 1, unitPrice: montant, vatRate: 20, unit: "unité", details: "", discount: 0, discountType: "PERCENTAGE", progressPercentage: 100, vatExemptionText: "" }],
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
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    appearance: { headerBgColor: "#5b50FF", headerTextColor: "#ffffff", textColor: "#000000" },
    clientPositionRight: false,
    operationType: null,
    retenueGarantie: 0,
    escompte: 0,
    isReverseCharge: false,
    isVatExempt: false,
    linkedInvoices: [],
    workspaceId: compte.organisation._id,
    createdBy: compte.utilisateur._id,
    createdAt: emise,
    // Date fixe : un enregistrement qui réécrit le document la change.
    updatedAt: DANS(-creeIlYa),
    ...(type === "factureCc"
      ? { dueDate: DANS(30 - creeIlYa), paymentDate: null, invoiceType: "standard", isDeposit: false, situationNumber: 1, paymentMethod: "BANK_TRANSFER", eInvoiceStatus: "NOT_SENT", eInvoiceFlowType: "NONE", eInvoiceEvents: [], linkedTransactionIds: [] }
      : { validUntil: DANS(30 - creeIlYa) }),
    ...(type === "devisCc" ? { projectReference: "", convertedToInvoice: null } : {}),
    ...(type === "bcCc" ? { purchaseOrderNumber: "", sourceQuoteId: null } : {}),
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    abbySyncStatus: "NOT_SYNCED",
    emailTracking: { emailClickCount: 0, emailOpenCount: 0 },
    ...extra,
  };
}

const C = CONTACTS_INTEGRITE;
const CHAMP_SUR_DOCUMENT = [{ fieldId: oid("diversCc", 900).toHexString(), name: "Code chantier", value: "CH-42", fieldType: "TEXT" }];

export const FACTURES_CC = {
  emise: docCc("factureCc", 1, I, { client: C.documents, statut: "PENDING", numero: "0001" }),
  annulee: docCc("factureCc", 2, I, { client: C.documents, statut: "CANCELED", numero: "0002" }),
  brouillon: docCc("factureCc", 3, I, { client: C.documents, statut: "DRAFT", numero: "DRAFT-0001", clientExtra: { documentFields: CHAMP_SUR_DOCUMENT } }),
  bloque: docCc("factureCc", 4, I, { client: C.bloque, statut: "PENDING", numero: "0003" }),
  payee400: docCc("factureCc", 5, I, { client: C.facturePayee, statut: "PENDING", numero: "0004", montant: 400 }),
  payee600: docCc("factureCc", 6, I, { client: C.facturePayee, statut: "PENDING", numero: "0005", montant: 600 }),
};

export const DEVIS_CC = {
  signe: docCc("devisCc", 1, I, { client: C.documents, statut: "COMPLETED", numero: "0001" }),
  annule: docCc("devisCc", 2, I, { client: C.documents, statut: "CANCELED", numero: "0002" }),
  brouillonInchange: docCc("devisCc", 3, I, { client: C.inchange, statut: "DRAFT", numero: "DRAFT-0001" }),
  aAccepter: docCc("devisCc", 4, I, { client: C.devisAccepte, statut: "PENDING", numero: "0003", montant: 900 }),
};

export const BONS_COMMANDE_CC = {
  annule: docCc("bcCc", 1, I, { client: C.documents, statut: "CANCELED", numero: "0001" }),
};

export const BON_LIVRAISON_CC = {
  _id: oid("blCc", 1),
  prefix: "BL-CC",
  number: "0001",
  status: "PENDING",
  issueDate: DANS(-3),
  issueYear: DANS(-3).getFullYear(),
  deliveryDate: DANS(3),
  client: copieClient(C.avecBl),
  companyInfo: entrepriseCc(I),
  items: [{ description: "Palette", quantity: 1, details: "", unit: "unité", reference: "" }],
  deliveryAddress: { fullName: C.avecBl.name, street: "12 rue des Tests", postalCode: "69002", city: "Lyon", country: "France" },
  carrier: "",
  trackingNumber: "",
  notes: "",
  receivedBy: "",
  receivedAt: null,
  headerNotes: "",
  footerNotes: "",
  termsAndConditions: "",
  customFields: [],
  clientPositionRight: false,
  sourceQuote: null,
  sourceInvoice: null,
  linkedInvoices: [],
  workspaceId: I.organisation._id,
  createdBy: I.utilisateur._id,
  createdAt: DANS(-3),
  updatedAt: DANS(-3),
};

export const AVOIR_CC = {
  _id: oid("avoirCc", 1),
  prefix: "AV-CC",
  number: "0001",
  originalInvoice: oid("factureCc", 99),
  originalInvoiceNumber: "F-CC-0099",
  creditType: "COMMERCIAL_GESTURE",
  reason: "Geste commercial",
  issueDate: DANS(-2),
  issueYear: DANS(-2).getFullYear(),
  items: [{ description: "Geste commercial", quantity: -1, unitPrice: 50, vatRate: 20, unit: "", details: "", discount: 0, discountType: "PERCENTAGE", progressPercentage: 100, vatExemptionText: "" }],
  companyInfo: entrepriseCc(I),
  client: copieClient(C.avecAvoir),
  status: "CREATED",
  refundMethod: "NEXT_INVOICE",
  discount: 0,
  discountType: "PERCENTAGE",
  customFields: [],
  showBankDetails: false,
  isReverseCharge: false,
  totalHT: -50,
  totalVAT: -10,
  totalTTC: -60,
  finalTotalHT: -50,
  finalTotalVAT: -10,
  finalTotalTTC: -60,
  shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
  clientPositionRight: false,
  operationType: null,
  retenueGarantie: 0,
  escompte: 0,
  workspaceId: I.organisation._id,
  createdBy: I.utilisateur._id,
  createdAt: DANS(-2),
  updatedAt: MAINTENANT,
};

// --- Volume ---------------------------------------------------------------------

export const VOLUME = {
  // Dernier contact par ordre alphabétique : au-delà des 500 premiers.
  bloque: contactCc(2600, V, { name: "Zoé Zimmermann", email: "zoe.zimmermann@volume.test", isBlocked: true, blockedReason: "Litige en cours", blockedAt: DANS(-1) }),
  // N'a que le plus ancien devis et le plus ancien bon de commande de l'espace.
  ancien: contactCc(2601, V, { name: "Client Ancien SARL", email: "ancien@volume.test" }),
  recent: contactCc(2602, V, { name: "Client Récent SARL", email: "recent@volume.test" }),
};
const REMPLISSAGE_VOLUME = Array.from({ length: 600 }, (_, i) =>
  contactCc(2000 + i, V, { name: `Contact volume ${String(i + 1).padStart(3, "0")}`, email: `volume${i + 1}@volume.test` }),
);
const docsVolume = (type) => [
  docCc(type, 2000, V, { client: VOLUME.ancien, statut: "PENDING", numero: "0001", creeIlYa: 200 }),
  ...Array.from({ length: 60 }, (_, i) => docCc(type, 2001 + i, V, { client: VOLUME.recent, statut: "PENDING", numero: String(i + 2).padStart(4, "0"), creeIlYa: 60 - i })),
];
export const DEVIS_VOLUME_ANCIEN = docsVolume("devisCc")[0];
export const BC_VOLUME_ANCIEN = docsVolume("bcCc")[0];

// --- Catalogue ------------------------------------------------------------------

const K = COMPTES_CC.catalogue;
export const PRODUITS_CC = {
  image: {
    _id: oid("produitCc", 1),
    name: "Produit à l'image contrôlée",
    description: "",
    unitPrice: 50,
    vatRate: 20,
    unit: "unité",
    category: "",
    reference: "IMG-01",
    imageUrl: null,
    showImageOnDocuments: false,
    customFields: [],
    linkedProducts: [],
    ...dans(K),
  },
};
export const CHAMPS_PRODUIT_CC = {
  nombre: { _id: oid("champCc", 30), name: "Poids (kg)", fieldType: "NUMBER", description: "", options: [], placeholder: "", isRequired: false, order: 0, isActive: true, ...dans(K) },
  choix: { _id: oid("champCc", 31), name: "Gamme", fieldType: "SELECT", description: "", options: [{ label: "Standard", value: "standard", color: "#5b50FF" }], placeholder: "", isRequired: false, order: 1, isActive: true, ...dans(K) },
};

// --- Écriture -------------------------------------------------------------------

const utilisateurPret = (u) => ({
  emailVerified: true,
  role: "member",
  isActive: true,
  isDisabled: false,
  hasSeenOnboarding: true,
  onboardingStep: "completed",
  hasCompletedTutorial: true,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...u,
});

const session = (n, token, userId, organisationId) => ({
  _id: oid("sessionCc", n),
  token,
  userId,
  activeOrganizationId: organisationId.toHexString(),
  expiresAt: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ipAddress: "127.0.0.1",
  userAgent: "playwright-e2e",
});

export function donneesClientsCatalogue() {
  const docs = { user: [], organization: [], member: [], subscription: [], session: [], organizationRole: [] };
  for (const c of Object.values(COMPTES_CC)) {
    docs.user.push(utilisateurPret(c.utilisateur));
    docs.organization.push({
      ...c.organisation,
      slug: `e2e-cc-${c.n}`,
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
      logo: null,
      metadata: null,
      organizationType: "business",
      onboardingCompleted: true,
      sessionSettings: { maxSessions: 0 },
      createdAt: MAINTENANT,
    });
    docs.member.push({ _id: oid("membreCc", c.n), userId: c.utilisateur._id, organizationId: c.organisation._id, role: "owner", createdAt: MAINTENANT });
    docs.subscription.push({ _id: oid("abonnementCc", c.n), referenceId: c.organisation._id.toHexString(), plan: c.plan, status: "active", periodStart: DANS(-1), periodEnd: DANS(30), createdAt: MAINTENANT, updatedAt: MAINTENANT });
    docs.session.push(session(c.n, c.token, c.utilisateur._id, c.organisation._id));
  }
  for (const m of Object.values(MEMBRES_CC)) {
    docs.user.push(utilisateurPret(m.utilisateur));
    docs.member.push({ _id: oid("membreCc", m.n), userId: m.utilisateur._id, organizationId: m.organisationId, role: m.role, createdAt: MAINTENANT });
    docs.session.push(session(m.n, m.token, m.utilisateur._id, m.organisationId));
  }
  for (const r of Object.values(ROLES_CC)) {
    docs.organizationRole.push({ _id: r._id, organizationId: r.organizationId, role: r.role, permission: "{}", actions: r.actions, catalogVersion: 2, name: r.name, description: r.description, createdAt: MAINTENANT, updatedAt: MAINTENANT });
  }
  return {
    ...docs,
    clients: [...Object.values(CONTACTS_DROITS), ...Object.values(CONTACTS_INTEGRITE), ...Object.values(CONTACTS_AUTOMATISATIONS), ...Object.values(VOLUME), ...REMPLISSAGE_VOLUME],
    clientlists: Object.values(LISTES_CC),
    clientsegments: Object.values(SEGMENTS_CC),
    clientcustomfields: Object.values(CHAMPS_CC),
    crmemailautomations: Object.values(CRM_CC),
    invoices: Object.values(FACTURES_CC),
    quotes: [...Object.values(DEVIS_CC), ...docsVolume("devisCc")],
    purchaseorders: [...Object.values(BONS_COMMANDE_CC), ...docsVolume("bcCc")],
    deliverynotes: [BON_LIVRAISON_CC],
    creditnotes: [AVOIR_CC],
    products: Object.values(PRODUITS_CC),
    productcustomfields: Object.values(CHAMPS_PRODUIT_CC),
  };
}
