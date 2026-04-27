// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1c implementation
import { mongoDb } from "@/src/lib/mongodb";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1c implementation
import { toObjectId } from "./to-object-id";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1c implementation
import { apiError } from "./api-error";

/**
 * Verify that a user is a member of the specified organization, optionally with a required role.
 * Implements: Principle 2 (auth != authz), Principle 6 (unified RBAC), Principle 10 (typed IDs).
 *
 * @param {string|import("mongodb").ObjectId} userId - User ID from session
 * @param {string|import("mongodb").ObjectId} orgId - Organization ID from URL param or session
 * @param {string|string[]} [requiredRole] - Optional role(s) required. If omitted, any membership suffices.
 *   Valid roles: "owner", "admin", "member", "viewer", "accountant"
 * @returns {Promise<{ role: string, organizationId: import("mongodb").ObjectId }>}
 *   - role: the user's role in the organization (normalized to lowercase)
 *   - organizationId: the organization ObjectId (for use in subsequent queries)
 * @throws {NextResponse} 403 "Non autorise" if not a member or insufficient role
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1c
export async function requireOrgMembership(_userId, _orgId, _requiredRole) {
  throw new Error("Not implemented yet — Sprint 1c");
}
