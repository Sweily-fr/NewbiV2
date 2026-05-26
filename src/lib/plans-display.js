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
