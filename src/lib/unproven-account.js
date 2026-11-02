/**
 * Mot de passe posé avant la preuve de l'adresse.
 *
 * L'inscription par e-mail ne vérifie pas l'adresse : n'importe qui peut
 * inscrire l'adresse d'une autre personne avec son propre mot de passe.
 * Ce mot de passe ne doit jamais devenir celui d'un compte vérifié sans que
 * la titulaire de l'adresse l'ait elle-même tapé.
 *
 * À l'ouverture du lien de vérification :
 * - même navigateur que l'inscription (session du compte présente) : la
 *   personne qui a choisi le mot de passe est celle qui prouve l'adresse,
 *   vérification immédiate, rien ne change ;
 * - autre navigateur (inscription sur ordinateur, lien ouvert sur le
 *   téléphone, ou adresse inscrite par un tiers) : l'adresse n'est PAS
 *   encore vérifiée. La page propose deux choix :
 *   1. « J'ai créé ce compte » : la personne tape le mot de passe de
 *      l'inscription ; s'il est bon, l'adresse est vérifiée et rien d'autre
 *      ne change ;
 *   2. « Choisir un mot de passe » : le mot de passe de l'inscription est
 *      remplacé, les sessions ouvertes avant sont fermées, puis l'adresse
 *      est vérifiée.
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

async function findUnverifiedUser(mongoDb, email) {
  if (typeof email !== "string" || !email) return null;
  const user = await mongoDb
    .collection("user")
    .findOne(
      { email: email.toLowerCase() },
      { projection: { _id: 1, emailVerified: 1 } },
    );
  if (!user || user.emailVerified === true) return null;
  return user;
}

async function findPasswordAccount(mongoDb, userId) {
  return mongoDb.collection("account").findOne({
    userId: { $in: idValues(userId) },
    providerId: "credential",
    password: { $exists: true, $nin: [null, ""] },
  });
}

/**
 * Le lien est-il ouvert sans preuve que c'est l'auteur du mot de passe ?
 * Vrai pour un compte non vérifié qui a un mot de passe, quand la session
 * du navigateur n'est pas celle de ce compte.
 */
export async function needsOwnershipChoice({
  mongoDb,
  email,
  currentUserId = null,
}) {
  const user = await findUnverifiedUser(mongoDb, email);
  if (!user) return { required: false };
  if (currentUserId && String(currentUserId) === String(user._id)) {
    return { required: false };
  }
  const account = await findPasswordAccount(mongoDb, user._id);
  return account
    ? { required: true, userId: String(user._id) }
    : { required: false };
}

/**
 * Choix 1 : le mot de passe tapé est-il celui de l'inscription ?
 * `verifyPassword({ hash, password })` : fonction de Better Auth.
 */
export async function confirmSignupPassword({
  mongoDb,
  email,
  password,
  verifyPassword,
}) {
  if (typeof password !== "string" || !password) return { ok: false };
  const user = await findUnverifiedUser(mongoDb, email);
  if (!user) return { ok: false };
  const account = await findPasswordAccount(mongoDb, user._id);
  if (!account) return { ok: false };
  const ok = await verifyPassword({ hash: account.password, password });
  return { ok: Boolean(ok) };
}

/**
 * Choix 2 : mot de passe de l'inscription remplacé par celui de la
 * titulaire, sessions ouvertes avant fermées. Seulement pour un compte
 * encore non vérifié.
 */
export async function replaceUnprovenPassword({
  mongoDb,
  email,
  passwordHash,
}) {
  const user = await findUnverifiedUser(mongoDb, email);
  if (!user) return { ok: false };
  const userIds = idValues(user._id);
  const now = new Date();
  const accounts = mongoDb.collection("account");
  const result = await accounts.updateMany(
    { userId: { $in: userIds }, providerId: "credential" },
    {
      $set: {
        password: passwordHash,
        updatedAt: now,
        unprovenPasswordReplacedAt: now,
      },
    },
  );
  if (!result.matchedCount) {
    await accounts.insertOne({
      userId: user._id,
      accountId: String(user._id),
      providerId: "credential",
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }
  await mongoDb.collection("session").deleteMany({ userId: { $in: userIds } });
  return { ok: true };
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
