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
 * @param {any} [publicDetails] - Safe details included in the response body (e.g. Zod validation errors)
 * @returns {NextResponse} JSON response with { error: publicMessage, details?: publicDetails }
 */
export function apiError(
  status,
  publicMessage,
  internalDetails,
  publicDetails,
) {
  if (internalDetails !== undefined) {
    console.error(
      `❌ [API ERROR ${status}] ${publicMessage}`,
      internalDetails instanceof Error
        ? { message: internalDetails.message, stack: internalDetails.stack }
        : internalDetails,
    );
  } else {
    console.error(`❌ [API ERROR ${status}] ${publicMessage}`);
  }

  const body = { error: publicMessage };
  if (publicDetails !== undefined) {
    body.details = publicDetails;
  }

  return NextResponse.json(body, { status });
}
