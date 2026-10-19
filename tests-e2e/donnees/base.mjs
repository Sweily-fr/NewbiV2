/**
 * Socle des données de test : deux comptes, chacun propriétaire d'une
 * organisation complète (informations d'entreprise remplies, abonnement
 * actif, sessions illimitées), avec sa session et ses clients.
 *   - « Atelier » : organisation vide où les tests créent leurs factures ;
 *   - « Liste » : organisation pré-remplie de factures, devis, bons de
 *     commande et bons de livraison dans chaque état, pour les tests des
 *     listes et des actions (voir *-liste.mjs) ;
 *   - « Avoirs » : organisation dont les factures servent à créer des avoirs
 *     (voir avoirs.mjs), à part pour ne pas changer la liste des factures.
 * Mêmes formes qu'en prod : collections Better Auth au singulier, collections
 * de l'API au pluriel.
 */
import { ObjectId } from "mongodb";
import {
  SESSION_TOKEN,
  SESSION_TOKEN_AVOIRS,
  SESSION_TOKEN_CLIENTS,
  SESSION_TOKEN_EDITEUR,
  SESSION_TOKEN_FREELANCE,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_LECTEUR,
  SESSION_TOKEN_LISTE,
  SESSION_TOKEN_REGLAGES,
} from "../config.mjs";

// Préfixe hexadécimal par type : un id de test se reconnaît d'un coup d'œil.
const PREFIXES = {
  utilisateur: "e2e1",
  organisation: "e2e2",
  client: "e2e3",
  facture: "e2e4",
  session: "e2e5",
  membre: "e2e6",
  abonnement: "e2e7",
  devis: "e2e8",
  bonCommande: "e2e9",
  bonLivraison: "e2ea",
  avoir: "e2eb",
  listeClients: "e2ec",
  segment: "e2ed",
  champClient: "e2ee",
  automatisation: "e2ef",
};

export function oid(type, n) {
  const prefixe = PREFIXES[type];
  if (!prefixe) throw new Error(`[e2e] type d'identifiant inconnu : ${type}`);
  return new ObjectId(prefixe + String(n).padStart(24 - prefixe.length, "0"));
}

export const MAINTENANT = new Date();
export const DANS = (jours) => new Date(MAINTENANT.getTime() + jours * 86_400_000);

function organisation(n, nom) {
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
    siret: "98765432100012",
    legalForm: "SASU",
    vatNumber: "FR98765432100",
    capitalSocial: "10000",
    rcs: "Paris B 987 654 321",
  };
}

export const COMPTES = {
  atelier: {
    utilisateur: { _id: oid("utilisateur", 1), email: "proprietaire@e2e.test", name: "Camille Test" },
    organisation: organisation(1, "Atelier Test SASU"),
    token: SESSION_TOKEN,
  },
  liste: {
    utilisateur: { _id: oid("utilisateur", 2), email: "liste@e2e.test", name: "Dominique Liste" },
    organisation: organisation(2, "Liste Test SASU"),
    token: SESSION_TOKEN_LISTE,
  },
  avoirs: {
    utilisateur: { _id: oid("utilisateur", 3), email: "avoirs@e2e.test", name: "Alex Avoirs" },
    organisation: organisation(3, "Avoirs Test SASU"),
    token: SESSION_TOKEN_AVOIRS,
  },
  // Contacts, listes, segments et champs personnalisés (voir clients.mjs).
  clients: {
    utilisateur: { _id: oid("utilisateur", 4), email: "clients@e2e.test", name: "Morgan Clients" },
    organisation: organisation(4, "Clients Test SASU"),
    token: SESSION_TOKEN_CLIENTS,
  },
  // Une autre entreprise : ses tests vérifient qu'elle n'atteint jamais les
  // données des autres organisations, ni à l'écran ni par l'API.
  intrus: {
    utilisateur: { _id: oid("utilisateur", 5), email: "intrus@e2e.test", name: "Sacha Intrus" },
    organisation: organisation(5, "Intrus Test SASU"),
    token: SESSION_TOKEN_INTRUS,
  },
  // Offre d'entrée : ses plafonds (champs personnalisés, segments…) doivent
  // tenir aussi face à un appel direct à l'API (voir clients/offre.spec.mjs).
  freelance: {
    utilisateur: { _id: oid("utilisateur", 8), email: "freelance@e2e.test", name: "Robin Freelance" },
    organisation: organisation(6, "Freelance Test EI"),
    token: SESSION_TOKEN_FREELANCE,
    plan: "freelance",
  },
  // Configuration de l'espace (champs personnalisés, import, automatisations,
  // paramètres) : ses changements ne touchent aucun autre test.
  reglages: {
    utilisateur: { _id: oid("utilisateur", 9), email: "reglages@e2e.test", name: "Charlie Réglages" },
    organisation: organisation(7, "Réglages Test SASU"),
    token: SESSION_TOKEN_REGLAGES,
  },
};

/**
 * Membres invités dans l'organisation d'un autre compte, avec un rôle
 * limité : leurs tests vérifient qu'aucune action interdite n'est possible,
 * ni à l'écran ni par l'API.
 */
export const MEMBRES = {
  lecteur: {
    utilisateur: { _id: oid("utilisateur", 6), email: "lecteur@e2e.test", name: "Lou Lecteur" },
    de: "clients",
    role: "viewer",
    token: SESSION_TOKEN_LECTEUR,
  },
  editeur: {
    utilisateur: { _id: oid("utilisateur", 7), email: "editeur@e2e.test", name: "Eden Éditeur" },
    de: "clients",
    role: "member",
    token: SESSION_TOKEN_EDITEUR,
  },
};

// Compatibilité : le compte « Atelier » est le compte par défaut des tests.
export const UTILISATEUR = COMPTES.atelier.utilisateur;
export const ORGANISATION = COMPTES.atelier.organisation;

export const CLIENTS = {
  alpha: {
    _id: oid("client", 1),
    organisation: "atelier",
    name: "Entreprise Alpha SAS",
    email: "contact@alpha.test",
    phone: "+33612345678",
    type: "COMPANY",
    siret: "12345678900011",
    vatNumber: "FR12123456789",
    isInternational: false,
    isBlocked: false,
    address: { fullName: "Entreprise Alpha SAS", street: "42 avenue des Champs-Élysées", city: "Paris", postalCode: "75008", country: "France" },
    firstName: "Jean",
    lastName: "Dupont",
  },
  particulier: {
    _id: oid("client", 2),
    organisation: "atelier",
    name: "Paul Durand",
    email: "paul.durand@e2e.test",
    type: "INDIVIDUAL",
    firstName: "Paul",
    lastName: "Durand",
    isInternational: false,
    isBlocked: false,
    address: { fullName: "Paul Durand", street: "5 allée des Tilleuls", city: "Bordeaux", postalCode: "33000", country: "France" },
  },
  gamma: {
    _id: oid("client", 3),
    organisation: "liste",
    name: "Société Gamma",
    email: "compta@gamma.test",
    type: "COMPANY",
    siret: "22233344400017",
    vatNumber: "FR22222333444",
    isInternational: false,
    isBlocked: false,
    address: { fullName: "Société Gamma", street: "10 quai Saint-Antoine", city: "Lyon", postalCode: "69002", country: "France" },
  },
  delta: {
    _id: oid("client", 4),
    organisation: "liste",
    name: "Studio Delta",
    email: "bonjour@delta.test",
    type: "COMPANY",
    siret: "33344455500018",
    vatNumber: "FR33333444555",
    isInternational: false,
    isBlocked: false,
    address: { fullName: "Studio Delta", street: "3 rue Sainte-Catherine", city: "Bordeaux", postalCode: "33000", country: "France" },
  },
  epsilon: {
    _id: oid("client", 5),
    organisation: "avoirs",
    name: "Maison Epsilon",
    email: "achats@epsilon.test",
    type: "COMPANY",
    siret: "44455566600019",
    vatNumber: "FR44444555666",
    isInternational: false,
    isBlocked: false,
    address: { fullName: "Maison Epsilon", street: "8 rue Nationale", city: "Lille", postalCode: "59000", country: "France" },
  },
};

const utilisateurPret = (utilisateur) => ({
  ...utilisateur,
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

const session = (n, token, utilisateur, organisation) => ({
  _id: oid("session", n),
  token,
  userId: utilisateur._id,
  activeOrganizationId: organisation._id.toHexString(),
  expiresAt: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ipAddress: "127.0.0.1",
  userAgent: "playwright-e2e",
});

export function socle() {
  const docs = { user: [], organization: [], member: [], subscription: [], session: [], clients: [] };
  Object.values(COMPTES).forEach(({ utilisateur, organisation: org, token, plan = "pme" }, i) => {
    const n = i + 1;
    docs.user.push(utilisateurPret(utilisateur));
    docs.organization.push({
      ...org,
      logo: null,
      metadata: null,
      organizationType: "business",
      onboardingCompleted: true,
      // 0 = sessions illimitées : rien ne déconnecte le compte de test.
      sessionSettings: { maxSessions: 0 },
      createdAt: MAINTENANT,
    });
    docs.member.push({ _id: oid("membre", n), userId: utilisateur._id, organizationId: org._id, role: "owner", createdAt: MAINTENANT });
    docs.subscription.push({
      _id: oid("abonnement", n),
      referenceId: org._id.toHexString(),
      plan,
      status: "active",
      periodStart: DANS(-1),
      periodEnd: DANS(30),
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    });
    docs.session.push(session(n, token, utilisateur, org));
  });
  // Membres invités : pas d'organisation à eux, une session dans celle qui les invite.
  Object.values(MEMBRES).forEach(({ utilisateur, de, role, token }, i) => {
    const n = 100 + i;
    const org = COMPTES[de].organisation;
    docs.user.push(utilisateurPret(utilisateur));
    docs.member.push({ _id: oid("membre", n), userId: utilisateur._id, organizationId: org._id, role, createdAt: MAINTENANT });
    docs.session.push(session(n, token, utilisateur, org));
  });
  for (const { organisation: cleOrg, ...c } of Object.values(CLIENTS)) {
    const compte = COMPTES[cleOrg];
    docs.clients.push({
      contacts: [],
      notes: [],
      customFields: [],
      activityLog: [],
      assignedMembers: [],
      ...c,
      createdBy: compte.utilisateur._id,
      workspaceId: compte.organisation._id,
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    });
  }
  return docs;
}
