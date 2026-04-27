// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { auth } from "@/src/lib/auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { apiError } from "./api-error";

/**
 * Verify that the request has a valid authenticated session.
 * Implements: Principle 1 (deny by default), Principle 11 (middleware first line).
 *
 * @param {Request} request - Next.js request object
 * @returns {Promise<{ user: Object, session: Object, cookieHeader: string }>}
 *   - user: Better Auth user object (id, email, name, role, additionalFields...)
 *   - session: Better Auth session object (id, activeOrganizationId, expiresAt...)
 *   - cookieHeader: raw cookie header string for proxying to backend services
 * @throws {NextResponse} 401 "Non authentifie" if no valid session
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1b
export async function requireSession(_request) {
  throw new Error("Not implemented yet — Sprint 1b");
}
