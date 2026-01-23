/**
 * Configuration centralisée des limites par plan d'abonnement
 *
 * IMPORTANT: Ce fichier est la source unique de vérité pour les limites.
 * Ne pas définir de limites ailleurs dans le code.
 *
 * Logique des limites:
 * - `invitableUsers`: Nombre d'utilisateurs qu'on peut INVITER (exclut l'owner)
 * - `accountants`: Nombre de comptables gratuits
 * - `totalUsers`: Nombre total d'utilisateurs (owner + invités) pour Stripe
 * - `canAddPaidUsers`: Si des sièges payants sont disponibles au-delà de la limite
 */

export const PLAN_LIMITS = {
  freelance: {
    // Freelance: Owner seul, pas d'utilisateurs invités
    invitableUsers: 0,      // 0 utilisateur invité (owner seul)
    accountants: 1,         // 1 comptable gratuit
    totalUsers: 1,          // 1 utilisateur total (owner)
    canAddPaidUsers: false, // Pas de siège payant possible
    workspaces: 1,
    bankAccounts: 1,
    storage: 50,
    projects: 50,
    invoices: 500,
  },
  pme: {
    // PME: Owner + jusqu'à 10 collaborateurs
    invitableUsers: 10,     // 10 utilisateurs invités
    accountants: 3,         // 3 comptables gratuits
    totalUsers: 11,         // 11 utilisateurs total (owner + 10)
    canAddPaidUsers: true,  // Sièges payants possibles (7,49€/mois)
    workspaces: 1,
    bankAccounts: 3,
    storage: 200,
    projects: 200,
    invoices: 2000,
  },
  entreprise: {
    // Entreprise: Owner + jusqu'à 25 collaborateurs
    invitableUsers: 25,     // 25 utilisateurs invités
    accountants: 5,         // 5 comptables gratuits
    totalUsers: 26,         // 26 utilisateurs total (owner + 25)
    canAddPaidUsers: true,  // Sièges payants possibles (7,49€/mois)
    workspaces: 1,
    bankAccounts: 5,
    storage: 500,
    projects: 500,
    invoices: 5000,
  },
};

// Prix par siège additionnel
export const SEAT_PRICE = 7.49;

/**
 * Récupère les limites d'un plan
 * @param {string} planName - Nom du plan (freelance, pme, entreprise)
 * @returns {Object} Limites du plan
 */
export function getPlanLimits(planName) {
  const normalizedPlan = planName?.toLowerCase() || 'freelance';
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.freelance;
}

/**
 * Vérifie si un plan permet d'inviter des utilisateurs
 * @param {string} planName
 * @returns {boolean}
 */
export function canInviteUsers(planName) {
  const limits = getPlanLimits(planName);
  return limits.invitableUsers > 0 || limits.canAddPaidUsers;
}

/**
 * Vérifie si un plan permet d'ajouter des sièges payants
 * @param {string} planName
 * @returns {boolean}
 */
export function canAddPaidSeats(planName) {
  return getPlanLimits(planName).canAddPaidUsers;
}
