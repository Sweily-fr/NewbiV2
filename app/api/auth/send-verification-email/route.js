import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { withErrorHandler } from "@/src/lib/security";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

// Cette route masque l'endpoint Better Auth du même chemin, et donc sa
// propre limite de débit : 5 envois par quart d'heure et par IP.
const isRateLimited = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

/**
 * Lien de retour de l'email : toujours la page de vérification du site.
 * Une URL fournie par le client n'est acceptée que si elle est sur le site
 * lui-même (sinon le lien d'un email légitime Newbi pouvait renvoyer vers
 * un site tiers).
 */
function safeCallbackURL(callbackURL) {
  const base = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "";
  const fallback = `${base}/auth/verify-email`;
  if (typeof callbackURL !== "string" || !callbackURL) return fallback;
  try {
    const target = new URL(callbackURL, base || undefined);
    const allowed = base ? new URL(base).origin : null;
    return allowed && target.origin === allowed ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}

async function handler(request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const { email, callbackURL } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Utiliser Better Auth pour envoyer l'email de vérification
  const result = await auth.api.sendVerificationEmail({
    body: {
      email: email.toLowerCase(),
      callbackURL: safeCallbackURL(callbackURL),
    },
  });

  if (result?.error) {
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Verification email sent successfully",
  });
}

export const POST = withErrorHandler(handler);
