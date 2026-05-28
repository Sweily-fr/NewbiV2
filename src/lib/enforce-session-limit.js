/**
 * Server-side: enforces the maxSessions limit for a given user by revoking
 * excess sessions. Always keeps the current session (when provided) and the
 * most-recently-active others, up to maxSessions total.
 */

import { mongoDb } from "@/src/lib/mongodb";

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
    .sort({ updatedAt: -1 })
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
