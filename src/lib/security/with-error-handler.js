// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in Sprint 1b implementation
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- params used in Sprint 1b
export function withErrorHandler(_handler) {
  throw new Error("Not implemented yet — Sprint 1b");
}
