import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// Routes qui nécessitent uniquement une authentification (pas d'abonnement requis)
// ✅ MODIFIÉ: Toutes les routes dashboard nécessitent uniquement l'authentification
// La vérification d'abonnement est gérée côté client pour plus de flexibilité
const AUTH_ONLY_ROUTES = ["/dashboard"];

// Routes qui nécessitent un abonnement actif ou un essai valide (API uniquement)
const PROTECTED_ROUTES = [
  "/api/graphql",
  "/api/upload",
  "/api/bridge",
  "/api/ocr",
];

// ❌ SUPPRIMÉ: PRO_ONLY_ROUTES - La vérification est maintenant côté client uniquement
// Cela permet un meilleur contrôle et évite les problèmes de cache/synchronisation
// Les composants côté client (nav-main, pro-route-guard, useFeatureAccess) gèrent l'accès

// Routes exclues de la vérification d'abonnement
const EXCLUDED_ROUTES = [
  "/auth",
  "/accept-invitation",
  "/api/auth",
  "/api/webhooks/stripe",
  "/pricing",
  "/checkout",
  "/billing",
];

export async function subscriptionMiddleware(request) {
  const { pathname } = request.nextUrl;

  // Vérifier si la route est exclue
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isExcludedRoute) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route dashboard (nécessite uniquement authentification)
  const isDashboardRoute = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Vérifier si la route nécessite une vérification d'abonnement (API uniquement)
  const isProtectedApiRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Si ce n'est ni une route dashboard ni une route API protégée, laisser passer
  if (!isDashboardRoute && !isProtectedApiRoute) {
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
      // Rediriger vers la page de connexion si pas connecté
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // ✅ Pour les routes dashboard, autoriser l'accès si connecté
    // La vérification d'abonnement est gérée côté client (meilleur UX et cache)
    if (isDashboardRoute) {
      return NextResponse.next();
    }

    // Pour les routes API protégées, vérifier l'abonnement
    if (isProtectedApiRoute) {
      const subscription = await auth.api.stripe.getSubscription({
        headers: request.headers,
      });

      const hasActiveSubscription =
        subscription?.status === "active" || subscription?.status === "trialing";

      if (!hasActiveSubscription) {
        // Pas d'abonnement Stripe actif pour les API
        return NextResponse.json(
          { error: "Abonnement requis" },
          { status: 403 }
        );
      }
    }

    // L'utilisateur a un abonnement actif, autoriser l'accès
    return NextResponse.next();
  } catch (error) {
    console.error("Erreur dans le middleware d'abonnement:", error);

    // En cas d'erreur sur les routes API, retourner une erreur JSON
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: "Erreur de vérification" },
        { status: 500 }
      );
    }

    // En cas d'erreur sur les routes dashboard, laisser passer (le client gèrera)
    return NextResponse.next();
  }
}
