/**
 * Paramètres : tous les boutons de chaque onglet de la fenêtre, pour le
 * propriétaire, l'Éditeur et le Membre (lecture seule) de l'espace
 * « Paramètres ». Chaque élément est essayé sur une fenêtre neuve, avec son
 * effet attendu ; un élément présent sans description fait échouer « Chaque
 * élément de la page est décrit et testé ».
 *
 * Les changements faits à l'intérieur de la fenêtre (changer d'onglet,
 * filtrer les applications, choisir un thème) ne se voient pas dans la page
 * derrière : `parcours` renvoie au test qui les vérifie (parcours.spec.mjs).
 */
import { test } from "../outils.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_PARAMETRES, SESSION_TOKEN_MEMBRE_PARAMETRES, SESSION_TOKEN_PARAMETRES } from "../config.mjs";
import { ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";
import { contenuParametres, menuParametres, ouvrirParametres } from "../authentification/outils-auth.mjs";

const PARAMETRES = COMPTES.parametres;

/**
 * Réglage de sessions connu de la liste (1, 2 ou 3) : avec la valeur « 0 »
 * des comptes de test, l'onglet Sécurité enregistre une valeur vide à
 * l'ouverture (défaut dédié dans securite-session.spec.mjs).
 */
async function sessionsReglees() {
  await (await base()).collection("organization").updateOne({ _id: PARAMETRES.organisation._id }, { $set: { "sessionSettings.maxSessions": 3 } });
}

const onglet = (id) => async (page) => {
  await sessionsReglees();
  await ouvrirParametres(page, id);
};

const FERMER = { parcours: "parcours.spec.mjs : « Annuler » ferme la fenêtre" };
const ONGLET = { parcours: "parcours.spec.mjs : chaque onglet du menu ouvre sa page" };
const DEMANDER_ACCES = { notification: /Demande (d'accès envoyée|déjà envoyée)/ };
const MENU = (initiale, nom) => ({
  [`button ${initiale} ${nom}`]: ONGLET,
  ...Object.fromEntries(
    [
      "Notifications",
      "Préférences",
      "Générale",
      "Coordonnées bancaires",
      "Informations légales",
      "Sécurité",
      "Espaces",
      "Rôles",
      "Applications",
      "Comptes bancaires",
      "Facturation électronique",
      "Abonnement",
      "Facturation",
    ].map((n) => [`button ${n}`, ONGLET]),
  ),
});
const NOTIFICATIONS = {
  "button Annuler": FERMER,
  "tab Activité": { sansEffet: "onglet déjà affiché" },
  "tab Invitations": { etat: /\[selected\]/ },
  "tab Préférences": { etat: /\[selected\]/ },
};
const PREFERENCES = {
  // Relance locale (rien en base) : le tutoriel s'ouvre.
  "button Relancer le tutoriel": { fenetre: "Bienvenue sur Newbi" },
  "button Annuler": FERMER,
  // Cartes de thème : le bouton radio est sous son étiquette, on clique l'étiquette.
  "radio Claire Claire": { parcours: "parcours.spec.mjs : thème et mode daltonien" },
  "radio Sombre Sombre": { parcours: "parcours.spec.mjs : thème et mode daltonien" },
  "radio Système Système": { parcours: "parcours.spec.mjs : thème et mode daltonien" },
  "radio Standard Vert et rouge": { parcours: "parcours.spec.mjs : thème et mode daltonien" },
  "radio Daltonien Bleu et noir": { parcours: "parcours.spec.mjs : thème et mode daltonien" },
  "combobox icône chevron-down": {
    options: [
      "Tableau de bord",
      "Tâches",
      "Calendrier",
      "Factures",
      "Devis",
      "Clients",
      "Transactions",
      "Signatures mail",
      "Transferts de fichiers",
      "Documents partagés",
      "Catalogues",
      "Collaborateurs",
      "Dernière page visitée",
    ],
  },
};
const AIDES_BANQUE = {
  "button Aide IBAN": { parcours: "parcours.spec.mjs : aides des coordonnées bancaires" },
  "button Aide BIC/SWIFT": { parcours: "parcours.spec.mjs : aides des coordonnées bancaires" },
  "button Aide Nom de la banque": { parcours: "parcours.spec.mjs : aides des coordonnées bancaires" },
};
const ROLE = (nom, description, nombre, action) => `button ${nom} ${description} ${nombre} ${action}`;
const ROLES_LISTE = (action) => ({
  [ROLE("Super admin", "Tous les droits, y compris les membres, les rôles et l'abonnement. Un seul par espace.", 1, "Voir")]: { fenetre: "Super admin" },
  [ROLE("Administrateur", "Crée, modifie et supprime partout. Ne gère ni les membres ni l'abonnement.", 1, action)]: {
    fenetre: action === "Voir" ? "Administrateur" : "Modifier « Administrateur »",
  },
  [ROLE("Éditeur", "Crée, modifie et envoie les documents, sans pouvoir supprimer, annuler une facture ni toucher au compte.", 1, action)]: {
    fenetre: action === "Voir" ? "Éditeur" : "Modifier « Éditeur »",
  },
  [ROLE("Membre", "Consulte tout, sans rien pouvoir modifier ni exporter.", 3, action)]: { fenetre: action === "Voir" ? "Membre" : "Modifier « Membre »" },
  [ROLE(
    "Comptable",
    "Consulte les ventes, encaisse les factures, importe des documents, gère les transactions et les documents partagés. Siège gratuit, nombre limité selon l'offre.",
    1,
    action,
  )]: { fenetre: action === "Voir" ? "Comptable" : "Modifier « Comptable »" },
  [`button ${ROLES_PERSO.recrutement.name} Personnalisé ${ROLES_PERSO.recrutement.description} 2 ${action}`]: {
    fenetre: action === "Voir" ? ROLES_PERSO.recrutement.name : `Modifier « ${ROLES_PERSO.recrutement.name} »`,
  },
});

// --- Propriétaire -------------------------------------------------------------

test.describe("Paramètres (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PARAMETRES) });

  verifierBoutons({ test, titre: "Menu des Paramètres", ouvrir: onglet("notifications"), zone: menuParametres, boutons: MENU("N", PARAMETRES.utilisateur.name) });

  verifierBoutons({ test, titre: "Notifications", ouvrir: onglet("notifications"), zone: contenuParametres, boutons: NOTIFICATIONS });

  verifierBoutons({ test, titre: "Préférences", ouvrir: onglet("preferences"), zone: contenuParametres, boutons: PREFERENCES });

  verifierBoutons({
    test,
    titre: "Générale",
    ouvrir: onglet("generale"),
    zone: contenuParametres,
    boutons: {
      "button Uploader un logo": { selecteurDeFichier: true },
      "button Uploader un fichier image": { parcours: "zone de dépôt du logo : même sélecteur que « Uploader un logo »" },
      "button Uploader le logo": { selecteurDeFichier: true },
      "button Annuler": FERMER,
      "button Sauvegarder": { desactive: "rien n'a été modifié" },
      "checkbox Activité réglementée": { etat: /\[checked\]/ },
      "combobox icône chevron-down": { options: ["France", "Belgique", "Suisse", "Canada", "Luxembourg"] },
    },
  });

  verifierBoutons({
    test,
    titre: "Coordonnées bancaires",
    ouvrir: onglet("coordonnees-bancaires"),
    zone: contenuParametres,
    boutons: { ...AIDES_BANQUE, "button Annuler": FERMER, "button Sauvegarder": { desactive: "rien n'a été modifié" } },
  });

  verifierBoutons({
    test,
    titre: "Informations légales",
    ouvrir: onglet("informations-legales"),
    zone: contenuParametres,
    boutons: {
      "button Sélectionner une date": { etat: /\[expanded\]/ },
      "button Annuler": FERMER,
      "button Sauvegarder": { desactive: "rien n'a été modifié" },
      // Interrupteurs sans nom (assujetti à la TVA, franchise) : voir accessibilite.spec.mjs.
      "switch ": { parcours: "accessibilite.spec.mjs : interrupteurs sans nom" },
      // Les 15 premières formes juridiques (18 en tout, comme LEGAL_FORM_GROUPS).
      "combobox icône chevron-down": {
        options: [
          "SARL - Société à responsabilité limitée",
          "EURL - Entreprise unipersonnelle à responsabilité limitée",
          "SAS - Société par actions simplifiée",
          "SASU - Société par actions simplifiée unipersonnelle",
          "SA - Société anonyme",
          "SCA - Société en commandite par actions",
          "SNC - Société en nom collectif",
          "SCS - Société en commandite simple",
          "SELARL - Société d'exercice libéral à responsabilité limitée",
          "SELAS - Société d'exercice libéral par actions simplifiée",
          "SELAFA - Société d'exercice libéral à forme anonyme",
          "SELCA - Société d'exercice libéral en commandite par actions",
          "SCI - Société civile immobilière",
          "SCM - Société civile de moyens",
          "SCP - Société civile professionnelle",
          "… 18 en tout",
        ],
      },
    },
  });

  verifierBoutons({
    test,
    titre: "Sécurité",
    ouvrir: onglet("securite"),
    zone: contenuParametres,
    boutons: {
      "button Déconnexion globale": { parcours: "appareils.spec.mjs : déconnecter tous les autres appareils (compte à part)" },
      "button Annuler": FERMER,
      "switch ": { parcours: "accessibilite.spec.mjs : interrupteur de la double authentification sans nom" },
      "combobox icône chevron-down": { options: ["7 jours", "30 jours", "90 jours"] },
    },
  });

  verifierBoutons({
    test,
    titre: "Rôles",
    ouvrir: onglet("roles"),
    zone: contenuParametres,
    boutons: { "button Créer un rôle": { fenetre: "Nouveau rôle" }, ...ROLES_LISTE("Modifier"), "button Annuler": FERMER },
  });

  verifierBoutons({
    test,
    titre: "Applications",
    ouvrir: onglet("applications"),
    zone: contenuParametres,
    boutons: {
      ...Object.fromEntries(
        ["Toutes", "Paiement", "Banque", "Comptabilité", "Automatisations", "CRM", "Intelligence artificielle", "E-mailing", "Productivité"].map((c) => [
          `button ${c}`,
          { parcours: "parcours.spec.mjs : catégories des applications" },
        ]),
      ),
      "button Annuler": FERMER,
    },
  });

  verifierBoutons({ test, titre: "Comptes bancaires", ouvrir: onglet("comptes-bancaires"), zone: contenuParametres, boutons: { "button Annuler": FERMER } });

  verifierBoutons({
    test,
    titre: "Facturation électronique",
    ouvrir: onglet("facturation-electronique"),
    zone: contenuParametres,
    boutons: {
      "button situation de TVA": { parcours: "parcours.spec.mjs : liens de la facturation électronique vers les autres onglets" },
      "button informations légales": { parcours: "parcours.spec.mjs : liens de la facturation électronique vers les autres onglets" },
      "button À vérifier": { parcours: "parcours.spec.mjs : liens de la facturation électronique vers les autres onglets" },
      "button Activer la facturation électronique": { desactive: "conditions non remplies (régime de TVA à vérifier)" },
      "button Annuler": FERMER,
      "link /": { parcours: "lien externe vers superpdp.tech, nouvel onglet" },
    },
  });

  verifierBoutons({
    test,
    titre: "Abonnement",
    ouvrir: onglet("subscription"),
    zone: contenuParametres,
    boutons: {
      "button Passer en annuel (Économisez 10%)": { parcours: "parcours.spec.mjs : bascule mensuel / annuel" },
      "button Mensuel": { parcours: "parcours.spec.mjs : bascule mensuel / annuel" },
      "button Annuel -10%": { parcours: "parcours.spec.mjs : bascule mensuel / annuel" },
      // Changer d'offre passe par Stripe, injoignable dans les tests.
      "button Downgrade": { parcours: "non testable : Stripe injoignable en CI" },
      "button Plan actuel": { desactive: "offre en cours" },
      "button Choisir": { parcours: "non testable : Stripe injoignable en CI" },
      "button Annuler": FERMER,
    },
  });

  verifierBoutons({
    test,
    titre: "Facturation",
    ouvrir: onglet("facturation"),
    zone: contenuParametres,
    boutons: {
      "button Changer de plan": { parcours: "parcours.spec.mjs : « Changer de plan » ouvre l'onglet Abonnement" },
      // Espace de test sans client Stripe : le portail ne peut pas s'ouvrir.
      "button icône pencil": { notification: /Aucun identifiant client Stripe trouvé/ },
      "button icône plus": { notification: /Aucun identifiant client Stripe trouvé/ },
      "button Ouvrir le portail de paiement": { notification: /Aucun identifiant client Stripe trouvé/ },
      "button Actualiser": { sansEffet: "relit la facturation, rien ne change" },
      "button Résilier l'abonnement": { fenetre: "Résilier l'abonnement" },
      "button Annuler": FERMER,
    },
  });

  verifierBoutons({
    test,
    titre: "Compte",
    ouvrir: onglet("user-info"),
    zone: contenuParametres,
    boutons: {
      "button Upload image": { selecteurDeFichier: true },
      "button Upload image file": { parcours: "zone de dépôt de la photo : même sélecteur que « Upload image »" },
      "button Changer d'adresse e-mail": { fenetre: "Changer d'adresse e-mail" },
      "button Modifier votre numéro": { fenetre: "Modifier le numéro de téléphone" },
      "button Modifier le mot de passe": { fenetre: "Modifier le mot de passe" },
      "button Gérer mon abonnement": { parcours: "parcours.spec.mjs : « Gérer mon abonnement » ouvre l'onglet Abonnement" },
      "button Désactiver": { desactive: "abonnement actif : il faut d'abord le résilier" },
      "button Annuler": FERMER,
    },
  });
});

// --- Éditeur : informations de l'entreprise en lecture, compte fermé ----------

const LECTURE_SEULE_GENERALE = {
  "button Annuler": FERMER,
  "checkbox Activité réglementée": { desactive: "lecture seule" },
  "combobox icône chevron-down": { desactive: "lecture seule" },
};
const LECTURE_SEULE_LEGALES = {
  "button Sélectionner une date": { desactive: "lecture seule" },
  "button Annuler": FERMER,
  "switch ": { desactive: "lecture seule" },
  "combobox icône chevron-down": { desactive: "lecture seule" },
};
const SECURITE_SANS_REGLAGES = {
  "button Déconnexion globale": { parcours: "appareils.spec.mjs : déconnecter tous les autres appareils (compte à part)" },
  "button Annuler": FERMER,
  "switch ": { parcours: "accessibilite.spec.mjs : interrupteur de la double authentification sans nom" },
};
const COMPTE_MEMBRE = {
  "button Upload image": { selecteurDeFichier: true },
  "button Upload image file": { parcours: "zone de dépôt de la photo : même sélecteur que « Upload image »" },
  "button Changer d'adresse e-mail": { fenetre: "Changer d'adresse e-mail" },
  "button Modifier votre numéro": { fenetre: "Modifier le numéro de téléphone" },
  "button Modifier le mot de passe": { fenetre: "Modifier le mot de passe" },
  "button Gérer mon abonnement": { parcours: "parcours.spec.mjs : « Gérer mon abonnement » ouvre l'onglet Abonnement" },
  "button Désactiver": { desactive: "abonnement actif de l'espace" },
  "button Annuler": FERMER,
};
const INACCESSIBLE = { "button Demander l'accès": DEMANDER_ACCES, "button Annuler": FERMER };

for (const [role, token, initiale, nom] of [
  ["éditeur", SESSION_TOKEN_EDITEUR_PARAMETRES, "É", "Élio Éditeur"],
  ["membre, lecture seule", SESSION_TOKEN_MEMBRE_PARAMETRES, "M", "Mia Membre"],
]) {
  test.describe(`Paramètres (${role})`, () => {
    test.use({ storageState: connecte(token) });

    verifierBoutons({ test, titre: "Menu des Paramètres", ouvrir: onglet("notifications"), zone: menuParametres, boutons: MENU(initiale, nom) });
    verifierBoutons({ test, titre: "Notifications", ouvrir: onglet("notifications"), zone: contenuParametres, boutons: NOTIFICATIONS });
    verifierBoutons({ test, titre: "Préférences", ouvrir: onglet("preferences"), zone: contenuParametres, boutons: PREFERENCES });
    verifierBoutons({ test, titre: "Générale", ouvrir: onglet("generale"), zone: contenuParametres, boutons: LECTURE_SEULE_GENERALE });
    verifierBoutons({ test, titre: "Coordonnées bancaires", ouvrir: onglet("coordonnees-bancaires"), zone: contenuParametres, boutons: { ...AIDES_BANQUE, "button Annuler": FERMER } });
    verifierBoutons({ test, titre: "Informations légales", ouvrir: onglet("informations-legales"), zone: contenuParametres, boutons: LECTURE_SEULE_LEGALES });
    verifierBoutons({ test, titre: "Sécurité", ouvrir: onglet("securite"), zone: contenuParametres, boutons: SECURITE_SANS_REGLAGES });
    verifierBoutons({ test, titre: "Rôles", ouvrir: onglet("roles"), zone: contenuParametres, boutons: { ...ROLES_LISTE("Voir"), "button Annuler": FERMER } });
    for (const [id, titre] of [
      ["applications", "Applications"],
      ["comptes-bancaires", "Comptes bancaires"],
      ["facturation-electronique", "Facturation électronique"],
      ["subscription", "Abonnement"],
      ["facturation", "Facturation"],
    ]) {
      verifierBoutons({ test, titre, ouvrir: onglet(id), zone: contenuParametres, boutons: INACCESSIBLE });
    }
    verifierBoutons({ test, titre: "Compte", ouvrir: onglet("user-info"), zone: contenuParametres, boutons: COMPTE_MEMBRE });
  });
}
