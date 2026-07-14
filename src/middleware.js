import { NextResponse, userAgent } from "next/server";

// L'app n'est pas utilisable sur téléphone : ces préfixes sont redirigés vers
// /mobile-non-disponible quand l'appareil est un mobile (User-Agent).
// Le site public, /auth et surtout les liens de transfert (/transfer/*)
// restent accessibles sur mobile.
//
// NOTE : ce fichier doit rester compatible edge runtime — pas d'import de
// mongodb, Better Auth ou tout module Node (stream, fs, …). La vérification
// de session/abonnement est faite par le Server Component
// app/dashboard/layout.jsx, pas ici.
const MOBILE_BLOCKED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/create-workspace",
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (MOBILE_BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const { device } = userAgent(request);
    // device.type === "mobile" ne cible que les téléphones (pas les tablettes)
    if (device.type === "mobile") {
      return NextResponse.redirect(
        new URL("/mobile-non-disponible", request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/create-workspace/:path*",
  ],
};
