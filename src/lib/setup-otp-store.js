// Store persistant pour les codes OTP de setup 2FA.
//
// ⚠️ On ne peut PAS utiliser un Map en mémoire (même attaché à globalThis)
// car NewbiV2 tourne sur Vercel en serverless : chaque invocation de route
// handler peut atterrir sur une instance Lambda différente, et chaque
// instance a son propre process/mémoire. Résultat : la route `send-otp`
// écrit dans une instance et `verify-otp` lit depuis une autre instance
// vide → "Code incorrect ou expiré" systématique.
//
// → Stockage en MongoDB dans la collection `twoFactorSetupOtp`.
// Un index TTL sur `expiresAt` (voir mongodb.js ensureIndexes) supprime
// automatiquement les entrées expirées.

import { mongoDb } from "./mongodb";

const COLLECTION = "twoFactorSetupOtp";

export const setupOtpStore = {
  async set(userId, otp, ttlMs) {
    const expiresAt = new Date(Date.now() + ttlMs);
    // Upsert : remplace l'OTP précédent si l'utilisateur clique "Renvoyer"
    await mongoDb.collection(COLLECTION).updateOne(
      { userId },
      {
        $set: {
          userId,
          otp: String(otp),
          expiresAt,
        },
      },
      { upsert: true },
    );
  },

  async verify(userId, code) {
    const entry = await mongoDb.collection(COLLECTION).findOne({ userId });
    if (!entry) return false;

    // Expiré → on supprime et on refuse
    if (entry.expiresAt < new Date()) {
      await mongoDb.collection(COLLECTION).deleteOne({ userId });
      return false;
    }

    // Comparaison tolérante aux espaces éventuels
    const expected = String(entry.otp).trim();
    const received = String(code).trim();
    const isValid = expected === received;

    // Usage unique : on ne supprime l'entrée qu'en cas de succès,
    // pour laisser la possibilité de corriger une faute de frappe.
    if (isValid) {
      await mongoDb.collection(COLLECTION).deleteOne({ userId });
    }

    return isValid;
  },
};
