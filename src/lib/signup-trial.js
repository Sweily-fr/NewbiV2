/**
 * Essai gratuit des nouvelles inscriptions (décision du 18/11/2026).
 *
 * À l'inscription, le client choisit son offre et entre sa carte sur
 * Stripe Checkout : l'abonnement démarre en essai (`trialing`) pendant
 * SIGNUP_TRIAL_DAYS jours, puis Stripe prélève automatiquement l'offre
 * choisie, sauf résiliation avant la fin de l'essai.
 *
 * La durée n'est réglée nulle part sur Stripe : elle est transmise à chaque
 * Checkout (`subscription_data.trial_period_days`, cf.
 * app/api/create-org-subscription/route.js).
 *
 * Ne concerne pas les clients créés par un cabinet comptable, qui gardent
 * leur essai sans carte (CLIENT_APP_TRIAL_DAYS, managed-clients.js), ni les
 * essais sans carte de 30 jours accordés avant le 18/11/2026, qui vont à
 * leur terme (ENABLE_APP_TRIAL).
 *
 * Module sans dépendance serveur : importable côté client.
 */
export const SIGNUP_TRIAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Date du premier prélèvement pour un essai qui démarre maintenant.
 * @param {Date} [from]
 * @returns {Date}
 */
export function firstChargeDate(from = new Date()) {
  return new Date(from.getTime() + SIGNUP_TRIAL_DAYS * DAY_MS);
}
