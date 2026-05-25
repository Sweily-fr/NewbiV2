/**
 * App-managed trial helpers.
 *
 * Mirror of newbi-api/src/utils/trialApp.js. Both implementations must match
 * exactly — this is the single source of truth for "is this org currently
 * inside its 14-day app-managed trial window".
 *
 * Fields read from the Organization document (Better Auth):
 *   - isTrialActive    (boolean)
 *   - trialEndDate     (ISO string)
 *   - hasUsedTrial     (boolean, anti-abuse — not read here)
 *   - stripeTrialActive (boolean, discriminates legacy Stripe trial — not read here)
 */

export function isTrialAppActive(org) {
  if (!org) return false;
  if (org.isTrialActive !== true) return false;
  if (!org.trialEndDate) return false;
  const end = new Date(org.trialEndDate);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() > Date.now();
}
