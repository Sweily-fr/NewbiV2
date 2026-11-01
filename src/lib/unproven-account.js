/**
 * Mot de passe posé avant la preuve de l'adresse.
 *
 * L'inscription par e-mail ne vérifie pas l'adresse : n'importe qui peut
 * inscrire l'adresse d'une autre personne avec son propre mot de passe.
 * Quand la titulaire ouvre ensuite le lien de vérification, ce mot de passe
 * ne doit pas lui survivre.
 *
 * À la vérification par lien :
 * - même navigateur que l'inscription (session du compte présente) : la
 *   personne qui a choisi le mot de passe est celle qui prouve l'adresse,
 *   rien ne change ;
 * - autre navigateur : le mot de passe et les sessions ouvertes avant la
 *   preuve sont retirés ; la titulaire, connectée par le lien, choisit son
 *   mot de passe (elle peut reprendre le même si c'est elle qui s'était
 *   inscrite).
 *
 * Même principe que Better Auth pour le lien magique et les codes OTP
 * (revokeUnprovenAccountAccess), sans supprimer le compte de connexion.
 */
import { ObjectId } from "mongodb";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

function idValues(id) {
  const values = [String(id)];
  if (ObjectId.isValid(String(id))) values.push(new ObjectId(String(id)));
  return values;
}

/**
 * À appeler AVANT de marquer l'adresse vérifiée. Renvoie { revoked } :
 * true si le mot de passe et les sessions d'avant la preuve ont été retirés.
 */
export async function revokeUnprovenPassword({
  mongoDb,
  email,
  currentUserId = null,
}) {
  if (typeof email !== "string" || !email) return { revoked: false };
  const users = mongoDb.collection("user");
  const user = await users.findOne(
    { email: email.toLowerCase() },
    { projection: { _id: 1, emailVerified: 1 } },
  );
  if (!user || user.emailVerified === true) return { revoked: false };
  if (currentUserId && String(currentUserId) === String(user._id)) {
    return { revoked: false };
  }

  const userIds = idValues(user._id);
  const accounts = mongoDb.collection("account");
  const withPassword = await accounts.countDocuments({
    userId: { $in: userIds },
    providerId: "credential",
    password: { $exists: true, $nin: [null, ""] },
  });
  if (!withPassword) return { revoked: false };

  const now = new Date();
  await accounts.updateMany(
    { userId: { $in: userIds }, providerId: "credential" },
    { $unset: { password: "" }, $set: { unprovenPasswordRemovedAt: now } },
  );
  await mongoDb.collection("session").deleteMany({ userId: { $in: userIds } });
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordSetupRequired: true } },
  );
  return { revoked: true };
}

export function validateNewPassword(password) {
  if (typeof password !== "string") return "Mot de passe invalide";
  if (password.length < PASSWORD_MIN) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`;
  }
  if (password.length > PASSWORD_MAX) {
    return `Le mot de passe doit contenir au plus ${PASSWORD_MAX} caractères`;
  }
  return null;
}

/**
 * Mot de passe choisi par la titulaire après la preuve de l'adresse.
 * Seulement pour un compte dont le mot de passe a été retiré à la
 * vérification (passwordSetupRequired).
 */
export async function setPasswordAfterProof({ mongoDb, userId, passwordHash }) {
  const users = mongoDb.collection("user");
  const userIds = idValues(userId);
  const user = await users.findOne(
    { _id: { $in: userIds }, passwordSetupRequired: true, emailVerified: true },
    { projection: { _id: 1 } },
  );
  if (!user) return { ok: false };
  const now = new Date();
  const result = await mongoDb
    .collection("account")
    .updateMany(
      { userId: { $in: userIds }, providerId: "credential" },
      { $set: { password: passwordHash, updatedAt: now } },
    );
  if (!result.matchedCount) {
    await mongoDb.collection("account").insertOne({
      userId: user._id,
      accountId: String(user._id),
      providerId: "credential",
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }
  await users.updateOne(
    { _id: user._id },
    { $unset: { passwordSetupRequired: "" } },
  );
  return { ok: true };
}
