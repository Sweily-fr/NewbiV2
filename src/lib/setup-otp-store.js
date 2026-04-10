// Store temporaire en mémoire pour les codes OTP de setup 2FA.
// On l'attache à globalThis pour qu'il survive au HMR de Next.js (dev/Turbopack)
// et aux éventuelles ré-évaluations de module entre route handlers.
const store = globalThis.__newbiSetupOtpStore ?? new Map();
if (!globalThis.__newbiSetupOtpStore) {
  globalThis.__newbiSetupOtpStore = store;
}

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

    // Expiré → on supprime et on refuse
    if (Date.now() > entry.expiresAt) {
      store.delete(userId);
      return false;
    }

    // Comparaison tolérante aux espaces éventuels
    const expected = String(entry.otp).trim();
    const received = String(code).trim();
    const isValid = expected === received;

    // Usage unique : on ne supprime l'entrée qu'en cas de succès,
    // pour laisser la possibilité de corriger une faute de frappe.
    if (isValid) {
      store.delete(userId);
    }

    return isValid;
  },
};
