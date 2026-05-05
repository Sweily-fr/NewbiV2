import { auth } from "@/src/lib/auth";
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
export async function requireSession(request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw apiError(401, "Non authentifié");
  }

  return {
    user: session.user,
    session: session.session,
    cookieHeader: request.headers.get("cookie") || "",
  };
}
