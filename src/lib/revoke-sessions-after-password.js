import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import { logSessionRevocation } from "@/src/lib/session-revocation-log";

/**
 * Mot de passe changé (Paramètres, application mobile) ou réinitialisé
 * (lien « mot de passe oublié ») : les autres sessions de la personne sont
 * fermées, pour qu'une session ouverte par un tiers ne survive pas au
 * nouveau mot de passe. Appliqué par le serveur quel que soit le client
 * (le site et l'application envoient revokeOtherSessions: false).
 *
 * `keepToken` : la session qui vient de changer le mot de passe (gardée) ;
 * aucune après un lien de réinitialisation. Journalisé comme les autres
 * révocations (session_revocation_log, mécanisme « password_change »).
 */
export async function revokeSessionsAfterPasswordChange({
  userId,
  keepToken,
  trigger,
}) {
  const id = userId != null ? String(userId) : "";
  if (!ObjectId.isValid(id)) return 0;
  const userObjectId = new ObjectId(id);

  const sessions = await mongoDb
    .collection("session")
    .find({
      userId: { $in: [userObjectId, id] },
      ...(keepToken ? { token: { $ne: keepToken } } : {}),
    })
    .toArray();
  if (sessions.length === 0) return 0;

  const result = await mongoDb.collection("session").deleteMany({
    _id: { $in: sessions.map((s) => s._id) },
  });
  await logSessionRevocation({
    mechanism: "password_change",
    trigger,
    userId: userObjectId,
    revokedSessions: sessions,
    keptToken: keepToken,
  });
  return result.deletedCount;
}
