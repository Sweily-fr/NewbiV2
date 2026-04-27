import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

/**
 * Middleware d'authentification — DENY BY DEFAULT.
 * Implements: Principle 1 (deny by default), Principle 11 (middleware first line of defense).
 *
 * ALL routes under /api/* require a valid session UNLESS explicitly listed
 * in PUBLIC_API_ROUTES with a justification comment.
 *
 * The /api/auth/* routes are excluded at the Next.js matcher level (middleware.js)
 * because Better Auth manages its own authentication on those endpoints.
 *
 * MIDDLEWARE_ENFORCE controls blocking behavior:
 * - "true" (default in production): actually blocks unauthenticated requests (401/redirect)
 * - "false" (dry-run mode): logs what WOULD be blocked without blocking, for safe rollout
 */

// ─── PUBLIC API ROUTES ──────────────────────────────────────────────────────
// Each entry MUST have a comment explaining why it's public.
// Adding an entry here requires a security review.
const PUBLIC_API_ROUTES = [
  // PUBLIC: Stripe webhook — verified by stripe-signature header, no user session
  "/api/webhooks/stripe",

  // PUBLIC: Company search for onboarding — read-only, no sensitive data
  "/api/search-companies",

  // PUBLIC: Email existence check for signup form — returns boolean only
  "/api/auth/check-user",

  // PUBLIC: Email existence check for signup form (duplicate route, Sprint 8 cleanup)
  "/api/users/check-email",

  // PUBLIC: Meta Conversion API tracking — server-to-server, no user data
  "/api/meta-capi",

  // PUBLIC: Leads notification — protected by x-api-secret header (own auth mechanism)
  "/api/leads/notify",

  // PUBLIC: File transfer download — protected by shareLink + accessKey (own auth mechanism)
  "/api/transfer/download",

  // PUBLIC: File transfer download all — protected by shareLink + accessKey
  "/api/transfer/download-all",

  // PUBLIC: Account reactivation — token-based auth (not session-based, user is locked out)
  "/api/account/reactivate",

  // PUBLIC: Email verification via Better Auth — token-based, user may not have active session
  "/api/auth/send-verification-email",

  // PUBLIC: Invitation details GET — pre-login page shows "You're invited to [Org]"
  // POST is session-protected inside the route handler
  "/api/invitations",

  // PUBLIC: Subscription check — currently dead code (Sprint 8: delete), but middleware
  // must not block it during transition to avoid breaking any residual caller
  "/api/subscription/check",

  // PUBLIC: Test email — dev/staging only, should be removed in production (Sprint 8)
  "/api/test-email",

  // PUBLIC: SuperPDP endpoints — currently disabled/placeholder
  "/api/superpdp",
];

// ─── DASHBOARD ROUTES (pages, not API) ──────────────────────────────────────
const DASHBOARD_ROUTES = ["/dashboard"];

// ─── ENFORCE MODE ───────────────────────────────────────────────────────────
// Set MIDDLEWARE_ENFORCE=false for dry-run mode (logging only, no blocking).
// Default: true in production (enforce), false if explicitly set to "false".
const ENFORCE = process.env.MIDDLEWARE_ENFORCE !== "false";

/**
 * Check if a session cookie is present in the request headers.
 * Used as a lightweight fallback when DB is unavailable.
 */
function hasSessionCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return (
    cookieHeader.includes("better-auth.session_token") ||
    cookieHeader.includes("__Secure-better-auth.session_token")
  );
}

/**
 * Main middleware function.
 */
export async function subscriptionMiddleware(request) {
  const { pathname } = request.nextUrl;

  // ─── PUBLIC API ROUTES: always pass through ────────────────────────────
  const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isPublicApi) {
    return NextResponse.next();
  }

  // ─── NON-PROTECTED ROUTES: pages that aren't /dashboard or /api ────────
  const isApiRoute = pathname.startsWith("/api/");
  const isDashboardRoute = DASHBOARD_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isApiRoute && !isDashboardRoute) {
    // Public pages (/, /pricing, /auth/signup, /blog, etc.)
    return NextResponse.next();
  }

  // ─── PROTECTED ROUTE: verify session ──────────────────────────────────
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user) {
      // Valid session → allow
      return NextResponse.next();
    }

    // No valid session → block or log depending on enforce mode
    return handleUnauthorized(request, pathname, isApiRoute, "no-session");
  } catch (error) {
    // DB error during session validation
    console.error(
      `[Middleware] Session validation error for ${pathname}:`,
      error?.message || error,
    );

    if (isDashboardRoute) {
      // Dashboard pages: fail-open if cookie present (layout.jsx will revalidate)
      if (hasSessionCookie(request)) {
        console.warn(
          `[Middleware] DB error but cookie present for dashboard page — pass-through for layout.jsx revalidation`,
        );
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (isApiRoute) {
      // API routes: fail-closed (Principle 11)
      if (ENFORCE) {
        return NextResponse.json(
          { error: "Service temporairement indisponible" },
          { status: 503 },
        );
      }
      // Dry-run: log but don't block
      console.warn(
        `[MIDDLEWARE DRY-RUN] Would have returned 503: ${request.method} ${pathname} | reason: db-error | userAgent: ${request.headers.get("user-agent") || "unknown"}`,
      );
      return NextResponse.next();
    }

    return NextResponse.next();
  }
}

/**
 * Handle unauthorized access: either block (enforce) or log (dry-run).
 */
function handleUnauthorized(request, pathname, isApiRoute, reason) {
  if (!ENFORCE) {
    // Dry-run mode: log what would have been blocked
    console.warn(
      `[MIDDLEWARE DRY-RUN] Would have blocked: ${request.method} ${pathname} | reason: ${reason} | userAgent: ${request.headers.get("user-agent") || "unknown"}`,
    );
    return NextResponse.next();
  }

  // Enforce mode: actually block
  if (isApiRoute) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Dashboard page → redirect to login
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
