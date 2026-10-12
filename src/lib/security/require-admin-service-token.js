import crypto from "crypto";
import { apiError } from "./api-error";

/**
 * Jeton de service du back-office newbi-admin (admin.newbi.fr), qui n'a
 * qu'un accès en lecture à la base. Mêmes règles que newbi-api
 * (middlewares/admin-service-token.js) : Authorization: Bearer
 * <ADMIN_SERVICE_TOKEN>, fermé si la variable est absente ou trop courte,
 * ADMIN_SERVICE_TOKEN_ALT accepté pendant une rotation, admin connecté
 * transmis dans x-admin-email pour le journal.
 *
 * @param {Request} request
 * @returns {{ adminEmail: string }}
 * @throws {NextResponse} 503 / 401 / 400
 */
const MIN_TOKEN_LENGTH = 32;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const digest = (value) =>
  crypto.createHash("sha256").update(value, "utf8").digest();

export function requireAdminServiceToken(request) {
  const accepted = [
    process.env.ADMIN_SERVICE_TOKEN,
    process.env.ADMIN_SERVICE_TOKEN_ALT,
  ].filter(
    (value) =>
      typeof value === "string" && value.trim().length >= MIN_TOKEN_LENGTH,
  );
  if (accepted.length === 0) {
    throw apiError(503, "Service admin non configuré");
  }

  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  let match = false;
  if (provided) {
    const providedDigest = digest(provided);
    for (const token of accepted) {
      match = crypto.timingSafeEqual(providedDigest, digest(token)) || match;
    }
  }
  if (!match) throw apiError(401, "Non autorisé");

  const adminEmail = String(request.headers.get("x-admin-email") || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(adminEmail)) {
    throw apiError(400, "Admin non identifié");
  }
  return { adminEmail };
}
