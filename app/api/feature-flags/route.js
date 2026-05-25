import { NextResponse } from "next/server";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";

/**
 * GET /api/feature-flags
 *
 * Returns the subset of feature flags client code is allowed to inspect.
 * No auth required — feature flags are not secrets, and the signup page
 * needs to read them before any session exists.
 *
 * Add new flags here (and only here) as the refonte progresses.
 */
export async function GET() {
  return NextResponse.json({
    appTrialEnabled: isAppTrialEnabled(),
  });
}
