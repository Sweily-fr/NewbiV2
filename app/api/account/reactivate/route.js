import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyReactivationToken } from "@/src/lib/auth-utils";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

const isRateLimited = createIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

/**
 * POST /api/account/reactivate
 *
 * Réactive un compte désactivé depuis le lien envoyé par email. Le jeton
 * est signé (HMAC) et vaut 24 h : l'ancien jeton, simple base64 de
 * `userId:horodatage`, se fabriquait par quiconque connaissait l'id et
 * l'email du compte.
 *
 * Body : { email, token }
 */
export async function POST(request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  try {
    const { email, token } = await request.json();

    if (!email || !token || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email et token requis" },
        { status: 400 },
      );
    }

    const verified = verifyReactivationToken(token);
    if (!verified || !ObjectId.isValid(verified.userId)) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré" },
        { status: 400 },
      );
    }

    const { mongoDb } = await import("@/src/lib/mongodb");
    const usersCollection = mongoDb.collection("user");
    const userObjectId = new ObjectId(verified.userId);

    const user = await usersCollection.findOne({
      _id: userObjectId,
      email: email,
      isActive: false, // Vérifier que le compte est bien désactivé
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou compte déjà actif" },
        { status: 404 },
      );
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          isActive: true,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Compte réactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la réactivation du compte:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
