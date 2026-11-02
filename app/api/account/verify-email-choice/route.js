import { NextResponse } from "next/server";
import { verifyJWT } from "better-auth/crypto";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";
import {
  confirmSignupPassword,
  replaceUnprovenPassword,
  validateNewPassword,
} from "@/src/lib/unproven-account";

/**
 * Vérification de l'adresse quand le lien est ouvert ailleurs que dans le
 * navigateur de l'inscription (voir unproven-account.js). Le jeton du lien
 * prouve la boîte mail ; le mot de passe dit qui l'ouvre :
 * - action « confirm » : mot de passe de l'inscription, gardé s'il est bon ;
 * - action « replace » : nouveau mot de passe, l'ancien et les sessions
 *   d'avant sont retirés.
 * L'adresse n'est marquée vérifiée qu'après l'un des deux.
 */
const isRateLimited = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const INVALID_LINK = "Lien de vérification invalide ou expiré.";
const WRONG_PASSWORD =
  "Mot de passe incorrect. Vérifiez-le ou choisissez un nouveau mot de passe.";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { token, action, password } = body || {};
  if (typeof token !== "string" || !["confirm", "replace"].includes(action)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (action === "confirm" && isRateLimited(request)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const payload = await verifyJWT(token, process.env.BETTER_AUTH_SECRET);
  if (!payload?.email || payload.updateTo) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  }
  const email = String(payload.email);
  const context = await auth.$context;

  if (action === "confirm") {
    const { ok } = await confirmSignupPassword({
      mongoDb,
      email,
      password,
      verifyPassword: (data) => context.password.verify(data),
    });
    if (!ok) {
      return NextResponse.json({ error: WRONG_PASSWORD }, { status: 400 });
    }
  } else {
    const invalid = validateNewPassword(password);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }
    const passwordHash = await context.password.hash(password);
    const { ok } = await replaceUnprovenPassword({
      mongoDb,
      email,
      passwordHash,
    });
    if (!ok) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }
  }

  // Adresse vérifiée et session ouverte (connexion automatique de Better Auth)
  const result = await auth.api.verifyEmail({
    query: { token },
    headers: request.headers,
    asResponse: true,
  });
  if (result.status !== 200) {
    return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  }
  const response = NextResponse.json({ success: true });
  for (const cookie of result.headers.getSetCookie?.() || []) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
