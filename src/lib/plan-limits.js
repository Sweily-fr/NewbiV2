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
 * - `maxPaidSeats`: Nombre max de sièges payants au-delà de la limite incluse (-1 = illimité)
 */

export const PLAN_LIMITS = {
  freelance: {
    // Freelance: Owner + 1 utilisateur payant max + 1 comptable gratuit
    invitableUsers: 0,
    accountants: 1,
    totalUsers: 1,
    canAddPaidUsers: true,
    maxPaidSeats: 1,
    seatPrice: 7.49,
    workspaces: 1,
    bankAccounts: 1,
    storage: 50,
    // Taille max par transfert de fichier (en Go)
    fileTransferMaxGB: 5,
    // Rôles disponibles à l'invitation (member = siège payant, aucun inclus)
    availableRoles: ["member", "accountant"],
    // Exports comptables
    exports: ["csv", "excel"],
    // E-signature (SES avec quota mensuel)
    esignature: "ses",
    esignatureMonthlyQuota: 3,
    // Automatisations
    documentAutomations: 5,
    clientAutomations: true,
    crmEmailAutomations: false,
    // Analytics
    advancedAnalytics: true,
    // Prévisions trésorerie
    forecastMonths: 24,
    // Champs personnalisés (par entité)
    customFields: 5,
    // Segments clients dynamiques
    clientSegments: false,
    // Calendriers connectés
    calendarConnections: 1,
    // Modèles de documents
    documentTemplates: 10,
    // SMTP personnalisé
    customSmtp: false,
    // E-invoicing (Factur-X / SuperPDP) + archivage légal
    eInvoicing: true,
    eInvoicingArchival: true,
  },
  pme: {
    // PME: Owner + jusqu'à 10 collaborateurs
    invitableUsers: 10,
    accountants: 3,
    totalUsers: 11,
    canAddPaidUsers: true,
    maxPaidSeats: -1,
    seatPrice: 7.49,
    workspaces: 1,
    bankAccounts: 3,
    storage: 200,
    // Taille max par transfert de fichier (en Go)
    fileTransferMaxGB: 15,
    // Rôles disponibles à l'invitation
    availableRoles: ["member", "accountant", "admin"],
    // Exports comptables
    exports: ["csv", "excel", "fec"],
    // E-signature (SES avec quota mensuel)
    esignature: "ses",
    esignatureMonthlyQuota: 20,
    // Automatisations (illimité = -1)
    documentAutomations: -1,
    clientAutomations: true,
    crmEmailAutomations: true,
    // Analytics
    advancedAnalytics: true,
    // Prévisions trésorerie
    forecastMonths: 24,
    // Champs personnalisés (illimité = -1)
    customFields: -1,
    // Segments clients dynamiques
    clientSegments: true,
    // Calendriers connectés
    calendarConnections: 3,
    // Modèles de documents (illimité = -1)
    documentTemplates: -1,
    // SMTP personnalisé
    customSmtp: false,
    // E-invoicing (Factur-X / SuperPDP) + archivage légal
    eInvoicing: true,
    eInvoicingArchival: true,
  },
  entreprise: {
    // Entreprise: Owner + jusqu'à 25 collaborateurs
    invitableUsers: 25,
    accountants: 5,
    totalUsers: 26,
    canAddPaidUsers: true,
    maxPaidSeats: -1,
    seatPrice: 5.99,
    workspaces: 1,
    bankAccounts: 5,
    storage: 500,
    // Taille max par transfert de fichier (en Go)
    fileTransferMaxGB: 50,
    // Rôles disponibles à l'invitation (tous les rôles)
    availableRoles: ["member", "accountant", "admin", "viewer"],
    // Exports comptables (tous les formats)
    exports: ["csv", "excel", "fec", "sage", "cegid"],
    // E-signature (SES + QES, illimité)
    esignature: "qes",
    esignatureMonthlyQuota: -1,
    // Automatisations (illimité = -1)
    documentAutomations: -1,
    clientAutomations: true,
    crmEmailAutomations: true,
    // Analytics
    advancedAnalytics: true,
    // Prévisions trésorerie
    forecastMonths: 24,
    // Champs personnalisés (illimité = -1)
    customFields: -1,
    // Segments clients dynamiques
    clientSegments: true,
    // Calendriers connectés (illimité = -1)
    calendarConnections: -1,
    // Modèles de documents (illimité = -1)
    documentTemplates: -1,
    // SMTP personnalisé
    customSmtp: true,
    // E-invoicing (Factur-X / SuperPDP) + archivage légal
    eInvoicing: true,
    eInvoicingArchival: true,
  },
};

// Prix par siège additionnel (fallback, préférer getSeatPrice(plan))
export const SEAT_PRICE = 7.49;

/**
 * Récupère le prix du siège supplémentaire pour un plan
 * @param {string} planName - Nom du plan
 * @returns {number} Prix du siège en €/mois
 */
export function getSeatPrice(planName) {
  const limits = getPlanLimits(planName);
  return limits.seatPrice || SEAT_PRICE;
}

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
