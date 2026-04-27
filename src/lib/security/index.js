/**
 * Security helpers — barrel export.
 *
 * All security helpers live in this directory and are re-exported here
 * for convenient imports: import { requireSession, apiError } from "@/src/lib/security";
 *
 * See docs/security/architecture.md for the full specification of each helper.
 * See docs/security/principles.md for the principles they implement.
 */

export { requireSession } from "./require-session";
export { requireOrgMembership } from "./require-org-membership";
export { requireActiveSubscription } from "./require-active-subscription";
export {
  requireInternalSecret,
  hasInternalSecret,
} from "./require-internal-secret";
export { apiError } from "./api-error";
export { withErrorHandler } from "./with-error-handler";
export { toObjectId } from "./to-object-id";
export { assertModified } from "./assert-modified";
