import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// Routes qui nécessitent une authentification
const AUTH_REQUIRED_ROUTES = ["/dashboard"];

// Routes API qui nécessitent une authentification
const PROTECTED_API_ROUTES = [
  "/api/graphql",
  "/api/upload",
  "/api/bridge",
  "/api/ocr",
];

// Routes exclues de la vérification
const EXCLUDED_ROUTES = [
  "/auth",
  "/accept-invitation",
  "/api/auth",
  "/api/webhooks/stripe",
  "/api/organizations",
  "/api/invitations",
  "/api/subscription",
  "/pricing",
  "/checkout",
  "/billing",
  "/onboarding",
];

/**
 * Middleware d'authentification
 *
 * NOTE: La vérification d'abonnement est faite dans le Server Component
 * (app/dashboard/layout.jsx) car le middleware Edge Runtime ne peut pas
 * faire d'appels fetch internes ni accéder à MongoDB directement.
 */
export async function subscriptionMiddleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Vérifier si la route est exclue
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isExcludedRoute) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route qui nécessite authentification
  const isAuthRequiredRoute = AUTH_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Vérifier si c'est une route API protégée
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Si ce n'est pas une route protégée, laisser passer
  if (!isAuthRequiredRoute && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  try {
    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log("[Middleware] Vérification auth pour:", pathname);
    console.log("[Middleware] Session trouvée:", !!session?.user);

    if (!session?.user) {
      console.log("[Middleware] Redirection vers /auth/login - Pas de session");

      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: "Non authentifié" },
          { status: 401 }
        );
      }

      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // ✅ Utilisateur authentifié, laisser passer
    // La vérification d'abonnement est faite dans le Server Component layout.jsx
    return NextResponse.next();
  } catch (error) {
    console.error("Erreur dans le middleware d'authentification:", error);

    // En cas d'erreur sur les routes API, retourner une erreur JSON
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: "Erreur de vérification" },
        { status: 500 }
      );
    }

    // Vérifier si un cookie de session signé existe avant de rediriger
    // En Edge Runtime, les lookups MongoDB peuvent échouer de façon transitoire
    // Si le cookie existe, laisser passer — l'API et les validateurs côté client protègent les données
    if (isAuthRequiredRoute) {
      const cookieHeader = request.headers.get("cookie") || "";
      const hasSessionCookie = cookieHeader.includes("better-auth.session_token=")
        || cookieHeader.includes("__Secure-better-auth.session_token=");

      if (hasSessionCookie) {
        console.warn("[Middleware] Erreur de validation DB mais cookie de session présent, laisser passer");
        return NextResponse.next();
      }

      console.log("[Middleware] Erreur et pas de cookie de session, redirection vers /auth/login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
  }
}
