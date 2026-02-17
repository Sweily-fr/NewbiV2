import { NextResponse } from 'next/server';
import { subscriptionMiddleware } from './src/middleware/subscription';

export async function middleware(request) {
  try {
    return await subscriptionMiddleware(request);
  } catch (error) {
    console.error('[Middleware] Erreur fatale, laisser passer:', error?.message || error);
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
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth).*)',
  ],
};
