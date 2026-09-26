/**
 * Journal des connexions par appareil (collection `user_device_log`).
 *
 * Better Auth supprime les sessions (déconnexion, expiration, limite de
 * sessions simultanées) : sans ce journal, l'historique des connexions
 * disparaît. Une entrée est ajoutée à CHAQUE création de session, quel que
 * soit le flux (email, OAuth, mobile), dans le document de l'appareil.
 *
 * Le document est partagé avec newbi-api, qui y écrit la dernière activité
 * et la version d'app vue sur l'appareil (cf. deviceHistoryService.js).
 * Les tokens ne sont jamais stockés en clair : préfixe de 8 caractères,
 * comme dans [session-revocation-log].
 *
 * Écriture best-effort : ne fait jamais échouer un login.
 */

import { mongoDb } from "@/src/lib/mongodb";
import { deviceKeyFor, parseDevice } from "@/src/lib/device-identity";

const COLLECTION = "user_device_log";
const MAX_LOGINS = 30;

export async function logLogin(session) {
  try {
    if (!session?.userId) return;

    const userAgent = String(session.userAgent || "").slice(0, 400);
    const deviceKey = deviceKeyFor(userAgent);
    const device = parseDevice(userAgent);
    const at = session.createdAt ? new Date(session.createdAt) : new Date();
    const ipAddress = String(session.ipAddress || "").slice(0, 60);
    const tokenPrefix =
      typeof session.token === "string" && session.token
        ? session.token.slice(0, 8)
        : null;

    await mongoDb.collection(COLLECTION).updateOne(
      { userId: String(session.userId), deviceKey },
      {
        $set: {
          lastLoginAt: at,
          userAgent,
          ipAddress,
          kind: device.kind,
          platform: device.platform,
          label: device.label,
          appBuild: device.appBuild,
        },
        $max: { lastSeenAt: at },
        $setOnInsert: { firstSeenAt: at },
        $inc: { loginCount: 1 },
        $push: {
          logins: {
            // Le build de l'app est lu dans le user-agent de la session : il
            // date la connexion même si l'API n'a pas encore vu sa version.
            $each: [{ at, ipAddress, tokenPrefix, appBuild: device.appBuild }],
            $slice: -MAX_LOGINS,
          },
        },
      },
      { upsert: true },
    );
  } catch (error) {
    // Le journal ne doit jamais casser une connexion
    console.error("⚠️ [LOGIN-LOG] échec écriture:", error?.message);
  }
}
