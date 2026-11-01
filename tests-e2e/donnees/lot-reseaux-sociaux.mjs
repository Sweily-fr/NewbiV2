/**
 * Données du lot « collaboration » : Posts réseaux sociaux (comptes
 * connectés, posts programmés depuis le kanban, médias, parcours de
 * connexion OAuth).
 *
 * Espace « Réseaux » (comptes 64 à 69, comptes-collaboration.mjs) : un
 * membre par rôle (Membre, Éditeur, Comptable, Administrateur), et une autre
 * entreprise « Autre Agence » avec ses propres comptes et posts.
 * Tableaux, colonnes et cartes à part (jamais ceux du kanban) : un tableau
 * ouvert à tout l'espace, un tableau restreint au propriétaire.
 *
 * Les publications ne partent jamais en CI (ni Zernio ni appli directe
 * configurés) : les écritures refusées le sont avant toute création.
 */
import { DANS, MAINTENANT, oid } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot } from "./comptes-collaboration.mjs";

export const COMPTES_RESEAUX = {
  proprietaire: compteLot(64, { email: "reseaux@e2e.test", name: "Rose Réseaux", espace: "Réseaux Test SASU" }),
  autre: compteLot(68, { email: "autre-agence@e2e.test", name: "Axel Agence", espace: "Autre Agence SAS" }),
};

export const MEMBRES_RESEAUX = {
  membre: membreLot(65, { email: "reseaux-membre@e2e.test", name: "Malo Membre", de: COMPTES_RESEAUX.proprietaire, role: "viewer" }),
  editeur: membreLot(66, { email: "reseaux-editeur@e2e.test", name: "Élie Éditeur", de: COMPTES_RESEAUX.proprietaire, role: "member" }),
  comptable: membreLot(67, { email: "reseaux-comptable@e2e.test", name: "Cléo Comptable", de: COMPTES_RESEAUX.proprietaire, role: "accountant" }),
  admin: membreLot(69, { email: "reseaux-admin@e2e.test", name: "Adèle Administratrice", de: COMPTES_RESEAUX.proprietaire, role: "admin" }),
};

const ORG = COMPTES_RESEAUX.proprietaire.organisation._id;
const PROPRIO = COMPTES_RESEAUX.proprietaire.utilisateur._id;
const ORG_AUTRE = COMPTES_RESEAUX.autre.organisation._id;
const PROPRIO_AUTRE = COMPTES_RESEAUX.autre.utilisateur._id;

const tableau = (n, titre, { workspaceId = ORG, userId = PROPRIO, members = [] } = {}) => ({
  _id: oid("socialDivers", n),
  title: titre,
  description: "",
  clientId: null,
  workspaceId,
  userId,
  templateId: null,
  templateName: null,
  priority: "",
  dueDate: null,
  members,
  category: null,
  emoji: null,
  color: "#5a50ff",
  status: null,
  favoritedBy: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

const colonne = (n, tableauN, titre, { workspaceId = ORG, userId = PROPRIO } = {}) => ({
  _id: oid("socialDivers", n),
  title: titre,
  color: "#6366f1",
  boardId: oid("socialDivers", tableauN),
  order: 0,
  workspaceId,
  userId,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

const carte = (n, tableauN, colonneN, titre, { workspaceId = ORG, userId = PROPRIO, dueDate = DANS(3) } = {}) => ({
  _id: oid("socialDivers", n),
  title: titre,
  description: "",
  status: oid("socialDivers", colonneN).toHexString(),
  priority: "medium",
  tags: [],
  startDate: null,
  dueDate,
  boardId: oid("socialDivers", tableauN),
  columnId: oid("socialDivers", colonneN).toHexString(),
  position: 0,
  checklist: [],
  clientId: null,
  assignedMembers: [],
  linkedTasks: [],
  images: [],
  comments: [],
  activity: [],
  workspaceId,
  userId,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

/** Tableaux : 1 à 9 ; colonnes : 10 à 19 ; cartes : 20 à 39. */
export const TABLEAUX_RESEAUX = {
  ouvert: tableau(1, "Calendrier éditorial"),
  // Restreint au propriétaire : ni l'Éditeur ni le Membre n'y ont accès.
  restreint: tableau(2, "Campagne confidentielle", { members: [PROPRIO] }),
  autre: tableau(3, "Calendrier de l'autre agence", { workspaceId: ORG_AUTRE, userId: PROPRIO_AUTRE }),
};

export const COLONNES_RESEAUX = {
  ouvert: colonne(10, 1, "À publier"),
  restreint: colonne(11, 2, "À publier"),
  autre: colonne(12, 3, "À publier", { workspaceId: ORG_AUTRE, userId: PROPRIO_AUTRE }),
};

export const CARTES_RESEAUX = {
  ouvert: carte(20, 1, 10, "LinkedIn · Lancement de l’offre d’automne"),
  restreint: carte(21, 2, 11, "X · Annonce confidentielle"),
  autre: carte(22, 3, 12, "LinkedIn · Post de l'autre agence", { workspaceId: ORG_AUTRE, userId: PROPRIO_AUTRE }),
};

const compteSocial = (n, platform, username, { workspaceId = ORG, connectedBy = PROPRIO } = {}) => ({
  _id: oid("socialCompte", n),
  workspaceId,
  provider: "zernio",
  platform,
  connector: null,
  externalAccountId: `e2e-${platform}-${n}`,
  username,
  displayName: username,
  avatarUrl: null,
  status: "active",
  connectedBy,
  lastSyncedAt: MAINTENANT,
  deletedAt: null,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

export const COMPTES_SOCIAUX = {
  linkedin: compteSocial(1, "linkedin", "reseaux-test"),
  x: compteSocial(2, "twitter", "reseaux_test"),
  autre: compteSocial(3, "linkedin", "autre-agence", { workspaceId: ORG_AUTRE, connectedBy: PROPRIO_AUTRE }),
};

const media = (n, { workspaceId = ORG, createdBy = PROPRIO } = {}) => ({
  _id: oid("socialMedia", n),
  workspaceId,
  createdBy,
  provider: "newbi",
  kind: "image",
  status: "ready",
  url: `https://fichiers.e2e.invalid/social-media/${n}.jpg`,
  key: `social-media/e2e-${n}.jpg`,
  width: 1080,
  height: 1080,
  contentType: "image/jpeg",
  size: 120_000,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

export const MEDIAS_RESEAUX = {
  image: media(1),
  autre: media(2, { workspaceId: ORG_AUTRE, createdBy: PROPRIO_AUTRE }),
};

const cible = (compte) => ({
  socialAccountId: compte._id,
  platform: compte.platform,
  externalAccountId: compte.externalAccountId,
  username: compte.username,
  displayName: compte.displayName,
  status: "pending",
  provider: "zernio",
});

const post = (n, { carteDoc, compte, contenu, workspaceId = ORG, createdBy = PROPRIO }) => ({
  _id: oid("socialPost", n),
  workspaceId,
  boardId: carteDoc.boardId,
  taskId: carteDoc._id,
  createdBy,
  updatedBy: createdBy,
  provider: "zernio",
  externalPostId: `e2e-post-${n}`,
  idempotencyKey: `e2e-idempotence-${n}`,
  content: contenu,
  media: [],
  targets: [cible(compte)],
  scheduledFor: carteDoc.dueDate,
  timezone: "Europe/Paris",
  status: "scheduled",
  tiktokSettings: null,
  instagramSettings: null,
  facebookSettings: null,
  xRetriedAt: [],
  taskDeletedAt: null,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

export const POSTS_RESEAUX = {
  ouvert: post(1, { carteDoc: CARTES_RESEAUX.ouvert, compte: COMPTES_SOCIAUX.linkedin, contenu: "Lancement de l’offre d’automne : -20 % jusqu’au 30 novembre." }),
  restreint: post(2, { carteDoc: CARTES_RESEAUX.restreint, compte: COMPTES_SOCIAUX.x, contenu: "Annonce confidentielle réservée au propriétaire." }),
  autre: post(3, {
    carteDoc: CARTES_RESEAUX.autre,
    compte: COMPTES_SOCIAUX.autre,
    contenu: "Post confidentiel de l'autre agence.",
    workspaceId: ORG_AUTRE,
    createdBy: PROPRIO_AUTRE,
  }),
};

/**
 * Parcours de connexion en cours (jeton d'état à usage unique, comme
 * connectSocialAccount les crée) : un par test qui le consomme.
 */
const etat = (n, token, { platform = "linkedin", provider = "direct", connector = null, userId = PROPRIO, expiresAt = DANS(1) } = {}) => ({
  _id: oid("socialDivers", 100 + n),
  token,
  workspaceId: ORG,
  userId,
  platform,
  provider,
  connector,
  codeVerifier: null,
  returnTo: "/dashboard/outils/kanban/" + TABLEAUX_RESEAUX.ouvert._id.toHexString(),
  expiresAt,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

export const ETATS_CONNEXION = {
  // Annulé chez le réseau puis rejoué : la seconde fois, refusé.
  rejoue: etat(1, "e2eEtatConnexionRejoueLinkedIn000000000000001"),
  // Retour sur le connecteur d'un autre réseau : refusé.
  autreConnecteur: etat(2, "e2eEtatConnexionInstagramSurX0000000000000002", { platform: "instagram" }),
  // Parcours expiré (Zernio) : refusé, même avec le bon jeton.
  expireZernio: etat(3, "e2eEtatConnexionExpireZernio00000000000000003", { provider: "zernio", expiresAt: DANS(-1) }),
  // Parcours expiré (appli directe) : refusé.
  expireDirect: etat(4, "e2eEtatConnexionExpireDirect00000000000000004", { platform: "twitter", expiresAt: DANS(-1) }),
  // Lancé par l'Éditeur, qui n'a pas le droit « Applications et banques » : refusé au retour.
  sansDroitZernio: etat(5, "e2eEtatConnexionSansDroitZernio000000000000005", {
    provider: "zernio",
    userId: MEMBRES_RESEAUX.editeur.utilisateur._id,
  }),
  sansDroitDirect: etat(6, "e2eEtatConnexionSansDroitDirect000000000000006", {
    platform: "twitter",
    userId: MEMBRES_RESEAUX.editeur.utilisateur._id,
  }),
};

/** Documents à écrire en base, par collection. */
export function donneesReseauxSociaux() {
  return {
    ...docsComptesLot({
      comptes: Object.values(COMPTES_RESEAUX),
      membres: Object.values(MEMBRES_RESEAUX),
    }),
    boards: Object.values(TABLEAUX_RESEAUX),
    columns: Object.values(COLONNES_RESEAUX),
    tasks: Object.values(CARTES_RESEAUX),
    socialaccounts: Object.values(COMPTES_SOCIAUX),
    socialpostmedias: Object.values(MEDIAS_RESEAUX),
    socialposts: Object.values(POSTS_RESEAUX),
    socialconnectstates: Object.values(ETATS_CONNEXION),
  };
}
