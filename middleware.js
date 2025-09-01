import { NextResponse } from 'next/server';
import { subscriptionMiddleware } from './src/middleware/subscription';

export async function middleware(request) {
  // Appliquer le middleware de vérification d'abonnement
  return await subscriptionMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
