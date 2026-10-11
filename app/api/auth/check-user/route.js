import { NextResponse } from "next/server";
import { ensureConnection } from "@/src/lib/mongodb";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

// 20 vérifications par quart d'heure et par IP (comme verify-password)
const isRateLimited = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/**
 * POST /api/auth/check-user
 *
 * Repli de la page de connexion après un échec : faut-il proposer de
 * vérifier l'adresse email ? La réponse ne dit QUE cela
 * (`needsVerification`) : plus de `exists` ni d'`emailVerified`, qui
 * permettaient de savoir pour n'importe quelle adresse si un compte Newbi
 * existe. Limité par IP.
 *
 * Body : { email }
 */
export async function POST(request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const db = await ensureConnection();
    const existingUser = await db
      .collection("user")
      .findOne(
        { email: email.trim().toLowerCase() },
        { projection: { emailVerified: 1 } },
      );

    return NextResponse.json({
      needsVerification: Boolean(existingUser && !existingUser.emailVerified),
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
