import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// Routes qui nécessitent uniquement une authentification (pas d'abonnement requis)
const AUTH_ONLY_ROUTES = ["/dashboard"];

// Routes qui nécessitent un abonnement actif ou un essai valide
const PROTECTED_ROUTES = [
  "/api/graphql",
  "/api/upload",
  "/api/bridge",
  "/api/ocr",
];

// Routes qui nécessitent spécifiquement un abonnement Pro (pas accessible en Free)
const PRO_ONLY_ROUTES = [
  "/dashboard/outils/factures",
  "/dashboard/outils/devis",
  "/dashboard/outils/clients",
  "/dashboard/outils/produits",
  "/dashboard/outils/transactions",
  "/dashboard/outils/kanban",
  "/dashboard/outils/transferts-fichiers",
  "/dashboard/outils/signatures-mail",
];

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

  // Vérifier si c'est une route PRO_ONLY (sous-pages du dashboard)
  const isProOnlyRoute = PRO_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Vérifier si c'est une route qui nécessite uniquement une authentification
  const isAuthOnlyRoute =
    AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route)) &&
    !isProOnlyRoute;

  // Vérifier si la route nécessite une vérification d'abonnement
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Si ce n'est ni une route auth-only ni une route protégée ni une route pro-only, laisser passer
  if (!isAuthOnlyRoute && !isProtectedRoute && !isProOnlyRoute) {
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

    // Pour les routes auth-only (comme /dashboard), autoriser l'accès si connecté
    if (isAuthOnlyRoute && !isProOnlyRoute) {
      return NextResponse.next();
    }

    // Récupérer les informations d'abonnement Stripe
    // ⚠️ IMPORTANT: On ne vérifie plus le trial basé sur user.createdAt
    // Seuls les abonnements Stripe sont acceptés (active, trialing, canceled valide)
    const subscription = await auth.api.stripe.getSubscription({
      headers: request.headers,
    });

    const hasActiveSubscription =
      subscription?.status === "active" || subscription?.status === "trialing";

    if (!hasActiveSubscription) {
      // Pas d'abonnement Stripe actif
      // Rediriger vers l'onboarding pour choisir un plan
      console.log("[Middleware] Pas d'abonnement actif, redirection vers /onboarding");
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // L'utilisateur a un abonnement actif, autoriser l'accès
    return NextResponse.next();
  } catch (error) {
    console.error("Erreur dans le middleware d'abonnement:", error);

    // En cas d'erreur, rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
