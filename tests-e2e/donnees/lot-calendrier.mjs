/**
 * Données du lot « collaboration » : Calendrier (événements privés, membres
 * assignés, agendas connectés, webhooks, connexion Gmail).
 *
 * Espace « Agenda » à part (comptes 20 à 39 de comptes-collaboration.mjs) :
 * un membre par rôle et des rôles personnalisés. Une donnée par action qui
 * modifie : un test qui échoue (défaut connu) ne touche jamais la donnée
 * d'un autre.
 */
import { COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot, roleLot } from "./comptes-collaboration.mjs";

/* ------------------------------------------------------------------ */
/* Comptes                                                             */
/* ------------------------------------------------------------------ */

const AGENDA = compteLot(20, { email: "agenda@e2e.test", name: "Iris Agenda", espace: "Agenda Test SASU" });
// Espace sans abonnement : lecture seule (mutations refusées, déconnexion permise).
const AGENDA_LECTURE = compteLot(29, {
  email: "agenda-lecture-seule@e2e.test",
  name: "Léo Lecture",
  espace: "Agenda Lecture Seule SASU",
  abonnement: null,
});

/** Rôles personnalisés de l'espace « Agenda ». */
export const ROLES_AGENDA = {
  // Calendrier en écriture, sans factures, banque, prévision ni analytiques.
  sansFactures: roleLot(20, {
    de: AGENDA,
    name: "Agenda sans factures",
    description: "Calendrier en écriture, rien d'autre",
    actions: { calendar: ["view", "create", "edit"] },
  }),
  // Calendrier en lecture seule.
  lecture: roleLot(21, {
    de: AGENDA,
    name: "Agenda en lecture",
    description: "Voir le calendrier",
    actions: { calendar: ["view"] },
  }),
  // Aucun accès au calendrier.
  sansAgenda: roleLot(22, {
    de: AGENDA,
    name: "Sans agenda",
    description: "Factures en lecture, pas de calendrier",
    actions: { invoices: ["view"] },
  }),
};

export const MEMBRES_AGENDA = {
  admin: membreLot(21, { email: "agenda-admin@e2e.test", name: "Ada Agenda", de: AGENDA, role: "admin" }),
  editeur: membreLot(22, { email: "agenda-editeur@e2e.test", name: "Eli Agenda", de: AGENDA, role: "member" }),
  membre: membreLot(23, { email: "agenda-membre@e2e.test", name: "Mona Agenda", de: AGENDA, role: "viewer" }),
  sansFactures: membreLot(24, { email: "agenda-sans-factures@e2e.test", name: "Sami Sansfacture", de: AGENDA, role: ROLES_AGENDA.sansFactures.role }),
  lecture: membreLot(25, { email: "agenda-lecture@e2e.test", name: "Lisa Lecture", de: AGENDA, role: ROLES_AGENDA.lecture.role }),
};

export { AGENDA, AGENDA_LECTURE };

/* ------------------------------------------------------------------ */
/* Événements                                                          */
/* ------------------------------------------------------------------ */

const PROPRIO = AGENDA.utilisateur._id;
const ESPACE = AGENDA.organisation._id;

const evenement = (n, titre, champs = {}) => ({
  _id: oid("calEvenement", n),
  title: titre,
  description: "",
  start: DANS(2),
  end: DANS(2),
  allDay: false,
  color: "sky",
  location: "",
  type: "MANUAL",
  source: "newbi",
  visibility: "workspace",
  isReadOnly: false,
  workspaceId: ESPACE,
  userId: PROPRIO,
  assignedMembers: [],
  externalCalendarLinks: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const EVENEMENTS_AGENDA = {
  // Événements privés du gérant : personne d'autre ne les lit, ne les modifie, ne les envoie ni ne les supprime.
  priveLecture: evenement(1, "Bilan privé du gérant", { visibility: "private", description: "Notes personnelles du gérant" }),
  priveModifier: evenement(2, "Entretien privé à modifier", { visibility: "private" }),
  priveSupprimer: evenement(3, "Entretien privé à supprimer", { visibility: "private" }),
  priveEnvoyer: evenement(4, "Entretien privé à envoyer", { visibility: "private" }),
  // Échéance de facture (titre avec client et montant) : cachée sans « Voir » des factures.
  echeanceFacture: evenement(7, "Échéance F-202611-0001 Client Agenda SARL 1 200,00 €", { type: "INVOICE_DUE", color: "amber" }),
  // Événement de l'espace : l'Éditeur y change les membres assignés.
  equipeAssigner: evenement(8, "Réunion de l'espace Agenda"),
  // Événement privé de l'Éditeur lui-même : il le modifie (contrôle positif).
  priveEditeur: evenement(9, "Note privée de l'Éditeur", { visibility: "private", userId: MEMBRES_AGENDA.editeur.utilisateur._id }),
  // Événement de l'espace visible de tous.
  equipeLecture: evenement(10, "Point mensuel de l'espace Agenda", { start: DANS(3), end: DANS(3) }),
  // Espace en lecture seule : un événement à envoyer.
  lectureSeule: evenement(11, "Événement de l'espace en lecture seule", {
    workspaceId: AGENDA_LECTURE.organisation._id,
    userId: AGENDA_LECTURE.utilisateur._id,
  }),
};

/* ------------------------------------------------------------------ */
/* Agendas connectés (jetons factices, jamais utilisés tels quels)     */
/* ------------------------------------------------------------------ */

const connexion = (n, userId, provider, champs = {}) => ({
  _id: oid("calConnexion", n),
  userId,
  provider,
  accessToken: `e2e-jeton-acces-${n}`,
  refreshToken: `e2e-jeton-renouvellement-${n}`,
  tokenExpiresAt: DANS(1),
  calDavUsername: null,
  calDavPassword: null,
  calDavUrl: null,
  selectedCalendars: [{ calendarId: "primary", name: "Agenda principal", color: "#4285f4", enabled: true }],
  status: "active",
  lastSyncAt: null,
  lastSyncError: null,
  syncToken: null,
  autoSync: false,
  webhookChannelId: null,
  webhookResourceId: null,
  webhookExpiration: null,
  graphSubscriptionId: null,
  accountEmail: `agenda-${n}@exemple.test`,
  accountName: `Agenda ${n}`,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

const EDITEUR = MEMBRES_AGENDA.editeur.utilisateur._id;

export const CONNEXIONS = {
  // Agenda Google du gérant : visé par l'Éditeur avec cet identifiant (introuvable pour lui).
  proprietaire: connexion(1, PROPRIO, "google"),
  // Agendas de l'Éditeur, un par tentative d'envoi d'un événement qui ne le regarde pas.
  editeurPrive: connexion(2, EDITEUR, "google"),
  // Webhooks : une connexion par notification (une notification acceptée lancerait une synchro).
  webhookGoogleSansRessource: connexion(4, PROPRIO, "google", {
    webhookChannelId: "e2e-canal-google-sans-ressource",
    webhookResourceId: "e2e-ressource-google-4",
    webhookExpiration: DANS(5),
  }),
  webhookGoogleMauvaiseRessource: connexion(5, PROPRIO, "google", {
    webhookChannelId: "e2e-canal-google-mauvaise-ressource",
    webhookResourceId: "e2e-ressource-google-5",
    webhookExpiration: DANS(5),
  }),
  webhookMicrosoft: connexion(6, PROPRIO, "microsoft", {
    graphSubscriptionId: "e2e-abonnement-microsoft-6",
    webhookExpiration: DANS(2),
  }),
  // Rôle « Agenda en lecture » : sa propre connexion, qu'il ne peut ni régler ni utiliser.
  lecture: connexion(7, MEMBRES_AGENDA.lecture.utilisateur._id, "google"),
  // Espace en lecture seule : synchroniser refusé, déconnecter permis.
  lectureSeule: connexion(8, AGENDA_LECTURE.utilisateur._id, "apple", {
    accessToken: null,
    refreshToken: null,
    calDavUsername: "lecture-seule@icloud.test",
    calDavPassword: "e2e-mot-de-passe-application",
  }),
  lectureSeuleDeconnecter: connexion(9, AGENDA_LECTURE.utilisateur._id, "google"),
};

/* ------------------------------------------------------------------ */
/* Connexions Gmail                                                    */
/* ------------------------------------------------------------------ */

const gmail = (n, userId, champs = {}) => ({
  _id: oid("calDivers", n),
  userId,
  workspaceId: ESPACE,
  accessToken: `e2e-gmail-acces-${n}`,
  refreshToken: `e2e-gmail-renouvellement-${n}`,
  tokenExpiresAt: DANS(1),
  accountEmail: `boite-${n}@gmail.test`,
  accountName: `Boîte ${n}`,
  isActive: true,
  scanPeriodMonths: 3,
  status: "active",
  lastSyncAt: null,
  lastSyncError: null,
  totalEmailsScanned: 0,
  totalInvoicesFound: 0,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const GMAIL = {
  // Boîte du gérant : un autre membre ne peut ni la déconnecter, ni l'analyser, ni la régler.
  proprietaire: gmail(1, PROPRIO),
  // Boîte du « Membre » (lecture seule) : il ne peut pas lancer d'analyse (crée des factures d'achat).
  membre: gmail(2, MEMBRES_AGENDA.membre.utilisateur._id),
};

/* ------------------------------------------------------------------ */

/** Documents à écrire en base, par collection. */
export function donneesCalendrier() {
  const comptes = docsComptesLot({
    comptes: [AGENDA, AGENDA_LECTURE],
    membres: Object.values(MEMBRES_AGENDA),
    roles: Object.values(ROLES_AGENDA),
  });
  return {
    ...comptes,
    events: Object.values(EVENEMENTS_AGENDA),
    calendarconnections: Object.values(CONNEXIONS),
    gmailconnections: Object.values(GMAIL),
  };
}

/** Utilisateur d'une autre entreprise (membres assignés, connexions d'autrui). */
export const INTRUS = COMPTES.intrus;
