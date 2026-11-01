/**
 * Compte désactivé (Paramètres > Compte > Désactiver, isActive: false) :
 * aucune session ne doit s'ouvrir, quelle que soit la voie de connexion
 * (e-mail et mot de passe, Google, Apple, application mobile, lien de
 * vérification, jeton à usage unique). Le contrôle de /sign-in/email
 * (auth-hooks.js) répond plus tôt avec le même message ; celui-ci, appelé à
 * la création de la session, couvre toutes les autres voies.
 *
 * La réactivation se fait par le lien reçu par e-mail (/reactivate-account),
 * renvoyé à chaque tentative.
 */
export const DEACTIVATED_ACCOUNT_MESSAGE =
  "Votre compte a été désactivé. Un email de réactivation vous a été envoyé.";
export const DEACTIVATED_ACCOUNT_CODE = "account_deactivated";

/** Adresse telle que Better Auth l'enregistre (minuscules, sans espaces autour). */
export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

async function throwDeactivated(user) {
  const { sendReactivationEmail } = await import("./auth-utils");
  await sendReactivationEmail(user).catch((err) =>
    console.error("Failed to send reactivation email:", err?.message),
  );
  const { APIError } = await import("better-auth/api");
  throw new APIError("FORBIDDEN", {
    message: DEACTIVATED_ACCOUNT_MESSAGE,
    code: DEACTIVATED_ACCOUNT_CODE,
  });
}

/**
 * Refuse la création d'une session pour un compte désactivé. Une session
 * d'administration (impersonation) reste permise. Si la base ne répond pas,
 * la connexion n'est pas bloquée (même règle que le contrôle de /sign-in/email).
 */
export async function assertAccountActiveForSession(session) {
  if (!session?.userId || session.impersonatedBy) return;
  let user = null;
  try {
    const { mongoDb } = await import("./mongodb.js");
    const { ObjectId } = await import("mongodb");
    const id = String(session.userId);
    if (!ObjectId.isValid(id)) return;
    user = await mongoDb
      .collection("user")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { _id: 1, email: 1, isActive: 1 } },
      );
  } catch (error) {
    console.error(
      "⚠️ [SESSION CREATE] Contrôle du compte désactivé impossible :",
      error?.message,
    );
    return;
  }
  // Hors du try : l'erreur ne doit jamais être avalée
  if (user && user.isActive === false) await throwDeactivated(user);
}

export { throwDeactivated };
