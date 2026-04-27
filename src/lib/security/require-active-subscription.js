// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1c implementation
import { mongoDb } from "@/src/lib/mongodb";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1c implementation
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1c
export async function requireActiveSubscription(_userId, _orgId) {
  throw new Error("Not implemented yet — Sprint 1c");
}
