/**
 * Données du lot « devis-bc-bl » (devis, bons de commande, bons de livraison).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e8a à e2e8f, e2e9a à e2e9f, e2eaa à e2eaf).
 *
 * Trois organisations :
 *   - « Ventes » (offre Entreprise) : un document stable par état (consulté par
 *     le propriétaire, l'Éditeur et le Membre, jamais modifié), une cible par
 *     opération de l'API (contrôles de droits) et un document par parcours ;
 *   - « Freelance Ventes » (offre d'entrée) : quota de signatures du mois
 *     atteint (10), 10 modèles de devis (plafond des modèles) ;
 *   - « Volume » (offre PME) : 55 devis, bons de commande et bons de
 *     livraison (plus que les 50 chargés par les listes), quota de signatures
 *     atteint (100), numérotation continue des devis.
 * Les documents stables sont les plus anciens : ceux créés par les tests
 * (conversions) passent devant eux dans les listes, les tests les retrouvent
 * par la recherche.
 */
import { CLIENTS, COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { articles, entreprise, ligne, snapshotClient, totaux } from "./documents.mjs";

/** Préfixe du mois en cours, comme le propose l'éditeur (« D-102026 »). */
const MOIS = `${String(MAINTENANT.getMonth() + 1).padStart(2, "0")}${MAINTENANT.getFullYear()}`;
export const PREFIXE_DEVIS = `D-${MOIS}`;
export const PREFIXE_BC = `BC-${MOIS}`;
export const PREFIXE_BL = `BL-${MAINTENANT.getFullYear()}${String(MAINTENANT.getMonth() + 1).padStart(2, "0")}`;

// --- Clients ------------------------------------------------------------------

function client(n, compte, champs) {
  return { _id: oid("clientVentes", n), organisation: compte, isInternational: false, isBlocked: false, ...champs };
}

export const CLIENTS_VENTES = {
  lumiere: client(1, "ventes", {
    name: "Boulangerie Lumière SARL",
    email: "commandes@lumiere.test",
    phone: "+33478000001",
    type: "COMPANY",
    siret: "11122233300014",
    vatNumber: "FR11111222333",
    address: { fullName: "Boulangerie Lumière SARL", street: "12 rue des Boulangers", city: "Lyon", postalCode: "69001", country: "France" },
  }),
  martin: client(2, "ventes", {
    name: "Hélène Martin",
    email: "helene.martin@e2e.test",
    type: "INDIVIDUAL",
    firstName: "Hélène",
    lastName: "Martin",
    address: { fullName: "Hélène Martin", street: "4 place du Marché", city: "Annecy", postalCode: "74000", country: "France" },
  }),
  coeur: client(3, "ventes", {
    name: "Cœur d’Artichaut SAS",
    email: "bonjour@coeur.test",
    type: "COMPANY",
    siret: "55566677700012",
    vatNumber: "FR55555666777",
    address: { fullName: "Cœur d’Artichaut SAS", street: "8 quai de la Fosse", city: "Nantes", postalCode: "44000", country: "France" },
  }),
  // Nom sans caractère particulier : les parcours ne dépendent pas des règles de nom de l'API.
  durand: client(6, "ventes", {
    name: "Fromagerie Durand SARL",
    email: "contact@durand.test",
    type: "COMPANY",
    siret: "88899900000011",
    vatNumber: "FR88888999000",
    address: { fullName: "Fromagerie Durand SARL", street: "15 rue du Lac", city: "Annecy", postalCode: "74000", country: "France" },
  }),
  // Noms réels refusés par les règles de nom de l'API (« & », chiffres) : tests dédiés.
  dupont: client(7, "ventes", {
    name: "Dupont & Fils",
    email: "contact@dupont-fils.test",
    type: "COMPANY",
    siret: "99900011100012",
    address: { fullName: "Dupont & Fils", street: "3 rue des Artisans", city: "Rennes", postalCode: "35000", country: "France" },
  }),
  studio: client(8, "ventes", {
    name: "Studio 54 Production",
    email: "contact@studio54.test",
    type: "COMPANY",
    siret: "99900022200013",
    address: { fullName: "Studio 54 Production", street: "54 rue de la Scène", city: "Paris", postalCode: "75011", country: "France" },
  }),
  freelance: client(4, "freelanceVentes", {
    name: "Atelier Client Freelance",
    email: "contact@client-freelance.test",
    type: "COMPANY",
    siret: "66677788800015",
    vatNumber: "FR66666777888",
    address: { fullName: "Atelier Client Freelance", street: "2 rue du Port", city: "Brest", postalCode: "29200", country: "France" },
  }),
  volume: client(5, "volume", {
    name: "Grossiste Volume SARL",
    email: "achats@volume.test",
    type: "COMPANY",
    siret: "77788899900016",
    vatNumber: "FR77777888999",
    address: { fullName: "Grossiste Volume SARL", street: "100 avenue des Entrepôts", city: "Rungis", postalCode: "94150", country: "France" },
  }),
};

const enBaseClient = ({ organisation: cle, ...c }) => {
  const compte = COMPTES[cle];
  return {
    contacts: [],
    notes: [],
    customFields: [],
    activityLog: [],
    assignedMembers: [],
    hasDifferentShippingAddress: false,
    ...c,
    createdBy: compte.utilisateur._id,
    workspaceId: compte.organisation._id,
    createdAt: DANS(-300),
    updatedAt: MAINTENANT,
  };
};

// --- Devis --------------------------------------------------------------------

/**
 * Devis « tel qu'enregistré ». `creeIlYa` règle l'ordre des listes (les plus
 * récents d'abord) : les documents stables sont créés il y a 200 jours et plus.
 */
function devis(compte, n, { numero, statut, client: c, lignes, emiseIlYa = 2, valideDans = 28, creeIlYa = 100 + (200 - n), prefixe = PREFIXE_DEVIS, ...champs }) {
  const doc = {
    _id: oid("devisVentes", n),
    prefix: prefixe,
    number: numero,
    status: statut,
    issueDate: DANS(-emiseIlYa),
    issueYear: DANS(-emiseIlYa).getFullYear(),
    validUntil: DANS(valideDans),
    client: snapshotClient(c),
    companyInfo: entreprise(compte),
    items: articles(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    ...totaux(lignes),
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
    projectReference: "",
    convertedToInvoice: null,
    pennylaneSyncStatus: "NOT_SYNCED",
    qontoSyncStatus: "NOT_SYNCED",
    abbySyncStatus: "NOT_SYNCED",
    emailTracking: { emailClickCount: 0, emailOpenCount: 0 },
    workspaceId: COMPTES[compte].organisation._id,
    createdBy: COMPTES[compte].utilisateur._id,
    createdAt: DANS(-creeIlYa),
    updatedAt: MAINTENANT,
    ...champs,
  };
  return doc;
}

const L = CLIENTS_VENTES.lumiere;
const M = CLIENTS_VENTES.martin;
const C = CLIENTS_VENTES.durand;
const dv = (n, o) => devis("ventes", n, o);

/** Conditions générales assez longues pour être repérées (rechargement, réenregistrement). */
export const CGV_DEVIS = "Conditions générales de vente : acompte de 30 % à la commande, solde à la livraison. Pénalités de retard au taux légal.";

/** Devis de l'organisation « Ventes », par rôle dans les tests. */
export const DEVIS_VENTES = {
  // Stables : consultés par chaque rôle, jamais modifiés.
  brouillon: dv(1, { numero: "DRAFT-0001", statut: "DRAFT", client: L, lignes: [ligne("Étude de marché", 1, 1200)] }),
  enAttente: dv(2, { numero: "0001", statut: "PENDING", client: L, lignes: [ligne("Site vitrine", 1, 2500)], projectReference: "PROJ-VENTES-01" }),
  accepte: dv(3, { numero: "0002", statut: "COMPLETED", client: M, lignes: [ligne("Séance photo", 1, 450)] }),
  refuse: dv(4, { numero: "0003", statut: "CANCELED", client: L, lignes: [ligne("Projet refusé", 1, 800)] }),
  expire: dv(5, { numero: "0004", statut: "PENDING", client: M, lignes: [ligne("Offre expirée", 1, 300)], emiseIlYa: 40, valideDans: -10 }),
  // Cibles des contrôles de droits (une par opération qui modifie).
  cibleModifier: dv(6, { numero: "0005", statut: "PENDING", client: L, lignes: [ligne("Cible modification", 1, 100)] }),
  cibleSupprimer: dv(7, { numero: "DRAFT-0002", statut: "DRAFT", client: L, lignes: [ligne("Cible suppression", 1, 100)] }),
  cibleStatut: dv(8, { numero: "0006", statut: "PENDING", client: L, lignes: [ligne("Cible statut", 1, 100)] }),
  cibleFacture: dv(9, { numero: "0007", statut: "COMPLETED", client: L, lignes: [ligne("Cible conversion en facture", 1, 100)] }),
  cibleBc: dv(10, { numero: "0008", statut: "COMPLETED", client: L, lignes: [ligne("Cible conversion en bon de commande", 1, 100)] }),
  cibleBl: dv(11, { numero: "0009", statut: "COMPLETED", client: L, lignes: [ligne("Cible bon de livraison", 1, 100)] }),
  cibleEnvoyer: dv(12, { numero: "0010", statut: "PENDING", client: L, lignes: [ligne("Cible envoi", 1, 100)] }),
  cibleSigner: dv(13, { numero: "0011", statut: "PENDING", client: L, lignes: [ligne("Cible signature", 1, 100)] }),
  cibleModele: dv(14, { numero: "0012", statut: "PENDING", client: L, lignes: [ligne("Cible modèle", 1, 100)] }),
  cibleXss: dv(15, { numero: "0013", statut: "PENDING", client: L, lignes: [ligne("Cible texte piégé", 1, 100)] }),
  cibleBrouillonValider: dv(16, { numero: "DRAFT-0003", statut: "DRAFT", client: L, lignes: [ligne("Cible validation du brouillon", 1, 100)] }),
  // Parcours (un devis par action).
  aAccepter: dv(17, { numero: "0014", statut: "PENDING", client: C, lignes: [ligne("Devis à accepter depuis le panneau", 1, 900)] }),
  aRefuser: dv(18, { numero: "0015", statut: "PENDING", client: C, lignes: [ligne("Devis à refuser depuis le panneau", 1, 950)] }),
  aFacturer: dv(19, { numero: "0016", statut: "COMPLETED", client: C, lignes: [ligne("Devis à facturer", 2, 600), ligne("Déplacement", 1, 80, 10)] }),
  aCommander: dv(20, { numero: "0017", statut: "COMPLETED", client: C, lignes: [ligne("Devis à commander", 3, 150)] }),
  aLivrer: dv(21, { numero: "0018", statut: "COMPLETED", client: C, lignes: [ligne("Devis à livrer", 5, 40)] }),
  aEnvoyer: dv(22, { numero: "0019", statut: "PENDING", client: C, lignes: [ligne("Devis à envoyer par e-mail", 1, 1300)] }),
  aModifierEnAttente: dv(23, { numero: "0020", statut: "PENDING", client: C, lignes: [ligne("Devis en attente à modifier", 1, 700)], emiseIlYa: 10, valideDans: 20, archivedPdfKey: "quotes/e2e/ancien.pdf", archivedPdfStoredAt: DANS(-10), archivedPdfSource: "NEWBI" }),
  avecCgv: dv(24, { numero: "DRAFT-0004", statut: "DRAFT", client: C, lignes: [ligne("Brouillon avec conditions générales", 1, 500)], termsAndConditions: CGV_DEVIS }),
  avecCgvEnAttente: dv(25, { numero: "0021", statut: "PENDING", client: C, lignes: [ligne("Devis en attente avec conditions générales", 1, 520)], termsAndConditions: CGV_DEVIS }),
  aNotesRefusees: dv(26, { numero: "DRAFT-0005", statut: "DRAFT", client: C, lignes: [ligne("Brouillon aux notes refusées", 1, 210)] }),
  aSupprimerPanneau: dv(27, { numero: "DRAFT-0006", statut: "DRAFT", client: C, lignes: [ligne("Brouillon à supprimer depuis le panneau", 1, 50)] }),
  aSupprimerGroupe1: dv(28, { numero: "DRAFT-0007", statut: "DRAFT", client: C, lignes: [ligne("Lot à supprimer en groupe", 1, 60)] }),
  aSupprimerGroupe2: dv(29, { numero: "DRAFT-0008", statut: "DRAFT", client: C, lignes: [ligne("Lot à supprimer en groupe", 1, 70)] }),
  aSauverModele: dv(30, { numero: "0022", statut: "PENDING", client: C, lignes: [ligne("Devis à garder comme modèle", 1, 640)] }),
  pdf: dv(31, { numero: "0023", statut: "PENDING", client: C, lignes: [ligne("Devis à télécharger en PDF", 1, 1111)] }),
  aValiderBrouillon: dv(32, { numero: "DRAFT-0009", statut: "DRAFT", client: C, lignes: [ligne("Brouillon à finaliser depuis l'éditeur", 1, 333)] }),
  aEditerEditeur: dv(33, { numero: "0024", statut: "PENDING", client: C, lignes: [ligne("Devis modifié par l'Éditeur", 1, 420)] }),
  aSigner: dv(34, { numero: "0025", statut: "PENDING", client: C, lignes: [ligne("Devis à faire signer", 1, 1500)] }),
  aExporter: dv(35, { numero: "0026", statut: "COMPLETED", client: C, lignes: [ligne("Devis exporté", 2, 125)], emiseIlYa: 12 }),
  aDupliquer: dv(36, { numero: "0027", statut: "PENDING", client: C, lignes: [ligne("Devis à dupliquer", 1, 275)] }),
  aRepasserBrouillon: dv(37, { numero: "0028", statut: "PENDING", client: C, lignes: [ligne("Devis à repasser en brouillon", 1, 310)] }),
  // Porte les 150 signatures du mois (offre illimitée), à part des devis consultés.
  signesCeMois: dv(38, { numero: "0029", statut: "COMPLETED", client: C, lignes: [ligne("Devis signés ce mois-ci", 1, 100)] }),
  // Cibles des signatures en cours (annuler) et en erreur (relancer), du cachet (devis signé).
  cibleAnnulerSignature: dv(39, { numero: "0030", statut: "PENDING", client: L, lignes: [ligne("Cible annulation de signature", 1, 100)] }),
  cibleRelancerSignature: dv(40, { numero: "0031", statut: "PENDING", client: L, lignes: [ligne("Cible relance de signature", 1, 100)] }),
  cibleCachet: dv(41, { numero: "0032", statut: "PENDING", client: L, lignes: [ligne("Cible cachet", 1, 100)] }),
  // Clients aux noms réels (« œ », apostrophe typographique « ’ », « & », chiffres) : tests dédiés.
  coeurAAccepter: dv(42, { numero: "0033", statut: "PENDING", client: CLIENTS_VENTES.coeur, lignes: [ligne("Devis Cœur à accepter", 1, 480)] }),
  coeurALivrer: dv(43, { numero: "0034", statut: "COMPLETED", client: CLIENTS_VENTES.coeur, lignes: [ligne("Devis Cœur à livrer", 2, 45)] }),
  dupontAAccepter: dv(44, { numero: "0035", statut: "PENDING", client: CLIENTS_VENTES.dupont, lignes: [ligne("Devis Dupont à accepter", 1, 310)] }),
};

/** Devis de l'offre d'entrée : demandes de signature au-delà du quota. */
export const DEVIS_FREELANCE = {
  signature: devis("freelanceVentes", 101, { numero: "0001", statut: "PENDING", client: CLIENTS_VENTES.freelance, lignes: [ligne("Signature au-delà du quota", 1, 500)] }),
  qualifiee: devis("freelanceVentes", 102, { numero: "0002", statut: "PENDING", client: CLIENTS_VENTES.freelance, lignes: [ligne("Signature qualifiée hors offre", 1, 500)] }),
  cachet: devis("freelanceVentes", 103, { numero: "0003", statut: "PENDING", client: CLIENTS_VENTES.freelance, lignes: [ligne("Cachet hors quota", 1, 500)] }),
  modele: devis("freelanceVentes", 104, { numero: "0004", statut: "PENDING", client: CLIENTS_VENTES.freelance, lignes: [ligne("Onzième modèle", 1, 500)] }),
  signes: devis("freelanceVentes", 105, { numero: "0005", statut: "COMPLETED", client: CLIENTS_VENTES.freelance, lignes: [ligne("Devis déjà signés ce mois-ci", 1, 500)] }),
};

/**
 * Organisation « Volume » : 55 devis finalisés sur le préfixe d'un mois
 * précédent (numérotation continue : le prochain numéro suit le plus grand,
 * quel que soit le préfixe), plus un brouillon du mois. Les 6 plus anciens
 * sont au-delà des 50 devis que la liste charge.
 */
export const PREFIXE_DEVIS_ANCIEN = "D-082026";
export const DEVIS_VOLUME = Array.from({ length: 54 }, (_, i) => {
  const k = i + 1;
  return devis("volume", 200 + k, {
    numero: String(k).padStart(4, "0"),
    statut: k % 3 === 0 ? "COMPLETED" : "PENDING",
    client: CLIENTS_VENTES.volume,
    lignes: [ligne(`Commande en volume n° ${k}`, 1, 100 + k)],
    prefixe: PREFIXE_DEVIS_ANCIEN,
    emiseIlYa: 60 - Math.floor(k / 2),
    valideDans: 30,
    creeIlYa: 120 - k,
  });
});
export const DEVIS_VOLUME_BROUILLON = devis("volume", 299, {
  numero: "DRAFT-0001",
  statut: "DRAFT",
  client: CLIENTS_VENTES.volume,
  lignes: [ligne("Brouillon en numérotation continue", 1, 990)],
  creeIlYa: 1,
});
export const DEVIS_VOLUME_SIGNATURE = devis("volume", 298, {
  numero: "0055",
  statut: "PENDING",
  client: CLIENTS_VENTES.volume,
  lignes: [ligne("Signature au-delà du quota PME", 1, 650)],
  prefixe: PREFIXE_DEVIS_ANCIEN,
  creeIlYa: 2,
});

// --- Bons de commande -----------------------------------------------------------

function bonCommande(compte, n, { numero, statut, client: c, lignes, emiseIlYa = 2, creeIlYa = 100 + (200 - n), prefixe = PREFIXE_BC, ...champs }) {
  const emise = DANS(-emiseIlYa);
  return {
    _id: oid("bcVentes", n),
    prefix: prefixe,
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    validUntil: DANS(30 - emiseIlYa),
    client: snapshotClient(c),
    companyInfo: entreprise(compte),
    items: articles(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    ...totaux(lignes),
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
    purchaseOrderNumber: "",
    sourceQuoteId: null,
    workspaceId: COMPTES[compte].organisation._id,
    createdBy: COMPTES[compte].utilisateur._id,
    createdAt: DANS(-creeIlYa),
    updatedAt: MAINTENANT,
    ...champs,
  };
}

const bc = (n, o) => bonCommande("ventes", n, o);

/** Bons de commande de l'organisation « Ventes », par rôle dans les tests. */
export const BC_VENTES = {
  brouillon: bc(1, { numero: "DRAFT-0001", statut: "DRAFT", client: L, lignes: [ligne("Fournitures stables", 4, 25)] }),
  enAttente: bc(2, { numero: "0001", statut: "CONFIRMED", client: L, lignes: [ligne("Commande en attente stable", 2, 300)], purchaseOrderNumber: "D-REF-0001" }),
  valide: bc(3, { numero: "0002", statut: "VALIDATED", client: M, lignes: [ligne("Commande validée stable", 1, 640)] }),
  enCours: bc(4, { numero: "0003", statut: "IN_PROGRESS", client: L, lignes: [ligne("Commande en cours stable", 1, 720)] }),
  livre: bc(5, { numero: "0004", statut: "DELIVERED", client: M, lignes: [ligne("Commande livrée stable", 3, 90)] }),
  annule: bc(6, { numero: "0005", statut: "CANCELED", client: L, lignes: [ligne("Commande annulée stable", 1, 150)] }),
  // Cibles des contrôles de droits.
  cibleModifier: bc(7, { numero: "0006", statut: "CONFIRMED", client: L, lignes: [ligne("Cible BC modification", 1, 100)] }),
  cibleSupprimer: bc(8, { numero: "DRAFT-0002", statut: "DRAFT", client: L, lignes: [ligne("Cible BC suppression", 1, 100)] }),
  cibleStatut: bc(9, { numero: "0007", statut: "CONFIRMED", client: L, lignes: [ligne("Cible BC statut", 1, 100)] }),
  cibleFacture: bc(10, { numero: "0008", statut: "DELIVERED", client: L, lignes: [ligne("Cible BC facture", 1, 100)] }),
  cibleEnvoyer: bc(11, { numero: "0009", statut: "CONFIRMED", client: L, lignes: [ligne("Cible BC envoi", 1, 100)] }),
  cibleModele: bc(12, { numero: "0010", statut: "CONFIRMED", client: L, lignes: [ligne("Cible BC modèle", 1, 100)] }),
  cibleXss: bc(13, { numero: "0011", statut: "CONFIRMED", client: L, lignes: [ligne("Cible BC texte piégé", 1, 100)] }),
  // Parcours.
  aFacturer: bc(14, { numero: "0012", statut: "DELIVERED", client: C, lignes: [ligne("Commande à facturer", 2, 410)] }),
  aLivrer: bc(15, { numero: "0013", statut: "VALIDATED", client: C, lignes: [ligne("Commande à livrer en bon de livraison", 6, 20)] }),
  aModifierEnAttente: bc(16, { numero: "0014", statut: "CONFIRMED", client: C, lignes: [ligne("Commande en attente à modifier", 1, 515)], emiseIlYa: 10, archivedPdfKey: "purchaseOrders/e2e/ancien.pdf", archivedPdfStoredAt: DANS(-10), archivedPdfSource: "NEWBI" }),
  avecCgv: bc(17, { numero: "DRAFT-0003", statut: "DRAFT", client: C, lignes: [ligne("Brouillon de commande avec conditions", 1, 230)], termsAndConditions: CGV_DEVIS }),
  aEnvoyer: bc(18, { numero: "0015", statut: "CONFIRMED", client: C, lignes: [ligne("Commande à envoyer par e-mail", 1, 860)] }),
  aSupprimerGroupe1: bc(19, { numero: "DRAFT-0004", statut: "DRAFT", client: C, lignes: [ligne("Lot de commandes à supprimer", 1, 11)] }),
  aSupprimerGroupe2: bc(20, { numero: "DRAFT-0005", statut: "DRAFT", client: C, lignes: [ligne("Lot de commandes à supprimer", 1, 12)] }),
  pdf: bc(21, { numero: "0016", statut: "CONFIRMED", client: C, lignes: [ligne("Commande à télécharger en PDF", 1, 2222)] }),
  aRepasserBrouillon: bc(22, { numero: "0017", statut: "CONFIRMED", client: C, lignes: [ligne("Commande à repasser en brouillon", 1, 199)] }),
  aConfirmerEditeur: bc(23, { numero: "DRAFT-0006", statut: "DRAFT", client: C, lignes: [ligne("Brouillon de commande à finaliser", 1, 377)] }),
  coeurAValider: bc(24, { numero: "0018", statut: "CONFIRMED", client: CLIENTS_VENTES.coeur, lignes: [ligne("Commande Cœur à valider", 1, 260)] }),
  aValiderPanneau: bc(25, { numero: "0019", statut: "CONFIRMED", client: C, lignes: [ligne("Commande à valider depuis le panneau", 1, 333)] }),
  aExporter: bc(26, { numero: "0020", statut: "VALIDATED", client: C, lignes: [ligne("Commande validée exportée", 2, 210)] }),
};

export const BC_VOLUME = Array.from({ length: 55 }, (_, i) => {
  const k = i + 1;
  return bonCommande("volume", 200 + k, {
    numero: String(k).padStart(4, "0"),
    statut: k % 2 ? "CONFIRMED" : "VALIDATED",
    client: CLIENTS_VENTES.volume,
    lignes: [ligne(`Bon de commande en volume n° ${k}`, 1, 50 + k)],
    prefixe: "BC-082026",
    emiseIlYa: 60 - Math.floor(k / 2),
    creeIlYa: 120 - k,
  });
});

// --- Bons de livraison ------------------------------------------------------------

function bonLivraison(compte, n, { numero, statut, client: c, lignes, emiseIlYa = 2, livraisonDans = 3, creeIlYa = 100 + (200 - n), prefixe = PREFIXE_BL, transporteur = "", suivi = "", recuPar = "", ...champs }) {
  const emise = DANS(-emiseIlYa);
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("blVentes", n),
    prefix: prefixe,
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    deliveryDate: DANS(livraisonDans),
    client: snapshotClient(c),
    companyInfo: entreprise(compte),
    // Prix gardés en base (cachés) comme le fait l'API, pour la facture du bon.
    items: lignes.map(([description, quantity, unitPrice = 0]) => ({ description, quantity, details: "", unit: "unité", reference: "", unitPrice, vatRate: 20 })),
    deliveryAddress: { fullName: c.name, street: c.address.street, postalCode: c.address.postalCode, city: c.address.city, country: "France" },
    carrier: transporteur,
    trackingNumber: suivi,
    notes: "",
    receivedBy: recuPar,
    receivedAt: recuPar ? DANS(-1) : null,
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
    createdAt: DANS(-creeIlYa),
    updatedAt: MAINTENANT,
    ...champs,
  };
}

const bl = (n, o) => bonLivraison("ventes", n, o);

/** Bons de livraison de l'organisation « Ventes », par rôle dans les tests. */
export const BL_VENTES = {
  brouillon: bl(1, { numero: "DRAFT-0001", statut: "DRAFT", client: L, lignes: [["Cartons stables", 10, 4]], transporteur: "Transport Brouillon Stable" }),
  aExpedier: bl(2, { numero: "0001", statut: "PENDING", client: L, lignes: [["Palette stable", 2, 150]], transporteur: "Chronopost", suivi: "VE000000001FR" }),
  expedie: bl(3, { numero: "0002", statut: "SHIPPED", client: M, lignes: [["Colis expédié stable", 1, 80]], transporteur: "DHL", suivi: "VE000000002FR" }),
  livre: bl(4, { numero: "0003", statut: "DELIVERED", client: L, lignes: [["Matériel livré stable", 3, 60]], transporteur: "Livraison en propre", recuPar: "Claire Martin" }),
  annule: bl(5, { numero: "0004", statut: "CANCELED", client: M, lignes: [["Livraison annulée stable", 1, 20]], transporteur: "UPS" }),
  // Cibles des contrôles de droits.
  cibleModifier: bl(6, { numero: "0005", statut: "PENDING", client: L, lignes: [["Cible BL modification", 1, 10]], transporteur: "Cible Transport" }),
  cibleSupprimer: bl(7, { numero: "DRAFT-0002", statut: "DRAFT", client: L, lignes: [["Cible BL suppression", 1, 10]], transporteur: "Cible Suppression" }),
  cibleStatut: bl(8, { numero: "0006", statut: "PENDING", client: L, lignes: [["Cible BL statut", 1, 10]] }),
  cibleReception: bl(9, { numero: "0007", statut: "SHIPPED", client: L, lignes: [["Cible BL réception", 1, 10]] }),
  cibleFacture: bl(10, { numero: "0008", statut: "DELIVERED", client: L, lignes: [["Cible BL facture", 1, 10]], recuPar: "Paul Cible" }),
  cibleEnvoyer: bl(11, { numero: "0009", statut: "PENDING", client: L, lignes: [["Cible BL envoi", 1, 10]] }),
  cibleXss: bl(12, { numero: "0010", statut: "PENDING", client: L, lignes: [["Cible BL texte piégé", 1, 10]] }),
  // Parcours.
  aEmettre: bl(13, { numero: "DRAFT-0003", statut: "DRAFT", client: C, lignes: [["Brouillon de livraison à émettre", 2, 30]], transporteur: "Transport à émettre" }),
  aExpedierPanneau: bl(14, { numero: "0011", statut: "PENDING", client: C, lignes: [["Colis à expédier depuis le panneau", 1, 45]] }),
  aReceptionner: bl(15, { numero: "0012", statut: "SHIPPED", client: C, lignes: [["Colis à réceptionner avec signature", 1, 55]], transporteur: "Colissimo", suivi: "6A00000000015" }),
  aFacturer: bl(16, { numero: "0013", statut: "DELIVERED", client: C, lignes: [["Livraison à facturer", 4, 35]], recuPar: "Jeanne Facture" }),
  aModifier: bl(17, { numero: "0014", statut: "PENDING", client: C, lignes: [["Livraison à modifier", 1, 15]], transporteur: "Transport à modifier" }),
  aSupprimerGroupe1: bl(18, { numero: "DRAFT-0004", statut: "DRAFT", client: C, lignes: [["Lot de livraisons à supprimer", 1, 5]], transporteur: "Lot à supprimer A" }),
  aSupprimerGroupe2: bl(19, { numero: "DRAFT-0005", statut: "DRAFT", client: C, lignes: [["Lot de livraisons à supprimer", 1, 6]], transporteur: "Lot à supprimer B" }),
  pdf: bl(20, { numero: "0015", statut: "PENDING", client: C, lignes: [["Livraison à télécharger en PDF", 7, 12]], transporteur: "Transport PDF" }),
  consultation: bl(21, { numero: "0016", statut: "SHIPPED", client: C, lignes: [["Livraison consultée par son adresse", 2, 18]], transporteur: "Geodis", suivi: "VE000000021FR" }),
  aAnnulerEditeur: bl(22, { numero: "0017", statut: "PENDING", client: C, lignes: [["Livraison annulée par l'Éditeur", 1, 9]] }),
  // Prix du devis gardés en base (cachés) pour la facture : modifié dans l'éditeur, il doit les garder.
  depuisDevis: bl(23, { numero: "0018", statut: "PENDING", client: C, lignes: [["Article du devis livré", 5, 40]], transporteur: "Transport depuis devis" }),
  coeurAExpedier: bl(24, { numero: "0019", statut: "PENDING", client: CLIENTS_VENTES.coeur, lignes: [["Livraison Cœur à expédier", 1, 30]], transporteur: "Transport Cœur" }),
  studioAExpedier: bl(25, { numero: "0020", statut: "PENDING", client: CLIENTS_VENTES.studio, lignes: [["Livraison Studio à expédier", 1, 25]], transporteur: "Transport Studio" }),
  aRepasserBrouillon: bl(26, { numero: "0021", statut: "PENDING", client: C, lignes: [["Livraison à repasser en brouillon", 1, 14]], transporteur: "Transport à repasser" }),
  aAnnulerExpedie: bl(27, { numero: "0022", statut: "SHIPPED", client: C, lignes: [["Livraison expédiée à annuler", 1, 16]], transporteur: "Transport à annuler" }),
  aEnvoyer: bl(28, { numero: "0023", statut: "PENDING", client: C, lignes: [["Livraison à envoyer par e-mail", 1, 17]], transporteur: "Transport e-mail" }),
};

export const BL_VOLUME = Array.from({ length: 55 }, (_, i) => {
  const k = i + 1;
  return bonLivraison("volume", 200 + k, {
    numero: String(k).padStart(4, "0"),
    statut: k % 2 ? "PENDING" : "SHIPPED",
    client: CLIENTS_VENTES.volume,
    lignes: [[`Livraison en volume n° ${k}`, k, 1]],
    prefixe: "BL-202608",
    transporteur: `Transporteur volume ${k}`,
    emiseIlYa: 60 - Math.floor(k / 2),
    creeIlYa: 120 - k,
  });
});

// Cibles des contrôles de droits (appelées par l'API, jamais ouvertes dans une liste) : les plus
// anciennes, pour que les documents ouverts dans les listes restent parmi les 50 qu'elles chargent,
// même après les créations des tests. Le texte piégé, lui, s'ouvre dans la liste.
for (const docs of [DEVIS_VENTES, BC_VENTES, BL_VENTES]) {
  Object.entries(docs).forEach(([cle, doc], i) => {
    if (cle.startsWith("cible") && cle !== "cibleXss") doc.createdAt = DANS(-(400 + i));
  });
}

// --- Facture (génération croisée facture → bon de livraison) --------------------

export const FACTURE_VENTES = (() => {
  const lignes = [ligne("Facture à livrer", 2, 75)];
  const emise = DANS(-3);
  return {
    _id: oid("factureVentes", 1),
    prefix: `F-${MOIS}`,
    number: "0001",
    status: "PENDING",
    issueDate: emise,
    issueYear: emise.getFullYear(),
    dueDate: DANS(27),
    paymentDate: null,
    invoiceType: "standard",
    isDeposit: false,
    situationNumber: 1,
    progressMode: "uniform",
    globalProgressPercentage: 100,
    depositAmount: 0,
    contractTotal: 0,
    client: snapshotClient(L),
    companyInfo: entreprise("ventes"),
    items: articles(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    ...totaux(lignes),
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    showBankDetails: false,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    isReverseCharge: false,
    isVatExempt: false,
    workspaceId: COMPTES.ventes.organisation._id,
    createdBy: COMPTES.ventes.utilisateur._id,
    createdAt: DANS(-3),
    updatedAt: MAINTENANT,
  };
})();

// --- Signatures électroniques (quotas du mois) -----------------------------------

/**
 * Demandes transmises au prestataire ce mois-ci (externalSignatureId posé) :
 * elles comptent dans le quota, même annulées. Ne comptent pas : celles du
 * mois dernier, celles tombées en erreur et le cachet de l'entreprise.
 */
function signature(compte, n, { document, statut = "DONE", type = "SES", ilYaMinutes = n, externe = `ext-${compte}-${n}` }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const cree = new Date(MAINTENANT.getTime() - ilYaMinutes * 60_000);
  return {
    _id: oid("signatureVentes", n),
    organizationId: organisation._id.toHexString(),
    workspaceId: organisation._id,
    documentType: "quote",
    documentId: document._id,
    documentNumber: document.number,
    signatureProvider: "openapi_esignature",
    externalSignatureId: externe,
    signatureType: type,
    status: statut,
    signers: [{ name: "Jean", surname: "Signataire", email: "signataire@e2e.test", authentication: ["email"] }],
    callbackReceived: statut === "DONE",
    createdBy: utilisateur._id,
    createdAt: cree,
    updatedAt: cree,
  };
}

const STATUTS_COMPTES = ["DONE", "WAIT_SIGN", "CANCELLED"];
/** Quota de l'offre d'entrée atteint : 10 demandes ce mois-ci, plus 3 qui ne comptent pas. */
export const SIGNATURES_FREELANCE = [
  ...Array.from({ length: 10 }, (_, i) => signature("freelanceVentes", 101 + i, { document: DEVIS_FREELANCE.signes, statut: STATUTS_COMPTES[i % 3] })),
  { ...signature("freelanceVentes", 111, { document: DEVIS_FREELANCE.signes }), createdAt: DANS(-40), updatedAt: DANS(-40) },
  signature("freelanceVentes", 112, { document: DEVIS_FREELANCE.signes, statut: "ERROR" }),
  signature("freelanceVentes", 113, { document: DEVIS_FREELANCE.signes, type: "QES_automatic" }),
];
/** Quota PME atteint : 100 demandes ce mois-ci. */
export const SIGNATURES_VOLUME = Array.from({ length: 100 }, (_, i) =>
  signature("volume", 201 + i, { document: DEVIS_VOLUME[(i % 18) * 3 + 2], statut: STATUTS_COMPTES[i % 3] }),
);
/** Offre Entreprise (illimitée) : 150 demandes ce mois-ci ne bloquent rien. */
export const SIGNATURES_VENTES = Array.from({ length: 150 }, (_, i) =>
  signature("ventes", 401 + i, { document: DEVIS_VENTES.signesCeMois, statut: "DONE" }),
);
/** Demandes des contrôles de droits : une en attente (annuler), une en erreur (relancer), une terminée (cachet). */
export const SIGNATURES_CIBLES = {
  aAnnuler: signature("ventes", 1, { document: DEVIS_VENTES.cibleAnnulerSignature, statut: "WAIT_SIGN" }),
  aRelancer: signature("ventes", 2, { document: DEVIS_VENTES.cibleRelancerSignature, statut: "ERROR" }),
  signee: signature("ventes", 3, { document: DEVIS_VENTES.cibleCachet, statut: "DONE" }),
};

// --- Modèles de documents ---------------------------------------------------------

/** 10 modèles de devis : plafond des modèles de l'offre d'entrée atteint. */
export const MODELES_FREELANCE = Array.from({ length: 10 }, (_, i) => ({
  _id: oid("modeleDevis", 101 + i),
  name: `Modèle freelance ${i + 1}`,
  description: "",
  items: articles([ligne(`Article du modèle ${i + 1}`, 1, 100)]),
  workspaceId: COMPTES.freelanceVentes.organisation._id,
  userId: COMPTES.freelanceVentes.utilisateur._id,
  createdAt: DANS(-(20 - i)),
  updatedAt: DANS(-(20 - i)),
}));

/** Un modèle de devis de l'organisation « Ventes » (liste des modèles de l'éditeur). */
export const MODELE_VENTES = {
  _id: oid("modeleDevis", 1),
  name: "Modèle Ventes stable",
  description: "Modèle repris dans l'éditeur",
  items: articles([ligne("Article issu du modèle", 2, 210)]),
  termsAndConditions: CGV_DEVIS,
  workspaceId: COMPTES.ventes.organisation._id,
  userId: COMPTES.ventes.utilisateur._id,
  createdAt: DANS(-30),
  updatedAt: DANS(-30),
};

/** Modèles de l'organisation « Ventes » à supprimer (contrôles de droits). */
export const MODELE_DEVIS_A_SUPPRIMER = { ...MODELE_VENTES, _id: oid("modeleDevis", 2), name: "Modèle de devis à supprimer" };
export const MODELE_BC_VENTES = {
  _id: oid("modeleBc", 1),
  name: "Modèle de bon de commande à supprimer",
  description: "",
  items: articles([ligne("Article du modèle de commande", 1, 90)]),
  workspaceId: COMPTES.ventes.organisation._id,
  userId: COMPTES.ventes.utilisateur._id,
  createdAt: DANS(-30),
  updatedAt: DANS(-30),
};

// --- Devis et bons de commande importés (PDF lus par l'OCR) ------------------------

function importe(type, n, { numero, statut = "PENDING_REVIEW", total = 240 }) {
  const { utilisateur, organisation } = COMPTES.ventes;
  const devisImporte = type === "devisImporte";
  return {
    _id: oid(type, n),
    workspaceId: organisation._id,
    importedBy: utilisateur._id,
    status: statut,
    [devisImporte ? "originalQuoteNumber" : "originalPurchaseOrderNumber"]: numero,
    source: "OCR_UPLOAD",
    vendor: { name: "Fournisseur Importé SAS", address: "3 rue de l'Import", city: "Lille", postalCode: "59000", country: "France", siret: null, vatNumber: null, email: null, phone: null },
    client: { name: "Ventes Test SASU", address: "1 rue de la Paix", city: "Paris", postalCode: "75001", siret: null, clientNumber: null },
    [devisImporte ? "quoteDate" : "purchaseOrderDate"]: DANS(-5),
    validUntil: DANS(25),
    totalHT: total / 1.2,
    totalVAT: total - total / 1.2,
    totalTTC: total,
    currency: "EUR",
    items: [{ description: `Ligne importée ${numero}`, quantity: 1, unitPrice: total / 1.2, totalPrice: total, vatRate: 20, productCode: null }],
    category: "OTHER",
    paymentMethod: "UNKNOWN",
    file: { url: "https://fichiers.e2e.invalid/import.pdf", cloudflareKey: `imports/e2e/${numero}.pdf`, originalFileName: `${numero}.pdf`, mimeType: "application/pdf", fileSize: 1024 },
    ocrData: { extractedText: "", rawData: {}, financialAnalysis: {}, confidence: 0.9, processedAt: DANS(-5) },
    notes: "",
    isDuplicate: false,
    createdAt: DANS(-5),
    updatedAt: DANS(-5),
  };
}

const ROLES_IMPORTES = ["stable", "cibleModifier", "cibleValider", "cibleConvertir", "cibleRejeter", "cibleArchiver", "cibleSupprimer", "cibleSupprimerPlusieurs"];
export const DEVIS_IMPORTES = Object.fromEntries(ROLES_IMPORTES.map((r, i) => [r, importe("devisImporte", i + 1, { numero: `DEV-IMP-${String(i + 1).padStart(3, "0")}` })]));
export const BC_IMPORTES = Object.fromEntries(ROLES_IMPORTES.map((r, i) => [r, importe("bcImporte", i + 1, { numero: `BC-IMP-${String(i + 1).padStart(3, "0")}` })]));

// --- Contrôles de l'audit : rôles, signatures, conversions, abonnement ---------------
//
// « Ventes » : un rôle Comptable et quatre rôles personnalisés (une page en
// lecture, ou la saisie sans statut ni factures), des documents liés entre eux
// (devis → factures, bon de commande, bon de livraison) et un devis au PDF en
// cache. Créés il y a plus d'un an : ils restent hors des 50 lignes chargées
// par les listes.
// « Contrôles Ventes » : devis en cours de signature (webhook du prestataire),
// devis à facturer par un bon de livraison ou un bon de commande, répartitions,
// facturation de situation. Une donnée par test.
// « Ventes Expirée » : espace sans abonnement (lecture seule).

const CTRL = "controleVentes";
const EXPIREE = "ventesExpiree";

export const CLIENT_CONTROLE = client(9, CTRL, {
  name: "Menuiserie Contrôle SARL",
  email: "atelier@menuiserie-controle.test",
  type: "COMPANY",
  siret: "12312312300015",
  vatNumber: "FR12123123123",
  address: { fullName: "Menuiserie Contrôle SARL", street: "7 rue des Copeaux", city: "Tours", postalCode: "37000", country: "France" },
});
export const CLIENT_EXPIREE = client(10, EXPIREE, {
  name: "Client Lecture Seule SARL",
  email: "contact@lecture-seule.test",
  type: "COMPANY",
  siret: "32132132100017",
  vatNumber: "FR32321321321",
  address: { fullName: "Client Lecture Seule SARL", street: "3 place du Gel", city: "Dijon", postalCode: "21000", country: "France" },
});

/** Facture « telle qu'enregistrée » (lien avec un devis, un bon de commande ou de livraison). */
function facture(compte, n, { numero, statut = "PENDING", client: c, lignes, prefixe = `F-${MOIS}`, ...champs }) {
  const emise = DANS(-3);
  const { utilisateur, organisation } = COMPTES[compte];
  return {
    _id: oid("factureVentes", n),
    prefix: prefixe,
    number: numero,
    status: statut,
    issueDate: emise,
    issueYear: emise.getFullYear(),
    dueDate: DANS(27),
    paymentDate: null,
    invoiceType: "standard",
    isDeposit: false,
    situationNumber: 1,
    progressMode: "uniform",
    globalProgressPercentage: 100,
    depositAmount: 0,
    contractTotal: 0,
    client: snapshotClient(c),
    companyInfo: entreprise(compte),
    items: articles(lignes),
    discount: 0,
    discountType: "PERCENTAGE",
    ...totaux(lignes),
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    showBankDetails: false,
    headerNotes: "",
    footerNotes: "",
    termsAndConditions: "",
    customFields: [],
    isReverseCharge: false,
    isVatExempt: false,
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: emise,
    updatedAt: MAINTENANT,
    ...champs,
  };
}

/** Rôles personnalisés de « Ventes » (clé `role_<hex>`, comme l'API les crée). */
const rolePerso = (n, name, actions) => ({
  _id: oid("roleVentes", n),
  organizationId: COMPTES.ventes.organisation._id,
  role: `role_${oid("roleVentes", n).toHexString()}`,
  permission: JSON.stringify({}),
  actions,
  catalogVersion: 2,
  name,
  description: "Rôle des contrôles de droits",
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});
export const ROLES_VENTES = {
  bl: rolePerso(1, "Livraisons en lecture", { deliveryNotes: ["view"] }),
  devis: rolePerso(2, "Devis en lecture", { quotes: ["view"] }),
  bc: rolePerso(3, "Commandes en lecture", { purchaseOrders: ["view"] }),
  // Crée devis, bons de commande et de livraison ; ni statut, ni factures.
  saisie: rolePerso(4, "Saisie des ventes", {
    quotes: ["view", "create", "edit"],
    purchaseOrders: ["view", "create", "edit"],
    deliveryNotes: ["view", "create", "edit"],
  }),
};

// Documents liés de « Ventes » : devis → facture, bon de commande → facture, bon de livraison → facture.
const ANCIEN = 480;
const factureLiee = (n, numero, nom) => facture("ventes", n, { numero, client: C, lignes: [ligne(nom, 1, 700)], createdAt: DANS(-ANCIEN) });
const F_DEVIS_LIE = factureLiee(14, "0002", "Facture du devis lié");
const F_BC_LIE = factureLiee(15, "0003", "Facture du bon de commande lié");
const F_BL_LIE = factureLiee(16, "0004", "Facture du bon de livraison lié");
const DEVIS_LIE = dv(50, {
  numero: "0036",
  statut: "COMPLETED",
  client: C,
  lignes: [ligne("Devis lié aux factures", 1, 700)],
  linkedInvoices: [F_DEVIS_LIE._id],
  convertedToInvoice: F_DEVIS_LIE._id,
  creeIlYa: ANCIEN,
});
F_DEVIS_LIE.sourceQuote = DEVIS_LIE._id;
F_DEVIS_LIE.purchaseOrderNumber = reference(DEVIS_LIE);
export const LIENS_VENTES = {
  devis: DEVIS_LIE,
  factureDevis: F_DEVIS_LIE,
  factureBc: F_BC_LIE,
  factureBl: F_BL_LIE,
  bc: bc(40, {
    numero: "0021",
    statut: "DELIVERED",
    client: C,
    lignes: [ligne("Commande liée au devis", 1, 700)],
    sourceQuoteId: DEVIS_LIE._id,
    linkedInvoices: [F_BC_LIE._id],
    creeIlYa: ANCIEN,
  }),
  bl: bl(40, {
    numero: "0024",
    statut: "DELIVERED",
    client: C,
    lignes: [["Livraison liée aux factures", 1, 700]],
    sourceQuote: DEVIS_LIE._id,
    sourceInvoice: F_DEVIS_LIE._id,
    linkedInvoices: [F_BL_LIE._id],
    recuPar: "Lou Réception",
    creeIlYa: ANCIEN,
  }),
  // Devis en attente au PDF en cache (automatisation appelée par le Comptable).
  devisPdfEnCache: dv(51, {
    numero: "0037",
    statut: "PENDING",
    client: C,
    lignes: [ligne("Devis au PDF en cache", 1, 640)],
    cachedPdf: { key: "quotes/e2e/devis-en-cache.pdf", url: "https://fichiers.e2e.invalid/quotes/devis-en-cache.pdf", generatedAt: DANS(-1) },
    creeIlYa: ANCIEN + 1,
  }),
};

function reference(doc) {
  return `${doc.prefix}-${doc.number}`;
}

// Documents partagés : un dossier et une automatisation (inactive : elle ne se
// déclenche jamais d'elle-même) par organisation qui en a besoin.
const dossierVentes = (n, compte, nom) => ({
  _id: oid("dossierVentes", n),
  name: nom,
  description: "",
  workspaceId: COMPTES[compte].organisation._id,
  parentId: null,
  color: "#6366f1",
  icon: "folder",
  isSharedWithAccountant: true,
  order: 0,
  isSystem: false,
  visibility: "public",
  allowedUserIds: [],
  trashedAt: null,
  originalParentId: null,
  createdBy: COMPTES[compte].utilisateur._id,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});
export const DOSSIERS_VENTES = {
  ventes: dossierVentes(1, "ventes", "Devis envoyés"),
  controle: dossierVentes(2, CTRL, "Devis acceptés"),
  expiree: dossierVentes(3, EXPIREE, "Devis de l'espace en lecture seule"),
};
const automatisationVentes = (n, compte, nom, triggerType, dossier, isActive) => ({
  _id: oid("automatisationVentes", n),
  name: nom,
  description: "",
  workspaceId: COMPTES[compte].organisation._id,
  createdBy: COMPTES[compte].utilisateur._id,
  triggerType,
  actionConfig: {
    targetFolderId: dossier._id,
    createSubfolder: false,
    subfolderPattern: "year",
    filterYear: null,
    filterClientId: null,
    filterClientName: null,
    documentNaming: "{documentType}-{number}-{clientName}",
    tags: [],
    documentStatus: "classified",
  },
  isActive,
  stats: { totalExecutions: 0, lastExecutedAt: null, lastDocumentId: null, failedExecutions: 0 },
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});
export const AUTOMATISATIONS_VENTES = {
  ventes: automatisationVentes(1, "ventes", "Devis envoyés vers les documents partagés", "QUOTE_SENT", DOSSIERS_VENTES.ventes, false),
  // Active : l'acceptation d'un devis signé doit la déclencher (et la journaliser).
  controle: automatisationVentes(2, CTRL, "Devis acceptés vers les documents partagés", "QUOTE_ACCEPTED", DOSSIERS_VENTES.controle, true),
  expiree: automatisationVentes(3, EXPIREE, "Devis envoyés (lecture seule)", "QUOTE_SENT", DOSSIERS_VENTES.expiree, false),
};

// --- « Contrôles Ventes » : signatures électroniques -------------------------------

const dc = (n, o) => devis(CTRL, n, { client: CLIENT_CONTROLE, creeIlYa: 5, ...o });
/** Demande de signature d'un devis de « Contrôles Ventes », transmise au prestataire. */
const signatureControle = (n, document, statut, champs = {}) => ({
  ...signature(CTRL, n, { document, statut, externe: `ext-controle-${n}` }),
  ...champs,
});
const lien = (n) => `https://signature.e2e.invalid/s/${n}`;
const jeton = (n) => `e2eJetonSuiviSignatureControle${n}`;
const suivi = (n) => ({ emailTracking: { trackingToken: jeton(n), emailSentAt: DANS(-1), emailOpenCount: 0, emailClickCount: 0 } });

export const DEVIS_SIGNATURE = {
  modifier: dc(60, { numero: "0001", statut: "PENDING", lignes: [ligne("Devis signé puis modifié", 1, 1000)] }),
  brouillon: dc(61, { numero: "0002", statut: "PENDING", lignes: [ligne("Devis repassé en brouillon pendant la signature", 1, 400)] }),
  supprimer: dc(62, { numero: "0003", statut: "PENDING", lignes: [ligne("Devis supprimé pendant la signature", 1, 300)] }),
  annuler: dc(63, { numero: "0004", statut: "PENDING", lignes: [ligne("Signature annulée puis terminée", 1, 350)] }),
  terminee: dc(64, { numero: "0005", statut: "PENDING", lignes: [ligne("Devis signé par le client", 1, 1500)] }),
  erreur: dc(65, { numero: "0006", statut: "PENDING", lignes: [ligne("Signature en erreur", 1, 250)] }),
  inconnu: dc(66, { numero: "0007", statut: "PENDING", lignes: [ligne("État de signature inconnu", 1, 260)] }),
  accepter: dc(67, { numero: "0008", statut: "PENDING", lignes: [ligne("Devis accepté pendant la signature", 1, 270)], ...suivi(607) }),
  refuser: dc(68, { numero: "0009", statut: "PENDING", lignes: [ligne("Devis refusé pendant la signature", 1, 280)], ...suivi(608) }),
  signataires: dc(69, { numero: "0010", statut: "PENDING", lignes: [ligne("Signataires refusés", 1, 290)] }),
  cachet: dc(70, { numero: "0011", statut: "PENDING", lignes: [ligne("Cachet sans signature du client", 1, 300)] }),
  accepteEnErreur: dc(71, { numero: "0012", statut: "COMPLETED", lignes: [ligne("Devis accepté, signature en erreur", 1, 310)] }),
  importe: dc(72, { numero: "IMP-CTRL-01", statut: "IMPORTED", prefixe: "", lignes: [ligne("Devis importé à signer", 1, 320)] }),
  brouillonASigner: dc(73, { numero: "DRAFT-0001", statut: "DRAFT", lignes: [ligne("Brouillon à signer", 1, 330)] }),
  accepteASigner: dc(74, { numero: "0013", statut: "COMPLETED", lignes: [ligne("Devis accepté à signer", 1, 340)] }),
  nomsReels: dc(75, { numero: "0014", statut: "PENDING", lignes: [ligne("Signataires aux noms réels", 1, 360)] }),
  dialogue: dc(76, { numero: "0015", statut: "PENDING", lignes: [ligne("Fenêtre de signature au clavier", 1, 370)] }),
};
const S = DEVIS_SIGNATURE;
export const SIGNATURES_CONTROLE = {
  modifier: signatureControle(600, S.modifier, "WAIT_SIGNER"),
  brouillon: signatureControle(601, S.brouillon, "WAIT_SIGN"),
  supprimer: signatureControle(602, S.supprimer, "WAIT_SIGN"),
  annuler: signatureControle(603, S.annuler, "WAIT_SIGN"),
  terminee: signatureControle(604, S.terminee, "WAIT_SIGNER"),
  erreur: signatureControle(605, S.erreur, "WAIT_SIGNER"),
  inconnu: signatureControle(606, S.inconnu, "WAIT_SIGNER"),
  accepter: signatureControle(607, S.accepter, "WAIT_SIGN", {
    signingUrl: lien(607),
    signers: [{ name: "Jean", surname: "Signataire", email: "signataire@e2e.test", authentication: ["email"], signingUrl: lien(607) }],
  }),
  refuser: signatureControle(608, S.refuser, "WAIT_SIGN", {
    signingUrl: lien(608),
    signers: [{ name: "Jean", surname: "Signataire", email: "signataire@e2e.test", authentication: ["email"], signingUrl: lien(608) }],
  }),
  accepteEnErreur: signatureControle(609, S.accepteEnErreur, "ERROR"),
};
export const LIENS_SIGNATURE = { lien, jeton };

// --- « Contrôles Ventes » : facturation par bon de livraison, bon de commande, répartitions ---

const dcFacture = (n, numero, nom, o = {}) => dc(n, { numero, statut: "COMPLETED", lignes: [ligne(nom, 1, 1000)], ...o });
const blc = (n, numero, doc, o = {}) =>
  bonLivraison(CTRL, n, {
    numero,
    statut: "PENDING",
    client: CLIENT_CONTROLE,
    lignes: doc.items.map((a) => [a.description, a.quantity, a.unitPrice]),
    sourceQuote: doc._id,
    transporteur: `Transport ${numero}`,
    creeIlYa: 5,
    ...o,
  });

const DEVIS_DEJA_FACTURE = dcFacture(80, "0020", "Prestation déjà facturée");
const F_DEJA_FACTURE = facture(CTRL, 10, {
  numero: "0001",
  client: CLIENT_CONTROLE,
  lignes: [ligne("Prestation déjà facturée", 1, 1000)],
  sourceQuote: DEVIS_DEJA_FACTURE._id,
  purchaseOrderNumber: reference(DEVIS_DEJA_FACTURE),
});
DEVIS_DEJA_FACTURE.linkedInvoices = [F_DEJA_FACTURE._id];
DEVIS_DEJA_FACTURE.convertedToInvoice = F_DEJA_FACTURE._id;

const DEVIS_DEUX_BL = dcFacture(81, "0021", "Prestation livrée en deux bons");
// Autoliquidation, remise globale de 10 % et port facturé 50 € HT :
// 1 000 € HT - 100 € de remise + 50 € de port = 950 € HT, TVA 0 €.
const DEVIS_AUTOLIQUIDE = dc(82, {
  numero: "0022",
  statut: "COMPLETED",
  lignes: [ligne("Pose autoliquidée", 1, 1000)],
  isReverseCharge: true,
  discount: 10,
  discountType: "PERCENTAGE",
  shipping: { billShipping: true, shippingAddress: null, shippingAmountHT: 50, shippingVatRate: 20 },
  totalHT: 1050,
  totalVAT: 0,
  totalTTC: 1050,
  finalTotalHT: 950,
  finalTotalVAT: 0,
  finalTotalTTC: 950,
  discountAmount: 100,
});
const DEVIS_ATTENTE_ACCEPTER = dc(83, { numero: "0023", statut: "PENDING", lignes: [ligne("Devis en attente livré puis accepté", 1, 500)] });
const DEVIS_ATTENTE_REFUSER = dc(84, { numero: "0024", statut: "PENDING", lignes: [ligne("Devis en attente livré puis refusé", 1, 520)] });

export const FACTURATION_CONTROLE = {
  dejaFacture: DEVIS_DEJA_FACTURE,
  factureDejaFaite: F_DEJA_FACTURE,
  blDejaFacture: blc(70, "0001", DEVIS_DEJA_FACTURE),
  deuxBl: DEVIS_DEUX_BL,
  blPremier: blc(71, "0002", DEVIS_DEUX_BL),
  blSecond: blc(72, "0003", DEVIS_DEUX_BL),
  autoliquide: DEVIS_AUTOLIQUIDE,
  blAutoliquide: blc(73, "0004", DEVIS_AUTOLIQUIDE),
  attenteAccepter: DEVIS_ATTENTE_ACCEPTER,
  blAttenteAccepter: blc(74, "0005", DEVIS_ATTENTE_ACCEPTER),
  attenteRefuser: DEVIS_ATTENTE_REFUSER,
  blAttenteRefuser: blc(75, "0006", DEVIS_ATTENTE_REFUSER),
  // Acompte de 30 %, puis bon de commande, puis facture du bon de commande.
  acompteBc: dcFacture(85, "0025", "Chantier avec acompte"),
  // Répartitions de convertQuoteToInvoice.
  repartitionNegative: dcFacture(86, "0026", "Répartition 150 et -50"),
  repartitionNulle: dcFacture(87, "0027", "Répartition 0"),
  repartitionDouble: dcFacture(88, "0028", "Répartition 200 sans contrôle"),
  repartitionMoitie: dcFacture(89, "0029", "Répartition 50 et 50"),
  // Appels simultanés.
  concurrentLie: dcFacture(90, "0030", "Facture liée demandée deux fois"),
  concurrentConversion: dcFacture(91, "0031", "Conversion demandée deux fois"),
  blConcurrent: bonLivraison(CTRL, 76, {
    numero: "0007",
    statut: "DELIVERED",
    client: CLIENT_CONTROLE,
    lignes: [["Livraison facturée deux fois", 2, 90]],
    transporteur: "Transport concurrent",
    recuPar: "Réception concurrente",
    creeIlYa: 5,
  }),
};

// Facturation de situation : devis de 10 000 € TTC, une situation annulée (10 000 €),
// une en brouillon (2 000 €), et une facture d'une autre organisation à la même référence.
const DEVIS_SITUATION = dc(92, { numero: "0032", statut: "COMPLETED", lignes: [ligne("Travaux en situation", 1, 8333.33)] });
const situation = (compte, n, numero, statut, montantHT) =>
  facture(compte, n, {
    numero,
    statut,
    client: compte === CTRL ? CLIENT_CONTROLE : CLIENTS.alpha,
    lignes: [ligne("Situation de travaux", 1, montantHT)],
    invoiceType: "situation",
    purchaseOrderNumber: reference(DEVIS_SITUATION),
    situationReference: reference(DEVIS_SITUATION),
  });
export const SITUATION_CONTROLE = {
  devis: DEVIS_SITUATION,
  annulee: situation(CTRL, 11, "0002", "CANCELED", 8333.33),
  brouillon: situation(CTRL, 12, "DRAFT-0001", "DRAFT", 1666.67),
  autreOrganisation: situation("intrus", 13, "0001", "PENDING", 2500),
};

// --- « Contrôles Ventes » : documents numérotés, réception, envois, archives ----------

const bcc = (n, numero, statut, nom, o = {}) =>
  bonCommande(CTRL, n, { numero, statut, client: CLIENT_CONTROLE, lignes: [ligne(nom, 1, 400)], creeIlYa: 5, ...o });
const blcs = (n, numero, statut, nom, o = {}) =>
  bonLivraison(CTRL, n, { numero, statut, client: CLIENT_CONTROLE, lignes: [[nom, 1, 40]], transporteur: `Transport ${nom}`, creeIlYa: 5, ...o });
const archive = (type, n) => ({ archivedPdfKey: `${type}/e2e/archive-${n}.pdf`, archivedPdfStoredAt: DANS(-1), archivedPdfSource: "NEWBI" });
/** Image PNG d'un pixel : signature manuscrite du réceptionnaire. */
export const SIGNATURE_RECEPTION = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export const DOCUMENTS_CONTROLE = {
  // Suppression par l'API de documents numérotés (l'écran ne supprime que les brouillons).
  devisEnAttente: dc(93, { numero: "0033", statut: "PENDING", lignes: [ligne("Devis numéroté en attente", 1, 410)] }),
  devisRefuse: dc(94, { numero: "0034", statut: "CANCELED", lignes: [ligne("Devis numéroté refusé", 1, 420)] }),
  bcConfirme: bcc(41, "0001", "CONFIRMED", "Commande numérotée confirmée"),
  blExpedie: blcs(78, "0009", "SHIPPED", "Livraison numérotée expédiée"),
  // Verrou des documents annulés.
  devisRefuseAModifier: dc(95, { numero: "0035", statut: "CANCELED", lignes: [ligne("Devis refusé à modifier", 1, 430)] }),
  bcAnnuleAModifier: bcc(42, "0002", "CANCELED", "Commande annulée à modifier"),
  // Bon de commande vers facture : statuts proposés à l'écran.
  bcValide: bcc(43, "0003", "VALIDATED", "Commande validée à facturer"),
  bcConfirmeAFacturer: bcc(44, "0004", "CONFIRMED", "Commande confirmée à facturer"),
  // Envoi d'un brouillon par e-mail.
  devisBrouillon: dc(96, { numero: "DRAFT-0002", statut: "DRAFT", lignes: [ligne("Brouillon de devis à envoyer", 1, 440)] }),
  bcBrouillon: bcc(45, "DRAFT-0001", "DRAFT", "Brouillon de commande à envoyer"),
  blBrouillon: blcs(82, "DRAFT-0001", "DRAFT", "Brouillon de livraison à envoyer"),
  // Réception d'un bon de livraison.
  blLivre: blcs(79, "0010", "DELIVERED", "Livraison déjà réceptionnée", { recuPar: "Claire Réception", signatureDataUrl: SIGNATURE_RECEPTION }),
  blReceptionFuture: blcs(80, "0011", "SHIPPED", "Réception datée dans le futur"),
  blReceptionAvantEmission: blcs(81, "0012", "SHIPPED", "Réception datée avant l'émission"),
  blReceptionClavier: blcs(84, "0015", "SHIPPED", "Réception notée au clavier"),
  // Archives PDF.
  devisBrouillonArchive: dc(97, { numero: "DRAFT-0003", statut: "DRAFT", lignes: [ligne("Brouillon à archiver", 1, 450)] }),
  devisArchiveHtml: dc(98, { numero: "0036", statut: "PENDING", lignes: [ligne("Archive qui n'est pas un PDF", 1, 460)] }),
  devisAccepteArchive: dc(99, { numero: "0037", statut: "COMPLETED", lignes: [ligne("Devis accepté archivé", 1, 470)], ...archive("quotes", 99) }),
  blLivreArchive: blcs(83, "0013", "DELIVERED", "Livraison archivée", { recuPar: "Hugo Archive", ...archive("deliveryNotes", 83) }),
  // Transporteur et numéro de suivi réels.
  blTransporteur: blcs(77, "0014", "PENDING", "Livraison au transporteur réel"),
};

/** Paramètres des devis de « Ventes » (lus par ses membres, jamais par une autre entreprise). */
export const PARAMETRES_DEVIS_VENTES = {
  _id: oid("devisVentes", 300),
  documentType: "QUOTE",
  defaultHeaderNotes: "Notes d'en-tête réservées à Ventes",
  defaultFooterNotes: "",
  defaultTermsAndConditions: CGV_DEVIS,
  defaultTermsAndConditionsLinkTitle: "Conditions générales",
  defaultTermsAndConditionsLink: "https://ventes.e2e.test/cgv",
  workspaceId: COMPTES.ventes.organisation._id,
  createdBy: COMPTES.ventes.utilisateur._id,
  createdAt: DANS(-30),
  updatedAt: DANS(-30),
};

// --- Espace sans abonnement ---------------------------------------------------------

const de = (n, o) => devis(EXPIREE, n, { client: CLIENT_EXPIREE, creeIlYa: 5, ...o });
const DEVIS_EXPIREE_ACCEPTE = de(121, { numero: "0002", statut: "COMPLETED", lignes: [ligne("Devis accepté en lecture seule", 1, 800)] });
export const DOCUMENTS_EXPIREE = {
  enAttente: de(120, { numero: "0001", statut: "PENDING", lignes: [ligne("Devis en attente en lecture seule", 1, 600)] }),
  accepte: DEVIS_EXPIREE_ACCEPTE,
  bl: bonLivraison(EXPIREE, 60, {
    numero: "0001",
    statut: "PENDING",
    client: CLIENT_EXPIREE,
    lignes: [["Livraison en lecture seule", 1, 800]],
    sourceQuote: DEVIS_EXPIREE_ACCEPTE._id,
    transporteur: "Transport lecture seule",
    creeIlYa: 5,
  }),
};

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesDevisBcBl() {
  const F = FACTURATION_CONTROLE;
  return {
    clients: [...Object.values(CLIENTS_VENTES), CLIENT_CONTROLE, CLIENT_EXPIREE].map(enBaseClient),
    quotes: [
      ...Object.values(DEVIS_VENTES),
      ...Object.values(DEVIS_FREELANCE),
      ...DEVIS_VOLUME,
      DEVIS_VOLUME_BROUILLON,
      DEVIS_VOLUME_SIGNATURE,
      LIENS_VENTES.devis,
      LIENS_VENTES.devisPdfEnCache,
      ...Object.values(DEVIS_SIGNATURE),
      ...[F.dejaFacture, F.deuxBl, F.autoliquide, F.attenteAccepter, F.attenteRefuser, F.acompteBc],
      ...[F.repartitionNegative, F.repartitionNulle, F.repartitionDouble, F.repartitionMoitie, F.concurrentLie, F.concurrentConversion],
      SITUATION_CONTROLE.devis,
      ...Object.values(DOCUMENTS_CONTROLE).filter((d) => d._id.toHexString().startsWith("e2e8b")),
      DOCUMENTS_EXPIREE.enAttente,
      DOCUMENTS_EXPIREE.accepte,
    ],
    purchaseorders: [...Object.values(BC_VENTES), ...BC_VOLUME, LIENS_VENTES.bc, ...Object.values(DOCUMENTS_CONTROLE).filter((d) => d._id.toHexString().startsWith("e2e9a"))],
    deliverynotes: [
      ...Object.values(BL_VENTES),
      ...BL_VOLUME,
      LIENS_VENTES.bl,
      ...[F.blDejaFacture, F.blPremier, F.blSecond, F.blAutoliquide, F.blAttenteAccepter, F.blAttenteRefuser, F.blConcurrent],
      ...Object.values(DOCUMENTS_CONTROLE).filter((d) => d._id.toHexString().startsWith("e2eaa")),
      DOCUMENTS_EXPIREE.bl,
    ],
    invoices: [
      FACTURE_VENTES,
      LIENS_VENTES.factureDevis,
      LIENS_VENTES.factureBc,
      LIENS_VENTES.factureBl,
      F.factureDejaFaite,
      SITUATION_CONTROLE.annulee,
      SITUATION_CONTROLE.brouillon,
      SITUATION_CONTROLE.autreOrganisation,
    ],
    signaturerequests: [
      ...SIGNATURES_FREELANCE,
      ...SIGNATURES_VOLUME,
      ...SIGNATURES_VENTES,
      ...Object.values(SIGNATURES_CIBLES),
      ...Object.values(SIGNATURES_CONTROLE),
    ],
    quotetemplates: [...MODELES_FREELANCE, MODELE_VENTES, MODELE_DEVIS_A_SUPPRIMER],
    purchaseordertemplates: [MODELE_BC_VENTES],
    imported_quotes: Object.values(DEVIS_IMPORTES),
    imported_purchase_orders: Object.values(BC_IMPORTES),
    organizationRole: Object.values(ROLES_VENTES),
    sharedfolders: Object.values(DOSSIERS_VENTES),
    documentautomations: Object.values(AUTOMATISATIONS_VENTES),
    documentsettings: [PARAMETRES_DEVIS_VENTES],
  };
}
