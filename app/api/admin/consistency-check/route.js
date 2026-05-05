import { NextResponse } from "next/server";
import { requireSession, apiError, withErrorHandler } from "@/src/lib/security";
import { runAllChecks } from "@/src/lib/consistency-checks";

// Whitelist of admin emails authorized to run consistency checks.
// Kept simple and explicit — no DB lookup, no role system dependency.
const ADMIN_EMAILS = ["sofiane.mtimet6@gmail.com"];

/**
 * GET /api/admin/consistency-check
 *
 * Run all consistency checks and return a structured report.
 * Auth: session + admin email whitelist.
 */
async function handler(request) {
  const { user } = await requireSession(request);

  if (!ADMIN_EMAILS.includes(user.email)) {
    return apiError(403, "Accès admin requis");
  }

  const report = await runAllChecks();

  return NextResponse.json(report);
}

export const GET = withErrorHandler(handler);
