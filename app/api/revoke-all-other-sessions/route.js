import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { mongoDb } from "@/src/lib/mongodb";
import { toObjectId, withErrorHandler } from "@/src/lib/security";
import { logSessionRevocation } from "@/src/lib/session-revocation-log";

async function handler() {
  // Récupérer la session de l'utilisateur connecté
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userObjectId = toObjectId(session.user.id);
  const currentSessionToken = session.session?.token;

  if (!currentSessionToken) {
    return NextResponse.json(
      { error: "Token de session actuelle introuvable" },
      { status: 400 },
    );
  }

  // Lecture préalable des victimes pour alimenter le journal des révocations.
  // MOYEN-25 fix: userId is stored as ObjectId in session collection (ADR-004)
  const otherSessions = await mongoDb
    .collection("session")
    .find({
      userId: userObjectId,
      token: { $ne: currentSessionToken },
    })
    .toArray();

  let deletedCount = 0;
  if (otherSessions.length > 0) {
    const result = await mongoDb.collection("session").deleteMany({
      _id: { $in: otherSessions.map((s) => s._id) },
    });
    deletedCount = result.deletedCount;
    await logSessionRevocation({
      mechanism: "revoke_all_others",
      trigger: "user_action",
      userId: userObjectId,
      revokedSessions: otherSessions,
      keptToken: currentSessionToken,
    });
  }

  return NextResponse.json({
    success: true,
    message: `${deletedCount} session(s) révoquée(s)`,
    revokedCount: deletedCount,
  });
}

export const POST = withErrorHandler(handler);
