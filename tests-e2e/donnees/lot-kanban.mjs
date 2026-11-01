/**
 * Données du lot « collaboration » : Kanban, tableau restreint à une liste
 * de membres et liens publics (données renvoyées au visiteur, permissions du
 * lien, mot de passe).
 *
 * Espace « Kanban Restreint » à part (comptes 1 à 19 de
 * comptes-collaboration.mjs) : un Éditeur absent de la liste du tableau, un
 * Éditeur listé, un Administrateur. Une donnée par action qui modifie : un
 * test qui échoue (défaut connu) ne touche jamais la donnée d'un autre.
 */
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { DANS, MAINTENANT, oid } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot } from "./comptes-collaboration.mjs";
import { SECRET } from "../config.mjs";

/* ------------------------------------------------------------------ */
/* Comptes                                                             */
/* ------------------------------------------------------------------ */

export const KANBAN = compteLot(1, { email: "kanban-restreint@e2e.test", name: "Rita Restreint", espace: "Kanban Restreint SASU" });

export const MEMBRES_KANBAN = {
  // Éditeur absent de la liste du tableau restreint : ne doit rien en lire ni en modifier.
  editeurHors: membreLot(2, { email: "kanban-editeur-hors@e2e.test", name: "Hugo Horsliste", de: KANBAN, role: "member" }),
  // Éditeur listé : lit et modifie le tableau restreint (contrôle).
  editeurListe: membreLot(3, { email: "kanban-editeur-liste@e2e.test", name: "Lina Listée", de: KANBAN, role: "member" }),
  // Administrateur : lit tout tableau restreint (niveau suppression du kanban).
  admin: membreLot(4, { email: "kanban-admin@e2e.test", name: "Adam Admin", de: KANBAN, role: "admin" }),
};

const ESPACE = KANBAN.organisation._id;
const PROPRIO = KANBAN.utilisateur._id;

/* ------------------------------------------------------------------ */
/* Tableaux, colonnes, tâches                                          */
/* ------------------------------------------------------------------ */

const tableau = (n, titre, champs = {}) => ({
  _id: oid("kbTableau", n),
  title: titre,
  description: "",
  clientId: null,
  workspaceId: ESPACE,
  userId: PROPRIO,
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

export const TABLEAUX_KANBAN = {
  // Réservé au propriétaire et à l'Éditeur listé.
  restreint: tableau(1, "Projet RH confidentiel", {
    members: [PROPRIO.toHexString(), MEMBRES_KANBAN.editeurListe.utilisateur._id.toHexString()],
  }),
  // Partagé par un lien public à deux clients (visiteurs).
  partageClients: tableau(2, "Suivi client partagé"),
  // Partagé par un lien protégé par mot de passe.
  protege: tableau(3, "Tableau protégé par mot de passe"),
};

const colonne = (n, tableauCle, titre, ordre) => ({
  _id: oid("kbColonne", n),
  title: titre,
  color: "#6366f1",
  boardId: TABLEAUX_KANBAN[tableauCle]._id,
  order: ordre,
  workspaceId: ESPACE,
  userId: PROPRIO,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

export const COLONNES_KANBAN = {
  restreintAfaire: colonne(1, "restreint", "À faire", 0),
  restreintEnCours: colonne(2, "restreint", "En cours", 1),
  partageAfaire: colonne(3, "partageClients", "À faire", 0),
  protegeAfaire: colonne(4, "protege", "À faire", 0),
};

const tache = (n, tableauCle, colonneCle, titre, champs = {}) => ({
  _id: oid("kbTache", n),
  title: titre,
  description: "",
  status: COLONNES_KANBAN[colonneCle]._id.toHexString(),
  priority: "medium",
  tags: [],
  startDate: null,
  dueDate: DANS(7),
  boardId: TABLEAUX_KANBAN[tableauCle]._id,
  columnId: COLONNES_KANBAN[colonneCle]._id.toHexString(),
  position: n,
  checklist: [],
  clientId: null,
  assignedMembers: [],
  linkedTasks: [],
  images: [],
  comments: [],
  activity: [],
  workspaceId: ESPACE,
  userId: PROPRIO,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

const commentaireInterne = (n, contenu) => ({
  _id: oid("kbDivers", n),
  userId: PROPRIO.toHexString(),
  content: contenu,
  mentions: [],
  images: [],
  isExternal: false,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

/** Visiteurs (clients) d'un lien public. */
export const VISITEURS_KANBAN = {
  claire: { _id: oid("kbDivers", 20), email: "claire.client@externe.test", name: "Claire Client" },
  bruno: { _id: oid("kbDivers", 21), email: "bruno.prospect@externe.test", name: "Bruno Prospect" },
  protege: { _id: oid("kbDivers", 22), email: "pauline.protegee@externe.test", name: "Pauline Protégée" },
};

const commentaireVisiteur = (n, visiteur, contenu) => ({
  _id: oid("kbDivers", n),
  userId: `external_${visiteur.email}`,
  userEmail: visiteur.email,
  userName: visiteur.name,
  content: contenu,
  mentions: [],
  images: [],
  isExternal: true,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

const image = (n, tacheN) => ({
  _id: oid("kbDivers", n),
  key: `${oid("kbTache", tacheN).toHexString()}/${PROPRIO.toHexString()}/description/e2e-${n}.png`,
  url: `https://kanban.e2e.test/${oid("kbTache", tacheN).toHexString()}/e2e-${n}.png`,
  fileName: "maquette.png",
  fileSize: 1200,
  contentType: "image/png",
  uploadedBy: PROPRIO.toHexString(),
  uploadedAt: MAINTENANT,
});

export const TACHES_KANBAN = {
  // Tableau restreint : une tâche lue, une par action qui la modifierait.
  restreintLire: tache(1, "restreint", "restreintAfaire", "Plan de recrutement confidentiel", {
    description: "<p>Salaires prévus : 48 000 € brut</p>",
    comments: [commentaireInterne(1, "Ne pas diffuser avant validation")],
  }),
  restreintModifier: tache(2, "restreint", "restreintAfaire", "Entretien annuel de Marc"),
  restreintDeplacer: tache(3, "restreint", "restreintAfaire", "Revue des contrats"),
  restreintCommenter: tache(4, "restreint", "restreintAfaire", "Plan de formation"),
  restreintListe: tache(5, "restreint", "restreintAfaire", "Tâche modifiée par l'Éditeur listé"),
  // Tableau partagé : commentée par deux visiteurs, minuteur facturé.
  partage: tache(10, "partageClients", "partageAfaire", "Maquette de la page d'accueil", {
    assignedMembers: [MEMBRES_KANBAN.editeurListe.utilisateur._id.toHexString()],
    images: [image(30, 10)],
    timeTracking: { totalSeconds: 5400, isRunning: false, currentStartTime: null, hourlyRate: 85, roundingOption: "none" },
    comments: [
      commentaireVisiteur(31, VISITEURS_KANBAN.claire, "Pouvez-vous agrandir le logo ?"),
      commentaireVisiteur(32, VISITEURS_KANBAN.bruno, "Le bouton d’appel est-il cliquable ?"),
      commentaireInterne(33, "Logo agrandi, à valider"),
    ],
  }),
  protege: tache(20, "protege", "protegeAfaire", "Tâche du tableau protégé"),
};

/* ------------------------------------------------------------------ */
/* Liens publics et visiteurs                                          */
/* ------------------------------------------------------------------ */

export const MOT_DE_PASSE_PARTAGE = "Lien-Protege-e2e-2026";

const TOUTES_PERMISSIONS = {
  canViewTasks: true,
  canComment: true,
  canViewComments: true,
  canViewAssignees: true,
  canViewDueDates: true,
  canViewAttachments: true,
};

const visite = (v, n) => ({ _id: oid("kbDivers", n), email: v.email, name: v.name, firstVisitAt: MAINTENANT, lastVisitAt: MAINTENANT, visitCount: 1 });

const partage = (n, tableauCle, token, champs = {}) => ({
  _id: oid("kbPartage", n),
  token,
  boardId: TABLEAUX_KANBAN[tableauCle]._id,
  workspaceId: ESPACE,
  createdBy: PROPRIO,
  name: `Lien ${n}`,
  permissions: { ...TOUTES_PERMISSIONS },
  isActive: true,
  expiresAt: null,
  password: null,
  passwordHash: null,
  passwordHashedAt: null,
  visitors: [],
  bannedEmails: [],
  accessRequests: [],
  stats: { totalViews: 0, uniqueVisitors: 0, totalComments: 0 },
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const PARTAGES_KANBAN = {
  // Toutes permissions : deux clients y ont commenté.
  clients: partage(1, "partageClients", "e2ekanbanlotliendesclientspublicuniquement00000000000000000001", {
    visitors: [visite(VISITEURS_KANBAN.claire, 50), visite(VISITEURS_KANBAN.bruno, 51)],
  }),
  // Même tableau, permissions réduites : ni commentaires, ni pièces jointes, ni membres.
  reduit: partage(2, "partageClients", "e2ekanbanlotlienpermissionsreduitesuniquement0000000000000000002", {
    permissions: { ...TOUTES_PERMISSIONS, canViewComments: false, canViewAttachments: false, canViewAssignees: false, canComment: false },
    visitors: [visite(VISITEURS_KANBAN.claire, 52)],
  }),
  // Protégé par mot de passe (empreinte bcrypt, jamais renvoyée).
  protege: partage(3, "protege", "e2ekanbanlotlienprotegeparmotdepasseuniquement000000000000000003", {
    passwordHash: bcrypt.hashSync(MOT_DE_PASSE_PARTAGE, 4),
    passwordHashedAt: MAINTENANT,
    visitors: [visite(VISITEURS_KANBAN.protege, 53)],
  }),
};

/** Session de visiteur signée comme boardVisitorSession.js (HMAC-SHA256, base64url). */
function jetonVisiteur(userInvitedId, shareId, expiresAt, sessionVersion = 0) {
  const uid = String(userInvitedId);
  const sid = String(shareId);
  const signature = createHmac("sha256", SECRET).update(`board-visitor-session:v1:${uid}:${sid}:${expiresAt}:${sessionVersion}`).digest("base64url");
  return ["v1", uid, sid, expiresAt, signature].join(".");
}

const EXPIRATION = MAINTENANT.getTime() + 30 * 86_400_000;

const userInvited = (v, acces) => ({
  _id: v._id,
  email: v.email,
  password: null,
  requiresPassword: false,
  firstName: v.name.split(" ")[0],
  lastName: v.name.split(" ").slice(1).join(" "),
  name: v.name,
  emailVerifiedAt: MAINTENANT,
  sessionVersion: 0,
  boardsAccess: acces.map(([partageCle, n]) => ({
    _id: oid("kbDivers", n),
    boardId: PARTAGES_KANBAN[partageCle].boardId,
    shareId: PARTAGES_KANBAN[partageCle]._id,
    workspaceId: ESPACE,
    grantedAt: MAINTENANT,
    lastVisitAt: MAINTENANT,
    visitCount: 1,
    status: "active",
  })),
  stats: {},
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
});

/** Session d'un visiteur sur un lien (jeton à passer à getPublicBoard). */
export const sessionVisiteur = (visiteurCle, partageCle) => jetonVisiteur(VISITEURS_KANBAN[visiteurCle]._id, PARTAGES_KANBAN[partageCle]._id, EXPIRATION);

/* ------------------------------------------------------------------ */

/** Documents à écrire en base, par collection. */
export function donneesKanban() {
  return {
    ...docsComptesLot({ comptes: [KANBAN], membres: Object.values(MEMBRES_KANBAN) }),
    boards: Object.values(TABLEAUX_KANBAN),
    columns: Object.values(COLONNES_KANBAN),
    tasks: Object.values(TACHES_KANBAN),
    publicboardshares: Object.values(PARTAGES_KANBAN),
    userinviteds: [
      userInvited(VISITEURS_KANBAN.claire, [
        ["clients", 40],
        ["reduit", 41],
      ]),
      userInvited(VISITEURS_KANBAN.bruno, [["clients", 42]]),
      userInvited(VISITEURS_KANBAN.protege, [["protege", 43]]),
    ],
  };
}
