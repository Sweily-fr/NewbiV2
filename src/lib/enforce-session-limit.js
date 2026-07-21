/**
 * Server-side: enforces the maxSessions limit for a given user by revoking
 * excess sessions. Always keeps the current session (when provided) and the
 * most-recently-active others, up to maxSessions total.
 */

import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";

const DEFAULT_MAX_SESSIONS = 1;

/**
 * Lit le réglage maxSessions de l'organisation puis applique la limite.
 * Utilisé par le hook session.create.after (tous les flux de login :
 * email, OAuth, mobile) — les sessions les moins récemment actives
 * sont révoquées au-delà de la limite, la session courante est conservée.
 */
export async function enforceSessionLimitForUser({
  userId,
  orgId,
  currentSessionToken,
}) {
  let maxSessions = DEFAULT_MAX_SESSIONS;

  if (orgId) {
    try {
      const org = await mongoDb
        .collection("organization")
        .findOne(
          { _id: new ObjectId(orgId) },
          { projection: { sessionSettings: 1 } },
        );
      maxSessions = org?.sessionSettings?.maxSessions ?? DEFAULT_MAX_SESSIONS;
    } catch {
      // Org illisible : appliquer la valeur par défaut
    }
  }

  return enforceSessionLimit({
    userObjectId: new ObjectId(userId),
    currentSessionToken,
    maxSessions: Math.max(1, maxSessions),
  });
}

export async function enforceSessionLimit({
  userObjectId,
  currentSessionToken,
  maxSessions,
}) {
  const now = new Date();

  const activeSessions = await mongoDb
    .collection("session")
    .find({
      userId: userObjectId,
      expiresAt: { $gt: now },
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  if (activeSessions.length <= maxSessions) {
    return { revokedCount: 0, activeSessions };
  }

  const toKeep = new Set();
  if (currentSessionToken) toKeep.add(currentSessionToken);
  for (const s of activeSessions) {
    if (toKeep.size >= maxSessions) break;
    toKeep.add(s.token);
  }

  const tokensToRevoke = activeSessions
    .filter((s) => !toKeep.has(s.token))
    .map((s) => s.token);

  if (tokensToRevoke.length === 0) {
    return { revokedCount: 0, activeSessions };
  }

  const result = await mongoDb.collection("session").deleteMany({
    userId: userObjectId,
    token: { $in: tokensToRevoke },
  });

  const remaining = activeSessions.filter((s) => toKeep.has(s.token));
  return { revokedCount: result.deletedCount, activeSessions: remaining };
}
