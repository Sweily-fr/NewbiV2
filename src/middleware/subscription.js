import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';

// Routes qui nécessitent un abonnement actif ou un essai valide
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/graphql',
  '/api/upload',
  '/api/bridge',
  '/api/ocr',
];

// Routes exclues de la vérification d'abonnement
const EXCLUDED_ROUTES = [
  '/auth',
  '/accept-invitation',
  '/api/auth',
  '/api/webhooks/stripe',
  '/pricing',
  '/checkout',
  '/billing',
];

export async function subscriptionMiddleware(request) {
  const { pathname } = request.nextUrl;

  // Vérifier si la route nécessite une vérification d'abonnement
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute || isExcludedRoute) {
    return NextResponse.next();
  }

  try {
    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      // Rediriger vers la page de connexion si pas connecté
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const user = session.user;
    const now = new Date();
    const createdAt = new Date(user.createdAt);
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);

    // Vérifier si l'utilisateur est en période d'essai (14 jours)
    const isInTrial = daysSinceCreation <= 14;

    if (isInTrial) {
      // L'utilisateur est encore en période d'essai, autoriser l'accès
      return NextResponse.next();
    }

    // Récupérer les informations d'abonnement Stripe
    const subscription = await auth.api.stripe.getSubscription({
      headers: request.headers,
    });

    const hasActiveSubscription = subscription?.status === 'active' || 
                                 subscription?.status === 'trialing';

    if (!hasActiveSubscription) {
      // L'essai a expiré et pas d'abonnement actif
      // Rediriger vers la page de tarification
      const redirectUrl = new URL('/pricing', request.url);
      redirectUrl.searchParams.set('expired', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // L'utilisateur a un abonnement actif, autoriser l'accès
    return NextResponse.next();

  } catch (error) {
    console.error('Erreur dans le middleware d\'abonnement:', error);
    
    // En cas d'erreur, rediriger vers la page de connexion
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
