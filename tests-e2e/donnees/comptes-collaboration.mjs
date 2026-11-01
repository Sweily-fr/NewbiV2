/**
 * Comptes propres aux fonctionnalités du lot « collaboration » ajoutées après
 * coup (tableaux restreints, calendrier, prise de rendez-vous, réseaux
 * sociaux, e-mails envoyés), hors COMPTES : chacun son espace, ses membres et
 * son abonnement, sans décaler les comptes communs de base.mjs.
 *
 * Plages de numéros réservées (n) par fonctionnalité, pour qu'aucun id ne
 * se répète : kanban 1 à 19, calendrier 20 à 39, rendez-vous 40 à 59,
 * réseaux sociaux et e-mails envoyés 60 à 79. Préfixes : utilisateurLot,
 * espaceLot, membreLot, sessionLot, abonnementLot, roleLot (base.mjs).
 */
import { DANS, MAINTENANT, oid } from "./base.mjs";

/** Jeton de session d'un compte du lot (chaîne unique, comme config.mjs). */
export const jetonLot = (n) => `e2eSessionTokenNewbiCollabLot${n}Uniquement`;

/**
 * Propriétaire d'un espace. `abonnement` : "active" (défaut), un autre statut
 * ("canceled", "unpaid", "incomplete_expired"…), un objet (champs de
 * l'abonnement) ou null (aucun abonnement : espace en lecture seule).
 */
export function compteLot(n, { email, name, espace, plan = "pme", abonnement = "active", organisation = {}, utilisateur = {} }) {
  return {
    n,
    utilisateur: { _id: oid("utilisateurLot", n), email, name, ...utilisateur },
    organisation: { _id: oid("espaceLot", n), name: espace, companyName: espace, ...organisation },
    plan,
    abonnement,
    token: jetonLot(n),
  };
}

/**
 * Membre invité dans l'espace `de` (un compteLot ou une organisation de
 * COMPTES) avec un rôle (viewer, member, accountant, admin ou role_<id>).
 * `session: false` : membre sans session (personne ne se connecte avec).
 */
export function membreLot(n, { email, name, de, role, session = true, utilisateur = {} }) {
  const organisation = de.organisation || de;
  return {
    n,
    utilisateur: { _id: oid("utilisateurLot", n), email, name, ...utilisateur },
    organisationId: organisation._id,
    role,
    token: session ? jetonLot(n) : null,
  };
}

const utilisateurPret = (u) => ({
  emailVerified: true,
  role: "member",
  isActive: true,
  isDisabled: false,
  hasSeenOnboarding: true,
  onboardingStep: "completed",
  hasCompletedTutorial: true,
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ...u,
});

function espace(org) {
  const hex = org._id.toHexString();
  return {
    slug: `e2e-collab-${hex}`,
    companyEmail: `facturation@lot${hex.slice(-4)}.test`,
    companyPhone: "+33123456789",
    addressStreet: "3 rue des Lilas",
    addressCity: "Paris",
    addressZipCode: "75011",
    addressCountry: "France",
    siret: "98765432100012",
    legalForm: "SASU",
    vatNumber: "FR98765432100",
    capitalSocial: "10000",
    rcs: "Paris B 987 654 321",
    logo: null,
    metadata: null,
    organizationType: "business",
    onboardingCompleted: true,
    // 0 = sessions illimitées : rien ne déconnecte le compte de test.
    sessionSettings: { maxSessions: 0 },
    createdAt: MAINTENANT,
    ...org,
  };
}

const session = (n, token, userId, organisationId) => ({
  _id: oid("sessionLot", n),
  token,
  userId,
  activeOrganizationId: organisationId.toHexString(),
  expiresAt: DANS(30),
  createdAt: MAINTENANT,
  updatedAt: MAINTENANT,
  ipAddress: "127.0.0.1",
  userAgent: "playwright-e2e",
});

/**
 * Rôle personnalisé d'un espace (collection organizationRole, comme
 * lot-parametres-auth.mjs) : `actions` = { module: ["view", "create"…] }
 * (catalogue : rolePermissions.js de newbi-api).
 * L'identifiant à donner au membre est `role_<_id>`.
 */
export function roleLot(n, { de, name, actions, permission = {}, description = "" }) {
  const organisation = de.organisation || de;
  const _id = oid("roleLot", n);
  return {
    _id,
    role: `role_${_id.toHexString()}`,
    organizationId: organisation._id,
    name,
    description,
    actions,
    permission,
  };
}

/** Documents à écrire en base pour ces comptes, membres et rôles, par collection. */
export function docsComptesLot({ comptes = [], membres = [], roles = [] }) {
  const docs = { user: [], organization: [], member: [], subscription: [], session: [], organizationRole: [] };
  for (const c of comptes) {
    docs.user.push(utilisateurPret(c.utilisateur));
    docs.organization.push(espace(c.organisation));
    docs.member.push({ _id: oid("membreLot", c.n), userId: c.utilisateur._id, organizationId: c.organisation._id, role: "owner", createdAt: MAINTENANT });
    if (c.abonnement) {
      const champs = typeof c.abonnement === "object" ? c.abonnement : { status: c.abonnement };
      docs.subscription.push({
        _id: oid("abonnementLot", c.n),
        referenceId: c.organisation._id.toHexString(),
        plan: c.plan,
        status: "active",
        periodStart: DANS(-1),
        periodEnd: DANS(30),
        createdAt: MAINTENANT,
        updatedAt: MAINTENANT,
        ...champs,
      });
    }
    docs.session.push(session(c.n, c.token, c.utilisateur._id, c.organisation._id));
  }
  for (const m of membres) {
    docs.user.push(utilisateurPret(m.utilisateur));
    docs.member.push({ _id: oid("membreLot", m.n), userId: m.utilisateur._id, organizationId: m.organisationId, role: m.role, createdAt: MAINTENANT });
    if (m.token) docs.session.push(session(m.n, m.token, m.utilisateur._id, m.organisationId));
  }
  for (const r of roles) {
    docs.organizationRole.push({
      _id: r._id,
      organizationId: r.organizationId,
      role: r.role,
      permission: JSON.stringify(r.permission),
      actions: r.actions,
      catalogVersion: 2,
      name: r.name,
      description: r.description,
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    });
  }
  return docs;
}
