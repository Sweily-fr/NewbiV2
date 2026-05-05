import { mongoDb } from "@/src/lib/mongodb";
import { apiError } from "./api-error";

/**
 * Verify that the organization has an active or trialing subscription.
 * Implements: Principle 11 (subscription verified at data level, not just UI).
 *
 * @param {string} userId - User ID from session (for logging/context)
 * @param {string} orgId - Organization ID (referenceId in subscription collection)
 * @returns {Promise<{ active: boolean, plan: string, status: string, expiresAt?: Date }>}
 *   - active: always true if returned (throws otherwise)
 *   - plan: "freelance" | "pme" | "entreprise"
 *   - status: "active" | "trialing" | "canceled" (with valid period)
 *   - expiresAt: subscription period end date (if applicable)
 * @throws {NextResponse} 402 "Abonnement requis" if no active subscription found
 */
export async function requireActiveSubscription(userId, orgId) {
  // Search by referenceId (string) — this is how org-creation.js stores it
  const subscription = await mongoDb.collection("subscription").findOne({
    referenceId: orgId,
  });

  if (!subscription) {
    throw apiError(402, "Aucun abonnement actif");
  }

  const { status, periodEnd, plan } = subscription;

  // Active or trialing — straightforward
  if (status === "active" || status === "trialing") {
    return {
      active: true,
      plan: plan || "freelance",
      status,
      expiresAt: periodEnd ? new Date(periodEnd) : undefined,
    };
  }

  // Canceled but still within paid period
  if (status === "canceled" && periodEnd && new Date(periodEnd) > new Date()) {
    return {
      active: true,
      plan: plan || "freelance",
      status,
      expiresAt: new Date(periodEnd),
    };
  }

  // Any other status (past_due, incomplete, expired, canceled+expired)
  throw apiError(402, "Aucun abonnement actif");
}
