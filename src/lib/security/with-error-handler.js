import { NextResponse } from "next/server";
import { apiError } from "./api-error";

/**
 * Wrap a Next.js API route handler with standardized error handling.
 * Implements: Principle 1 (deny by default), Principle 8 (no error leaks).
 *
 * Catches two types of throws:
 * 1. NextResponse instances (from requireSession, requireOrgMembership, etc.) — returned as-is
 * 2. Unexpected Error instances — converted to a generic 500 via apiError()
 *
 * Usage:
 *   export const GET = withErrorHandler(async (request, context) => {
 *     const { user } = await requireSession(request);
 *     // ... business logic, no try/catch needed
 *     return NextResponse.json(data);
 *   });
 *
 * @param {(request: Request, context?: any) => Promise<NextResponse>} handler - Route handler function
 * @returns {(request: Request, context?: any) => Promise<NextResponse>} - Wrapped handler
 */
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // NextResponse thrown by security helpers (requireSession, apiError, etc.)
      // These are intentional "error responses", not crashes — return them as-is.
      if (error instanceof NextResponse) {
        return error;
      }

      // Unexpected error — log details server-side, return generic message to client
      return apiError(500, "Erreur serveur", error);
    }
  };
}
