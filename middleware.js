import { NextResponse } from "next/server";
import { subscriptionMiddleware } from "./src/middleware/subscription";

export async function middleware(request) {
  try {
    return await subscriptionMiddleware(request);
  } catch (error) {
    // Fatal error in middleware — this should never happen if subscriptionMiddleware
    // handles its own errors. If it does, fail-closed for safety.
    console.error("[Middleware] Fatal error:", error?.message || error);

    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith("/api/");

    if (isApiRoute) {
      return NextResponse.json(
        { error: "Service temporairement indisponible" },
        { status: 503 },
      );
    }

    // For pages: redirect to login as last resort
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public/ folder
     * - api/auth/ (Better Auth manages its own endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/auth).*)",
  ],
};
