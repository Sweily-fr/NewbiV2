/**
 * Données du lot « factures » (factures et avoirs).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e4a à e2e4f, e2eba à e2ebf).
 *
 * Trois organisations (voir COMPTES dans base.mjs) :
 *   - « Factures » : factures dans chaque état, avoirs, récurrences, modèles,
 *     facture importée et compte Stripe Connect (lien de paiement), vues par
 *     le propriétaire, l'« Éditeur » et le « Membre » ;
 *   - « Réglages Factures » : numérotation continue, plus de 50 factures,
 *     paramètres et relances automatiques ;
 *   - « Offre Factures » : offre d'entrée, 10 modèles (plafond atteint).
 * Les créations depuis l'éditeur se font dans « Atelier », comme les autres
 * catalogues de création.
 *
 * Les factures consultées seulement par l'API (cibles des contrôles de
 * droits) sont les plus anciennes : la liste ne charge que les 50 factures
 * créées en dernier (défaut couvert par factures/volume.spec.mjs), les
 * factures vues à l'écran doivent rester parmi elles.
 */
import { COMPTES, DANS, MAINTENANT, MEMBRES, oid } from "./base.mjs";
import { articles as avecDefauts, entreprise, ligne, snapshotClient, totaux } from "./documents.mjs";
import { facture as factureListe } from "./factures-liste.mjs";

const jour = (d) => d.toISOString().slice(0, 10);

/** Préfixe de la séquence des factures pré-remplies (comme le compte « Liste »). */
export const PREFIXE = "F-092026";

// --- Clients ----------------------------------------------------------------

/** Champ personnalisé des clients de « Réglages Factures », affiché sur les documents. */
export const CHAMP_DOCUMENTS = { nom: "Numéro de dossier", valeur: "DOS-2026-042" };
const ID_CHAMP_DOCUMENTS = oid("diversFactures", 2);

const adresse = (street, city, postalCode, country = "France") => ({ street, city, postalCode, country });

function client(n, organisation, champs) {
  return {
    _id: oid("clientFactures", n),
    organisation,
    isInternational: false,
    isBlocked: false,
    ...champs,
  };
}

export const CLIENTS_FACTURES = {
  lumiere: client(1, "factures", {
    name: "Boulangerie Lumière SARL",
    email: "compta@lumiere.test",
    phone: "+33478000001",
    type: "COMPANY",
    siret: "55566677700011",
    vatNumber: "FR55555666777",
    address: adresse("12 rue de la République", "Lyon", "69002"),
  }),
  dumas: client(2, "factures", {
    name: "Cabinet Dumas et Fils",
    email: "contact@dumas-fils.test",
    type: "COMPANY",
    siret: "66677788800012",
    vatNumber: "FR66666777888",
    address: adresse("7 boulevard Haussmann", "Paris", "75009"),
  }),
  zoe: client(3, "factures", {
    name: "Zoé Dupré",
    firstName: "Zoé",
    lastName: "Dupré",
    email: "zoe.dupre@e2e.test",
    type: "INDIVIDUAL",
    address: adresse("3 allée des Cerisiers", "Nantes", "44000"),
  }),
  // Clients de l'éditeur (organisation « Atelier »)
  nordique: client(4, "atelier", {
    name: "Nordisk Design AB",
    email: "billing@nordisk.test",
    type: "COMPANY",
    isInternational: true,
    vatNumber: "SE556677889901",
    address: adresse("Kungsgatan 12", "Stockholm", "111 43", "Suède"),
  }),
  // Organisation « Réglages Factures »
  volume: client(10, "facturesReglages", {
    name: "Garage du Volume SARL",
    email: "factures@garage-volume.test",
    type: "COMPANY",
    siret: "77788899900013",
    address: adresse("40 route de Lyon", "Grenoble", "38000"),
    customFields: [{ fieldId: ID_CHAMP_DOCUMENTS, value: CHAMP_DOCUMENTS.valeur }],
  }),
  ancien: client(11, "facturesReglages", {
    name: "Ancien Client Archivé SAS",
    email: "archives@ancien-client.test",
    type: "COMPANY",
    siret: "88899900000014",
    address: adresse("1 place du Marché", "Dijon", "21000"),
  }),
  // Organisation « Offre Factures »
  offre: client(20, "facturesOffre", {
    name: "Client de l'Offre SARL",
    email: "contact@client-offre.test",
    type: "COMPANY",
    siret: "99900011100015",
    address: adresse("9 rue Nationale", "Tours", "37000"),
  }),
};

// --- Factures ---------------------------------------------------------------

/**
 * Une facture « telle qu'enregistrée » (forme de factures-liste.mjs), avec
 * les identifiants du lot. `creeeIlYa` règle l'ordre de la liste (la plus
 * récente en premier) ; `extra` : champs propres au cas.
 */
function f(n, { compte = "factures", prefixe = PREFIXE, creeeIlYa, extra = {}, ...champs }) {
  const doc = factureListe({ n: 0, compte, creeeIlYa: creeeIlYa ?? 60 - n, ...champs });
  return { ...doc, _id: oid("factureLot", n), prefix: prefixe, ...extra };
}

const { lumiere, dumas, zoe } = CLIENTS_FACTURES;

/** Factures de l'organisation « Factures », par rôle dans les tests. */
export const F = {
  // Consultées (boutons, panneau, consultation) : jamais modifiées.
  // Daté d'après-demain : première ligne de la liste (tri par date d'émission).
  brouillon: f(1, { numero: "DRAFT-0101", statut: "DRAFT", emiseIlYa: -2, echeanceDans: 30, client: lumiere, articles: [ligne("Étude de faisabilité", 1, 650)] }),
  attente: f(2, { numero: "0001", statut: "PENDING", emiseIlYa: 8, echeanceDans: 22, client: lumiere, articles: [ligne("Accompagnement mensuel", 2, 450)] }),
  retard: f(3, { numero: "0002", statut: "PENDING", emiseIlYa: 50, echeanceDans: -20, client: dumas, articles: [ligne("Refonte du logo", 1, 1200)] }),
  payee: f(4, { numero: "0003", statut: "COMPLETED", emiseIlYa: 40, echeanceDans: -10, client: zoe, articles: [ligne("Cours de piano", 4, 35)], payeeLe: DANS(-12) }),
  annulee: f(5, { numero: "0004", statut: "CANCELED", emiseIlYa: 35, echeanceDans: -5, client: dumas, articles: [ligne("Prestation annulée", 1, 300)] }),
  avecAvoir: f(6, { numero: "0005", statut: "PENDING", emiseIlYa: 15, echeanceDans: 15, client: lumiere, articles: [ligne("Pains spéciaux livrés", 10, 12)] }),
  acompte: f(7, {
    numero: "0006",
    statut: "PENDING",
    emiseIlYa: 6,
    echeanceDans: 24,
    client: dumas,
    articles: [ligne("Acompte de 30 % sur le chantier", 1, 900)],
    extra: { isDeposit: true, invoiceType: "deposit" },
  }),
  recurrenteActive: f(8, { numero: "0007", statut: "PENDING", emiseIlYa: 12, echeanceDans: 18, client: lumiere, articles: [ligne("Maintenance du site (mensuelle)", 1, 99)] }),
  recurrentePausee: f(9, { numero: "0008", statut: "COMPLETED", emiseIlYa: 45, echeanceDans: -15, client: zoe, articles: [ligne("Abonnement à l'atelier", 1, 49)], payeeLe: DANS(-20) }),

  // Une par action de l'interface.
  aMarquerPayee: f(10, { numero: "0009", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: lumiere, articles: [ligne("Atelier pâtisserie à encaisser", 1, 380)] }),
  aMarquerPayeeMenu: f(11, { numero: "0010", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: dumas, articles: [ligne("Audit comptable à encaisser", 1, 520)] }),
  aAnnuler: f(12, { numero: "0011", statut: "PENDING", emiseIlYa: 4, echeanceDans: 26, client: zoe, articles: [ligne("Séance à annuler", 1, 60)] }),
  aAnnulerMenu: f(13, { numero: "0012", statut: "PENDING", emiseIlYa: 4, echeanceDans: 26, client: lumiere, articles: [ligne("Livraison à annuler depuis le menu", 1, 75)] }),
  brouillonASupprimerMenu: f(14, { numero: "DRAFT-0102", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: dumas, articles: [ligne("Brouillon jetable", 1, 10)] }),
  brouillonAValider: f(15, { numero: "DRAFT-0103", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Brouillon à valider depuis le panneau", 3, 100)] }),
  brouillonAFinaliser: f(16, { numero: "DRAFT-0104", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: dumas, articles: [ligne("Brouillon à finaliser dans l'éditeur", 2, 150)] }),
  brouillonAModifier: f(17, { numero: "DRAFT-0105", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: zoe, articles: [ligne("Brouillon à compléter", 1, 80)] }),
  brouillonGroupe1: f(18, { numero: "DRAFT-0106", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Brouillon groupé A", 1, 11)] }),
  brouillonGroupe2: f(19, { numero: "DRAFT-0107", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: dumas, articles: [ligne("Brouillon groupé B", 1, 22)] }),
  attenteGroupe: f(20, { numero: "0013", statut: "PENDING", emiseIlYa: 3, echeanceDans: 27, client: zoe, articles: [ligne("Facture émise dans la sélection", 1, 33)] }),
  aCrediterMenu: f(21, { numero: "0014", statut: "PENDING", emiseIlYa: 9, echeanceDans: 21, client: lumiere, articles: [ligne("Mission à créditer depuis le menu", 1, 800)] }),
  aCrediterPayee: f(22, {
    numero: "0015",
    statut: "COMPLETED",
    emiseIlYa: 30,
    echeanceDans: 0,
    client: dumas,
    articles: [ligne("Formation payée à créditer", 2, 400)],
    payeeLe: DANS(-2),
  }),
  aCrediterAnnulee: f(23, { numero: "0016", statut: "CANCELED", emiseIlYa: 25, echeanceDans: 5, client: zoe, articles: [ligne("Facture annulée à créditer", 1, 200)] }),
  modeleSource: f(24, { numero: "0017", statut: "PENDING", emiseIlYa: 7, echeanceDans: 23, client: lumiere, articles: [ligne("Prestation type pour un modèle", 1, 250)] }),
  aRendreRecurrente: f(25, { numero: "0018", statut: "PENDING", emiseIlYa: 7, echeanceDans: 23, client: dumas, articles: [ligne("Hébergement à rendre récurrent", 1, 30)] }),
  recurrenceAPauser: f(26, { numero: "0019", statut: "PENDING", emiseIlYa: 20, echeanceDans: 10, client: lumiere, articles: [ligne("Abonnement à suspendre", 1, 19)] }),
  recurrenceAReprendre: f(27, { numero: "0020", statut: "PENDING", emiseIlYa: 20, echeanceDans: 10, client: dumas, articles: [ligne("Abonnement à reprendre", 1, 29)] }),
  recurrenceAArreter: f(28, { numero: "0021", statut: "PENDING", emiseIlYa: 20, echeanceDans: 10, client: zoe, articles: [ligne("Abonnement à arrêter", 1, 39)] }),
  aEnvoyer: f(29, { numero: "0022", statut: "PENDING", emiseIlYa: 2, echeanceDans: 28, client: lumiere, articles: [ligne("Facture à envoyer par e-mail", 1, 120)] }),
  aLivrer: f(30, { numero: "0023", statut: "PENDING", emiseIlYa: 2, echeanceDans: 28, client: dumas, articles: [ligne("Matériel à livrer", 5, 20)] }),
  // Nature de l'opération, notes, conditions et coordonnées bancaires : ce que le document doit montrer.
  complete: f(31, {
    numero: "0024",
    statut: "PENDING",
    emiseIlYa: 1,
    echeanceDans: 29,
    client: lumiere,
    articles: [ligne("Conseil en organisation", 1, 700)],
    extra: {
      operationType: "PS",
      headerNotes: "Commande n° 2026-117 du 1er octobre",
      footerNotes: "Merci pour votre confiance.",
      termsAndConditions: "Paiement à 30 jours. Pénalités de retard : trois fois le taux d'intérêt légal.",
      showBankDetails: true,
      bankDetails: { iban: "FR7630006000011234567890189", bic: "AGRIFRPP", bankName: "Banque des Tests" },
    },
  }),
  editeurPayee: f(32, { numero: "0025", statut: "PENDING", emiseIlYa: 3, echeanceDans: 27, client: zoe, articles: [ligne("Cours à encaisser par l'Éditeur", 1, 45)] }),
  editeurBrouillon: f(33, { numero: "DRAFT-0108", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Brouillon de l'Éditeur", 1, 55)] }),
  // Brouillon repris plus tard : son numéro provisoire (DRAFT-0005) est celui d'une facture émise depuis.
  brouillonNumeroPris: f(35, { numero: "DRAFT-0005", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Brouillon dont le numéro est pris", 1, 66)] }),
  avoirRestantExact: f(36, { numero: "0038", statut: "PENDING", emiseIlYa: 13, echeanceDans: 17, client: lumiere, articles: [ligne("Viennoiseries à créditer au centime", 10, 12)] }),
  avecAvoirAModifier: f(34, { numero: "0026", statut: "PENDING", emiseIlYa: 14, echeanceDans: 16, client: dumas, articles: [ligne("Mission dont l'avoir sera modifié", 1, 1000)] }),

  // Cibles des contrôles de droits (appels directs à l'API), les plus anciennes.
  cibleBrouillon: f(40, { numero: "DRAFT-0109", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Cible brouillon (droits)", 1, 5)], creeeIlYa: 400 }),
  cibleAttente: f(41, { numero: "0027", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: dumas, articles: [ligne("Cible en attente (droits)", 1, 6)], creeeIlYa: 401 }),
  ciblePayee: f(42, { numero: "0028", statut: "COMPLETED", emiseIlYa: 60, echeanceDans: -5, client: zoe, articles: [ligne("Cible payée (droits)", 1, 7)], payeeLe: DANS(-30), creeeIlYa: 402 }),
  cibleEditeurModifier: f(43, { numero: "DRAFT-0110", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: lumiere, articles: [ligne("Cible modifiable par l'Éditeur", 1, 8)], creeeIlYa: 403 }),
  cibleEditeurPayer: f(44, { numero: "0029", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: dumas, articles: [ligne("Cible encaissable par l'Éditeur", 1, 9)], creeeIlYa: 404 }),
  cibleEditeurRecurrence: f(45, { numero: "0030", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: lumiere, articles: [ligne("Cible récurrente par l'Éditeur", 1, 10)], creeeIlYa: 405 }),
  cibleEditeurValider: f(46, { numero: "DRAFT-0111", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client: zoe, articles: [ligne("Cible validée par l'Éditeur", 1, 11)], creeeIlYa: 406 }),
  emiseASupprimerApi: f(47, { numero: "0031", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: lumiere, articles: [ligne("Facture émise supprimée par l'API", 1, 12)], creeeIlYa: 407 }),
  annuleeASupprimerApi: f(48, { numero: "0032", statut: "CANCELED", emiseIlYa: 60, echeanceDans: 10, client: dumas, articles: [ligne("Facture annulée supprimée par l'API", 1, 13)], creeeIlYa: 408 }),
  emiseAModifierApi: f(49, { numero: "0033", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: zoe, articles: [ligne("Facture émise modifiée par l'API", 1, 14)], creeeIlYa: 409 }),
  aCrediterPourSuppression: f(50, { numero: "0034", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: lumiere, articles: [ligne("Facture dont l'avoir sera supprimé", 1, 15)], creeeIlYa: 410 }),
  aCrediterParEditeur: f(51, { numero: "0035", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: dumas, articles: [ligne("Facture créditée par l'Éditeur", 1, 160)], creeeIlYa: 411 }),
  cibleRecurrence: f(52, { numero: "0036", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: lumiere, articles: [ligne("Cible de la récurrence (droits)", 1, 17)], creeeIlYa: 412 }),
  cibleRecurrenceEditeur: f(53, { numero: "0037", statut: "PENDING", emiseIlYa: 60, echeanceDans: 10, client: dumas, articles: [ligne("Récurrence suspendue par l'Éditeur", 1, 18)], creeeIlYa: 413 }),
  // Relance immédiate (sendInvoiceReminderNow) : échues, une par cas.
  relanceEditeur: f(54, { numero: "0039", statut: "PENDING", emiseIlYa: 60, echeanceDans: -20, client: lumiere, articles: [ligne("Facture relancée par l'Éditeur", 1, 19)], creeeIlYa: 414 }),
  relanceRecente: f(55, { numero: "0040", statut: "PENDING", emiseIlYa: 60, echeanceDans: -20, client: dumas, articles: [ligne("Facture déjà relancée ce matin", 1, 20)], creeeIlYa: 415 }),
  // Facture payée dont le PDF est déjà archivé : l'archive fait foi.
  payeeArchivee: f(56, {
    numero: "0041",
    statut: "COMPLETED",
    emiseIlYa: 60,
    echeanceDans: -30,
    client: zoe,
    articles: [ligne("Facture payée archivée", 1, 21)],
    payeeLe: DANS(-35),
    creeeIlYa: 416,
    extra: { archivedPdfKey: "e2e/factures/archive-payee.pdf", archivedPdfStoredAt: DANS(-35), archivedPdfSource: "NEWBI" },
  }),
};

/** Référence affichée dans la liste et le panneau (« F-092026-0001 »). */
export const reference = (facture) => `${facture.prefix}-${facture.number}`;

// --- Avoirs -------------------------------------------------------------------

function avoir(n, { facture: source, numero, lignes, type = "COMMERCIAL_GESTURE", motif = "", remboursement = "NEXT_INVOICE", emisIlYa = 2 }) {
  const { utilisateur, organisation } = COMPTES.factures;
  const t = totaux(lignes);
  const negatif = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, -Math.abs(v)]));
  return {
    _id: oid("avoirLot", n),
    prefix: "AV",
    number: numero,
    originalInvoice: source._id,
    originalInvoiceNumber: source.number,
    creditType: type,
    reason: motif,
    issueDate: DANS(-emisIlYa),
    issueYear: DANS(-emisIlYa).getFullYear(),
    items: avecDefauts(lignes),
    companyInfo: entreprise("factures"),
    client: source.client,
    status: "CREATED",
    refundMethod: remboursement,
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
    createdAt: DANS(-emisIlYa),
    updatedAt: MAINTENANT,
  };
}

export const AVOIRS_FACTURES = {
  existant: avoir(1, { facture: F.avecAvoir, numero: "0001", lignes: [ligne("Remise sur pains abîmés", -1, 24)], motif: "Deux fournées abîmées" }),
  aModifier: avoir(2, { facture: F.avecAvoirAModifier, numero: "0002", lignes: [ligne("Geste commercial sur la mission", -1, 500)], motif: "Retard de livraison" }),
  aSupprimerApi: avoir(3, { facture: F.aCrediterPourSuppression, numero: "0003", lignes: [ligne("Avoir à ne jamais supprimer", -1, 5)] }),
  cible: avoir(4, { facture: F.ciblePayee, numero: "0004", lignes: [ligne("Avoir cible des droits", -1, 2)] }),
  editeur: avoir(5, { facture: F.aCrediterParEditeur, numero: "0005", lignes: [ligne("Avoir modifié par l'Éditeur", -1, 10)] }),
  restant: avoir(6, { facture: F.avoirRestantExact, numero: "0006", lignes: [ligne("Deux viennoiseries abîmées", -2, 12)] }),
  modifieApi: avoir(7, { facture: F.aCrediterPourSuppression, numero: "0007", lignes: [ligne("Avoir dont le motif change", -1, 3)] }),
};

// --- Factures récurrentes -------------------------------------------------------

function recurrence(n, source, { statut = "ACTIVE", frequence = "MONTHLY", prochaine = 10 } = {}) {
  const { utilisateur, organisation } = COMPTES.factures;
  return {
    _id: oid("recurrence", n),
    workspaceId: organisation._id,
    sourceInvoiceId: source._id,
    userId: utilisateur._id,
    frequency: frequence,
    interval: 1,
    startDate: jour(DANS(prochaine)),
    endDate: null,
    nextRunDate: statut === "ENDED" ? null : jour(DANS(prochaine)),
    status: statut,
    emailSubject: null,
    emailBody: null,
    generatedCount: 0,
    lastRunDate: null,
    lastInvoiceId: null,
    lastError: null,
    lastErrorAt: null,
    failureCount: 0,
    lockedUntil: null,
    createdAt: DANS(-10),
    updatedAt: DANS(-10),
  };
}

export const RECURRENCES = {
  active: recurrence(1, F.recurrenteActive, { prochaine: 18 }),
  pausee: recurrence(2, F.recurrentePausee, { statut: "PAUSED", prochaine: 15 }),
  aPauser: recurrence(3, F.recurrenceAPauser, { prochaine: 10 }),
  aReprendre: recurrence(4, F.recurrenceAReprendre, { statut: "PAUSED", prochaine: 10 }),
  aArreter: recurrence(5, F.recurrenceAArreter, { prochaine: 10 }),
  cible: recurrence(6, F.cibleRecurrence, { prochaine: 10 }),
  cibleEditeur: recurrence(7, F.cibleRecurrenceEditeur, { prochaine: 10 }),
};

// --- Modèles de factures -----------------------------------------------------------

function modele(n, compte, { nom, description = "", lignes }) {
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("modeleFacture", n),
    name: nom,
    description,
    items: avecDefauts(lignes),
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    discount: 0,
    discountType: "PERCENTAGE",
    invoiceType: "standard",
    appearance: { textColor: "#000000", headerTextColor: "#ffffff", headerBgColor: "#5b50FF" },
    clientPositionRight: false,
    isReverseCharge: false,
    isVatExempt: false,
    showBankDetails: false,
    retenueGarantie: 0,
    escompte: 0,
    operationType: null,
    workspaceId: organisation._id,
    userId: utilisateur._id,
    createdAt: DANS(-20 + n / 100),
    updatedAt: DANS(-20 + n / 100),
  };
}

export const MODELES = {
  maintenance: modele(1, "factures", { nom: "Modèle maintenance mensuelle", lignes: [ligne("Maintenance mensuelle (modèle)", 1, 150), ligne("Astreinte (modèle)", 2, 40)] }),
  aSupprimer: modele(2, "factures", { nom: "Modèle à supprimer", lignes: [ligne("Ligne du modèle à supprimer", 1, 1)] }),
  cible: modele(3, "factures", { nom: "Modèle cible des droits", lignes: [ligne("Ligne du modèle cible", 1, 2)] }),
  // Offre d'entrée : 10 modèles = plafond atteint.
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [`offre${i + 1}`, modele(10 + i, "facturesOffre", { nom: `Modèle de l'offre ${i + 1}`, lignes: [ligne(`Ligne du modèle ${i + 1}`, 1, 10 + i)] })]),
  ),
};

// --- Facture importée -----------------------------------------------------------------

function importee(n, { numero, client: nomClient, montantHT, statut = "VALIDATED", emiseIlYa = 20 }) {
  const { utilisateur, organisation } = COMPTES.factures;
  return {
    _id: oid("importee", n),
    workspaceId: organisation._id,
    importedBy: utilisateur._id,
    status: statut,
    originalInvoiceNumber: numero,
    vendor: { name: organisation.companyName, normalizedName: organisation.companyName.toLowerCase(), address: "1 rue de la Paix", city: "Paris", postalCode: "75001", country: "France", siret: organisation.siret },
    client: { name: nomClient, email: null, address: "", city: "", postalCode: "" },
    invoiceDate: DANS(-emiseIlYa),
    dueDate: DANS(-emiseIlYa + 30),
    totalHT: montantHT,
    totalVAT: Math.round(montantHT * 20) / 100,
    totalTTC: Math.round(montantHT * 120) / 100,
    currency: "EUR",
    items: [],
    category: "SERVICES",
    paymentMethod: "TRANSFER",
    file: { url: "https://fichiers.e2e.invalid/importees/facture.pdf", cloudflareKey: `e2e/importees/${n}.pdf`, originalFileName: `facture-importee-${n}.pdf`, mimeType: "application/pdf", fileSize: 1024 },
    source: "OCR_UPLOAD",
    isDuplicate: false,
    linkedTransactionIds: [],
    createdAt: DANS(-emiseIlYa),
    updatedAt: DANS(-emiseIlYa),
  };
}

export const IMPORTEES = {
  validee: importee(1, { numero: "ANCIEN-2025-042", client: "Client d'avant Newbi SARL", montantHT: 640 }),
  // Cibles des contrôles de droits (appels directs à l'API)
  cible: importee(2, { numero: "IMPORT-CIBLE-001", client: "Client importé cible", montantHT: 50, emiseIlYa: 300 }),
  editeurModifier: importee(3, { numero: "IMPORT-EDIT-002", client: "Client importé modifié", montantHT: 51, emiseIlYa: 301 }),
  editeurValider: importee(4, { numero: "IMPORT-EDIT-003", client: "Client importé à valider", montantHT: 52, statut: "PENDING_REVIEW", emiseIlYa: 302 }),
  editeurRejeter: importee(5, { numero: "IMPORT-EDIT-004", client: "Client importé rejeté", montantHT: 53, statut: "PENDING_REVIEW", emiseIlYa: 303 }),
  editeurArchiver: importee(6, { numero: "IMPORT-EDIT-005", client: "Client importé archivé", montantHT: 54, emiseIlYa: 304 }),
  // Jamais validée (lecture OCR à revoir) : pas une vente du FEC.
  aRevoirFec: importee(7, { numero: "IMPORT-REVUE-006", client: "Client importé à revoir", montantHT: 77, statut: "PENDING_REVIEW", emiseIlYa: 305 }),
};

// --- Organisation « Réglages Factures » : numérotation continue et volume -------------

const R = "facturesReglages";
const { volume, ancien } = CLIENTS_FACTURES;
/** Préfixe du mois en cours : sa suite (0010, 0011) est en retard sur la suite globale (0057). */
export const PREFIXE_MOIS = `F-${String(MAINTENANT.getMonth() + 1).padStart(2, "0")}${MAINTENANT.getFullYear()}`;

/**
 * 57 factures émises (numérotation continue : un seul compteur pour tous les
 * préfixes) : 55 sous « F-2025 » (0001 à 0009 et 0012 à 0057), 2 sous le
 * préfixe du mois (0010 et 0011), et un brouillon du mois à rouvrir. La plus
 * ancienne (créée en premier) est hors des 50 que la liste charge.
 */
/** Nom de client qui ressemble à une formule de tableur (injection dans les exports). */
export const FORMULE = { client: '=HYPERLINK("https://e2e.invalid","Voir")' };

export const VOLUME = Object.fromEntries(
  Array.from({ length: 57 }, (_, i) => {
    const numero = i + 1;
    const duMois = numero === 10 || numero === 11;
    const statut = numero % 3 === 0 ? "COMPLETED" : "PENDING";
    return [
      `n${numero}`,
      f(100 + numero, {
        compte: R,
        prefixe: duMois ? PREFIXE_MOIS : "F-2025",
        numero: String(numero).padStart(4, "0"),
        statut,
        emiseIlYa: 200 - numero * 3,
        echeanceDans: 230 - numero * 3,
        client: numero === 1 ? ancien : numero === 57 ? { ...volume, name: FORMULE.client } : volume,
        articles: [ligne(numero === 1 ? "Toute première facture archivée" : `Entretien n° ${numero}`, 1, 100 + numero)],
        payeeLe: statut === "COMPLETED" ? DANS(-150 + numero) : null,
        creeeIlYa: 300 - numero * 5,
      }),
    ];
  }),
);

export const NUMEROTATION = {
  brouillonDuMois: f(170, {
    compte: R,
    prefixe: PREFIXE_MOIS,
    numero: "DRAFT-0001",
    statut: "DRAFT",
    emiseIlYa: 0,
    echeanceDans: 30,
    client: volume,
    articles: [ligne("Brouillon à rouvrir (numérotation continue)", 1, 90)],
    creeeIlYa: 1,
  }),
};

// --- Organisation « Offre Factures » --------------------------------------------------

export const F_OFFRE = {
  attente: f(180, { compte: "facturesOffre", numero: "0001", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: CLIENTS_FACTURES.offre, articles: [ligne("Prestation de l'offre d'entrée", 1, 300)] }),
};

// --- Espaces de contrôle (hors COMPTES, semés ici) -------------------------------------

/**
 * Trois espaces du lot, à part pour que leurs montants et leurs numéros ne
 * dépendent d'aucun autre test :
 *   - « Contrôles Factures » : statuts, avoirs simultanés, montants des
 *     factures liées et de situation, numérotation, et un membre par rôle
 *     (Comptable, Administrateur, deux rôles personnalisés) ;
 *   - « Soldes Factures » : factures échues créditées, jamais modifiées
 *     (soldes, paiement en ligne, relances d'une facture soldée par avoir) ;
 *   - « E-facturation Factures » (SA, facturation électronique activée) :
 *     factures déjà transmises à la plateforme ou déclarées.
 */
const jeton = (nom) => `e2eSessionTokenNewbiFactures${nom}Uniquement`;
const espace = (n, nom, champs = {}) => ({
  _id: oid("espaceFactures", n),
  name: nom,
  slug: nom.toLowerCase().replace(/\s+/g, "-"),
  companyName: nom,
  companyEmail: `facturation@espace-factures-${n}.test`,
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
  ...champs,
});

export const ESPACES_FACTURES = {
  controles: {
    organisation: espace(1, "Contrôles Factures Test SASU"),
    proprietaire: { _id: oid("membreFactures", 1), email: "factures-controles@e2e.test", name: "Clément Contrôles", token: jeton("Controles") },
  },
  soldes: {
    organisation: espace(2, "Soldes Factures Test SASU"),
    proprietaire: { _id: oid("membreFactures", 6), email: "factures-soldes@e2e.test", name: "Solène Soldes", token: jeton("Soldes") },
  },
  efacturation: {
    organisation: espace(3, "E-facturation Factures Test SA", { legalForm: "SA", eInvoicingEnabled: true }),
    proprietaire: { _id: oid("membreFactures", 7), email: "factures-efacturation@e2e.test", name: "Émile Efacturation", token: jeton("EFacturation") },
  },
};

/** Rôles personnalisés de « Contrôles Factures » (clé role_<hex>, comme l'API les crée). */
export const ROLES_FACTURES = {
  creation: {
    _id: oid("espaceFactures", 101),
    role: `role_${oid("espaceFactures", 101).toHexString()}`,
    name: "Factures : voir, créer",
    actions: { invoices: ["view", "create"] },
  },
  avoirs: {
    _id: oid("espaceFactures", 102),
    role: `role_${oid("espaceFactures", 102).toHexString()}`,
    name: "Avoirs : voir",
    actions: { creditNotes: ["view"] },
  },
};

/** Membres de « Contrôles Factures », un par rôle. */
export const MEMBRES_CONTROLES = {
  comptable: { _id: oid("membreFactures", 2), email: "factures-comptable@e2e.test", name: "Camille Comptable", role: "accountant", token: jeton("Comptable") },
  admin: { _id: oid("membreFactures", 3), email: "factures-admin@e2e.test", name: "Adèle Administratrice", role: "admin", token: jeton("Admin") },
  creation: { _id: oid("membreFactures", 4), email: "factures-role-creation@e2e.test", name: "Corentin Création", role: ROLES_FACTURES.creation.role, token: jeton("RoleCreation") },
  avoirs: { _id: oid("membreFactures", 5), email: "factures-role-avoirs@e2e.test", name: "Ava Avoirs", role: ROLES_FACTURES.avoirs.role, token: jeton("RoleAvoirs") },
};

const adresseEspace = { street: "1 rue de la Paix", city: "Paris", postalCode: "75001", country: "France" };
const emetteur = (org) => ({
  name: org.companyName,
  email: org.companyEmail,
  phone: org.companyPhone,
  siret: org.siret,
  vatNumber: org.vatNumber,
  companyStatus: org.legalForm,
  capitalSocial: org.capitalSocial,
  rcs: org.rcs,
  transactionCategory: "SERVICES",
  vatPaymentCondition: "NONE",
  vatFranchise: false,
  address: adresseEspace,
});

/** Clients des espaces de contrôle (un par espace, plus un second pour les avoirs). */
export const CLIENTS_CONTROLES = {
  chantier: client(30, null, { name: "Maître d'ouvrage Chantier SAS", email: "travaux@chantier.test", type: "COMPANY", siret: "11122233300014", vatNumber: "FR11111222333", address: adresse("5 place du Chantier", "Lyon", "69003") }),
  autre: client(31, null, { name: "Autre Client Fictif SARL", email: "contact@autre-client.test", type: "COMPANY", siret: "44455566600017", vatNumber: "FR44444555666", address: adresse("2 rue Ailleurs", "Nantes", "44000") }),
  soldes: client(32, null, { name: "Client des Soldes SARL", email: "compta@soldes.test", type: "COMPANY", siret: "55566677700018", vatNumber: "FR55555666778", address: adresse("8 rue des Comptes", "Lille", "59000") }),
  public: client(33, null, { name: "Collectivité Destinataire SA", email: "factures@collectivite.test", type: "COMPANY", siret: "66677788800019", vatNumber: "FR66666777889", address: adresse("1 place de la Mairie", "Rennes", "35000") }),
};
const ESPACE_DU_CLIENT = { chantier: "controles", autre: "controles", soldes: "soldes", public: "efacturation" };

/**
 * Facture d'un espace de contrôle (forme de factures-liste.mjs). `lignes` :
 * articles ; `extra` : champs propres au cas (remise, port, e-facturation…).
 */
function piece(n, cle, { prefixe = "F-CTRL", numero, statut, emiseIlYa = 30, echeanceDans = 30, client: c, lignes, creeeIlYa = 100, payeeLe = null, extra = {} }) {
  const { organisation, proprietaire } = ESPACES_FACTURES[cle];
  const doc = factureListe({ n: 0, compte: "factures", numero, statut, emiseIlYa, echeanceDans, client: c, articles: lignes, payeeLe, creeeIlYa });
  return {
    ...doc,
    _id: oid("pieceFactures", n),
    prefix: prefixe,
    companyInfo: statut === "DRAFT" ? null : emetteur(organisation),
    workspaceId: organisation._id,
    createdBy: proprietaire._id,
    ...extra,
  };
}

const { chantier, autre, soldes: clientSoldes, public: clientPublic } = CLIENTS_CONTROLES;

/** Factures de « Contrôles Factures », une par action qui la modifie. */
export const C = {
  // Rôles
  payerComptable: piece(1, "controles", { numero: "0001", statut: "PENDING", client: chantier, lignes: [ligne("Encaissée par le Comptable", 1, 100)] }),
  refusComptable: piece(2, "controles", { numero: "0002", statut: "PENDING", client: chantier, lignes: [ligne("Intouchable par le Comptable", 1, 110)] }),
  refusRoleCreation: piece(3, "controles", { numero: "0003", statut: "PENDING", client: chantier, lignes: [ligne("Non encaissable par le rôle Création", 1, 120)] }),
  annulerAdmin: piece(4, "controles", { numero: "0004", statut: "PENDING", client: chantier, lignes: [ligne("Annulée par l'Administrateur", 1, 130)] }),
  // Statuts
  brouillonStatuts: piece(5, "controles", { numero: "DRAFT-0001", statut: "DRAFT", emiseIlYa: 0, client: chantier, lignes: [ligne("Brouillon aux statuts impossibles", 1, 140)] }),
  payeeParStatut: piece(6, "controles", { numero: "0005", statut: "PENDING", client: chantier, lignes: [ligne("Payée par changement de statut", 1, 150)] }),
  brouillonAcompte: piece(7, "controles", { prefixe: "ACOMPTE", numero: "DRAFT-0001", statut: "DRAFT", emiseIlYa: 0, client: chantier, lignes: [ligne("Acompte à valider depuis le panneau", 1, 160)] }),
  // Avoirs : 900 € HT, soit 1 080 € TTC
  avoirsSimultanes: piece(8, "controles", { numero: "0006", statut: "PENDING", client: chantier, lignes: [ligne("Facture créditée deux fois au même instant", 1, 900)] }),
  avoirsModifiesSimultanes: piece(9, "controles", { numero: "0007", statut: "PENDING", client: chantier, lignes: [ligne("Facture dont deux avoirs grandissent", 1, 900)] }),
  avoirClient: piece(10, "controles", { numero: "0008", statut: "PENDING", client: chantier, lignes: [ligne("Avoir au client de la facture", 1, 300)] }),
  avoirDate: piece(11, "controles", { numero: "0009", statut: "PENDING", emiseIlYa: 10, client: chantier, lignes: [ligne("Avoir daté d'avant la facture", 1, 200)] }),
  // Remise de 10 %, port de 15 € HT, autoliquidation
  avoirRemisePort: piece(12, "controles", {
    numero: "0010",
    statut: "PENDING",
    client: chantier,
    lignes: [ligne("Pose de cloisons", 2, 500)],
    extra: {
      discount: 10,
      discountType: "PERCENTAGE",
      isReverseCharge: true,
      shipping: { billShipping: true, shippingAddress: { fullName: chantier.name, ...chantier.address }, shippingAmountHT: 15, shippingVatRate: 20 },
      // 1 000 € HT - 10 % + 15 € de port = 915 € HT, TVA autoliquidée
      totalHT: 915,
      totalVAT: 0,
      totalTTC: 915,
      finalTotalHT: 915,
      finalTotalVAT: 0,
      finalTotalTTC: 915,
    },
  }),
};

/** Devis acceptés de « Contrôles Factures » (factures liées et de situation). */
function devis(n, { numero, lignes, montantTTC }) {
  const { organisation, proprietaire } = ESPACES_FACTURES.controles;
  const ht = lignes.reduce((t, a) => t + a.quantity * a.unitPrice, 0);
  return {
    _id: oid("pieceFactures", n),
    prefix: "D-CTRL",
    number: numero,
    status: "COMPLETED",
    issueDate: DANS(-20),
    issueYear: DANS(-20).getFullYear(),
    validUntil: DANS(10),
    client: snapshotClient(chantier),
    companyInfo: emetteur(organisation),
    items: avecDefauts(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    totalHT: ht,
    totalVAT: montantTTC - ht,
    totalTTC: montantTTC,
    finalTotalHT: ht,
    finalTotalVAT: Math.round((montantTTC - ht) * 100) / 100,
    finalTotalTTC: montantTTC,
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    linkedInvoices: [],
    customFields: [],
    workspaceId: organisation._id,
    createdBy: proprietaire._id,
    createdAt: DANS(-20),
    updatedAt: MAINTENANT,
  };
}

export const DEVIS_CONTROLES = {
  // 8 333,33 € HT à 20 % = 10 000 € TTC (contrat des factures de situation)
  situation: devis(50, { numero: "0001", lignes: [ligne("Construction de l'extension", 1, 8333.33)], montantTTC: 10000 }),
  // 1 200 € TTC à deux taux : 900 € à 20 % (750 € HT) et 300 € à 5,5 % (284,36 € HT)
  acompte: devis(51, { numero: "0002", lignes: [ligne("Rénovation énergétique", 1, 750), ligne("Isolation des combles", 1, 284.36, 5.5)], montantTTC: 1200 }),
};

/** Factures de « Soldes Factures » : échues, jamais modifiées par les tests. */
export const S = {
  // 1 000 € HT (1 200 € TTC), avoir de 400 € HT : 600 € HT encore dus
  credit400: piece(60, "soldes", { numero: "0001", statut: "PENDING", emiseIlYa: 60, echeanceDans: -30, client: clientSoldes, lignes: [ligne("Mission créditée en partie", 1, 1000)] }),
  // 500 € HT (600 € TTC), avoir total : plus rien à régler
  soldee: piece(61, "soldes", { numero: "0002", statut: "PENDING", emiseIlYa: 60, echeanceDans: -30, client: clientSoldes, lignes: [ligne("Mission soldée par avoir", 1, 500)] }),
  // 200 € HT (240 € TTC), sans avoir
  due: piece(62, "soldes", { numero: "0003", statut: "PENDING", emiseIlYa: 60, echeanceDans: -30, client: clientSoldes, lignes: [ligne("Mission due", 1, 200)] }),
};

/** Factures de « E-facturation Factures », déjà transmises ou déclarées. */
const transmise = (n, numero, nom) =>
  piece(n, "efacturation", {
    numero,
    statut: "PENDING",
    emiseIlYa: 5,
    client: clientPublic,
    lignes: [ligne(nom, 1, 1000)],
    extra: {
      superPdpInvoiceId: `spdp-e2e-${numero}`,
      eInvoiceStatus: "VALIDATED",
      eInvoiceFlowType: "E_INVOICING",
      eInvoiceSentAt: DANS(-5),
    },
  });

export const E = {
  aCrediter: transmise(70, "0001", "Facture transmise à créditer"),
  aAnnuler: transmise(71, "0002", "Facture transmise qu'on voudrait annuler"),
  aRenvoyer: transmise(72, "0003", "Facture transmise renvoyée par erreur"),
  declaree: piece(73, "efacturation", {
    numero: "0004",
    statut: "PENDING",
    emiseIlYa: 5,
    client: { ...clientPublic, type: "INDIVIDUAL", siret: undefined, vatNumber: undefined },
    lignes: [ligne("Facture à un particulier déclarée", 1, 100)],
    extra: { eInvoiceFlowType: "E_REPORTING_TRANSACTION", eReportingStatus: "REPORTED", eReportingTransactionId: "e2e-ereporting-1" },
  }),
};

/** Avoirs des espaces de contrôle. */
function avoirEspace(n, cle, { facture: source, numero, lignes }) {
  const { organisation, proprietaire } = ESPACES_FACTURES[cle];
  const t = totaux(lignes);
  const negatif = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, -Math.abs(v)]));
  return {
    _id: oid("pieceFactures", n),
    prefix: "AV",
    number: numero,
    originalInvoice: source._id,
    originalInvoiceNumber: source.number,
    creditType: "COMMERCIAL_GESTURE",
    reason: "",
    issueDate: DANS(-2),
    issueYear: DANS(-2).getFullYear(),
    items: avecDefauts(lignes),
    companyInfo: emetteur(organisation),
    client: source.client,
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
    createdBy: proprietaire._id,
    createdAt: DANS(-2),
    updatedAt: MAINTENANT,
  };
}

export const AVOIRS_CONTROLES = {
  // « Contrôles Factures » : deux avoirs de 100 € HT, modifiés au même instant
  croissantA: avoirEspace(80, "controles", { facture: C.avoirsModifiesSimultanes, numero: "0001", lignes: [ligne("Premier geste", -1, 100)] }),
  croissantB: avoirEspace(81, "controles", { facture: C.avoirsModifiesSimultanes, numero: "0002", lignes: [ligne("Second geste", -1, 100)] }),
  // Cible du rôle « Avoirs : voir » (modification et envoi refusés)
  cibleRole: avoirEspace(82, "controles", { facture: C.refusRoleCreation, numero: "0003", lignes: [ligne("Avoir cible du rôle", -1, 10)] }),
  // « Soldes Factures »
  partiel: avoirEspace(83, "soldes", { facture: S.credit400, numero: "0001", lignes: [ligne("Remise sur la mission", -1, 400)] }),
  total: avoirEspace(84, "soldes", { facture: S.soldee, numero: "0002", lignes: [ligne("Annulation de la mission", -1, 500)] }),
};

/** Facture importée de « Contrôles Factures » (modifiable par le Comptable). */
export const IMPORTEE_CONTROLES = {
  ...importee(20, { numero: "IMPORT-CTRL-001", client: "Client importé du Comptable", montantHT: 60, statut: "VALIDATED" }),
  workspaceId: ESPACES_FACTURES.controles.organisation._id,
  importedBy: ESPACES_FACTURES.controles.proprietaire._id,
};

/** Relance manuelle envoyée il y a une heure (une seule toutes les 12 heures). */
const RELANCES = [
  {
    _id: oid("diversFactures", 10),
    invoiceId: F.relanceRecente._id,
    workspaceId: COMPTES.factures.organisation._id,
    reminderType: "MANUAL",
    recipientEmail: F.relanceRecente.client.email,
    emailSubject: "Rappel de paiement",
    emailBody: "Bonjour",
    status: "SENT",
    sentAt: DANS(-1 / 24),
    createdAt: DANS(-1 / 24),
    updatedAt: DANS(-1 / 24),
  },
];

const utilisateurPret = (u) => ({
  _id: u._id,
  email: u.email,
  name: u.name,
  emailVerified: true,
  role: "member",
  isActive: true,
  isDisabled: false,
  hasSeenOnboarding: true,
  onboardingStep: "completed",
  hasCompletedTutorial: true,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});
const sessionDe = (n, u, org) => ({
  _id: oid("membreFactures", 100 + n),
  token: u.token,
  userId: u._id,
  activeOrganizationId: org._id.toHexString(),
  expiresAt: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ipAddress: "127.0.0.1",
  userAgent: "playwright-e2e",
});

/** Comptes, membres, rôles et documents des espaces de contrôle. */
function donneesEspacesControle() {
  const docs = { user: [], organization: [], member: [], subscription: [], session: [], organizationRole: [] };
  Object.values(ESPACES_FACTURES).forEach(({ organisation: org, proprietaire }, i) => {
    docs.user.push(utilisateurPret(proprietaire));
    docs.organization.push({ ...org, logo: null, metadata: null, organizationType: "business", onboardingCompleted: true, sessionSettings: { maxSessions: 0 }, createdAt: MAINTENANT });
    docs.member.push({ _id: oid("membreFactures", 200 + i), userId: proprietaire._id, organizationId: org._id, role: "owner", createdAt: MAINTENANT });
    docs.subscription.push({ _id: oid("espaceFactures", 200 + i), referenceId: org._id.toHexString(), plan: "pme", status: "active", periodStart: DANS(-1), periodEnd: DANS(30), createdAt: MAINTENANT, updatedAt: MAINTENANT });
    docs.session.push(sessionDe(i, proprietaire, org));
  });
  const org = ESPACES_FACTURES.controles.organisation;
  Object.values(MEMBRES_CONTROLES).forEach((m, i) => {
    docs.user.push(utilisateurPret(m));
    docs.member.push({ _id: oid("membreFactures", 210 + i), userId: m._id, organizationId: org._id, role: m.role, createdAt: MAINTENANT });
    docs.session.push(sessionDe(10 + i, m, org));
  });
  for (const r of Object.values(ROLES_FACTURES)) {
    docs.organizationRole.push({ _id: r._id, organizationId: org._id, role: r.role, permission: "{}", actions: r.actions, catalogVersion: 2, name: r.name, description: "", createdAt: MAINTENANT, updatedAt: MAINTENANT });
  }
  const clients = Object.entries(CLIENTS_CONTROLES).map(([cle, { organisation: _, ...c }]) => {
    const espaceDuClient = ESPACES_FACTURES[ESPACE_DU_CLIENT[cle]];
    return {
      contacts: [],
      notes: [],
      customFields: [],
      activityLog: [],
      assignedMembers: [],
      ...c,
      createdBy: espaceDuClient.proprietaire._id,
      workspaceId: espaceDuClient.organisation._id,
      createdAt: DANS(-90),
      updatedAt: DANS(-90),
    };
  });
  // Paiement en ligne activé pour « Soldes Factures » : un refus vient de l'avoir, pas du compte.
  const stripeconnectaccounts = [
    {
      _id: oid("espaceFactures", 300),
      organizationId: ESPACES_FACTURES.soldes.organisation._id.toHexString(),
      userId: ESPACES_FACTURES.soldes.proprietaire._id,
      accountId: "acct_e2e_soldes",
      isOnboarded: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      createdAt: DANS(-60),
      updatedAt: DANS(-60),
    },
  ];
  return {
    ...docs,
    clients,
    invoices: [...Object.values(C), ...Object.values(S), ...Object.values(E)],
    quotes: Object.values(DEVIS_CONTROLES),
    creditnotes: Object.values(AVOIRS_CONTROLES),
    imported_invoices: [IMPORTEE_CONTROLES],
    stripeconnectaccounts,
    invoicereminderlogs: RELANCES,
  };
}

/** Tous les documents du lot, par collection. */
export function donneesFactures() {
  const clients = Object.values(CLIENTS_FACTURES).map(({ organisation: cle, ...c }) => ({
    contacts: [],
    notes: [],
    customFields: [],
    activityLog: [],
    assignedMembers: [],
    ...c,
    createdBy: COMPTES[cle].utilisateur._id,
    workspaceId: COMPTES[cle].organisation._id,
    createdAt: DANS(-90),
    updatedAt: DANS(-90),
  }));
  // Lien de paiement en ligne : un compte Stripe Connect opérationnel pour l'organisation « Factures ».
  const stripeconnectaccounts = [
    {
      _id: oid("diversFactures", 1),
      organizationId: COMPTES.factures.organisation._id.toHexString(),
      userId: COMPTES.factures.utilisateur._id,
      accountId: "acct_e2e_factures",
      isOnboarded: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      createdAt: DANS(-60),
      updatedAt: DANS(-60),
    },
  ];
  const clientcustomfields = [
    {
      _id: ID_CHAMP_DOCUMENTS,
      name: CHAMP_DOCUMENTS.nom,
      fieldType: "TEXT",
      description: "",
      options: [],
      placeholder: "",
      isRequired: false,
      order: 1,
      showOnDocuments: true,
      isActive: true,
      workspaceId: COMPTES.facturesReglages.organisation._id,
      createdBy: COMPTES.facturesReglages.utilisateur._id,
      createdAt: DANS(-60),
      updatedAt: DANS(-60),
    },
  ];
  const controles = donneesEspacesControle();
  return {
    ...controles,
    clients: [...clients, ...controles.clients],
    clientcustomfields,
    invoices: [...Object.values(F), ...Object.values(VOLUME), ...Object.values(NUMEROTATION), ...Object.values(F_OFFRE), ...controles.invoices],
    creditnotes: [...Object.values(AVOIRS_FACTURES), ...controles.creditnotes],
    invoicerecurrences: Object.values(RECURRENCES),
    invoicetemplates: Object.values(MODELES),
    imported_invoices: [...Object.values(IMPORTEES), ...controles.imported_invoices],
    stripeconnectaccounts: [...stripeconnectaccounts, ...controles.stripeconnectaccounts],
  };
}

/** Membres de l'organisation « Factures » (rôles « Éditeur » et « Membre »). */
export const EDITEUR = MEMBRES.facturesEditeur;
export const LECTEUR = MEMBRES.facturesLecteur;
export { snapshotClient };
