import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ensureConnection } from "@/src/lib/mongodb";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

// 20 vérifications par quart d'heure et par IP (comme verify-password)
const isRateLimited = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/**
 * POST /api/users/check-email
 *
 * Page d'acceptation d'invitation : l'adresse invitée a-t-elle déjà un
 * compte (connexion) ou non (inscription) ?
 *
 * Auparavant, n'importe qui pouvait tester n'importe quelle adresse. La
 * réponse n'est donnée que pour l'adresse d'une invitation en attente dont
 * on fournit l'identifiant ; pour toute autre adresse, `exists: false`.
 * Limité par IP, et l'adresse n'est plus renvoyée.
 *
 * Body : { email, invitationId }
 */
export async function POST(request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  try {
    const { email, invitationId } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    if (
      typeof invitationId !== "string" ||
      !/^[0-9a-f]{24}$/.test(invitationId)
    ) {
      return NextResponse.json(
        { error: "Invitation requise" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await ensureConnection();

    const invitation = await db
      .collection("invitation")
      .findOne(
        { _id: new ObjectId(invitationId) },
        { projection: { email: 1, status: 1, expiresAt: 1 } },
      );
    const isPendingForEmail =
      invitation &&
      invitation.status === "pending" &&
      (!invitation.expiresAt || new Date(invitation.expiresAt) > new Date()) &&
      String(invitation.email || "")
        .trim()
        .toLowerCase() === normalizedEmail;

    if (!isPendingForEmail) {
      return NextResponse.json({ exists: false });
    }

    const existingUser = await db
      .collection("user")
      .findOne({ email: normalizedEmail }, { projection: { _id: 1 } });

    return NextResponse.json({ exists: Boolean(existingUser) });
  } catch (error) {
    console.error("Error checking user email:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
