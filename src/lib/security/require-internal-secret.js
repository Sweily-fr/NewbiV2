import { createHash, timingSafeEqual } from "crypto";
import { apiError } from "./api-error";

/**
 * Secret interne partagé avec l'API (en-tête x-internal-secret).
 *
 * Seule vérification du secret reçu dans le site : routes Puppeteer, PDF,
 * leads, etc. passent par requireInternalSecret / hasInternalSecret.
 *
 * Rotation sans coupure : la réception accepte INTERNAL_API_SECRET OU
 * INTERNAL_API_SECRET_ALT (facultative, ignorée si vide). L'envoi utilise
 * toujours INTERNAL_API_SECRET. Procédure : newbi-api,
 * docs/rotation-secret-interne.md.
 */

const INTERNAL_SECRET_HEADER = "x-internal-secret";

const isUsable = (value) => typeof value === "string" && value.trim() !== "";

// Empreintes de longueur fixe : la comparaison ne dépend ni du contenu ni
// de la longueur des valeurs comparées.
const digest = (value) => createHash("sha256").update(value, "utf8").digest();

/**
 * Secrets acceptés en réception : principal puis ALT, valeurs vides ignorées.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {string[]}
 */
export function getAcceptedInternalSecrets(env = process.env) {
  return [env.INTERNAL_API_SECRET, env.INTERNAL_API_SECRET_ALT].filter(
    isUsable,
  );
}

/**
 * Le secret reçu correspond-il à l'un des secrets acceptés ?
 * Chaque secret accepté est comparé (pas de sortie anticipée), en temps
 * constant.
 *
 * @param {unknown} provided
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function isAcceptedInternalSecret(provided, env = process.env) {
  if (typeof provided !== "string" || provided === "") return false;

  const providedDigest = digest(provided);
  let match = false;
  for (const secret of getAcceptedInternalSecrets(env)) {
    match = timingSafeEqual(providedDigest, digest(secret)) || match;
  }
  return match;
}

/**
 * Verify that the request carries a valid internal API secret.
 * Used for server-to-server calls (Puppeteer PDF generation, crons, internal services).
 * Implements: Principle 4 (internal services authenticate with dedicated mechanism).
 *
 * @param {Request} request - Next.js request object
 * @returns {void}
 * @throws {NextResponse} 401 "Non authentifié" if X-Internal-Secret header is missing or invalid
 * @throws {NextResponse} 500 "Erreur de configuration" if no internal secret is configured
 */
export function requireInternalSecret(request) {
  if (getAcceptedInternalSecrets().length === 0) {
    console.error(
      "❌ [INTERNAL SECRET] INTERNAL_API_SECRET is not defined in environment variables",
    );
    throw apiError(500, "Erreur de configuration");
  }

  const provided = request.headers.get(INTERNAL_SECRET_HEADER) || "";

  if (!isAcceptedInternalSecret(provided)) {
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
  if (getAcceptedInternalSecrets().length === 0) {
    console.warn(
      "⚠️ [INTERNAL SECRET] INTERNAL_API_SECRET is not defined: hasInternalSecret returns false",
    );
    return false;
  }

  const provided = request.headers.get(INTERNAL_SECRET_HEADER) || "";

  return isAcceptedInternalSecret(provided);
}
