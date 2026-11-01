/**
 * Données du lot « collaboration » : prise de rendez-vous (pages de
 * réservation, types, réservations, rôles).
 * Comptes : donnees/comptes-collaboration.mjs (numéros 40 à 59).
 *
 * Pages en fuseau UTC, ouvertes tous les jours de 08:00 à 18:00, préavis
 * nul : les créneaux ne dépendent ni du jour de la semaine ni de l'heure
 * d'été, et une réservation semée tombe toujours sur un créneau (jour J+k
 * à heure pleine UTC).
 *
 * Collections : booking_pages, appointment_types, bookings (noms fixés par
 * les modèles de l'API), events, clients, user.
 */
import { createHash } from "node:crypto";
import { DANS, MAINTENANT, oid } from "./base.mjs";
import { compteLot, docsComptesLot, membreLot, roleLot } from "./comptes-collaboration.mjs";

/* ------------------------------------------------------------------ */
/* Comptes                                                             */
/* ------------------------------------------------------------------ */

export const COMPTES_RDV = {
  // Espace principal : la page publique réservée par les invités.
  principal: compteLot(40, { email: "rdv@e2e.test", name: "Romane Rendez-vous", espace: "Rendez-vous Test SASU" }),
  // Abonnement échu (annulé, période terminée) : sa page ne doit plus rien montrer.
  echu: compteLot(46, {
    email: "rdv-echu@e2e.test",
    name: "Erwan Échu",
    espace: "Rendez-vous Échu SASU",
    abonnement: { status: "canceled", periodStart: DANS(-40), periodEnd: DANS(-5) },
  }),
  // Saisie des champs de la page et des types (refus et valeurs réelles).
  champs: compteLot(47, { email: "rdv-champs@e2e.test", name: "Chloé Champs", espace: "Rendez-vous Champs SASU" }),
};

// Rôle personnalisé sans la prise de rendez-vous (calendrier et kanban seulement).
export const ROLE_SANS_RDV = roleLot(40, {
  de: COMPTES_RDV.principal,
  name: "Agenda seulement",
  description: "Calendrier et kanban, sans la prise de rendez-vous",
  actions: { calendar: ["view"], kanban: ["view"] },
});

export const MEMBRES_RDV = {
  membre: membreLot(41, { email: "rdv-membre@e2e.test", name: "Mona Membre", de: COMPTES_RDV.principal, role: "viewer" }),
  editeur: membreLot(42, { email: "rdv-editeur@e2e.test", name: "Elio Éditeur", de: COMPTES_RDV.principal, role: "member" }),
  comptable: membreLot(43, { email: "rdv-comptable@e2e.test", name: "Colin Comptable", de: COMPTES_RDV.principal, role: "accountant" }),
  sansRdv: membreLot(44, { email: "rdv-sans-droit@e2e.test", name: "Sacha Agenda", de: COMPTES_RDV.principal, role: ROLE_SANS_RDV.role }),
  // Membre dont la page est désactivée (personne ne se connecte avec).
  pageDesactivee: membreLot(48, {
    email: "rdv-desactivee@e2e.test",
    name: "Dana Désactivée",
    de: COMPTES_RDV.principal,
    role: "viewer",
    session: false,
  }),
};

// Organisateur retiré de l'espace : son compte existe, sa page aussi, plus son appartenance.
const ANCIEN_MEMBRE = { _id: oid("utilisateurLot", 45), email: "rdv-parti@e2e.test", name: "Paul Parti" };

/* ------------------------------------------------------------------ */
/* Pages et types                                                      */
/* ------------------------------------------------------------------ */

const TOUS_LES_JOURS = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  intervals: [{ start: "08:00", end: "18:00" }],
}));

const pageRdv = (n, slug, titre, { compte, userId, ...champs }) => ({
  _id: oid("rdvPage", n),
  workspaceId: compte.organisation._id,
  userId: userId || compte.utilisateur._id,
  slug,
  title: titre,
  description: null,
  accentColor: "#5b50ff",
  avatarUrl: null,
  timezone: "UTC",
  isActive: true,
  availability: TOUS_LES_JOURS,
  dateOverrides: [],
  writeConnectionId: null,
  busyConnectionIds: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const PAGES_RDV = {
  principale: pageRdv(1, "cabinet-romane-e2e", "Romane Rendez-vous", {
    compte: COMPTES_RDV.principal,
    description: "Conseil et accompagnement, sur place ou par téléphone.",
  }),
  // Page du rôle « Membre » (lecture seule) : il la lit, ne la modifie pas.
  membre: pageRdv(2, "mona-membre-e2e", "Mona Membre", { compte: COMPTES_RDV.principal, userId: MEMBRES_RDV.membre.utilisateur._id }),
  // Indisponibles : même 404 que pour une adresse inconnue.
  comptable: pageRdv(3, "colin-comptable-e2e", "Colin Comptable", {
    compte: COMPTES_RDV.principal,
    userId: MEMBRES_RDV.comptable.utilisateur._id,
  }),
  sansRdv: pageRdv(4, "sacha-agenda-e2e", "Sacha Agenda", { compte: COMPTES_RDV.principal, userId: MEMBRES_RDV.sansRdv.utilisateur._id }),
  ancienMembre: pageRdv(5, "paul-parti-e2e", "Paul Parti", { compte: COMPTES_RDV.principal, userId: ANCIEN_MEMBRE._id }),
  echu: pageRdv(6, "erwan-echu-e2e", "Erwan Échu", { compte: COMPTES_RDV.echu }),
  desactivee: pageRdv(7, "page-desactivee-e2e", "Dana Désactivée", {
    compte: COMPTES_RDV.principal,
    userId: MEMBRES_RDV.pageDesactivee.utilisateur._id,
    isActive: false,
  }),
  // Page de l'espace « Champs » : les tests de saisie la modifient (retrouvée par son propriétaire, jamais par son adresse).
  champs: pageRdv(8, "chloe-champs-e2e", "Chloé Champs", { compte: COMPTES_RDV.champs }),
};

const typeRdv = (n, page, slug, nom, { location = { kind: "IN_PERSON", value: "Bât. n° 12, 3 rue de l’Église, 75011 Paris" }, ...champs } = {}) => ({
  _id: oid("rdvType", n),
  workspaceId: page.workspaceId,
  bookingPageId: page._id,
  userId: page.userId,
  slug,
  name: nom,
  description: null,
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  location,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  minNoticeMinutes: 0,
  maxDaysAhead: 30,
  maxPerDay: null,
  color: null,
  position: n,
  isActive: true,
  requirePhone: false,
  priceAmount: null,
  currency: null,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...champs,
});

export const TYPES_RDV = {
  decouverte: typeRdv(1, PAGES_RDV.principale, "decouverte", "Rendez-vous découverte", {
    description: "Premier échange pour faire connaissance.",
  }),
  appel: typeRdv(2, PAGES_RDV.principale, "appel", "Appel de suivi", { location: { kind: "PHONE", value: null } }),
  // Une heure : deux réservations simultanées qui se chevauchent avec des débuts différents.
  seanceLongue: typeRdv(11, PAGES_RDV.principale, "seance-longue", "Séance longue", { durationMinutes: 60 }),
  // Désactivé : absent de la page, son adresse donne la même 404.
  inactif: typeRdv(3, PAGES_RDV.principale, "type-inactif", "Type désactivé", { isActive: false }),
  membre: typeRdv(4, PAGES_RDV.membre, "decouverte", "Découverte avec Mona"),
  comptable: typeRdv(5, PAGES_RDV.comptable, "decouverte", "Découverte avec Colin"),
  sansRdv: typeRdv(6, PAGES_RDV.sansRdv, "decouverte", "Découverte avec Sacha"),
  ancienMembre: typeRdv(7, PAGES_RDV.ancienMembre, "decouverte", "Découverte avec Paul"),
  echu: typeRdv(8, PAGES_RDV.echu, "decouverte", "Découverte avec Erwan"),
  desactivee: typeRdv(9, PAGES_RDV.desactivee, "decouverte", "Découverte (page désactivée)"),
  champs: typeRdv(10, PAGES_RDV.champs, "decouverte", "Découverte avec Chloé"),
};

/* ------------------------------------------------------------------ */
/* Réservations (une par action qui la modifie)                        */
/* ------------------------------------------------------------------ */

/** Jeton de gestion (43 caractères base64url) : ce que contient le lien de l'e-mail. */
const jetonGestion = (nom) => `e2eRdv${nom}`.padEnd(43, "0");
const hacher = (jeton) => createHash("sha256").update(jeton).digest("hex");

/** Instant du jour J+k (UTC) à hh:mm : toujours un créneau des pages UTC. */
export function jourUtc(k, h, m = 0) {
  const jour = new Date(MAINTENANT);
  jour.setUTCHours(0, 0, 0, 0);
  return new Date(jour.getTime() + k * 86_400_000 + (h * 60 + m) * 60_000);
}

const reservation = (n, nom, debut, { type = TYPES_RDV.decouverte, guest = {}, ...champs } = {}) => {
  const jeton = jetonGestion(nom);
  return {
    jeton,
    doc: {
      _id: oid("rdvReservation", n),
      workspaceId: type.workspaceId,
      bookingPageId: type.bookingPageId,
      appointmentTypeId: type._id,
      hostUserId: type.userId,
      startAt: debut,
      endAt: new Date(debut.getTime() + type.durationMinutes * 60_000),
      typeName: type.name,
      durationMinutes: type.durationMinutes,
      location: { ...type.location },
      guest: {
        firstName: "Inès",
        lastName: "Invitée",
        email: `invitee-${n}@e2e.test`,
        phone: null,
        message: null,
        timezone: "Europe/Paris",
        ...guest,
      },
      status: "CONFIRMED",
      cancelledBy: null,
      cancelReason: null,
      cancelledAt: null,
      rescheduleHistory: [],
      manageTokenHash: hacher(jeton),
      manageTokenEncrypted: null,
      eventId: null,
      calendarConnectionId: null,
      externalEventId: null,
      meetingUrl: null,
      meetingWarning: null,
      clientId: null,
      reminders: { h24SentAt: null, h1SentAt: null },
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
      ...champs,
    },
  };
};

// Événement du Calendrier lié à la réservation à annuler : l'annulation doit le retirer.
const ID_EVENEMENT_A_ANNULER = oid("rdvDivers", 1);

export const RESERVATIONS = {
  // Annulée par l'invité depuis sa page de gestion, puis une seconde fois par l'API.
  aAnnuler: reservation(1, "AAnnuler", jourUtc(4, 9), { eventId: ID_EVENEMENT_A_ANNULER }),
  // Annulée par l'API seule (deux appels de suite).
  annulerDeuxFois: reservation(2, "AnnulerDeuxFois", jourUtc(4, 10)),
  dejaAnnulee: reservation(3, "DejaAnnulee", jourUtc(4, 11), {
    status: "CANCELLED",
    cancelledBy: "GUEST",
    cancelledAt: DANS(-1),
  }),
  passee: reservation(4, "Passee", jourUtc(-2, 10)),
  // Déplacée vers le créneau d'« occupante » : refusé (409), rien ne bouge.
  aDeplacer: reservation(5, "ADeplacer", jourUtc(5, 9)),
  occupante: reservation(6, "Occupante", jourUtc(5, 14)),
  // Reprogrammée dans l'interface pendant qu'un autre invité prend le créneau.
  deplacementConcurrent: reservation(7, "DeplacementConcurrent", jourUtc(6, 9)),
  // Réservation du propriétaire : l'Éditeur ne doit ni la lire ni l'annuler.
  proprietaire: reservation(8, "Proprietaire", jourUtc(7, 9), {
    guest: { firstName: "Gaspard", lastName: "Garnier", email: "gaspard.garnier@e2e.test" },
  }),
  // Message piégé laissé par un invité, lu par l'organisateur dans son tableau de bord.
  piegee: reservation(9, "Piegee", jourUtc(7, 11), {
    guest: {
      firstName: "Zoé",
      lastName: "Piège",
      email: "zoe.piege@e2e.test",
      message: `<img src="x-rdv-piege" onerror="window.__xssRdv='execute'">Message piégé`,
    },
  }),
  // Déplacée avec succès par l'invité (API) : l'ancien créneau se libère.
  deplacable: reservation(10, "Deplacable", jourUtc(8, 9)),
};

/** Jeton d'une réservation semée (lien de gestion). */
export const jetonDe = (cle) => RESERVATIONS[cle].jeton;

/** Client déjà présent dans le CRM : une réservation à son adresse ne doit pas modifier sa fiche. */
export const CLIENT_FIDELE = {
  _id: oid("rdvDivers", 10),
  workspaceId: COMPTES_RDV.principal.organisation._id,
  createdBy: COMPTES_RDV.principal.utilisateur._id,
  type: "COMPANY",
  name: "Fidèle & Fils SARL",
  email: "client.fidele@e2e.test",
  phone: "0102030405",
  siret: "12345678900011",
  address: { street: "8 rue des Fidèles", city: "Lyon", postalCode: "69001", country: "France" },
  contacts: [],
  notes: [],
  customFields: [],
  activity: [],
  activityLog: [],
  assignedMembers: [],
  isInternational: false,
  isBlocked: false,
  createdAt: DANS(-30),
  updatedAt: DANS(-30),
};

const evenementLie = {
  _id: ID_EVENEMENT_A_ANNULER,
  title: "Rendez-vous découverte avec Inès Invitée",
  description: "Rendez-vous pris sur votre page Newbi.",
  start: RESERVATIONS.aAnnuler.doc.startAt,
  end: RESERVATIONS.aAnnuler.doc.endAt,
  allDay: false,
  color: "violet",
  location: TYPES_RDV.decouverte.location.value,
  type: "APPOINTMENT",
  source: "newbi",
  visibility: "private",
  isReadOnly: false,
  bookingId: RESERVATIONS.aAnnuler.doc._id,
  workspaceId: COMPTES_RDV.principal.organisation._id,
  userId: COMPTES_RDV.principal.utilisateur._id,
  assignedMembers: [],
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
};

/* ------------------------------------------------------------------ */

/** Documents à écrire en base, par collection. */
export function donneesRendezVous() {
  const comptes = docsComptesLot({
    comptes: Object.values(COMPTES_RDV),
    membres: Object.values(MEMBRES_RDV),
    roles: [ROLE_SANS_RDV],
  });
  comptes.user.push({
    ...ANCIEN_MEMBRE,
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
  return {
    ...comptes,
    booking_pages: Object.values(PAGES_RDV),
    appointment_types: Object.values(TYPES_RDV),
    bookings: Object.values(RESERVATIONS).map((r) => r.doc),
    events: [evenementLie],
    clients: [CLIENT_FIDELE],
  };
}
