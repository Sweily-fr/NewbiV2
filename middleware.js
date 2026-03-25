import { NextResponse } from "next/server";
import { subscriptionMiddleware } from "./src/middleware/subscription";

// Routes protégées qui nécessitent une session
const AUTH_REQUIRED_PREFIXES = ["/dashboard"];

export async function middleware(request) {
  try {
    return await subscriptionMiddleware(request);
  } catch (error) {
    console.error("[Middleware] Erreur fatale:", error?.message || error);

    // En cas d'erreur, vérifier au minimum si un cookie de session existe
    // avant de laisser passer sur les routes protégées
    const { pathname } = request.nextUrl;
    const isProtectedRoute = AUTH_REQUIRED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (isProtectedRoute) {
      const cookieHeader = request.headers.get("cookie") || "";
      const hasSessionCookie =
        cookieHeader.includes("better-auth.session_token") ||
        cookieHeader.includes("__Secure-better-auth.session_token");

      if (!hasSessionCookie) {
        // Pas de cookie de session → bloquer l'accès
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      // Cookie présent mais middleware a crashé → laisser passer,
      // le Server Component layout.jsx revalidera la session
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (Better Auth endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/auth).*)",
  ],
};
