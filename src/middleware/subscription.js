import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// Routes qui nécessitent une authentification ET un abonnement actif
// ✅ SÉCURISÉ: Vérification côté serveur obligatoire
const SUBSCRIPTION_REQUIRED_ROUTES = ["/dashboard"];

// Routes API qui nécessitent un abonnement actif
const PROTECTED_API_ROUTES = [
  "/api/graphql",
  "/api/upload",
  "/api/bridge",
  "/api/ocr",
];

// Routes exclues de la vérification d'abonnement
const EXCLUDED_ROUTES = [
  "/auth",
  "/accept-invitation",
  "/api/auth",
  "/api/webhooks/stripe",
  "/api/organizations", // API de vérification d'abonnement
  "/pricing",
  "/checkout",
  "/billing",
  "/onboarding", // Pages d'onboarding
];

export async function subscriptionMiddleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Vérifier si la route est exclue
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isExcludedRoute) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route dashboard (nécessite authentification + abonnement)
  const isDashboardRoute = SUBSCRIPTION_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Vérifier si c'est une route API protégée
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
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
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 🔄 Autoriser l'accès temporaire si on revient de Stripe (webhook en cours)
    const isReturningFromStripe =
      searchParams.get("session_id") ||
      searchParams.get("subscription_success") === "true" ||
      searchParams.get("payment_success") === "true" ||
      searchParams.get("welcome") === "true";

    if (isDashboardRoute && isReturningFromStripe) {
      console.log("[Middleware] Retour de Stripe, accès temporaire autorisé");
      return NextResponse.next();
    }

    // 🔒 Vérifier l'abonnement pour les routes dashboard ET les routes API
    const subscription = await auth.api.stripe.getSubscription({
      headers: request.headers,
    });

    console.log("[Middleware] Subscription status:", subscription?.status);

    // Vérifier si l'abonnement est valide (actif, trialing, ou canceled mais encore dans la période)
    const isSubscriptionActive =
      subscription?.status === "active" || subscription?.status === "trialing";

    // Vérifier si l'abonnement canceled est encore valide (période non expirée)
    const isCanceledButValid =
      subscription?.status === "canceled" &&
      subscription?.periodEnd &&
      new Date(subscription.periodEnd) > new Date();

    const hasValidSubscription = isSubscriptionActive || isCanceledButValid;

    if (!hasValidSubscription) {
      // Pas d'abonnement valide
      if (isDashboardRoute) {
        console.log("[Middleware] Pas d'abonnement, redirection vers /onboarding");
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: "Abonnement requis" },
          { status: 403 }
        );
      }
    }

    // ✅ L'utilisateur a un abonnement valide, autoriser l'accès
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

    // En cas d'erreur sur les routes dashboard, rediriger vers onboarding par sécurité
    // (mieux vaut bloquer que laisser passer)
    if (isDashboardRoute) {
      console.log("[Middleware] Erreur, redirection sécurisée vers /onboarding");
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return NextResponse.next();
  }
}
