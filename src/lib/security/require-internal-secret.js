// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1d implementation
import { apiError } from "./api-error";

/**
 * Verify that the request carries a valid internal API secret.
 * Used for server-to-server calls (Puppeteer PDF generation, crons, internal services).
 * Implements: Principle 4 (internal services authenticate with dedicated mechanism).
 *
 * @param {Request} request - Next.js request object
 * @returns {void}
 * @throws {NextResponse} 401 "Non autorise" if X-Internal-Secret header is missing or invalid
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1d
export function requireInternalSecret(_request) {
  throw new Error("Not implemented yet — Sprint 1d");
}

/**
 * Check if the request carries a valid internal API secret, without throwing.
 * Used for dual-access routes (internal OR authenticated user).
 * Implements: Principle 4 (internal services authenticate with dedicated mechanism).
 *
 * @param {Request} request - Next.js request object
 * @returns {boolean} true if valid internal secret is present
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1d
export function hasInternalSecret(_request) {
  throw new Error("Not implemented yet — Sprint 1d");
}
