import { timingSafeEqual } from "crypto";
import { apiError } from "./api-error";

/**
 * Verify that the request carries a valid internal API secret.
 * Used for server-to-server calls (Puppeteer PDF generation, crons, internal services).
 * Implements: Principle 4 (internal services authenticate with dedicated mechanism).
 *
 * @param {Request} request - Next.js request object
 * @returns {void}
 * @throws {NextResponse} 401 "Non authentifié" if X-Internal-Secret header is missing or invalid
 * @throws {NextResponse} 500 "Erreur de configuration" if INTERNAL_API_SECRET env var is not set
 */
export function requireInternalSecret(request) {
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    console.error(
      "❌ [INTERNAL SECRET] INTERNAL_API_SECRET is not defined in environment variables",
    );
    throw apiError(500, "Erreur de configuration");
  }

  const provided = request.headers.get("x-internal-secret") || "";

  if (!provided || !constantTimeEqual(provided, expected)) {
    throw apiError(401, "Non authentifié");
  }
}

/**
 * Check if the request carries a valid internal API secret, without throwing.
 * Used for dual-access routes (internal OR authenticated user).
 * Implements: Principle 4 (internal services authenticate with dedicated mechanism).
 *
 * @param {Request} request - Next.js request object
 * @returns {boolean} true if valid internal secret is present
 */
export function hasInternalSecret(request) {
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    console.warn(
      "⚠️ [INTERNAL SECRET] INTERNAL_API_SECRET is not defined — hasInternalSecret returns false",
    );
    return false;
  }

  const provided = request.headers.get("x-internal-secret") || "";

  if (!provided) {
    return false;
  }

  return constantTimeEqual(provided, expected);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Both strings are padded/truncated to the same length before comparison.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function constantTimeEqual(a, b) {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  // timingSafeEqual requires same length — pad the shorter one
  if (bufA.length !== bufB.length) {
    // Compare against b anyway to avoid short-circuiting on length
    const padded = Buffer.alloc(bufB.length);
    bufA.copy(padded);
    try {
      timingSafeEqual(padded, bufB);
    } catch {
      // Shouldn't happen with same-length buffers, but be safe
    }
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
