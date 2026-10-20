/**
 * Données du lot « collaboration » (kanban, calendrier, transferts, documents
 * partagés, signatures, automatisations de documents).
 *
 * Une donnée par action qui modifie : deux tests ne partagent jamais une
 * donnée qu'ils changent. Les documents à usage « lecture seule » (explorés
 * par plusieurs tests sans les modifier) sont regroupés à part.
 *
 * Identifiants : oid(type, n) avec les types déclarés entre les repères du lot
 * dans base.mjs (préfixes e2e5a à e2e5f, e2e6a à e2e6f). Collections : noms
 * pluralisés par Mongoose (boards, columns, tasks, events, filetransfers,
 * publicboardshares, sharedfolders, shareddocuments, sharedtags,
 * documentautomations, emailsignaturev2, userinviteds).
 */
import { createHmac } from "node:crypto";
import { COMPTES, MEMBRES, DANS, MAINTENANT, oid } from "./base.mjs";
import { SECRET } from "../config.mjs";

const org = (cle) => COMPTES[cle].organisation._id;
const orgHex = (cle) => COMPTES[cle].organisation._id.toHexString();
const user = (cle) => COMPTES[cle].utilisateur._id;
const membre = (cle) => MEMBRES[cle].utilisateur._id;

const COLLAB = org("collab");
const COLLAB_HEX = orgHex("collab");
const PROPRIO = user("collab");

/** Texte piégé (XSS stockée) commun : s'affiche comme du texte, ne s'exécute jamais. */
export const PIEGE = `<img src="x-collab-piege" onerror="window.__xssCollab='execute';document.title='XSS'">texte piégé`;

/* ------------------------------------------------------------------ */
/* Kanban : tableaux, colonnes, tâches                                 */
/* ------------------------------------------------------------------ */

const board = (n, nom, { organisation = "collab", userId, ...champs } = {}) => ({
  _id: oid("tableau", n),
  title: nom,
  description: "",
  clientId: null,
  workspaceId: org(organisation),
  userId: userId || user(organisation),
  templateId: null,
  templateName: null,
  priority: "",
  dueDate: null,
  members: [],
  category: null,
  emoji: null,
  color: "#5a50ff",
  status: null,
  favoritedBy: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

const colonne = (n, boardN, titre, ordre, { organisation = "collab" } = {}) => ({
  _id: oid("colonne", n),
  title: titre,
  color: "#6366f1",
  boardId: oid("tableau", boardN),
  order: ordre,
  workspaceId: org(organisation),
  userId: user(organisation),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

const tache = (n, boardN, colonneN, titre, { organisation = "collab", userId, ...champs } = {}) => ({
  _id: oid("tache", n),
  title: titre,
  description: "",
  status: oid("colonne", colonneN).toHexString(),
  priority: "medium",
  tags: [],
  startDate: null,
  dueDate: DANS(7),
  boardId: oid("tableau", boardN),
  columnId: oid("colonne", colonneN).toHexString(),
  position: 0,
  checklist: [],
  clientId: null,
  assignedMembers: [],
  linkedTasks: [],
  images: [],
  comments: [],
  activity: [],
  claudeWorkingSince: null,
  claudeCodingSince: null,
  workspaceId: org(organisation),
  userId: userId || user(organisation),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

/** Tableaux. `lecture` : exploré (boutons) sans être modifié. Les autres : une cible par action. */
export const TABLEAUX = {
  lecture: board(1, "Projet Alpha (lecture)"),
  xss: board(2, "Tableau piégé"),
  // Cibles d'écriture (sécurité, parcours) : une par action, jamais partagée.
  modifier: board(3, "Tableau à modifier"),
  supprimer: board(4, "Tableau à supprimer"),
  favori: board(5, "Tableau à mettre en favori"),
  colonnes: board(6, "Tableau pour colonnes"),
  taches: board(7, "Tableau pour tâches"),
  partage: board(8, "Tableau partagé publiquement"),
  // Tableau d'une autre entreprise (intrus) : l'intrus y a ses droits, les autres non.
  intrus: board(9, "Tableau de l'intrus", { organisation: "intrus" }),
  // Cibles mutées par l'Éditeur (permis) : séparées de celles que les rôles
  // refusés lisent, pour qu'aucune donnée changée ne soit partagée entre tests.
  editeur: board(10, "Tableau édité par l'Éditeur"),
  favoriEditeur: board(11, "Tableau mis en favori par l'Éditeur"),
};

export const COLONNES = {
  lectureAfaire: colonne(1, 1, "À faire", 0),
  lectureEnCours: colonne(2, 1, "En cours", 1),
  xss: colonne(3, 2, "À faire", 0),
  modifier: colonne(4, 3, "Colonne à modifier", 0),
  supprimer: colonne(5, 3, "Colonne à supprimer", 1),
  reordonner1: colonne(6, 3, "Colonne à réordonner A", 2),
  reordonner2: colonne(7, 3, "Colonne à réordonner B", 3),
  taches: colonne(8, 7, "À faire", 0),
  partage: colonne(9, 8, "À faire", 0),
  intrus: colonne(10, 9, "À faire", 0, { organisation: "intrus" }),
  editeur: colonne(11, 7, "Colonne éditée par l'Éditeur", 5),
};

export const TACHES = {
  lecture1: tache(1, 1, 1, "Préparer la maquette"),
  lecture2: tache(2, 1, 2, "Développer la page d'accueil"),
  // Tâche piégée : titre et description écrits par l'Éditeur, ouverts par les autres.
  xss: tache(3, 2, 3, PIEGE, { userId: membre("collabEditeur"), description: PIEGE, startDate: DANS(1) }),
  modifier: tache(4, 7, 8, "Tâche à modifier"),
  supprimer: tache(5, 7, 8, "Tâche à supprimer"),
  deplacer: tache(6, 7, 8, "Tâche à déplacer"),
  assigner: tache(7, 7, 8, "Tâche à assigner"),
  etiqueter: tache(8, 7, 8, "Tâche à étiqueter"),
  checklist: tache(9, 7, 8, "Tâche avec checklist", {
    checklist: [{ _id: oid("annexeCollab", 1), text: "Premier point", completed: false }],
  }),
  commenter: tache(10, 7, 8, "Tâche à commenter", {
    comments: [
      {
        _id: oid("annexeCollab", 2),
        userId: PROPRIO.toHexString(),
        content: "Commentaire du propriétaire",
        mentions: [],
        images: [],
        isExternal: false,
        createdAt: MAINTENANT,
        updatedAt: MAINTENANT,
      },
    ],
  }),
  minuteur: tache(11, 7, 8, "Tâche avec minuteur"),
  lier: tache(12, 7, 8, "Tâche à lier"),
  lierCible: tache(13, 7, 8, "Autre tâche à lier"),
  partage: tache(14, 8, 9, "Tâche visible sur le lien public", {
    description: "<b>Description riche</b> du lien public",
  }),
  partageXss: tache(15, 8, 9, "Tâche piégée du lien public", { description: PIEGE, startDate: DANS(1) }),
  intrus: tache(16, 9, 10, "Tâche de l'intrus", { organisation: "intrus" }),
  // Cibles mutées par l'Éditeur (permis).
  modifierEditeur: tache(17, 7, 8, "Tâche modifiée par l'Éditeur"),
  deplacerEditeur: tache(18, 7, 8, "Tâche déplacée par l'Éditeur"),
  assignerEditeur: tache(19, 7, 8, "Tâche assignée par l'Éditeur"),
  etiqueterEditeur: tache(20, 7, 8, "Tâche étiquetée par l'Éditeur"),
  checklistEditeur: tache(21, 7, 8, "Checklist par l'Éditeur"),
  commenterEditeur: tache(22, 7, 8, "Commentée par l'Éditeur"),
  minuteurEditeur: tache(23, 7, 8, "Minuteur par l'Éditeur"),
  lierEditeur: tache(24, 7, 8, "Liée par l'Éditeur"),
  lierCibleEditeur: tache(25, 7, 8, "Autre tâche liée par l'Éditeur"),
};

/* ------------------------------------------------------------------ */
/* Partage public d'un tableau                                         */
/* ------------------------------------------------------------------ */

const TOUTES_PERMISSIONS = {
  canViewTasks: true,
  canComment: true,
  canViewComments: true,
  canViewAssignees: true,
  canViewDueDates: true,
  canViewAttachments: true,
};

/** Session de visiteur signée comme boardVisitorSession.js (HMAC-SHA256, base64url). */
function jetonVisiteur(userInvitedId, shareId, { expiresAt, sessionVersion = 0 }) {
  const uid = String(userInvitedId);
  const sid = String(shareId);
  const signature = createHmac("sha256", SECRET)
    .update(`board-visitor-session:v1:${uid}:${sid}:${expiresAt}:${sessionVersion}`)
    .digest("base64url");
  return ["v1", uid, sid, expiresAt, signature].join(".");
}

const ID_PARTAGE_ACTIF = oid("partageTableau", 1);
const ID_VISITEUR = oid("annexeCollab", 10);
const EXP_VISITEUR = MAINTENANT.getTime() + 30 * 86_400_000;

export const PARTAGES = {
  // Lien actif, lecture + commentaires, sans mot de passe.
  actif: {
    _id: ID_PARTAGE_ACTIF,
    token: "e2ecollabtokenactifpublicuniquement000000000000000000000000000a",
    boardId: TABLEAUX.partage._id,
    workspaceId: COLLAB,
    createdBy: PROPRIO,
    name: "Partage de démonstration",
    permissions: { ...TOUTES_PERMISSIONS },
    isActive: true,
    expiresAt: null,
    password: null,
    passwordHash: null,
    passwordHashedAt: null,
    visitors: [
      {
        _id: oid("annexeCollab", 11),
        email: "visiteur@externe.test",
        name: "Val Visiteur",
        firstVisitAt: MAINTENANT,
        lastVisitAt: MAINTENANT,
        visitCount: 1,
      },
    ],
    bannedEmails: [],
    accessRequests: [],
    stats: { totalViews: 1, uniqueVisitors: 1, totalComments: 0 },
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  // Lien expiré : ne doit plus rien donner.
  expire: {
    _id: oid("partageTableau", 2),
    token: "e2ecollabtokenexpirepublicuniquement00000000000000000000000000b",
    boardId: TABLEAUX.partage._id,
    workspaceId: COLLAB,
    createdBy: PROPRIO,
    name: "Partage expiré",
    permissions: { ...TOUTES_PERMISSIONS },
    isActive: true,
    expiresAt: DANS(-1),
    password: null,
    passwordHash: null,
    visitors: [],
    bannedEmails: [],
    accessRequests: [],
    stats: { totalViews: 0, uniqueVisitors: 0, totalComments: 0 },
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  // Lien désactivé (révoqué) : ne doit plus rien donner.
  revoque: {
    _id: oid("partageTableau", 3),
    token: "e2ecollabtokenrevoquepublicuniquement0000000000000000000000000c",
    boardId: TABLEAUX.partage._id,
    workspaceId: COLLAB,
    createdBy: PROPRIO,
    name: "Partage révoqué",
    permissions: { ...TOUTES_PERMISSIONS },
    isActive: false,
    expiresAt: null,
    password: null,
    passwordHash: null,
    visitors: [],
    bannedEmails: [],
    accessRequests: [],
    stats: { totalViews: 0, uniqueVisitors: 0, totalComments: 0 },
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
};

/** Visiteur confirmé (userInvited) et sa session, pour ouvrir le lien public en CI. */
export const VISITEUR = {
  userInvited: {
    _id: ID_VISITEUR,
    email: "visiteur@externe.test",
    password: null,
    requiresPassword: false,
    firstName: "Val",
    lastName: "Visiteur",
    name: "Val Visiteur",
    emailVerifiedAt: MAINTENANT,
    sessionVersion: 0,
    boardsAccess: [
      {
        _id: oid("annexeCollab", 12),
        boardId: TABLEAUX.partage._id,
        shareId: ID_PARTAGE_ACTIF,
        workspaceId: COLLAB,
        grantedAt: MAINTENANT,
        lastVisitAt: MAINTENANT,
        visitCount: 1,
        status: "active",
      },
    ],
    stats: {},
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  token: PARTAGES.actif.token,
  cleStockage: `invited_session_${PARTAGES.actif.token}`,
  get sessionToken() {
    return jetonVisiteur(ID_VISITEUR, ID_PARTAGE_ACTIF, { expiresAt: EXP_VISITEUR });
  },
};

/* ------------------------------------------------------------------ */
/* Calendrier : événements                                             */
/* ------------------------------------------------------------------ */

const evenement = (n, titre, { organisation = "collab", userId, ...champs } = {}) => ({
  _id: oid("evenement", n),
  title: titre,
  description: "",
  start: DANS(1),
  end: DANS(1),
  allDay: false,
  color: "sky",
  location: "",
  type: "MANUAL",
  source: "newbi",
  visibility: "workspace",
  isReadOnly: false,
  workspaceId: org(organisation),
  userId: userId || user(organisation),
  assignedMembers: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const EVENEMENTS = {
  lecture: evenement(1, "Réunion d'équipe"),
  modifier: evenement(2, "Événement à modifier"),
  modifierEditeur: evenement(6, "Événement modifié par l'Éditeur"),
  supprimer: evenement(3, "Événement à supprimer"),
  // Événement externe (synchronisé) : non modifiable même par le propriétaire.
  externe: evenement(4, "Événement Google", { source: "google", isReadOnly: true, externalEventId: "ext-123" }),
  intrus: evenement(5, "Événement de l'intrus", { organisation: "intrus" }),
};

/* ------------------------------------------------------------------ */
/* Transferts de fichiers (stockage R2 absent en CI : semés en base)   */
/* ------------------------------------------------------------------ */

const fichierTransfert = (nom) => ({
  originalName: nom,
  displayName: nom,
  fileName: `stocke-${nom}`,
  filePath: `transfers/${nom}`,
  r2Key: `transfers/${nom}`,
  mimeType: "application/pdf",
  size: 2048,
  storageType: "r2",
  fileId: `fid-${nom}`,
  uploadedAt: MAINTENANT,
});

const transfert = (n, { organisation = "collab", userId, ...champs } = {}) => ({
  _id: oid("transfert", n),
  userId: userId || user(organisation),
  // workspaceId est une chaîne dans le modèle FileTransfer.
  workspaceId: orgHex(organisation),
  title: "Transfert",
  files: [fichierTransfert("document.pdf")],
  totalSize: 2048,
  downloadLink: `dl-${n}-${Math.random().toString(16).slice(2, 10)}`,
  expiryDate: DANS(7),
  downloadCount: 0,
  isPaymentRequired: false,
  paymentAmount: 0,
  paymentCurrency: "EUR",
  isPaid: false,
  status: "active",
  recipientEmail: "",
  notifyOnDownload: false,
  passwordProtected: false,
  allowPreview: true,
  hasWatermark: false,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const TRANSFERTS = {
  actif: transfert(1, {
    title: "Dossier client",
    shareLink: "e2ecollabtransfertactif0000000000",
    accessKey: "e2eclefactif00000000000000000000",
  }),
  renommer: transfert(2, {
    title: "Transfert à renommer",
    shareLink: "e2ecollabtransfertrenommer0000000",
    accessKey: "e2eclefrenommer000000000000000000",
  }),
  supprimer: transfert(3, {
    title: "Transfert à supprimer",
    shareLink: "e2ecollabtransfertsupprimer000000",
    accessKey: "e2eclefsupprimer00000000000000000",
  }),
  expire: transfert(4, {
    title: "Transfert expiré",
    shareLink: "e2ecollabtransfertexpire000000000",
    accessKey: "e2eclefexpire000000000000000000000",
    expiryDate: DANS(-2),
  }),
  supprimeStatut: transfert(5, {
    title: "Transfert déjà supprimé",
    shareLink: "e2ecollabtransfertsupprime0000000",
    accessKey: "e2eclefsupprime00000000000000000",
    status: "deleted",
  }),
  intrus: transfert(6, {
    organisation: "intrus",
    title: "Transfert de l'intrus",
    shareLink: "e2ecollabtransfertintrus000000000",
    accessKey: "e2eclefintrus00000000000000000000",
  }),
  // Cibles des parcours d'interface (renommer, supprimer), distinctes de la sécurité.
  renommerUi: transfert(7, {
    title: "Transfert à renommer (UI)",
    shareLink: "e2ecollabtransfertrenommerui00000",
    accessKey: "e2eclefrenommerui0000000000000000",
  }),
  supprimerUi: transfert(8, {
    title: "Transfert à supprimer (UI)",
    shareLink: "e2ecollabtransfertsupprimerui0000",
    accessKey: "e2eclefsupprimerui000000000000000",
  }),
};

/* ------------------------------------------------------------------ */
/* Documents partagés : dossiers, documents, étiquettes, automatisations */
/* ------------------------------------------------------------------ */

const dossier = (n, nom, { organisation = "collab", createdBy, ...champs } = {}) => ({
  _id: oid("dossierPartage", n),
  name: nom,
  description: "",
  workspaceId: org(organisation),
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
  createdBy: createdBy || user(organisation),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

const document = (n, nom, { organisation = "collab", uploadedBy, folderId = null, ...champs } = {}) => ({
  _id: oid("documentPartage", n),
  name: nom,
  originalName: nom,
  description: "",
  fileUrl: `https://fichiers.e2e.invalid/${nom}`,
  fileKey: `shared/${nom}`,
  mimeType: "application/pdf",
  fileSize: 4096,
  fileExtension: "pdf",
  workspaceId: org(organisation),
  folderId,
  uploadedBy: uploadedBy || user(organisation),
  uploadedByName: "Noa Collab",
  status: "pending",
  isSharedWithAccountant: true,
  tags: [],
  comments: [],
  trashedAt: null,
  originalFolderId: null,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const DOSSIERS = {
  lecture: dossier(1, "Factures 2026"),
  renommer: dossier(2, "Dossier à renommer"),
  renommerEditeur: dossier(7, "Dossier renommé par l'Éditeur"),
  supprimer: dossier(3, "Dossier à supprimer"),
  // Cible de l'automatisation et des documents.
  classement: dossier(4, "Dossier de classement"),
  // Dossier actif (non corbeille) pour éprouver permanentlyDeleteFolders.
  suppressionDefinitive: dossier(5, "Dossier actif à supprimer définitivement"),
  intrus: dossier(6, "Dossier de l'intrus", { organisation: "intrus" }),
};

export const DOCUMENTS = {
  lecture: document(1, "contrat.pdf", { folderId: DOSSIERS.lecture._id, status: "classified" }),
  modifier: document(2, "a-renommer.pdf"),
  modifierEditeur: document(7, "a-renommer-editeur.pdf"),
  supprimer: document(3, "a-supprimer.pdf"),
  deplacer: document(4, "a-deplacer.pdf"),
  deplacerEditeur: document(8, "a-deplacer-editeur.pdf"),
  // Document déjà en corbeille : cible de restauration / suppression définitive.
  corbeille: document(5, "en-corbeille.pdf", { trashedAt: DANS(-1), originalFolderId: null }),
  intrus: document(6, "intrus.pdf", { organisation: "intrus" }),
};

export const TAGS = {
  lecture: {
    _id: oid("tagDocument", 1),
    workspaceId: COLLAB,
    name: "Urgent",
    color: "#ef4444",
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  modifier: {
    _id: oid("tagDocument", 2),
    workspaceId: COLLAB,
    name: "À renommer",
    color: "#3b82f6",
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  modifierEditeur: {
    _id: oid("tagDocument", 4),
    workspaceId: COLLAB,
    name: "À renommer (éditeur)",
    color: "#3b82f6",
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
  supprimer: {
    _id: oid("tagDocument", 3),
    workspaceId: COLLAB,
    name: "À supprimer",
    color: "#10b981",
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  },
};

const automatisationDoc = (n, nom, { organisation = "collab", createdBy, folderId, ...champs } = {}) => ({
  _id: oid("automatisationDocument", n),
  name: nom,
  description: "",
  workspaceId: org(organisation),
  createdBy: createdBy || user(organisation),
  triggerType: "INVOICE_PAID",
  actionConfig: {
    targetFolderId: folderId || DOSSIERS.classement._id,
    createSubfolder: false,
    subfolderPattern: "year",
    filterYear: null,
    filterClientId: null,
    filterClientName: null,
    documentNaming: "{documentType}-{number}-{clientName}",
    tags: [],
    documentStatus: "classified",
  },
  isActive: true,
  stats: { totalExecutions: 0, lastExecutedAt: null, lastDocumentId: null, failedExecutions: 0 },
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const AUTOMATISATIONS_DOC = {
  lecture: automatisationDoc(4, "Automatisation (lecture)"),
  modifier: automatisationDoc(1, "Factures payées vers Classement"),
  modifierEditeur: automatisationDoc(5, "Automatisation modifiée par l'Éditeur", { triggerType: "QUOTE_SENT" }),
  supprimer: automatisationDoc(2, "Automatisation à supprimer", { triggerType: "QUOTE_ACCEPTED" }),
  intrus: automatisationDoc(3, "Automatisation de l'intrus", {
    organisation: "intrus",
    folderId: DOSSIERS.intrus._id,
  }),
};

// Dossier de classement pour l'organisation freelance (cible des automatisations de l'offre).
export const DOSSIER_FREELANCE = dossier(10, "Classement freelance", { organisation: "collabFreelance" });
// Cinq automatisations chez le freelance (plafond de l'offre = 5) : la 6e doit être refusée par l'API.
export const AUTOMATISATIONS_FREELANCE = Array.from({ length: 5 }, (_, i) =>
  automatisationDoc(20 + i, `Automatisation freelance ${i + 1}`, {
    organisation: "collabFreelance",
    folderId: DOSSIER_FREELANCE._id,
    triggerType: ["INVOICE_PAID", "INVOICE_SENT", "QUOTE_ACCEPTED", "QUOTE_SENT", "CREDIT_NOTE_CREATED"][i],
  }),
);

/* ------------------------------------------------------------------ */
/* Signatures de mail (V2 : personnelles, scope createdBy + workspace) */
/* ------------------------------------------------------------------ */

const signature = (n, nom, { organisation = "collab", createdBy, ...champs } = {}) => ({
  _id: oid("signatureMail", n),
  name: nom,
  isDefault: false,
  schemaVersion: 2,
  templateId: "newbi",
  savedTemplateId: null,
  identity: { firstName: "Noa", lastName: "Collab", jobTitle: "Gérant", department: "", company: "Collab Test SASU", tagline: "" },
  contact: { email: "noa@collab.test", phone: "+33123456789", mobile: "", website: "https://collab.test", address: "" },
  social: [],
  images: { photo: null, logo: null, banner: null },
  cta: { enabled: false, label: "", url: "", backgroundColor: "", textColor: "" },
  banner: { enabled: false, url: "", alt: "" },
  disclaimer: { enabled: false, text: "" },
  style: {},
  memberUserId: null,
  migratedFrom: null,
  workspaceId: org(organisation),
  createdBy: createdBy || user(organisation),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const SIGNATURES = {
  // Signature du propriétaire : lecture, modèle d'édition, cible de modification.
  proprietaire: signature(1, "Signature du gérant", { isDefault: true }),
  supprimer: signature(2, "Signature à supprimer"),
  // Signature d'un AUTRE membre (l'Éditeur) : personne d'autre ne doit la lire ni la modifier.
  editeur: signature(3, "Signature de l'éditeur", { createdBy: membre("collabEditeur") }),
  intrus: signature(4, "Signature de l'intrus", { organisation: "intrus" }),
};

/* ------------------------------------------------------------------ */

/** Documents à écrire en base, par collection. */
export function donneesCollaboration() {
  return {
    boards: Object.values(TABLEAUX),
    columns: Object.values(COLONNES),
    tasks: Object.values(TACHES),
    publicboardshares: Object.values(PARTAGES),
    userinviteds: [VISITEUR.userInvited],
    events: Object.values(EVENEMENTS),
    filetransfers: Object.values(TRANSFERTS),
    sharedfolders: [...Object.values(DOSSIERS), DOSSIER_FREELANCE],
    shareddocuments: Object.values(DOCUMENTS),
    sharedtags: Object.values(TAGS),
    documentautomations: [...Object.values(AUTOMATISATIONS_DOC), ...AUTOMATISATIONS_FREELANCE],
    emailsignaturev2: Object.values(SIGNATURES),
  };
}
