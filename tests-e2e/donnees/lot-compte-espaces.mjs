/**
 * Données du lot « compte-espaces » : connexion (callbackUrl, codes OTP,
 * comptes désactivés, jeton à usage unique), double authentification depuis
 * les Paramètres, facturation par rôle, réglages de session, lecture seule
 * après l'essai, inscription.
 *
 * Mêmes types d'identifiants que le lot parametres-auth (préfixes e2e1a à
 * e2e2d), numéros 100 et plus : aucun ne recoupe ceux de ce lot. Chaque
 * compte sert à un seul usage : se connecter, désactiver ou activer la double
 * authentification ne touche jamais un autre compte de test.
 */
import { oid, MAINTENANT, DANS } from "./base.mjs";
import { CODES_SECOURS_CHIFFRES, HACHAGE_MOT_DE_PASSE, SECRET_TOTP_CHIFFRE } from "./lot-parametres-auth.mjs";

const jeton = (nom) => `e2eSessionTokenNewbiCompte${nom}Uniquement`;

/**
 * Options : motDePasse, espace (nom, propriétaire) avec `plan` (null = aucun
 * abonnement) et `abonnement` (champs en plus), sessions [{ nom, il_y_a_jours }],
 * deuxFacteurs, utilisateur / organisation (champs en plus).
 */
function compte(n, { email, name, motDePasse = false, espace = null, plan = "pme", abonnement = {}, sessions = [], deuxFacteurs = false, utilisateur = {}, organisation = {} }) {
  const sessionsCompte = sessions.map((s, i) => ({
    _id: oid("sessionAuth", n * 10 + i),
    token: jeton(s.nom),
    ilYAJours: s.il_y_a_jours || 0,
  }));
  return {
    n,
    utilisateur: { _id: oid("utilisateurAuth", n), email, name, ...utilisateur },
    motDePasse,
    deuxFacteurs,
    plan,
    abonnement,
    organisation: espace ? { _id: oid("espaceAuth", n), name: espace, companyName: espace, ...organisation } : null,
    sessions: sessionsCompte,
    token: sessionsCompte[0]?.token || null,
  };
}

const ESSAI_TERMINE = { trialStartDate: DANS(-45).toISOString(), trialEndDate: DANS(-15).toISOString(), isTrialActive: false, hasUsedTrial: true };

export const COMPTES_CE = {
  // Connexion avec ?callbackUrl= : seuls les chemins du site sont suivis.
  callback: compte(100, { email: "callback@e2e.test", name: "Carla Callback", motDePasse: true, espace: "Callback Test SASU" }),
  callback2fa: compte(101, { email: "callback-2fa@e2e.test", name: "Cyril Callback", motDePasse: true, espace: "Callback 2FA Test SASU", deuxFacteurs: true }),
  // Compte désactivé visé par des adresses écrites autrement (majuscules, espaces, objet).
  desactiveVariantes: compte(102, { email: "desactive-variantes@e2e.test", name: "Dina Variantes", motDePasse: true, espace: "Variantes Test SASU", utilisateur: { isActive: false } }),
  // Désactivé par le test : son jeton de l'API, obtenu avant, ne sert plus.
  desactivationJeton: compte(103, { email: "desactivation-jeton@e2e.test", name: "Jules Jeton", motDePasse: true, espace: "Jeton Test SASU", sessions: [{ nom: "DesactivationJeton" }] }),
  // Visé par les routes de codes OTP fermées (double authentification activée).
  codesOtp: compte(104, { email: "codes-otp@e2e.test", name: "Otto Codes", motDePasse: true, espace: "Codes OTP Test SASU", deuxFacteurs: true, utilisateur: { phoneNumber: "+33612345678", phoneNumberVerified: true } }),
  // Jeton à usage unique de l'application mobile.
  jetonUnique: compte(105, { email: "jeton-unique@e2e.test", name: "Uma Unique", espace: "Jeton Unique Test SASU", sessions: [{ nom: "JetonUnique" }] }),
  // Lien de connexion qui porte une invitation (?invitation=&email=).
  invitationLien: compte(106, { email: "invitation-lien@e2e.test", name: "Ivo Lien", motDePasse: true, espace: "Invitation Lien Test SASU" }),
  // Double authentification activée depuis les Paramètres.
  a2fEmail: compte(107, { email: "a2f-email@e2e.test", name: "Emma Email", motDePasse: true, espace: "A2F Email Test SASU", sessions: [{ nom: "A2fEmail" }] }),
  a2fApplication: compte(108, { email: "a2f-application@e2e.test", name: "Paul Application", motDePasse: true, espace: "A2F Application Test SASU", sessions: [{ nom: "A2fApplication" }] }),
  a2fEssais: compte(109, { email: "a2f-essais@e2e.test", name: "Eric Essais", motDePasse: true, espace: "A2F Essais Test SASU", sessions: [{ nom: "A2fEssais" }] }),
  a2fCoupure: compte(116, { email: "a2f-coupure@e2e.test", name: "Cora Coupure", motDePasse: true, espace: "A2F Coupure Test SASU", deuxFacteurs: true, sessions: [{ nom: "A2fCoupure" }] }),
  // « Facturation » : abonnement relié à Stripe, un membre de chaque rôle.
  facturation: compte(110, {
    email: "facturation-proprietaire@e2e.test",
    name: "Félix Facturation",
    espace: "Facturation Test SASU",
    abonnement: { stripeCustomerId: "cus_e2eFacturation", stripeSubscriptionId: "sub_e2eFacturation" },
    sessions: [{ nom: "Facturation" }],
  }),
  // Réglages de session : valeurs hors liste refusées.
  reglages: compte(120, { email: "reglages-valeurs@e2e.test", name: "Rémi Réglages", espace: "Réglages Valeurs Test SASU", organisation: { sessionSettings: { maxSessions: 3, sessionDuration: 30, inactivityTimeout: 12 } }, sessions: [{ nom: "ReglagesValeurs" }] }),
  // « Durée de session » de 7 jours : une session ouverte il y a 8 jours ne vaut plus.
  dureeSession: compte(121, { email: "duree-session@e2e.test", name: "Dario Durée", espace: "Durée Session Test SASU", organisation: { sessionSettings: { maxSessions: 0, sessionDuration: 7 } }, sessions: [{ nom: "DureeSession", il_y_a_jours: 8 }] }),
  // Essai terminé, aucun abonnement : lecture seule tenue par l'API.
  expire: compte(123, { email: "lecture-seule-api@e2e.test", name: "Léo Lecture", espace: "Lecture Seule API Test SASU", plan: null, organisation: ESSAI_TERMINE, sessions: [{ nom: "LectureSeuleApi" }] }),
  // Fenêtre « Désactiver mon compte » (sans abonnement, le bouton est actif) : lue, jamais confirmée.
  desactivationTexte: compte(124, { email: "desactivation-texte@e2e.test", name: "Tara Texte", espace: "Désactivation Texte Test SASU", plan: null, organisation: ESSAI_TERMINE, sessions: [{ nom: "DesactivationTexte" }] }),
  // Déconnexion : le jeton de l'API obtenu avant ne sert plus (claim sid).
  jwtRevoque: compte(130, { email: "jwt-revoque@e2e.test", name: "Jade Révoquée", espace: "JWT Révoqué Test SASU", sessions: [{ nom: "JwtRevoque" }] }),
  // Partenaire (apporteur d'affaires) : son code ?partner= est gardé à l'inscription d'un filleul.
  partenaire: compte(131, { email: "partenaire-code@e2e.test", name: "Paula Partenaire", utilisateur: { isPartner: true, referralCode: "E2EPARTENAIRE" } }),
  // Inscription en cours (étape « Votre entreprise »).
  onboarding: compte(125, { email: "onboarding-etapes@e2e.test", name: "Odile Étapes", espace: "Mon entreprise", plan: null, sessions: [{ nom: "OnboardingEtapes" }], utilisateur: { onboardingStep: "workspace", hasSeenOnboarding: false }, organisation: { onboardingCompleted: false } }),
};

/** Membres de « Facturation » (une session chacun, dans cet espace). */
export const MEMBRES_FACTURATION = {
  admin: { n: 111, role: "admin", email: "facturation-admin@e2e.test", name: "Adèle Admin", nom: "FacturationAdmin" },
  editeur: { n: 112, role: "member", email: "facturation-editeur@e2e.test", name: "Edgar Éditeur", nom: "FacturationEditeur" },
  membre: { n: 113, role: "viewer", email: "facturation-membre@e2e.test", name: "Maëlle Membre", nom: "FacturationMembre" },
  comptable: { n: 114, role: "accountant", email: "facturation-comptable@e2e.test", name: "Corentin Comptable", nom: "FacturationComptable" },
  // Rôle personnalisé sans l'abonnement : il voit les factures, rien d'autre.
  perso: { n: 115, role: "role_e2e2c00000000000000000a1", email: "facturation-perso@e2e.test", name: "Pia Perso", nom: "FacturationPerso" },
};
for (const m of Object.values(MEMBRES_FACTURATION)) {
  m._id = oid("utilisateurAuth", m.n);
  m.token = jeton(m.nom);
}

export const ROLE_FACTURES_SEULEMENT = {
  _id: oid("roleEspaceAuth", 101),
  role: "role_e2e2c00000000000000000a1",
  name: "Factures seulement",
  description: "Voir les factures",
  actions: { invoices: ["view"] },
};

/** Invitation en attente pour « invitationLien », dans « Facturation ». */
export const INVITATION_LIEN = { _id: oid("invitationAuth", 101), email: "invitation-lien@e2e.test", role: "viewer" };

/** « Onboarding » est aussi Membre de « Facturation » (espace qui l'a invité). */
const ADHESION_ONBOARDING = { _id: oid("membreAuth", 126), role: "viewer" };

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
  const n = org._id.toHexString().slice(-4);
  return {
    slug: `e2e-compte-${org._id.toHexString()}`,
    companyEmail: `facturation@compte${n}.test`,
    companyPhone: "+33123456789",
    addressStreet: "3 rue des Comptes",
    addressCity: "Paris",
    addressZipCode: "75003",
    addressCountry: "France",
    siret: "98765432100012",
    legalForm: "SASU",
    logo: null,
    metadata: null,
    organizationType: "business",
    onboardingCompleted: true,
    sessionSettings: { maxSessions: 0 },
    createdAt: MAINTENANT,
    ...org,
  };
}

function sessionDoc(_id, token, userId, orgId, ilYAJours = 0) {
  const depuis = new Date(MAINTENANT.getTime() - ilYAJours * 86_400_000);
  return {
    _id,
    token,
    userId,
    activeOrganizationId: orgId.toHexString(),
    expiresAt: new Date(depuis.getTime() + 30 * 86_400_000),
    createdAt: depuis,
    updatedAt: depuis,
    ipAddress: "127.0.0.1",
    userAgent: "playwright-e2e",
  };
}

/** Documents à écrire en base, par collection. */
export function donneesCompteEspaces() {
  const docs = { user: [], account: [], organization: [], member: [], subscription: [], session: [], twoFactor: [], invitation: [], organizationRole: [] };
  const facturation = COMPTES_CE.facturation.organisation._id;

  for (const c of Object.values(COMPTES_CE)) {
    docs.user.push(utilisateurPret({ ...c.utilisateur, ...(c.deuxFacteurs ? { twoFactorEnabled: true } : {}) }));
    if (c.motDePasse) {
      docs.account.push({
        _id: oid("compteAuth", c.n),
        userId: c.utilisateur._id,
        accountId: c.utilisateur._id.toHexString(),
        providerId: "credential",
        password: HACHAGE_MOT_DE_PASSE,
        createdAt: MAINTENANT,
        updatedAt: MAINTENANT,
      });
    }
    if (c.deuxFacteurs) {
      docs.twoFactor.push({ _id: oid("deuxFacteursAuth", c.n), userId: c.utilisateur._id, secret: SECRET_TOTP_CHIFFRE, backupCodes: CODES_SECOURS_CHIFFRES, verified: true });
    }
    if (c.organisation) {
      docs.organization.push(espace(c.organisation));
      docs.member.push({ _id: oid("membreAuth", c.n), userId: c.utilisateur._id, organizationId: c.organisation._id, role: "owner", createdAt: MAINTENANT });
      if (c.plan) {
        docs.subscription.push({
          _id: oid("abonnementAuth", c.n),
          referenceId: c.organisation._id.toHexString(),
          plan: c.plan,
          status: "active",
          periodStart: DANS(-1),
          periodEnd: DANS(30),
          createdAt: MAINTENANT,
          updatedAt: MAINTENANT,
          ...c.abonnement,
        });
      }
      c.sessions.forEach((s) => docs.session.push(sessionDoc(s._id, s.token, c.utilisateur._id, c.organisation._id, s.ilYAJours)));
    }
  }

  for (const m of Object.values(MEMBRES_FACTURATION)) {
    docs.user.push(utilisateurPret({ _id: m._id, email: m.email, name: m.name }));
    docs.member.push({ _id: oid("membreAuth", m.n), userId: m._id, organizationId: facturation, role: m.role, createdAt: MAINTENANT });
    docs.session.push(sessionDoc(oid("sessionAuth", m.n * 10), m.token, m._id, facturation));
  }

  docs.member.push({ _id: ADHESION_ONBOARDING._id, userId: COMPTES_CE.onboarding.utilisateur._id, organizationId: facturation, role: ADHESION_ONBOARDING.role, createdAt: MAINTENANT });

  docs.organizationRole.push({
    _id: ROLE_FACTURES_SEULEMENT._id,
    organizationId: facturation,
    role: ROLE_FACTURES_SEULEMENT.role,
    permission: JSON.stringify({}),
    actions: ROLE_FACTURES_SEULEMENT.actions,
    catalogVersion: 2,
    name: ROLE_FACTURES_SEULEMENT.name,
    description: ROLE_FACTURES_SEULEMENT.description,
    createdAt: MAINTENANT,
    updatedAt: MAINTENANT,
  });

  docs.invitation.push({
    _id: INVITATION_LIEN._id,
    organizationId: facturation,
    email: INVITATION_LIEN.email,
    role: INVITATION_LIEN.role,
    status: "pending",
    inviterId: COMPTES_CE.facturation.utilisateur._id,
    expiresAt: DANS(7),
    createdAt: MAINTENANT,
  });

  return docs;
}
