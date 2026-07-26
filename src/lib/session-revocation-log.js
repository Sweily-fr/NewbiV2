/**
 * Journal des révocations de sessions (collection `session_revocation_log`).
 *
 * Chaque suppression de session côté serveur passe par un des mécanismes
 * suivants et DOIT être journalisée ici pour rendre les déconnexions
 * diagnosticables a posteriori :
 *   - max_sessions_limit : limite de sessions simultanées (enforce-session-limit)
 *   - inactivity_cleanup : nettoyage des sessions inactives (check-session-limit)
 *   - revoke_all_others  : bouton « Déconnexion globale » / manage-devices
 *
 * Les tokens ne sont jamais stockés en clair : préfixe de 8 caractères
 * uniquement, suffisant pour corréler avec une session donnée.
 *
 * Un index TTL (30 jours) sur `at` purge automatiquement le journal
 * (cf. ensureIndexes dans mongodb.js).
 */

import { mongoDb } from "@/src/lib/mongodb";

const COLLECTION = "session_revocation_log";

export const tokenPrefix = (token) =>
  typeof token === "string" && token.length > 0 ? token.slice(0, 8) : null;

const sessionSummary = (s) => ({
  tokenPrefix: tokenPrefix(s.token),
  userAgent: s.userAgent || null,
  ipAddress: s.ipAddress || null,
  createdAt: s.createdAt || null,
  updatedAt: s.updatedAt || null,
  expiresAt: s.expiresAt || null,
});

/**
 * Écriture best-effort : ne lève jamais, ne bloque jamais le flux appelant.
 *
 * @param {Object} entry
 * @param {string} entry.mechanism - max_sessions_limit | inactivity_cleanup | revoke_all_others
 * @param {string} [entry.trigger] - contexte de l'appelant (login_session_create,
 *   login_check_route, settings_update_max_sessions, user_action…)
 * @param {*} entry.userId - id du user concerné
 * @param {Array} entry.revokedSessions - documents session supprimés
 * @param {string} [entry.keptToken] - token de la session conservée (préfixé)
 * @param {Object} [entry.meta] - infos additionnelles (UA/IP du déclencheur…)
 */
export async function logSessionRevocation({
  mechanism,
  trigger,
  userId,
  revokedSessions,
  keptToken,
  meta,
}) {
  try {
    await mongoDb.collection(COLLECTION).insertOne({
      at: new Date(),
      mechanism,
      trigger: trigger || null,
      userId: userId != null ? String(userId) : null,
      revokedCount: revokedSessions?.length || 0,
      revoked: (revokedSessions || []).map(sessionSummary),
      keptTokenPrefix: tokenPrefix(keptToken),
      meta: meta || null,
    });
  } catch (error) {
    // Le journal ne doit jamais casser une révocation légitime
    console.error("⚠️ [REVOCATION-LOG] échec écriture:", error?.message);
  }
}
