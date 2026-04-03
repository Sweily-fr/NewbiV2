// Store temporaire en mémoire pour les codes OTP de setup 2FA
const store = new Map();

export const setupOtpStore = {
  set(userId, otp, ttlMs) {
    store.set(userId, {
      otp,
      expiresAt: Date.now() + ttlMs,
    });
  },

  verify(userId, code) {
    const entry = store.get(userId);
    if (!entry) return false;

    // Supprimer après vérification (usage unique)
    store.delete(userId);

    if (Date.now() > entry.expiresAt) return false;
    return entry.otp === code;
  },
};
