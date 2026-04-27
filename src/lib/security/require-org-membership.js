import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId } from "./to-object-id";
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
 * @throws {NextResponse} 403 "Non autorisé" if not a member or insufficient role
 */
export async function requireOrgMembership(userId, orgId, requiredRole) {
  const userObjectId = toObjectId(userId);
  const orgObjectId = toObjectId(orgId);

  const member = await mongoDb.collection("member").findOne({
    userId: userObjectId,
    organizationId: orgObjectId,
  });

  if (!member) {
    throw apiError(403, "Non autorisé");
  }

  const role = (member.role || "member").toLowerCase();

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(role)) {
      throw apiError(403, "Rôle insuffisant");
    }
  }

  return { role, organizationId: orgObjectId };
}
