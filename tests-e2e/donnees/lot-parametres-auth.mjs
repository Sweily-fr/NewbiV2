/**
 * Données du lot « parametres-auth » (paramètres, connexion, inscription, espaces, membres).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e1a à e2e1f, e2e2a à e2e2f).
 *
 * Trois familles :
 *   - les espaces « Paramètres », « Configuration » et « Équipe » de COMPTES
 *     (base.mjs) : invitations, rôles personnalisés et membres visés ;
 *   - COMPTES_AUTH : un compte par parcours qui touche à la connexion
 *     (mot de passe, double authentification, sessions, désactivation…).
 *     Chacun a son utilisateur, son espace et, au besoin, son mot de passe
 *     (collection `account` de Better Auth) ou ses sessions : se connecter,
 *     se déconnecter ou révoquer ne touche jamais un autre compte de test ;
 *   - les membres et invitations visés par les actions des tests.
 */
import { oid, MAINTENANT, DANS, COMPTES, MEMBRES } from "./base.mjs";

/** Mot de passe de tous les comptes qui se connectent par le formulaire. */
export const MOT_DE_PASSE = "Newbi-Test-2026!";
/**
 * MOT_DE_PASSE haché par `hashPassword` de better-auth/crypto (scrypt, version
 * 1.6.23 du package-lock), tel que Better Auth l'enregistre dans `account`.
 * Une valeur figée : les données sont écrites sans attente (donnees/index.mjs).
 */
export const HACHAGE_MOT_DE_PASSE =
  "1850f0072cbd2b19ded689cff49217d6:c83fb67b8f98a3464227ffeddb39d49c970f8f4021c276e3eb943336e73bcab6853cabf6b222eebf291d913e2d51672ff1b5549e520e8f060c01ccf558987b39";

/** Secret TOTP (application d'authentification) des comptes à double authentification. */
export const SECRET_TOTP = "E2EDeuxFacteursNewbiSecretTotp01";
// SECRET_TOTP chiffré par symmetricEncrypt de better-auth/crypto avec le
// secret des tests (config.mjs, SECRET), comme le plugin twoFactor le stocke.
const SECRET_TOTP_CHIFFRE =
  "0d71fe8ae9f0e8af9c1864580ac24d0917630972059f0991f2021ea7df09cbcf4120054354fce84a77d72cd863872a99aa9458097466d93bfd646e8098e429d54e2180b80e1c9d3c";
/** Codes de secours de ces comptes (chacun ne sert qu'une fois). */
export const CODES_SECOURS = ["e2eAa-11111", "e2eBb-22222", "e2eCc-33333", "e2eDd-44444", "e2eEe-55555"];
const CODES_SECOURS_CHIFFRES =
  "744f56c2b92a541b4672b465ec273a076837a4022aac7e50039527dcdf1e502669006eee673c81c8752815ed9e95a6b4b7de4ed572945e517faa0036cfcf6cad1acc8c28bee1aa086736a90588b252f5af03712ab4ef9a5e823d56e745e770dafebd4ecdeaa0efc6fe83b33b958e8e";

/** Texte piégé : s'il est interprété comme du HTML, il pose une marque et ouvre une alerte. */
export const piege = (marque) => `<img src="x-${marque}" onerror="window.__piege='${marque}';alert('${marque}')">`;

const jeton = (nom) => `e2eSessionTokenNewbiAuth${nom}Uniquement`;

/** Rôles personnalisés (clés `role_<hex>`, comme l'API les crée). */
export const ROLES_PERSO = {
  // « Paramètres » : voir et inviter des membres, rien d'autre.
  recrutement: {
    _id: oid("roleEspaceAuth", 1),
    organisation: () => COMPTES.parametres.organisation._id,
    role: "role_e2e2c0000000000000000001",
    name: "Recrutement",
    description: "Voir et inviter des membres",
    actions: { team: ["view", "invite"] },
    permission: { member: ["create"], invitation: ["create", "cancel"] },
  },
  // « Équipe » : gérer les membres (inviter, changer les rôles, retirer).
  gestionEquipe: {
    _id: oid("roleEspaceAuth", 2),
    organisation: () => COMPTES.equipe.organisation._id,
    role: "role_e2e2c0000000000000000002",
    name: "Gestion d'équipe",
    description: "Inviter, changer les rôles et retirer des membres",
    actions: { team: ["view", "invite", "changeRole", "remove"] },
    permission: { member: ["create", "update", "delete"], invitation: ["create", "cancel"] },
  },
  // « Équipe » : rôle que les tests modifient puis suppriment.
  aModifier: {
    _id: oid("roleEspaceAuth", 3),
    organisation: () => COMPTES.equipe.organisation._id,
    role: "role_e2e2c0000000000000000003",
    name: "Rôle à modifier",
    description: "Modifié par les tests",
    actions: { invoices: ["view"] },
    permission: {},
  },
  aSupprimer: {
    _id: oid("roleEspaceAuth", 4),
    organisation: () => COMPTES.equipe.organisation._id,
    role: "role_e2e2c0000000000000000004",
    name: "Rôle à supprimer",
    description: "Supprimé par les tests",
    actions: { invoices: ["view"] },
    permission: {},
  },
  // « Piège » : nom de rôle piégé, vu par un membre (voir COMPTES_AUTH.piegeMembre).
  piege: {
    _id: oid("roleEspaceAuth", 5),
    organisation: () => COMPTES_AUTH.piegeProprietaire.organisation._id,
    role: "role_e2e2c0000000000000000005",
    // 40 caractères au plus (limite de l'API) : un piège court mais exécutable.
    name: "Rôle <img src=x onerror=alert(1)>",
    description: `Description ${piege("role-description")}`,
    actions: { invoices: ["view"], team: ["view"] },
    permission: {},
  },
};

/**
 * Comptes propres au lot, hors COMPTES. Options :
 *   motDePasse : compte « credential » avec MOT_DE_PASSE ;
 *   espace     : nom de son espace (propriétaire), avec un abonnement `plan` (null = aucun) ;
 *   sessions   : sessions ouvertes [{ nom, appareil, il_y_a_minutes }], la première sert de cookie ;
 *   deuxFacteurs : double authentification activée (TOTP + codes de secours) ;
 *   utilisateur / organisation : champs en plus.
 */
function compte(n, { email, name, motDePasse = false, espace = null, plan = "pme", sessions = [], deuxFacteurs = false, utilisateur = {}, organisation = {} }) {
  const sessionsCompte = sessions.map((s, i) => ({
    _id: oid("sessionAuth", n * 10 + i),
    token: jeton(s.nom),
    appareil: s.appareil || "playwright-e2e",
    ipAddress: s.ip || "127.0.0.1",
    ilYA: s.il_y_a_minutes || 0,
  }));
  return {
    n,
    utilisateur: { _id: oid("utilisateurAuth", n), email, name, ...utilisateur },
    motDePasse,
    deuxFacteurs,
    plan,
    organisation: espace
      ? {
          _id: oid("espaceAuth", n),
          name: espace,
          companyName: espace,
          ...organisation,
        }
      : null,
    sessions: sessionsCompte,
    token: sessionsCompte[0]?.token || null,
  };
}

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const FIREFOX_WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0";

export const COMPTES_AUTH = {
  // Connexion par le formulaire (réussie, erreurs, messages).
  connexion: compte(1, { email: "connexion@e2e.test", name: "Léa Connexion", motDePasse: true, espace: "Connexion Test SASU" }),
  // Se déconnecter depuis le menu du compte.
  deconnexion: compte(2, { email: "deconnexion@e2e.test", name: "Dan Déconnexion", espace: "Déconnexion Test SASU", sessions: [{ nom: "Deconnexion" }] }),
  // Double authentification : connexion par l'application, verrou après les essais ratés, codes de secours.
  deuxFacteurs: compte(3, { email: "deux-facteurs@e2e.test", name: "Théo Deuxfacteurs", motDePasse: true, espace: "Double Facteur Test SASU", deuxFacteurs: true }),
  deuxFacteursVerrou: compte(4, { email: "deux-facteurs-verrou@e2e.test", name: "Vera Verrou", motDePasse: true, espace: "Verrou Test SASU", deuxFacteurs: true }),
  deuxFacteursSecours: compte(5, { email: "deux-facteurs-secours@e2e.test", name: "Sacha Secours", motDePasse: true, espace: "Secours Test SASU", deuxFacteurs: true }),
  // Compte désactivé : connexion refusée, et le message ne doit rien révéler sans le bon mot de passe.
  desactive: compte(6, { email: "desactive@e2e.test", name: "Denis Désactivé", motDePasse: true, espace: "Désactivé Test SASU", utilisateur: { isActive: false } }),
  // Réactivation par le lien reçu par e-mail.
  reactivation: compte(7, { email: "reactivation@e2e.test", name: "Rita Réactivation", motDePasse: true, espace: "Réactivation Test SASU", utilisateur: { isActive: false } }),
  // E-mail non vérifié : connexion permise, message d'échec identique aux autres.
  nonVerifie: compte(8, { email: "non-verifie@e2e.test", name: "Nina Nonvérifiée", motDePasse: true, espace: "Non Vérifié Test SASU", utilisateur: { emailVerified: false } }),
  // Vérification de l'e-mail par le lien (/auth/verify-email).
  verificationEmail: compte(9, { email: "verification-email@e2e.test", name: "Vic Vérification", motDePasse: true, espace: "Vérification Test SASU", utilisateur: { emailVerified: false } }),
  // Mot de passe oublié, puis nouveau mot de passe par le lien.
  motDePasseOublie: compte(10, { email: "mot-de-passe-oublie@e2e.test", name: "Oscar Oubli", motDePasse: true, espace: "Oubli Test SASU" }),
  // Lien de réinitialisation expiré (jeton semé, voir JETONS_REINITIALISATION).
  jetonExpire: compte(11, { email: "jeton-expire@e2e.test", name: "Jade Expiré", motDePasse: true, espace: "Jeton Expiré Test SASU" }),
  // Nouveau mot de passe par le lien : les sessions ouvertes ailleurs doivent être fermées.
  reinitialisationSessions: compte(12, {
    email: "reinitialisation-sessions@e2e.test",
    name: "Rose Réinitialisation",
    motDePasse: true,
    espace: "Réinitialisation Test SASU",
    sessions: [{ nom: "ReinitialisationAutreAppareil", appareil: IPHONE, ip: "10.0.0.12" }],
  }),
  // Changer son mot de passe (Paramètres > Compte) : le mot de passe est remis à MOT_DE_PASSE avant chaque test.
  changementMotDePasse: compte(13, { email: "changement-mdp@e2e.test", name: "Chloé Changement", motDePasse: true, espace: "Changement Test SASU", sessions: [{ nom: "ChangementMotDePasse" }] }),
  // Changer son mot de passe ferme-t-il les autres sessions ?
  changementSessions: compte(14, {
    email: "changement-sessions@e2e.test",
    name: "Hugo Sessions",
    motDePasse: true,
    espace: "Changement Sessions Test SASU",
    sessions: [{ nom: "ChangementSessions" }, { nom: "ChangementSessionsIphone", appareil: IPHONE, ip: "10.0.0.14" }],
  }),
  // Appareils connectés (Paramètres > Sécurité) : déconnecter un autre appareil.
  appareils: compte(15, {
    email: "appareils@e2e.test",
    name: "Alix Appareils",
    espace: "Appareils Test SASU",
    sessions: [
      { nom: "Appareils" },
      { nom: "AppareilsIphone", appareil: IPHONE, ip: "10.0.0.15", il_y_a_minutes: 30 },
      { nom: "AppareilsFirefox", appareil: FIREFOX_WINDOWS, ip: "10.0.1.15", il_y_a_minutes: 50 },
    ],
  }),
  // Déconnexion de tous les autres appareils.
  appareilsTous: compte(16, {
    email: "appareils-tous@e2e.test",
    name: "Tom Tousappareils",
    espace: "Tous Appareils Test SASU",
    sessions: [
      { nom: "AppareilsTous" },
      { nom: "AppareilsTousIphone", appareil: IPHONE, ip: "10.0.0.16", il_y_a_minutes: 20 },
      { nom: "AppareilsTousFirefox", appareil: FIREFOX_WINDOWS, ip: "10.0.1.16", il_y_a_minutes: 40 },
    ],
  }),
  // Limite de sessions simultanées (1) : se connecter ferme les deux sessions plus anciennes.
  limiteSessions: compte(17, {
    email: "limite-sessions@e2e.test",
    name: "Lina Limite",
    motDePasse: true,
    espace: "Limite Sessions Test SASU",
    organisation: { sessionSettings: { maxSessions: 1 } },
    sessions: [
      { nom: "LimiteAncienneIphone", appareil: IPHONE, ip: "10.0.0.17", il_y_a_minutes: 30 },
      { nom: "LimiteAncienneFirefox", appareil: FIREFOX_WINDOWS, ip: "10.0.1.17", il_y_a_minutes: 60 },
    ],
  }),
  // Même situation, pour l'avertissement affiché à la connexion (test à part).
  limiteSessionsAvis: compte(52, {
    email: "limite-sessions-avis@e2e.test",
    name: "Lou Limite",
    motDePasse: true,
    espace: "Limite Avis Test SASU",
    organisation: { sessionSettings: { maxSessions: 1 } },
    sessions: [
      { nom: "LimiteAvisIphone", appareil: IPHONE, ip: "10.0.0.52", il_y_a_minutes: 30 },
      { nom: "LimiteAvisFirefox", appareil: FIREFOX_WINDOWS, ip: "10.0.1.52", il_y_a_minutes: 60 },
    ],
  }),
  // Page « Gérer mes appareils » (/auth/manage-devices).
  gestionAppareils: compte(18, {
    email: "gestion-appareils@e2e.test",
    name: "Gil Gestion",
    espace: "Gestion Appareils Test SASU",
    sessions: [{ nom: "GestionAppareils" }, { nom: "GestionAppareilsIphone", appareil: IPHONE, ip: "10.0.0.18", il_y_a_minutes: 25 }],
  }),
  // Invité qui a déjà un compte : accepte son invitation dans « Équipe ».
  invite: compte(19, { email: "invite@e2e.test", name: "Inès Invitée", motDePasse: true, espace: "Invitée Test SASU", sessions: [{ nom: "Invite" }] }),
  // Connecté avec un autre compte que celui invité : l'invitation ne doit pas lui être acceptée.
  inviteAutre: compte(20, { email: "invite-autre@e2e.test", name: "Igor Autre", espace: "Autre Invité Test SASU", sessions: [{ nom: "InviteAutre" }] }),
  // Essai terminé sans abonnement : la connexion mène au tableau de bord en lecture seule, sans boucle.
  essaiExpire: compte(21, {
    email: "essai-expire@e2e.test",
    name: "Éva Essai",
    motDePasse: true,
    espace: "Essai Expiré Test SASU",
    plan: null,
    organisation: { trialStartDate: DANS(-45).toISOString(), trialEndDate: DANS(-15).toISOString(), isTrialActive: false, hasUsedTrial: true },
    sessions: [{ nom: "EssaiExpire" }],
  }),
  // Inscription commencée (étape « Votre entreprise ») : sans SIRET, avec SIRET, formes juridiques.
  inscriptionSansSiret: compte(22, {
    email: "inscription-sans-siret@e2e.test",
    name: "Paul Sanssiret",
    sessions: [{ nom: "InscriptionSansSiret" }],
    utilisateur: { onboardingStep: "workspace", hasSeenOnboarding: false },
  }),
  inscriptionAvecSiret: compte(23, {
    email: "inscription-avec-siret@e2e.test",
    name: "Anna Avecsiret",
    sessions: [{ nom: "InscriptionAvecSiret" }],
    utilisateur: { onboardingStep: "workspace", hasSeenOnboarding: false },
  }),
  inscriptionFormes: compte(24, {
    email: "inscription-formes@e2e.test",
    name: "Fabien Formes",
    sessions: [{ nom: "InscriptionFormes" }],
    utilisateur: { onboardingStep: "workspace", hasSeenOnboarding: false },
  }),
  // Textes piégés : nom de l'entreprise (écrit par le propriétaire) vu par un membre, nom du membre vu par le propriétaire.
  piegeProprietaire: compte(25, {
    email: "piege-proprietaire@e2e.test",
    name: "Pia Propriétaire",
    espace: "Piège Test SASU",
    sessions: [{ nom: "PiegeProprietaire" }],
    organisation: {
      companyName: `Piège ${piege("entreprise")} SASU`,
      commercialName: `Enseigne ${piege("enseigne")}`,
      addressStreet: `1 rue ${piege("adresse")}`,
      bankName: `Banque ${piege("banque")}`,
    },
  }),
  piegeMembre: compte(26, {
    email: "piege-membre@e2e.test",
    name: `Membre ${piege("nom-membre")}`,
    sessions: [{ nom: "PiegeMembre" }],
  }),
  // Transférer le rôle de super admin (l'espace change de propriétaire).
  transfert: compte(27, { email: "transfert@e2e.test", name: "Tess Transfert", espace: "Transfert Test SASU", sessions: [{ nom: "Transfert" }] }),
  // Offre d'entrée : ce qu'elle ne propose pas (rôle Administrateur, membres au-delà du siège) refusé par le serveur.
  offreFreelance: compte(28, { email: "offre-freelance@e2e.test", name: "Fred Freelance", espace: "Offre Freelance Test EI", plan: "freelance", sessions: [{ nom: "OffreFreelance" }] }),
  // Essai en cours (aucun abonnement) : inviter est refusé par le serveur.
  essaiEnCours: compte(29, {
    email: "essai-en-cours@e2e.test",
    name: "Elsa Essaiencours",
    espace: "Essai En Cours Test SASU",
    plan: null,
    sessions: [{ nom: "EssaiEnCours" }],
    organisation: { trialStartDate: DANS(-5).toISOString(), trialEndDate: DANS(25).toISOString(), isTrialActive: true, hasUsedTrial: true },
  }),
  // Désactiver son compte (Paramètres > Compte).
  // Sans abonnement actif (essai terminé) : avec un abonnement, « Désactiver » est grisé.
  desactivation: compte(30, {
    email: "desactivation@e2e.test",
    name: "Dora Désactivation",
    motDePasse: true,
    espace: "Désactivation Test SASU",
    plan: null,
    organisation: { trialStartDate: DANS(-45).toISOString(), trialEndDate: DANS(-15).toISOString(), isTrialActive: false, hasUsedTrial: true },
    sessions: [{ nom: "Desactivation" }],
  }),
  // Autre compte qui tente de fermer les sessions des autres.
  intrusSessions: compte(31, { email: "intrus-sessions@e2e.test", name: "Ivan Intrus", espace: "Intrus Sessions Test SASU", sessions: [{ nom: "IntrusSessions" }] }),
  // Essais de connexion répétés (mauvais mot de passe) : un compte à part pour ne bloquer personne.
  essaisRepetes: compte(32, { email: "essais-repetes@e2e.test", name: "Rémy Répétés", motDePasse: true, espace: "Essais Répétés Test SASU" }),
  // Délai d'inactivité et durée de session réglés dans Sécurité (le propriétaire change ses propres réglages).
  reglagesSession: compte(33, {
    email: "reglages-session@e2e.test",
    name: "Rose Réglages",
    espace: "Réglages Session Test SASU",
    organisation: { sessionSettings: { maxSessions: 3 } },
    sessions: [{ nom: "ReglagesSession" }],
  }),
  // Relancer le tutoriel : il se rouvre ensuite à chaque arrivée sur le tableau de bord.
  tutoriel: compte(37, { email: "tutoriel@e2e.test", name: "Tina Tutoriel", espace: "Tutoriel Test SASU", sessions: [{ nom: "Tutoriel" }] }),
  // Réglage « illimité » (0) hérité d'une ancienne version : la liste ne propose que 1, 2 ou 3.
  securiteHeritee: compte(38, { email: "securite-heritee@e2e.test", name: "Hector Hérité", espace: "Réglage Hérité Test SASU", sessions: [{ nom: "SecuriteHeritee" }] }),
  // Sessions visées par un autre compte (intrusSessions) : personne d'autre n'y touche.
  // (numéros 40 à 48 : membres visés, voir MEMBRES_CIBLES)
  cibleSessions: compte(50, {
    email: "cible-sessions@e2e.test",
    name: "Céleste Cible",
    espace: "Cible Sessions Test SASU",
    sessions: [{ nom: "CibleSessionsMac" }, { nom: "CibleSessionsIphone", appareil: IPHONE, ip: "10.0.0.50" }],
  }),
  // Inviter à l'écran depuis un espace qui a encore des sièges (« Équipe » est au-delà de 10).
  invitationsEcran: compte(51, { email: "invitations-ecran@e2e.test", name: "Ilan Invitations", espace: "Invitations Écran Test SASU", sessions: [{ nom: "InvitationsEcran" }] }),
  // Nom complet modifié depuis Paramètres > Compte.
  nomComplet: compte(39, { email: "nom-complet@e2e.test", name: "Nora Nom", espace: "Nom Complet Test SASU", sessions: [{ nom: "NomComplet" }] }),
  // Double authentification à activer depuis Paramètres > Sécurité.
  activation2fa: compte(34, { email: "activation-2fa@e2e.test", name: "Axel Activation", motDePasse: true, espace: "Activation 2FA Test SASU", sessions: [{ nom: "Activation2fa" }] }),
  // Super admin qui tente de quitter son espace (refusé : il doit d'abord transférer son rôle).
  quitter: compte(36, { email: "quitter@e2e.test", name: "Quentin Quitter", espace: "Quitter Test SASU", sessions: [{ nom: "Quitter" }] }),
  // Double authentification à couper depuis Paramètres > Sécurité.
  desactivation2fa: compte(35, {
    email: "desactivation-2fa@e2e.test",
    name: "Diane Désactivation",
    motDePasse: true,
    espace: "Coupure 2FA Test SASU",
    deuxFacteurs: true,
    sessions: [{ nom: "Desactivation2fa" }],
  }),
};

/** Membres visés par les actions des tests (sans session : personne ne se connecte avec). */
export const MEMBRES_CIBLES = {
  // « Équipe »
  roleChange: { n: 40, de: () => COMPTES.equipe.organisation._id, role: "viewer", email: "cible-role@e2e.test", name: "Cyril Cible" },
  retrait: { n: 41, de: () => COMPTES.equipe.organisation._id, role: "viewer", email: "cible-retrait@e2e.test", name: "Rania Retrait" },
  gestionRole: { n: 42, de: () => COMPTES.equipe.organisation._id, role: "viewer", email: "cible-gestion-role@e2e.test", name: "Gina Rôle" },
  gestionRetrait: { n: 43, de: () => COMPTES.equipe.organisation._id, role: "viewer", email: "cible-gestion-retrait@e2e.test", name: "Gary Retrait" },
  intrus: { n: 44, de: () => COMPTES.equipe.organisation._id, role: "viewer", email: "cible-intrus@e2e.test", name: "Iris Cible" },
  // « Paramètres » : visée par les refus (rien ne doit lui arriver).
  parametres: { n: 45, de: () => COMPTES.parametres.organisation._id, role: "viewer", email: "cible-parametres@e2e.test", name: "Zoé Cible" },
  // « Transfert » : reçoit le rôle de super admin.
  transfert: { n: 46, de: () => COMPTES_AUTH.transfert.organisation._id, role: "admin", email: "cible-transfert@e2e.test", name: "Tristan Reprise" },
  // « Piège » : le membre au nom piégé (compte avec session, voir COMPTES_AUTH.piegeMembre),
  // rôle « Membre » (lecture partout) pour que le tableau de bord se charge sans refus.
  piege: { n: 47, de: () => COMPTES_AUTH.piegeProprietaire.organisation._id, role: "viewer", compte: "piegeMembre" },
  // « Piège » : un membre au rôle personnalisé piégé, affiché dans la liste des membres.
  piegeRole: { n: 49, de: () => COMPTES_AUTH.piegeProprietaire.organisation._id, role: "role_e2e2c0000000000000000005", email: "membre-role-piege@e2e.test", name: "Paul Rôlepiégé" },
  // « Équipe » : le rôle « Rôle à supprimer » est porté par un membre, réaffecté à la suppression.
  roleSupprime: { n: 48, de: () => COMPTES.equipe.organisation._id, role: "role_e2e2c0000000000000000004", email: "cible-role-supprime@e2e.test", name: "Sven Supprimé" },
};

/** Invitations en attente (ou terminées) visées par les tests. */
export const INVITATIONS = {
  // « Paramètres » : affichées dans la liste, visées par les refus.
  attenteParametres: { n: 1, org: () => COMPTES.parametres.organisation._id, email: "invitee-parametres@e2e.test", role: "viewer", de: () => COMPTES.parametres.utilisateur._id },
  persoParametres: { n: 2, org: () => COMPTES.parametres.organisation._id, email: "invitee-recrutement@e2e.test", role: "role_e2e2c0000000000000000001", de: () => COMPTES.parametres.utilisateur._id },
  // « Équipe » : une invitation par action.
  annuler: { n: 3, org: () => COMPTES.equipe.organisation._id, email: "invitation-annuler@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
  gestionAnnuler: { n: 4, org: () => COMPTES.equipe.organisation._id, email: "invitation-gestion-annuler@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
  intrus: { n: 5, org: () => COMPTES.equipe.organisation._id, email: "invitation-intrus@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
  // Invitation du compte « invite » (déjà inscrit), acceptée depuis /accept-invitation.
  acceptee: { n: 6, org: () => COMPTES.equipe.organisation._id, email: "invite@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
  // Invitation d'un autre e-mail, ouverte par « inviteAutre ».
  autreDestinataire: { n: 7, org: () => COMPTES.equipe.organisation._id, email: "destinataire-reel@e2e.test", role: "member", de: () => COMPTES.equipe.utilisateur._id },
  // Invitation expirée, annulée, pour un e-mail sans compte (inscription par l'invitation).
  expiree: { n: 8, org: () => COMPTES.equipe.organisation._id, email: "invitation-expiree@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id, expire: DANS(-2) },
  annulee: { n: 9, org: () => COMPTES.equipe.organisation._id, email: "invitation-annulee@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id, statut: "canceled" },
  nouvelInscrit: { n: 10, org: () => COMPTES.equipe.organisation._id, email: "nouvel-inscrit-invite@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
  // Invitation refusée par l'invité (bouton « Refuser »).
  aRefuser: { n: 11, org: () => COMPTES.configuration.organisation._id, email: "invite@e2e.test", role: "viewer", de: () => COMPTES.configuration.utilisateur._id },
  // Invitation à renvoyer depuis la liste d'« Équipe ».
  renvoyer: { n: 12, org: () => COMPTES.equipe.organisation._id, email: "invitation-renvoyer@e2e.test", role: "viewer", de: () => COMPTES.equipe.utilisateur._id },
};

/**
 * Jetons de réinitialisation du mot de passe semés dans `verification`
 * (identifiant `reset-password:<jeton>`, valeur = id de l'utilisateur), comme
 * Better Auth les écrit quand il envoie le lien par e-mail.
 */
export const JETONS_REINITIALISATION = {
  expire: { n: 1, compte: "jetonExpire", jeton: "e2eJetonReinitialisationExpireUniquement01", expire: DANS(-1 / 24) },
  sessions: { n: 2, compte: "reinitialisationSessions", jeton: "e2eJetonReinitialisationSessionsUniquement2", expire: DANS(1 / 24) },
};

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
    slug: `e2e-auth-${org._id.toHexString()}`,
    companyEmail: `facturation@auth${n}.test`,
    companyPhone: "+33123456789",
    addressStreet: "2 rue de la Connexion",
    addressCity: "Paris",
    addressZipCode: "75002",
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
    sessionSettings: { maxSessions: 0 },
    createdAt: MAINTENANT,
    ...org,
  };
}

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesParametresAuth() {
  const docs = {
    user: [],
    account: [],
    organization: [],
    member: [],
    subscription: [],
    session: [],
    twoFactor: [],
    invitation: [],
    organizationRole: [],
    verification: [],
  };

  for (const c of Object.values(COMPTES_AUTH)) {
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
        });
      }
    }
    if (c.deuxFacteurs) {
      docs.twoFactor.push({
        _id: oid("deuxFacteursAuth", c.n),
        userId: c.utilisateur._id,
        secret: SECRET_TOTP_CHIFFRE,
        backupCodes: CODES_SECOURS_CHIFFRES,
        verified: true,
      });
    }
    // Session de l'espace du compte, ou de celui où il est membre.
    const cible = Object.values(MEMBRES_CIBLES).find((m) => m.compte && COMPTES_AUTH[m.compte] === c);
    const orgSession = c.organisation?._id || (cible ? cible.de() : null);
    for (const s of c.sessions) {
      const depuis = new Date(MAINTENANT.getTime() - s.ilYA * 60_000);
      docs.session.push({
        _id: s._id,
        token: s.token,
        userId: c.utilisateur._id,
        ...(orgSession ? { activeOrganizationId: orgSession.toHexString() } : {}),
        expiresAt: DANS(30),
        createdAt: depuis,
        updatedAt: depuis,
        ipAddress: s.ipAddress,
        userAgent: s.appareil,
      });
    }
  }

  for (const m of Object.values(MEMBRES_CIBLES)) {
    const compteLie = m.compte ? COMPTES_AUTH[m.compte] : null;
    const userId = compteLie ? compteLie.utilisateur._id : oid("utilisateurAuth", m.n);
    if (!compteLie) docs.user.push(utilisateurPret({ _id: userId, email: m.email, name: m.name }));
    docs.member.push({ _id: oid("membreAuth", m.n), userId, organizationId: m.de(), role: m.role, createdAt: MAINTENANT });
  }

  for (const r of Object.values(ROLES_PERSO)) {
    docs.organizationRole.push({
      _id: r._id,
      organizationId: r.organisation(),
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

  for (const i of Object.values(INVITATIONS)) {
    docs.invitation.push({
      _id: oid("invitationAuth", i.n),
      organizationId: i.org(),
      email: i.email,
      role: i.role,
      status: i.statut || "pending",
      inviterId: i.de(),
      expiresAt: i.expire || DANS(7),
      createdAt: MAINTENANT,
    });
  }

  for (const j of Object.values(JETONS_REINITIALISATION)) {
    docs.verification.push({
      _id: oid("verificationAuth", j.n),
      identifier: `reset-password:${j.jeton}`,
      value: COMPTES_AUTH[j.compte].utilisateur._id.toHexString(),
      expiresAt: j.expire,
      createdAt: MAINTENANT,
      updatedAt: MAINTENANT,
    });
  }

  return docs;
}

/** Comptes de base.mjs propres au lot, pour les tests. */
export const PARAMETRES = COMPTES.parametres;
export const CONFIGURATION = COMPTES.configuration;
export const EQUIPE = COMPTES.equipe;
export const MEMBRES_PARAMETRES = {
  admin: MEMBRES.adminParametres,
  editeur: MEMBRES.editeurParametres,
  membre: MEMBRES.membreParametres,
  comptable: MEMBRES.comptableParametres,
  recruteur: MEMBRES.recruteurParametres,
};
