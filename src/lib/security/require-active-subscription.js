import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError } from "./api-error";
import { isAppTrialEnabled } from "../feature-flags";
import { isTrialAppActive } from "../trial-app";

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
  // App-managed trial check (feature-flagged). When ENABLE_APP_TRIAL is OFF
  // (default), this block is skipped and the legacy Stripe-based check below
  // runs unchanged — zero behavioural change for existing users.
  if (isAppTrialEnabled()) {
    try {
      const orgObjectId = ObjectId.isValid(orgId) ? new ObjectId(orgId) : null;
      const orgDoc = orgObjectId
        ? await mongoDb.collection("organization").findOne(
            { _id: orgObjectId },
            {
              projection: {
                isTrialActive: 1,
                trialEndDate: 1,
                stripeTrialActive: 1,
              },
            },
          )
        : null;
      if (isTrialAppActive(orgDoc)) {
        return {
          active: true,
          plan: "freelance",
          status: "trialing",
          expiresAt: orgDoc.trialEndDate
            ? new Date(orgDoc.trialEndDate)
            : undefined,
        };
      }
    } catch {
      // Non-fatal — fall through to legacy Stripe-based check.
    }
  }

  // Search by referenceId (string) — this is how org-creation.js stores it
  const subscription = await mongoDb.collection("subscription").findOne({
    referenceId: orgId,
  });

  if (!subscription) {
    throw apiError(402, "Aucun abonnement actif");
  }

  const { status, periodEnd, plan } = subscription;

  // Active / trialing / past_due — straightforward.
  // Décision #12 (Lot 5) — past_due est un grace period Stripe pendant les
  // retries. Aligné avec rbac.js et le dashboard layout : l'utilisateur garde
  // l'accès pendant que Stripe re-tente le paiement.
  if (status === "active" || status === "trialing" || status === "past_due") {
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

  // Any other status (incomplete, expired, canceled+expired)
  throw apiError(402, "Aucun abonnement actif");
}
