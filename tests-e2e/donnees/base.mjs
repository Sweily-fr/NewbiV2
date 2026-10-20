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
  // Chaque lot ajoute ses types entre ses deux repères, avec ses seuls préfixes
  // réservés (un préfixe de 4 caractères prolongé par une lettre, jamais par un chiffre).
  // ── Lot factures (e2e4a à e2e4f, e2eba à e2ebf) ──
  clientFactures: "e2e4a",
  factureLot: "e2e4b",
  recurrence: "e2e4c",
  modeleFacture: "e2e4d",
  importee: "e2e4e",
  diversFactures: "e2e4f",
  avoirLot: "e2eba",
  // ── fin du lot factures ──
  // ── Lot devis-bc-bl (e2e8a à e2e8f, e2e9a à e2e9f, e2eaa à e2eaf) ──
  // ── fin du lot devis-bc-bl ──
  // ── Lot achats-banque (e2e0a à e2e0f, e2eca à e2ecf) ──
  // ── fin du lot achats-banque ──
  // ── Lot parametres-auth (e2e1a à e2e1f, e2e2a à e2e2f) ──
  // Comptes semés par donnees/lot-parametres-auth.mjs (connexion par
  // formulaire, double authentification, mot de passe, appareils…) : chacun
  // a son mot de passe ou ses sessions, qu'un test change ou révoque sans
  // toucher aux autres comptes.
  utilisateurAuth: "e2e1a",
  // Collection `account` de Better Auth (mot de passe haché).
  compteAuth: "e2e1b",
  sessionAuth: "e2e1c",
  membreAuth: "e2e1d",
  invitationAuth: "e2e1e",
  deuxFacteursAuth: "e2e1f",
  espaceAuth: "e2e2a",
  abonnementAuth: "e2e2b",
  roleEspaceAuth: "e2e2c",
  verificationAuth: "e2e2d",
  // ── fin du lot parametres-auth ──
  // ── Lot collaboration (e2e5a à e2e5f, e2e6a à e2e6f) ──
  tableau: "e2e5a",
  colonne: "e2e5b",
  tache: "e2e5c",
  evenement: "e2e5d",
  transfert: "e2e5e",
  partageTableau: "e2e5f",
  dossierPartage: "e2e6a",
  documentPartage: "e2e6b",
  tagDocument: "e2e6c",
  automatisationDocument: "e2e6d",
  signatureMail: "e2e6e",
  // Sous-documents et données annexes (commentaires, étiquettes, codes de visiteur…).
  annexeCollab: "e2e6f",
  // ── fin du lot collaboration ──
  // ── Lot pilotage (e2e7a à e2e7f, e2eda à e2edf) ──
  // ── fin du lot pilotage ──
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
  // Comptes propres à un lot : entre ses deux repères, avec ses numéros réservés.
  // ── Lot factures (organisations et utilisateurs 10 à 14) ──
  // Factures et avoirs dans chaque état, consultés par trois rôles (voir
  // MEMBRES) : propriétaire, « Éditeur » et « Membre » (donnees/lot-factures.mjs).
  factures: {
    utilisateur: { _id: oid("utilisateur", 10), email: "factures@e2e.test", name: "Fanny Factures" },
    organisation: organisation(10, "Factures Test SASU"),
    token: "e2eSessionTokenNewbiFacturesUniquement",
  },
  // Paramètres des factures, relances automatiques, numérotation continue et
  // grand nombre de factures : ses réglages ne touchent aucun autre compte.
  facturesReglages: {
    utilisateur: { _id: oid("utilisateur", 13), email: "factures-reglages@e2e.test", name: "Régis Réglages" },
    organisation: { ...organisation(11, "Réglages Factures Test SASU"), invoiceAutoNumbering: true },
    token: "e2eSessionTokenNewbiFacturesReglagesUniquement",
  },
  // Offre d'entrée réservée aux factures : ses plafonds (modèles, exports)
  // sans gêner le compte « freelance » des autres fonctionnalités.
  facturesOffre: {
    utilisateur: { _id: oid("utilisateur", 14), email: "factures-offre@e2e.test", name: "Odile Offre" },
    // En franchise en base de TVA : mention « TVA non applicable, art. 293 B du CGI ».
    organisation: { ...organisation(12, "Offre Factures Test EI"), vatFranchise: true },
    token: "e2eSessionTokenNewbiFacturesOffreUniquement",
    plan: "freelance",
  },
  // ── fin du lot factures ──
  // ── Lot devis-bc-bl (organisations et utilisateurs 15 à 19) ──
  // ── fin du lot devis-bc-bl ──
  // ── Lot achats-banque (organisations et utilisateurs 20 à 24) ──
  // ── fin du lot achats-banque ──
  // ── Lot parametres-auth (organisations et utilisateurs 25 à 34) ──
  // « Paramètres » : un membre de chaque rôle, des invitations en attente et
  // un rôle personnalisé (voir lot-parametres-auth.mjs). Les tests y lisent
  // et y sont refusés : rien n'y change, la page reste la même pour tous.
  parametres: {
    utilisateur: { _id: oid("utilisateur", 25), email: "parametres@e2e.test", name: "Noa Paramètres" },
    organisation: organisation(25, "Paramètres Test SASU"),
    token: "e2eSessionTokenNewbiParametresUniquement",
  },
  // « Configuration » : les formulaires de l'entreprise (générale, banque,
  // informations légales) et les réglages de session y enregistrent.
  configuration: {
    utilisateur: { _id: oid("utilisateur", 26), email: "configuration@e2e.test", name: "Sam Configuration" },
    organisation: organisation(26, "Configuration Test SASU"),
    token: "e2eSessionTokenNewbiConfigurationUniquement",
  },
  // « Équipe » : invitations, changements de rôle, retraits et rôles
  // personnalisés créés par les tests (un membre ou une invitation par action).
  equipe: {
    utilisateur: { _id: oid("utilisateur", 27), email: "equipe@e2e.test", name: "Ali Équipe" },
    organisation: organisation(27, "Équipe Test SASU"),
    token: "e2eSessionTokenNewbiEquipeUniquement",
  },
  // ── fin du lot parametres-auth ──
  // ── Lot collaboration (organisations et utilisateurs 35 à 39) ──
  // Kanban, calendrier, transferts, documents partagés, signatures (voir lot-collaboration.mjs).
  // Jetons : mêmes valeurs que SESSION_TOKEN_COLLAB* de config.mjs.
  collab: {
    utilisateur: { _id: oid("utilisateur", 35), email: "collab@e2e.test", name: "Noa Collab" },
    organisation: organisation(35, "Collab Test SASU"),
    token: "e2eSessionTokenNewbiCollabUniquement",
  },
  // Offre d'entrée : plafonds du lot (automatisations de documents, taille des transferts).
  collabFreelance: {
    utilisateur: { _id: oid("utilisateur", 36), email: "collab-freelance@e2e.test", name: "Ilan Freelance" },
    organisation: organisation(36, "Collab Freelance EI"),
    token: "e2eSessionTokenNewbiCollabFreelanceUniquement",
    plan: "freelance",
  },
  // ── fin du lot collaboration ──
  // ── Lot pilotage (organisations et utilisateurs 40 à 44) ──
  // ── fin du lot pilotage ──
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
  // Membres propres à un lot : entre ses deux repères.
  // ── Lot factures (utilisateurs 10 à 14) ──
  facturesEditeur: {
    utilisateur: { _id: oid("utilisateur", 11), email: "factures-editeur@e2e.test", name: "Élise Éditrice" },
    de: "factures",
    role: "member",
    token: "e2eSessionTokenNewbiFacturesEditeurUniquement",
  },
  facturesLecteur: {
    utilisateur: { _id: oid("utilisateur", 12), email: "factures-lecteur@e2e.test", name: "Louis Lecteur" },
    de: "factures",
    role: "viewer",
    token: "e2eSessionTokenNewbiFacturesLecteurUniquement",
  },
  // ── fin du lot factures ──
  // ── Lot devis-bc-bl (utilisateurs 15 à 19) ──
  // ── fin du lot devis-bc-bl ──
  // ── Lot achats-banque (utilisateurs 20 à 24) ──
  // ── fin du lot achats-banque ──
  // ── Lot parametres-auth (utilisateurs 25 à 34) ──
  // Un membre par rôle dans « Paramètres » (Administrateur, Éditeur, Membre,
  // Comptable, rôle personnalisé « Recrutement »), un dans « Équipe » avec un
  // rôle personnalisé qui peut inviter et changer les rôles.
  adminParametres: {
    utilisateur: { _id: oid("utilisateur", 28), email: "admin-parametres@e2e.test", name: "Ada Administratrice" },
    de: "parametres",
    role: "admin",
    token: "e2eSessionTokenNewbiAdminParametresUniquement",
  },
  editeurParametres: {
    utilisateur: { _id: oid("utilisateur", 29), email: "editeur-parametres@e2e.test", name: "Élio Éditeur" },
    de: "parametres",
    role: "member",
    token: "e2eSessionTokenNewbiEditeurParametresUniquement",
  },
  membreParametres: {
    utilisateur: { _id: oid("utilisateur", 30), email: "membre-parametres@e2e.test", name: "Mia Membre" },
    de: "parametres",
    role: "viewer",
    token: "e2eSessionTokenNewbiMembreParametresUniquement",
  },
  comptableParametres: {
    utilisateur: { _id: oid("utilisateur", 31), email: "comptable-parametres@e2e.test", name: "Côme Comptable" },
    de: "parametres",
    role: "accountant",
    token: "e2eSessionTokenNewbiComptableParametresUniquement",
  },
  // Rôle personnalisé « Recrutement » (voir lot-parametres-auth.mjs) : voir
  // et inviter des membres, rien d'autre.
  recruteurParametres: {
    utilisateur: { _id: oid("utilisateur", 32), email: "recruteur-parametres@e2e.test", name: "Rémi Recruteur" },
    de: "parametres",
    role: "role_e2e2c0000000000000000001",
    token: "e2eSessionTokenNewbiRecruteurParametresUniquement",
  },
  // Rôle personnalisé « Gestion d'équipe » d'« Équipe » : inviter, changer
  // les rôles et retirer des membres, sans le reste.
  gestionnaireEquipe: {
    utilisateur: { _id: oid("utilisateur", 33), email: "gestion-equipe@e2e.test", name: "Gaël Gestion" },
    de: "equipe",
    role: "role_e2e2c0000000000000000002",
    token: "e2eSessionTokenNewbiGestionEquipeUniquement",
  },
  // ── fin du lot parametres-auth ──
  // ── Lot collaboration (utilisateurs 35 à 39) ──
  collabMembre: {
    utilisateur: { _id: oid("utilisateur", 37), email: "collab-membre@e2e.test", name: "Lina Membre" },
    de: "collab",
    role: "viewer",
    token: "e2eSessionTokenNewbiCollabMembreUniquement",
  },
  collabEditeur: {
    utilisateur: { _id: oid("utilisateur", 38), email: "collab-editeur@e2e.test", name: "Enzo Éditeur" },
    de: "collab",
    role: "member",
    token: "e2eSessionTokenNewbiCollabEditeurUniquement",
  },
  collabComptable: {
    utilisateur: { _id: oid("utilisateur", 39), email: "collab-comptable@e2e.test", name: "Jade Comptable" },
    de: "collab",
    role: "accountant",
    token: "e2eSessionTokenNewbiCollabComptableUniquement",
  },
  // ── fin du lot collaboration ──
  // ── Lot pilotage (utilisateurs 40 à 44) ──
  // ── fin du lot pilotage ──
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
