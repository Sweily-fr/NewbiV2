import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import {
  setPasswordAfterProof,
  validateNewPassword,
} from "@/src/lib/unproven-account";

/**
 * Mot de passe choisi par la titulaire de l'adresse, juste après la
 * vérification par lien, quand le mot de passe de l'inscription a été retiré
 * (lien ouvert dans un autre navigateur : voir unproven-account.js).
 */
export async function POST(request) {
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const password = body?.password;
  const invalid = validateNewPassword(password);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const context = await auth.$context;
  const passwordHash = await context.password.hash(password);
  const { ok } = await setPasswordAfterProof({
    mongoDb,
    userId: session.user.id,
    passwordHash,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Aucun mot de passe à choisir pour ce compte" },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
