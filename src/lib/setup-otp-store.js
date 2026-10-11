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

// Essais erronés tolérés avant d'invalider le code (un code à 6 chiffres
// sans limite d'essais se trouvait en force brute dans ses 5 minutes).
export const MAX_SETUP_OTP_ATTEMPTS = 5;

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
          attempts: 0,
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
      return true;
    }

    // Mauvais code : compté ; au-delà de la limite, le code est invalidé
    // et l'utilisateur doit en demander un nouveau.
    const attempts = (entry.attempts || 0) + 1;
    if (attempts >= MAX_SETUP_OTP_ATTEMPTS) {
      await mongoDb.collection(COLLECTION).deleteOne({ userId });
    } else {
      await mongoDb
        .collection(COLLECTION)
        .updateOne({ userId }, { $inc: { attempts: 1 } });
    }
    return false;
  },
};
