/**
 * SOURCE UNIQUE de vérité pour l'AFFICHAGE des plans d'abonnement.
 *
 * Avant ce module, les prix étaient dupliqués dans ~9 fichiers (landing,
 * pricing modal, settings, signup, create-workspace, FAQ, etc.), avec :
 *   - un bug math : annualTotal Freelance = 157,56 € alors que 16,19 × 12
 *     = 194,28 € (le 157,56 venait d'une copie d'une ancienne grille 14,59 HT).
 *   - une incohérence de label : le plan `pme` (clé) s'affichait tantôt
 *     "PME" (settings) tantôt "TPE" (landing/signup/workspace).
 *   - une incohérence HT/TTC : la FAQ disait "HT", la landing "TTC", les
 *     autres écrans rien.
 *
 * Règle d'or :
 *   - Les TOTAUX ANNUELS sont DÉRIVÉS par calcul (annualMonthlyPrice × 12).
 *     Jamais écrits en dur — sinon le bug Freelance peut réapparaître à la
 *     prochaine modification de prix.
 *   - Les clés techniques (freelance / pme / entreprise) NE CHANGENT PAS.
 *     Le label affiché du plan `pme` est désormais "TPE" partout.
 *   - Tous les prix sont en TTC.
 *
 * Pas d'imports server-only ici : ce module doit être consommable depuis
 * n'importe quel composant (server ou client) sans casser le bundle.
 */

export const PLANS_DISPLAY = [
  {
    key: "freelance",
    displayName: "Freelance",
    description: "Pour les indépendants",
    monthlyPrice: 17.99,
    annualMonthlyPrice: 16.19,
  },
  {
    key: "pme",
    displayName: "TPE",
    description: "Pour les équipes en croissance",
    monthlyPrice: 48.99,
    annualMonthlyPrice: 44.09,
  },
  {
    key: "entreprise",
    displayName: "Entreprise",
    description: "Pour les structures avancées",
    monthlyPrice: 94.99,
    annualMonthlyPrice: 85.49,
  },
];

export const CURRENCY_SYMBOL = "€";
export const PRICE_QUALIFIER = "TTC";

/**
 * Matrice comparative des fonctionnalités par plan, groupée en sections.
 * Consommée par la landing (PricingSection) ET les paramètres entreprise
 * (subscription-section) — ne jamais redéfinir localement dans un composant,
 * sinon les deux écrans divergent (c'est déjà arrivé : relances/OCR/
 * utilisateurs supplémentaires affichaient des valeurs différentes).
 *
 * Valeurs : true → coche, false → croix, string → texte affiché tel quel.
 */
export const PLAN_FEATURES_SECTIONS = [
  {
    title: "Général",
    features: [
      {
        name: "Utilisateurs inclus",
        tooltip: "Nombre d'utilisateurs inclus dans votre plan",
        freelance: "1 utilisateur",
        pme: "Jusqu'à 10",
        entreprise: "Jusqu'à 25",
      },
      {
        name: "Accès comptables gratuits",
        tooltip: "Invitez un accès comptable sans frais supplémentaires",
        freelance: "1",
        pme: "3",
        entreprise: "5",
      },
      {
        name: "Utilisateurs supplémentaires",
        tooltip: "Ajoutez des collaborateurs au-delà de votre limite",
        freelance: "7,49€/mois",
        pme: "7,49€/mois",
        entreprise: "5,99€/mois",
      },
      {
        name: "Stockage documents",
        tooltip: "Espace de stockage pour vos documents et fichiers",
        freelance: "50 Go",
        pme: "200 Go",
        entreprise: "500 Go",
      },
      {
        name: "Création d'organisation",
        tooltip: "Créez et gérez votre organisation",
        freelance: true,
        pme: true,
        entreprise: true,
      },
    ],
  },
  {
    title: "Facturation",
    features: [
      {
        name: "Factures & Devis",
        tooltip: "Créez et gérez vos factures et devis professionnels",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Relance automatique impayés",
        tooltip: "Automatisez vos relances de factures impayées",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Exports comptables",
        tooltip: "Exportez vos données au format comptable",
        freelance: "CSV / Excel",
        pme: "CSV / Excel / FEC",
        entreprise: "Tous formats",
      },
      {
        name: "E-signature devis",
        tooltip: "Faites signer vos devis électroniquement",
        freelance: "3/mois",
        pme: "20/mois",
        entreprise: "Illimité",
      },
      {
        name: "Facturation électronique",
        tooltip: "Factur-X et conformité réglementaire 2026",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Archivage légal",
        tooltip:
          "Archivage légal conforme via SuperPDP pour vos factures électroniques",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Modèles de documents",
        tooltip: "Sauvegardez des modèles de factures et devis réutilisables",
        freelance: "10",
        pme: "Illimité",
        entreprise: "Illimité",
      },
    ],
  },
  {
    title: "Gestion",
    features: [
      {
        name: "CRM client",
        tooltip: "Gérez vos relations clients efficacement",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Catalogue produits",
        tooltip: "Créez votre catalogue de produits et services",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Scan de document OCR",
        tooltip: "Numérisez automatiquement vos documents par photo",
        freelance: "50/mois",
        pme: true,
        entreprise: true,
      },
      {
        name: "Connexion bancaire",
        tooltip: "Synchronisez vos comptes bancaires automatiquement",
        freelance: "1 compte",
        pme: "3 comptes",
        entreprise: "5 comptes",
      },
      {
        name: "Gestion de trésorerie",
        tooltip: "Suivez votre trésorerie en temps réel",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Gestion des projets",
        tooltip: "Organisez vos projets avec des tableaux Kanban",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Transfert de fichier",
        tooltip: "Partagez vos fichiers volumineux en toute sécurité",
        freelance: "5 Go/transfert",
        pme: "15 Go/transfert",
        entreprise: "50 Go/transfert",
      },
      {
        name: "Signature de mail",
        tooltip: "Créez des signatures de mail professionnelles",
        freelance: "1",
        pme: "10",
        entreprise: "25",
      },
      {
        name: "Champs personnalisés",
        tooltip: "Ajoutez des champs sur mesure à vos clients et produits",
        freelance: "5",
        pme: "Illimité",
        entreprise: "Illimité",
      },
      {
        name: "Calendrier connecté",
        tooltip: "Synchronisez Google, Outlook ou Apple Calendar",
        freelance: "1",
        pme: "3",
        entreprise: "Illimité",
      },
    ],
  },
  {
    title: "Automatisations",
    features: [
      {
        name: "Automatisations documents",
        tooltip: "Automatisez le classement de vos documents",
        freelance: "5 règles",
        pme: "Illimité",
        entreprise: "Illimité",
      },
      {
        name: "Automatisations CRM",
        tooltip: "Automatisez la gestion de vos listes clients",
        freelance: "Listes auto",
        pme: "Listes auto + Emails",
        entreprise: "Listes auto + Emails",
      },
      {
        name: "Segments clients",
        tooltip: "Créez des segments dynamiques avec des filtres avancés",
        freelance: false,
        pme: true,
        entreprise: true,
      },
    ],
  },
  {
    title: "Analytics & Prévisions",
    features: [
      {
        name: "Analytics & rapports",
        tooltip: "Analysez la performance de votre activité",
        freelance: true,
        pme: true,
        entreprise: true,
      },
      {
        name: "Prévisions de trésorerie",
        tooltip: "Anticipez votre trésorerie avec des prévisions IA",
        freelance: true,
        pme: true,
        entreprise: true,
      },
    ],
  },
  {
    title: "Support",
    features: [
      {
        name: "Support prioritaire",
        tooltip: "Assistance prioritaire par email et chat",
        freelance: false,
        pme: true,
        entreprise: true,
      },
    ],
  },
];

/**
 * Récupère la définition d'affichage d'un plan par sa clé technique.
 * Retourne null si la clé est inconnue.
 */
export function getPlanDisplay(key) {
  return PLANS_DISPLAY.find((p) => p.key === key) ?? null;
}

/**
 * Formate un nombre en prix français : 17.99 → "17,99 €"
 */
export function formatPrice(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  return `${amount.toFixed(2).replace(".", ",")} ${CURRENCY_SYMBOL}`;
}

/**
 * Total annuel TTC — CALCULÉ à partir du tarif annualisé mensuel.
 * Jamais écrire en dur. Retourne un nombre (à formatter via formatPrice).
 */
export function getAnnualTotalAmount(plan) {
  if (!plan || typeof plan.annualMonthlyPrice !== "number") return 0;
  return Math.round(plan.annualMonthlyPrice * 12 * 100) / 100;
}

/**
 * Helper d'affichage prêt-à-consommer pour un plan.
 *
 * Renvoie un objet :
 *   {
 *     key,
 *     displayName,
 *     description,
 *     monthly:           "17,99 €/mois TTC",
 *     annualPerMonth:    "16,19 €/mois TTC",
 *     annualTotal:       "194,28 € TTC/an",
 *     monthlyAmount:     17.99,
 *     annualMonthlyAmount: 16.19,
 *     annualTotalAmount: 194.28,
 *   }
 *
 * Options : { includeTtc: boolean = true, suffix: "/mois" }
 */
export function getPlanPricingStrings(key, opts = {}) {
  const plan = getPlanDisplay(key);
  if (!plan) return null;
  const ttc = opts.includeTtc !== false ? ` ${PRICE_QUALIFIER}` : "";
  const annualTotalAmount = getAnnualTotalAmount(plan);
  const fmt = (n) => `${n.toFixed(2).replace(".", ",")} ${CURRENCY_SYMBOL}`;
  return {
    key: plan.key,
    displayName: plan.displayName,
    description: plan.description,
    monthlyAmount: plan.monthlyPrice,
    annualMonthlyAmount: plan.annualMonthlyPrice,
    annualTotalAmount,
    monthly: `${fmt(plan.monthlyPrice)}/mois${ttc}`,
    annualPerMonth: `${fmt(plan.annualMonthlyPrice)}/mois${ttc}`,
    annualTotal: `${fmt(annualTotalAmount)}${ttc}/an`,
  };
}
