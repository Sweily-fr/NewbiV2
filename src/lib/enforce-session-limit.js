/**
 * Server-side: enforces the maxSessions limit for a given user by revoking
 * excess sessions. Always keeps the current session (when provided) and the
 * most-recently-active others, up to maxSessions total.
 */

import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import { logSessionRevocation } from "@/src/lib/session-revocation-log";

/**
 * 2 sessions simultanées par défaut depuis le 27/09/2026 : de quoi travailler
 * sur son ordinateur ET son téléphone sans se faire déconnecter.
 *
 * L'ancienne valeur (1) provoquait 148 révocations en 30 jours sur 15 clients,
 * dont 48 entre un mobile et un ordinateur. Au-delà de 2 appareils, la session
 * la moins récemment active est toujours fermée : c'est un choix assumé.
 */
const DEFAULT_MAX_SESSIONS = 2;

/**
 * Garde-fou : une limite absente ou non positive en base ne doit pas révoquer
 * des sessions au hasard, on n'applique alors aucune limite.
 */
export const isUnlimited = (maxSessions) =>
  maxSessions === null || maxSessions === undefined || maxSessions <= 0;

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
  trigger,
  meta,
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
    maxSessions,
    trigger,
    meta,
  });
}

export async function enforceSessionLimit({
  userObjectId,
  currentSessionToken,
  maxSessions,
  trigger,
  meta,
}) {
  // Pas de limite : on ne lit même pas les sessions, rien n'est révoqué.
  if (isUnlimited(maxSessions)) {
    return { revokedCount: 0, activeSessions: [] };
  }

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

  if (result.deletedCount > 0) {
    await logSessionRevocation({
      mechanism: "max_sessions_limit",
      trigger,
      userId: userObjectId,
      revokedSessions: activeSessions.filter((s) =>
        tokensToRevoke.includes(s.token),
      ),
      keptToken: currentSessionToken,
      meta: { ...meta, maxSessions },
    });
  }

  const remaining = activeSessions.filter((s) => toKeep.has(s.token));
  return { revokedCount: result.deletedCount, activeSessions: remaining };
}
