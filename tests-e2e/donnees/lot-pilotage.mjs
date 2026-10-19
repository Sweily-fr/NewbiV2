/**
 * Données du lot « pilotage » (accueil, analytiques, espace gestionnaire, mise en page, pages publiques).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e7a à e2e7f, e2eda à e2edf).
 *
 * Organisations (40 à 44) :
 *   - 40 « Pilotage Test SASU » (compte « pilotage ») : un compte bancaire,
 *     des transactions, des factures, devis, avoirs, factures d'achat et une
 *     facture importée répartis sur le mois en cours, les mois précédents et
 *     l'année précédente (accueil, analytiques, vue d'ensemble). Membres :
 *     Éditeur, Membre, et le cabinet (Comptable) qui la suit ;
 *   - 41 « Boulangerie Cliente SARL » (compte « clientCabinet ») : cliente du
 *     cabinet, plus de 50 factures (les plus anciennes sont en retard) ;
 *   - 42 « Épicerie Libre SAS » et 43 « Traiteur Libre SARL » : espaces libres
 *     du même dirigeant, à confier au cabinet par invitation ;
 *   - 44 « Studio Invitable SAS » : espace libre de l'Éditeur de « Pilotage »,
 *     cible des invitations créées par les tests (retirées en fin de test).
 * Comptes gestionnaires : le cabinet (Claire Comptable) et un « cabinet
 * fantôme » sans utilisateur, dont le cabinet ne doit jamais rien atteindre.
 */
import { COMPTES, MEMBRES, DANS, MAINTENANT, oid } from "./base.mjs";
import { facture } from "./factures-liste.mjs";
import { articles, documentVente, entreprise, ligne, snapshotClient, totaux } from "./documents.mjs";

const PILOTAGE = COMPTES.pilotage;
const BOULANGERIE = COMPTES.clientCabinet;
const W_PILOTAGE = PILOTAGE.organisation._id;
const W_BOULANGERIE = BOULANGERIE.organisation._id;

// --- Dates ---------------------------------------------------------------------

/** Jour du mois en cours (heure de Paris), comme le cadre « Facturation » de l'accueil. */
const JOUR_DU_MOIS = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", day: "2-digit" }).format(MAINTENANT));

/** Une date du mois en cours : `jours` avant maintenant, sans jamais sortir du mois. */
export const ceMois = (jours) => DANS(-Math.min(jours, JOUR_DU_MOIS - 1));

/** Midi (UTC) du jour situé `jours` avant aujourd'hui : un jour précis pour la période personnalisée. */
export function midiIlYa(jours, heure = 12) {
  const d = DANS(-jours);
  d.setUTCHours(heure, 0, 0, 0);
  return d;
}

// --- Organisations et membres en plus de base.mjs ---------------------------------

function espace(n, nom, proprietaire) {
  return {
    _id: oid("organisation", n),
    name: nom,
    slug: nom.toLowerCase().replace(/\s+/g, "-"),
    companyName: nom,
    companyEmail: `facturation@org${n}.test`,
    companyPhone: "+33123456789",
    addressStreet: "1 rue de la Paix",
    addressCity: "Paris",
    addressZipCode: "75001",
    addressCountry: "France",
    // SIRET propre à chaque espace (un SIRET n'appartient qu'à un espace)
    siret: `9876543210${String(n).padStart(4, "0")}`,
    legalForm: "SAS",
    vatNumber: "FR98765432100",
    capitalSocial: "10000",
    rcs: "Paris B 987 654 321",
    logo: null,
    metadata: null,
    organizationType: "business",
    onboardingCompleted: true,
    sessionSettings: { maxSessions: 0 },
    createdAt: DANS(-200),
    _proprietaire: proprietaire,
  };
}

/** Espaces libres : aucun cabinet ne les suit. */
export const ESPACES_LIBRES = {
  epicerie: espace(42, "Épicerie Libre SAS", BOULANGERIE.utilisateur),
  traiteur: espace(43, "Traiteur Libre SARL", BOULANGERIE.utilisateur),
  studio: espace(44, "Studio Invitable SAS", MEMBRES.pilotageEditeur.utilisateur),
};

// --- Comptes gestionnaires -----------------------------------------------------------

export const CABINET = {
  _id: oid("pilGestion", 1),
  userId: MEMBRES.cabinet.utilisateur._id,
  name: "Cabinet Expertise Test",
  discountPercent: 20,
  status: "active",
  createdAt: DANS(-60),
  updatedAt: MAINTENANT,
};

/** Un autre cabinet, sans compte utilisateur : ses invitations ne regardent que lui. */
export const CABINET_FANTOME = {
  _id: oid("pilGestion", 2),
  userId: oid("pilDivers", 999),
  name: "Cabinet Fantôme",
  discountPercent: 0,
  status: "active",
  createdAt: DANS(-60),
  updatedAt: MAINTENANT,
};

const lien = (n, organisation, { payer = "client", debutIlYa = 30 } = {}) => ({
  _id: oid("pilGestion", n),
  managerId: CABINET._id,
  organizationId: organisation._id,
  payer,
  status: "active",
  startedAt: DANS(-debutIlYa),
  endedAt: null,
  endedBy: null,
  createdBy: { type: "admin", email: "equipe@newbi.test" },
  createdAt: DANS(-debutIlYa),
  updatedAt: MAINTENANT,
});

const invitation = (n, { cabinet = CABINET, email, utilisateur, statut = "pending", demandeeIlYa = 2, expireDans = 12, reponduIlYa = null }) => ({
  _id: oid("pilGestion", n),
  managerId: cabinet._id,
  organizationId: null,
  status: statut,
  invitedEmail: email,
  invitedUserId: utilisateur,
  payer: "client",
  requestedAt: DANS(-demandeeIlYa),
  expiresAt: DANS(expireDans),
  respondedAt: reponduIlYa === null ? null : DANS(-reponduIlYa),
  startedAt: null,
  endedAt: null,
  endedBy: null,
  createdBy: { type: "manager", email: "cabinet@e2e.test" },
  createdAt: DANS(-demandeeIlYa),
  updatedAt: MAINTENANT,
});

const CLIENT_CABINET_ID = BOULANGERIE.utilisateur._id;
const PERSONNE = oid("pilDivers", 998);

/** Fiches du cabinet : ses deux clients et ses invitations, une par action des tests. */
export const LIENS = {
  pilotage: lien(11, PILOTAGE.organisation, { debutIlYa: 40 }),
  boulangerie: lien(12, BOULANGERIE.organisation, { debutIlYa: 20 }),
};

export const INVITATIONS = {
  // Reçues par le dirigeant de « Boulangerie Cliente » (deux espaces libres à confier)
  aAccepter: invitation(21, { email: BOULANGERIE.utilisateur.email, utilisateur: CLIENT_CABINET_ID, demandeeIlYa: 2 }),
  aRefuser: invitation(22, { email: BOULANGERIE.utilisateur.email, utilisateur: CLIENT_CABINET_ID, demandeeIlYa: 1 }),
  // Du cabinet fantôme, au même dirigeant : le cabinet n'y touche jamais
  fantome: invitation(23, { cabinet: CABINET_FANTOME, email: BOULANGERIE.utilisateur.email, utilisateur: CLIENT_CABINET_ID, demandeeIlYa: 3 }),
  // Expirée, à relancer : l'Éditeur de « Pilotage » est super admin d'un espace libre
  expiree: invitation(24, { email: MEMBRES.pilotageEditeur.utilisateur.email, utilisateur: MEMBRES.pilotageEditeur.utilisateur._id, demandeeIlYa: 20, expireDans: -6 }),
  // En attente, à annuler (adresse sans compte : n'apparaît chez personne)
  aAnnuler: invitation(25, { email: "prospect-annule@e2e.test", utilisateur: PERSONNE, demandeeIlYa: 4, expireDans: 10 }),
  // Refusée il y a longtemps, à retirer de la liste
  refuseeARetirer: invitation(26, { email: "prospect-refus@e2e.test", utilisateur: PERSONNE, statut: "declined", demandeeIlYa: 30, expireDans: -16, reponduIlYa: 25 }),
  // Refusée, à relancer alors que le compte n'existe plus : refus expliqué
  refuseeSansCompte: invitation(27, { email: "ancien-client@e2e.test", utilisateur: PERSONNE, statut: "declined", demandeeIlYa: 40, expireDans: -26, reponduIlYa: 30 }),
};

// --- Contacts ------------------------------------------------------------------------

/** Texte piégé : exécuté, il pose window.__piege et ouvre une alerte (la surveillance échoue). */
export const PIEGE_HTML = `<img src="x-piege" onerror="window.__piege='execute';alert('code exécuté depuis un texte')">`;

/** Contact « tel que copié » dans les documents (forme des CLIENTS de base.mjs, clé `organisation`). */
function contact(n, compte, { name, ...champs }) {
  return {
    _id: oid("pilClient", n),
    organisation: compte,
    name,
    email: `contact-${n}@pilotage.test`,
    type: "COMPANY",
    isInternational: false,
    isBlocked: false,
    address: { fullName: name, street: "12 rue des Lilas", city: "Lyon", postalCode: "69003", country: "France" },
    ...champs,
  };
}

/** Le même contact tel qu'enregistré dans la collection clients (comme socle() le fait pour CLIENTS). */
function contactEnBase({ organisation: compte, ...c }, i) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    contacts: [],
    notes: [],
    customFields: [],
    activityLog: [],
    assignedMembers: [],
    hasDifferentShippingAddress: false,
    ...c,
    createdBy: utilisateur._id,
    workspaceId: organisation._id,
    createdAt: DANS(-(150 - i)),
    updatedAt: MAINTENANT,
  };
}

export const CONTACTS_PILOTAGE = {
  pilote: contact(1, "pilotage", { name: "Société Pilote SAS", siret: "11122233300014" }),
  coeur: contact(2, "pilotage", { name: "Cœur d’Artichaut SARL", siret: "22233344400015" }),
  piege: contact(3, "pilotage", { name: `Piège ${PIEGE_HTML} SAS` }),
  particulier: contact(4, "pilotage", { name: "Jeanne Dupré", type: "INDIVIDUAL", firstName: "Jeanne", lastName: "Dupré" }),
  restaurant: contact(5, "clientCabinet", { name: "Restaurant du Port" }),
  piegeBoulangerie: contact(6, "clientCabinet", { name: `Traiteur ${PIEGE_HTML} Piégé` }),
};

// --- Factures --------------------------------------------------------------------

/** Facture « telle qu'enregistrée » (forme de factures-liste.mjs), avec l'identifiant et le préfixe du lot. */
function facturePil(n, { compte = "pilotage", prefixe = "F-PIL", emise, echeance, payeeLe = null, creeeLe = null, envoyee = false, ...reste }) {
  const base = facture({ n: 1, compte, emiseIlYa: 0, echeanceDans: 0, payeeLe, ...reste });
  const emiseLe = emise ?? MAINTENANT;
  return {
    ...base,
    _id: oid("pilFacture", n),
    prefix: prefixe,
    issueDate: emiseLe,
    issueYear: emiseLe.getFullYear(),
    dueDate: echeance ?? DANS(30),
    paymentDate: payeeLe,
    emailTracking: envoyee ? { emailSentAt: DANS(-1), emailClickCount: 0, emailOpenCount: 0 } : { emailClickCount: 0, emailOpenCount: 0 },
    createdAt: creeeLe ?? emiseLe,
  };
}

const C = CONTACTS_PILOTAGE;

/** Factures de « Pilotage », par rôle dans les tests (montants HT, TVA 20 % sauf mention). */
export const FACTURES_PILOTAGE = {
  // Mois en cours
  aEncaisser: facturePil(1, { numero: "0101", statut: "PENDING", emise: ceMois(2), echeance: DANS(20), client: C.pilote, articles: [ligne("Mission de pilotage", 3, 400)], envoyee: true }),
  enRetard: facturePil(2, { numero: "0102", statut: "PENDING", emise: ceMois(9), echeance: DANS(-1), client: C.pilote, articles: [ligne("Audit en retard", 1, 500)] }),
  payee: facturePil(3, { numero: "0103", statut: "COMPLETED", emise: ceMois(5), echeance: DANS(25), payeeLe: ceMois(1), client: C.pilote, articles: [ligne("Tableau de bord", 1, 1000)], envoyee: true }),
  annulee: facturePil(4, { numero: "0104", statut: "CANCELED", emise: ceMois(3), client: C.pilote, articles: [ligne("Mission annulée du mois", 1, 300)], envoyee: true }),
  brouillon: facturePil(5, { numero: "DRAFT-0101", statut: "DRAFT", emise: ceMois(1), client: C.pilote, articles: [ligne("Brouillon du mois", 1, 800)] }),
  piegee: facturePil(6, { numero: "0105", statut: "PENDING", emise: ceMois(4), echeance: DANS(30), client: C.piege, articles: [ligne("Prestation au nom piégé", 1, 250)], envoyee: true }),
  accents: facturePil(7, { numero: "0106", statut: "COMPLETED", emise: ceMois(6), echeance: DANS(24), payeeLe: ceMois(2), client: C.coeur, articles: [ligne("Œuvre graphique n° 2", 2, 1000, 10)], envoyee: true }),
  // Mois précédents
  ancienneEnRetard: facturePil(8, { numero: "0090", statut: "PENDING", emise: DANS(-45), echeance: DANS(-15), client: C.coeur, articles: [ligne("Conseil de septembre", 1, 700)], envoyee: true }),
  payeeIlYaDeuxMois: facturePil(9, { numero: "0080", statut: "COMPLETED", emise: DANS(-70), echeance: DANS(-40), payeeLe: DANS(-50), client: C.pilote, articles: [ligne("Formation équipe", 1, 1500)], envoyee: true }),
  anneePrecedente: facturePil(10, { numero: "0010", statut: "COMPLETED", emise: DANS(-400), echeance: DANS(-370), payeeLe: DANS(-390), client: C.pilote, articles: [ligne("Mission de l'an dernier", 1, 3000)], envoyee: true }),
  enAttenteRecente: facturePil(11, { numero: "0095", statut: "PENDING", emise: DANS(-35), echeance: DANS(5), client: C.particulier, articles: [ligne("Accompagnement particulier", 1, 400)], envoyee: true }),
  payeeSansDate: facturePil(12, { numero: "0085", statut: "COMPLETED", emise: DANS(-80), echeance: DANS(-50), client: C.coeur, articles: [ligne("Payée sans date de paiement", 1, 600)], envoyee: true }),
  // Émise et payée un jour précis, à midi : période personnalisée d'un seul jour
  jourPrecis: facturePil(13, { numero: "0075", statut: "COMPLETED", emise: midiIlYa(16), echeance: midiIlYa(1), payeeLe: midiIlYa(16, 15), client: C.pilote, articles: [ligne("Mission du jour précis", 1, 640)], envoyee: true }),
};

/** Factures de « Boulangerie Cliente » : 52 payées récentes, 3 en retard anciennes, 1 au nom piégé. */
function facturesBoulangerie() {
  const docs = [];
  for (let i = 1; i <= 52; i++) {
    docs.push(
      facturePil(100 + i, {
        compte: "clientCabinet",
        prefixe: "F-BOUL",
        numero: String(i + 10).padStart(4, "0"),
        statut: "COMPLETED",
        emise: DANS(-(40 + i)),
        echeance: DANS(-(10 + i)),
        payeeLe: DANS(-(20 + i)),
        // Créées récemment (reprise de l'historique) : les plus récentes de l'espace
        creeeLe: DANS(-(i / 10)),
        client: C.restaurant,
        articles: [ligne(`Pains et viennoiseries lot ${i}`, 1, 100 + i)],
        envoyee: true,
      }),
    );
  }
  for (let i = 1; i <= 3; i++) {
    docs.push(
      facturePil(200 + i, {
        compte: "clientCabinet",
        prefixe: "F-BOUL",
        numero: String(i).padStart(4, "0"),
        statut: "PENDING",
        emise: DANS(-(120 + i)),
        echeance: DANS(-(90 + i)),
        creeeLe: DANS(-(120 + i)),
        client: C.restaurant,
        articles: [ligne(`Commande impayée ${i}`, 1, 300 * i)],
        envoyee: true,
      }),
    );
  }
  docs.push(
    facturePil(210, {
      compte: "clientCabinet",
      prefixe: "F-BOUL",
      numero: "0099",
      statut: "PENDING",
      emise: DANS(-1),
      echeance: DANS(29),
      creeeLe: DANS(-1),
      client: C.piegeBoulangerie,
      articles: [ligne("Buffet au nom piégé", 1, 420)],
      envoyee: true,
    }),
  );
  return docs;
}
export const FACTURES_BOULANGERIE = facturesBoulangerie();

// --- Avoirs ------------------------------------------------------------------------

function avoirPil(n, { compte = "pilotage", f, montantHT, emis, motif }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const lignes = [ligne("Geste commercial", -1, montantHT)];
  const t = totaux(lignes);
  const negatif = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, -Math.abs(v)]));
  return {
    _id: oid("pilAvoir", n),
    prefix: "AV-PIL",
    number: String(n).padStart(4, "0"),
    originalInvoice: f._id,
    originalInvoiceNumber: `${f.prefix}-${f.number}`,
    creditType: "COMMERCIAL_GESTURE",
    reason: motif,
    issueDate: emis,
    issueYear: emis.getFullYear(),
    items: articles(lignes),
    companyInfo: entreprise(compte),
    client: f.client,
    status: "CREATED",
    refundMethod: "NEXT_INVOICE",
    discount: 0,
    discountType: "PERCENTAGE",
    customFields: [],
    showBankDetails: false,
    isReverseCharge: false,
    ...negatif,
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    clientPositionRight: false,
    operationType: null,
    retenueGarantie: 0,
    escompte: 0,
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: emis,
    updatedAt: MAINTENANT,
  };
}

export const AVOIRS_PILOTAGE = {
  surPayee: avoirPil(1, { f: FACTURES_PILOTAGE.payeeIlYaDeuxMois, montantHT: 100, emis: DANS(-48), motif: "Remise sur la formation" }),
  boulangerie: avoirPil(2, { compte: "clientCabinet", f: FACTURES_BOULANGERIE[0], montantHT: 20, emis: DANS(-30), motif: "Pains manquants" }),
};

// --- Devis, bons de commande, bons de livraison ---------------------------------------

function devisPil(n, { compte = "pilotage", numero, statut, emiseIlYa, valideDans, client, lignes }) {
  return {
    _id: oid("pilDevis", n),
    ...documentVente({ compte, prefixe: "D-PIL", numero, statut, emiseIlYa, client, lignes, creeIlYa: emiseIlYa }),
    validUntil: DANS(valideDans),
    projectReference: "",
    convertedToInvoice: null,
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    abbySyncStatus: "NOT_SYNCED",
    emailTracking: { emailClickCount: 0, emailOpenCount: 0 },
  };
}

export const DEVIS_PILOTAGE = {
  enAttente: devisPil(1, { numero: "0201", statut: "PENDING", emiseIlYa: 3, valideDans: 27, client: C.pilote, lignes: [ligne("Refonte du site", 1, 4000)] }),
  expire: devisPil(2, { numero: "0202", statut: "PENDING", emiseIlYa: 50, valideDans: -5, client: C.coeur, lignes: [ligne("Devis expiré", 1, 900)] }),
  accepte: devisPil(3, { numero: "0203", statut: "COMPLETED", emiseIlYa: 20, valideDans: 10, client: C.pilote, lignes: [ligne("Charte accepté", 1, 2500)] }),
  brouillon: devisPil(4, { numero: "DRAFT-0201", statut: "DRAFT", emiseIlYa: 1, valideDans: 29, client: C.pilote, lignes: [ligne("Devis brouillon", 1, 300)] }),
  annule: devisPil(5, { numero: "0204", statut: "CANCELED", emiseIlYa: 15, valideDans: 15, client: C.coeur, lignes: [ligne("Devis annulé", 1, 700)] }),
  boulangerie: devisPil(6, { compte: "clientCabinet", numero: "0301", statut: "PENDING", emiseIlYa: 4, valideDans: 26, client: C.restaurant, lignes: [ligne("Buffet de mariage", 1, 1800)] }),
};

function bonCommandePil(n, { compte, numero, statut, emiseIlYa, client, lignes }) {
  return {
    _id: oid("pilDivers", n),
    ...documentVente({ compte, prefixe: "BC-PIL", numero, statut, emiseIlYa, client, lignes, creeIlYa: emiseIlYa }),
    validUntil: DANS(30 - emiseIlYa),
    purchaseOrderNumber: "",
    sourceQuoteId: null,
  };
}

export const BONS_COMMANDE_PILOTAGE = {
  pilotage: bonCommandePil(101, { compte: "pilotage", numero: "0401", statut: "CONFIRMED", emiseIlYa: 6, client: C.pilote, lignes: [ligne("Licences", 4, 150)] }),
  boulangerie: bonCommandePil(102, { compte: "clientCabinet", numero: "0402", statut: "DELIVERED", emiseIlYa: 12, client: C.restaurant, lignes: [ligne("Farine bio", 10, 45)] }),
};

function bonLivraisonPil(n, { compte, numero, statut, emiseIlYa, client, objets }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const emise = DANS(-emiseIlYa);
  return {
    _id: oid("pilDivers", n),
    prefix: "BL-PIL",
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    deliveryDate: DANS(3),
    client: snapshotClient(client),
    companyInfo: entreprise(compte),
    items: objets.map(([description, quantity]) => ({ description, quantity, details: "", unit: "unité", reference: "" })),
    deliveryAddress: { fullName: client.name, street: client.address.street, postalCode: client.address.postalCode, city: client.address.city, country: "France" },
    carrier: "Transports Pilotage",
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
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: emise,
    updatedAt: MAINTENANT,
  };
}

export const BONS_LIVRAISON_PILOTAGE = {
  pilotage: bonLivraisonPil(201, { compte: "pilotage", numero: "0501", statut: "PENDING", emiseIlYa: 2, client: C.pilote, objets: [["Écrans", 2]] }),
  boulangerie: bonLivraisonPil(202, { compte: "clientCabinet", numero: "0502", statut: "DELIVERED", emiseIlYa: 9, client: C.restaurant, objets: [["Pains", 40]] }),
};

// --- Factures d'achat ------------------------------------------------------------

function achat(n, { fournisseur, statut, emise, echeance = null, payeeLe = null, ht, tva, categorie = "SOFTWARE", transactions = [] }) {
  return {
    _id: oid("pilAchat", n),
    supplierName: fournisseur,
    supplierId: null,
    invoiceNumber: `FA-${String(n).padStart(4, "0")}`,
    issueDate: emise,
    dueDate: echeance,
    amountHT: ht,
    amountTVA: tva,
    vatRate: ht ? Math.round((tva / ht) * 100) : 20,
    vatBreakdown: [],
    amountTTC: Math.round((ht + tva) * 100) / 100,
    currency: "EUR",
    status: statut,
    category: categorie,
    subcategory: null,
    tags: [],
    notes: "",
    files: [],
    ocrMetadata: {},
    paymentDate: payeeLe,
    ...(payeeLe ? { paymentMethod: "BANK_TRANSFER" } : {}),
    linkedTransactionIds: transactions,
    isReconciled: transactions.length > 0,
    source: "MANUAL",
    eInvoiceStatus: "NOT_APPLICABLE",
    eInvoicePaymentReportStatus: "NOT_APPLICABLE",
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    workspaceId: W_PILOTAGE,
    createdBy: PILOTAGE.utilisateur._id,
    createdAt: emise,
    updatedAt: MAINTENANT,
  };
}

const T = (n) => oid("pilTransaction", n);

export const ACHATS_PILOTAGE = {
  aPayer: achat(1, { fournisseur: "Logiciels Pilote", statut: "TO_PAY", emise: ceMois(3), echeance: DANS(10), ht: 200, tva: 40 }),
  aPayerEchu: achat(2, { fournisseur: "Imprimerie Échue", statut: "TO_PAY", emise: ceMois(8), echeance: DANS(-2), ht: 100, tva: 20, categorie: "OFFICE_SUPPLIES" }),
  enRetard: achat(3, { fournisseur: "Fournitures en retard", statut: "OVERDUE", emise: ceMois(6), echeance: DANS(-3), ht: 50, tva: 10, categorie: "OFFICE_SUPPLIES" }),
  payee: achat(4, { fournisseur: "Hébergeur payé", statut: "PAID", emise: ceMois(4), echeance: DANS(20), payeeLe: ceMois(1), ht: 400, tva: 80, transactions: [T(4)] }),
  aTraiter: achat(5, { fournisseur: "Reçu à traiter", statut: "TO_PROCESS", emise: ceMois(2), ht: 30, tva: 6, categorie: "MEALS" }),
  anneePrecedente: achat(6, { fournisseur: "Matériel de l'an dernier", statut: "PAID", emise: DANS(-420), payeeLe: DANS(-410), ht: 1000, tva: 200, categorie: "HARDWARE" }),
  ilYaDeuxMois: achat(7, { fournisseur: "Formation payée", statut: "PAID", emise: DANS(-65), payeeLe: DANS(-55), ht: 300, tva: 60, categorie: "TRAINING" }),
};

// --- Facture client importée ------------------------------------------------------

export const IMPORTEE_PILOTAGE = {
  _id: oid("pilImportee", 1),
  workspaceId: W_PILOTAGE,
  importedBy: PILOTAGE.utilisateur._id,
  status: "VALIDATED",
  originalInvoiceNumber: "IMP-PIL-001",
  vendor: { name: "Pilotage Test SASU" },
  client: { name: "Client importé SARL" },
  invoiceDate: ceMois(3),
  dueDate: DANS(27),
  paymentDate: null,
  linkedTransactionIds: [],
  totalHT: 150,
  totalVAT: 30,
  totalTTC: 180,
  currency: "EUR",
  items: [],
  category: "SERVICES",
  paymentMethod: "TRANSFER",
  file: { url: "https://fichiers.e2e.invalid/importees/imp-pil-001.pdf", cloudflareKey: "e2e/importees/imp-pil-001.pdf", originalFileName: "imp-pil-001.pdf", mimeType: "application/pdf", fileSize: 1024 },
  ocrData: { extractedText: "", rawData: {}, financialAnalysis: {}, confidence: 0, processedAt: null },
  notes: "",
  linkedExpenseId: null,
  isDuplicate: false,
  duplicateOf: null,
  source: "MANUAL",
  gmailMessageId: null,
  createdAt: ceMois(3),
  updatedAt: MAINTENANT,
};

// --- Banque ------------------------------------------------------------------------------

export const COMPTE_BANCAIRE_PILOTAGE = {
  _id: oid("pilCompteBancaire", 1),
  externalId: "e2e-pilotage-compte-1",
  provider: "bridge",
  name: "Compte courant Pilotage",
  type: "checking",
  status: "active",
  balance: 12500,
  currency: "EUR",
  iban: "FR7630001007941234567890185",
  bankName: "Banque Pilote",
  institutionName: "Banque Pilote",
  workspaceId: W_PILOTAGE.toHexString(),
  userId: PILOTAGE.utilisateur._id,
  lastSyncAt: DANS(-1),
  transactionSync: { status: "complete", lastSyncAt: DANS(-1), totalTransactions: 8 },
  createdAt: DANS(-100),
  updatedAt: MAINTENANT,
};

function transaction(n, { montant, date, libelle, statut = "completed", rapprochement = "unmatched", factures = [], achats = [], categorie = null, depense = null, fournisseur = "bridge", supprimee = false }) {
  return {
    _id: T(n),
    externalId: `e2e-pilotage-tx-${n}`,
    provider: fournisseur,
    type: montant > 0 ? "credit" : "debit",
    status: statut,
    amount: montant,
    currency: "EUR",
    description: libelle,
    fromAccount: COMPTE_BANCAIRE_PILOTAGE.externalId,
    workspaceId: W_PILOTAGE.toHexString(),
    userId: PILOTAGE.utilisateur._id,
    date,
    processedAt: date,
    linkedInvoiceIds: factures,
    linkedPurchaseInvoiceIds: achats,
    linkedImportedInvoiceIds: [],
    receiptFiles: [],
    reconciliationStatus: rapprochement,
    category: categorie,
    expenseCategory: depense,
    deletedAt: supprimee ? DANS(-1) : null,
    createdAt: date,
    updatedAt: MAINTENANT,
  };
}

export const TRANSACTIONS_PILOTAGE = {
  paiementFacture: transaction(1, { montant: 1200, date: ceMois(1), libelle: "VIR SOCIETE PILOTE SAS F-PIL-0103", rapprochement: "matched", factures: [FACTURES_PILOTAGE.payee._id] }),
  aRapprocher: transaction(2, { montant: 450, date: DANS(-3), libelle: "VIR CLIENT INCONNU" }),
  aRapprocherPetit: transaction(3, { montant: 99.9, date: DANS(-6), libelle: "VIR REMBOURSEMENT DIVERS" }),
  paiementAchat: transaction(4, { montant: -480, date: ceMois(1), libelle: "PRLV HEBERGEUR PAYE", rapprochement: "matched", achats: [ACHATS_PILOTAGE.payee._id], depense: "SOFTWARE" }),
  abonnement: transaction(5, { montant: -89.99, date: DANS(-4), libelle: "CB ABONNEMENT LOGICIEL", depense: "SOFTWARE" }),
  sansJustificatif: transaction(6, { montant: -35.5, date: DANS(-8), libelle: "CB DEJEUNER SANS JUSTIFICATIF" }),
  anneePrecedente: transaction(7, { montant: -1000, date: DANS(-380), libelle: "CB MATERIEL AN DERNIER", depense: "HARDWARE" }),
  especes: transaction(8, { montant: 50, date: DANS(-2), libelle: "Dépôt d'espèces", fournisseur: "manual", rapprochement: "ignored" }),
  supprimee: transaction(9, { montant: -999, date: DANS(-5), libelle: "CB SUPPRIMEE", supprimee: true }),
};

// --- Notifications d'activité ------------------------------------------------------

function notification(n, { titre, message, lue = false, ilYa = 1 }) {
  return {
    _id: oid("pilDivers", n),
    userId: PILOTAGE.utilisateur._id,
    workspaceId: W_PILOTAGE,
    type: "MEMBER_JOINED",
    title: titre,
    message,
    data: { actorName: "Léa Éditrice" },
    read: lue,
    readAt: lue ? DANS(-ilYa) : null,
    createdAt: DANS(-ilYa),
    updatedAt: DANS(-ilYa),
  };
}

export const NOTIFICATIONS_PILOTAGE = {
  nonLue: notification(301, { titre: "Nouveau membre", message: "Léa Éditrice a rejoint l'espace." }),
  piegee: notification(302, { titre: `Membre ${PIEGE_HTML}`, message: `Sam ${PIEGE_HTML} a rejoint l'espace.`, ilYa: 2 }),
  lue: notification(303, { titre: "Ancien membre", message: "Notification déjà lue.", lue: true, ilYa: 10 }),
};

// --- Assemblage --------------------------------------------------------------------

const membre = (n, utilisateur, organisation, role) => ({
  _id: oid("pilMembre", n),
  userId: utilisateur._id ?? utilisateur,
  organizationId: organisation._id ?? organisation,
  role,
  createdAt: DANS(-100),
});

const abonnement = (n, organisation) => ({
  _id: oid("pilAbonnement", n),
  referenceId: organisation._id.toHexString(),
  plan: "pme",
  status: "active",
  periodStart: DANS(-1),
  periodEnd: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesPilotage() {
  const libres = Object.values(ESPACES_LIBRES);
  return {
    organization: libres.map(({ _proprietaire, ...org }) => org),
    member: [
      ...libres.map((org, i) => membre(1 + i, org._proprietaire, org, "owner")),
      // Le cabinet suit aussi « Pilotage » (Comptable), en plus de « Boulangerie Cliente » (MEMBRES)
      membre(10, MEMBRES.cabinet.utilisateur, PILOTAGE.organisation, "accountant"),
    ],
    subscription: libres.map((org, i) => abonnement(1 + i, org)),
    accountmanagers: [CABINET, CABINET_FANTOME],
    managedclients: [...Object.values(LIENS), ...Object.values(INVITATIONS)],
    clients: Object.values(CONTACTS_PILOTAGE).map(contactEnBase),
    invoices: [...Object.values(FACTURES_PILOTAGE), ...FACTURES_BOULANGERIE],
    creditnotes: Object.values(AVOIRS_PILOTAGE),
    quotes: Object.values(DEVIS_PILOTAGE),
    purchaseorders: Object.values(BONS_COMMANDE_PILOTAGE),
    deliverynotes: Object.values(BONS_LIVRAISON_PILOTAGE),
    purchaseinvoices: Object.values(ACHATS_PILOTAGE),
    imported_invoices: [IMPORTEE_PILOTAGE],
    accounts_bankings: [COMPTE_BANCAIRE_PILOTAGE],
    transactions: Object.values(TRANSACTIONS_PILOTAGE),
    notifications: Object.values(NOTIFICATIONS_PILOTAGE),
  };
}

export { W_PILOTAGE, W_BOULANGERIE };
