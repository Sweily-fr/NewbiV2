// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { NextResponse } from "next/server";

/**
 * Create an error NextResponse with a public message for the client
 * and detailed logging server-side only.
 * Implements: Principle 8 (server errors don't leak information).
 *
 * NEVER returns error.message, error.stack, or technical details to the client.
 * Internal details are logged via console.error for debugging.
 *
 * @param {number} status - HTTP status code (400, 401, 403, 404, 500, etc.)
 * @param {string} publicMessage - Safe message for the client response
 * @param {any} [internalDetails] - Technical details logged server-side only (Error, string, object)
 * @returns {NextResponse} JSON response with { error: publicMessage }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1b
export function apiError(_status, _publicMessage, _internalDetails) {
  throw new Error("Not implemented yet — Sprint 1b");
}
