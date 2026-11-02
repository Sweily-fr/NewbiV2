/**
 * Retour de la connexion bancaire (Bridge) vers l'accueil.
 *
 * L'accueil lance une synchronisation complète des comptes quand il reçoit
 * les paramètres de retour de Bridge (?item_id, ?status, ?banking_success).
 * Un simple lien vers /dashboard?status=… ne doit rien déclencher : la
 * synchronisation n'a lieu que si ce navigateur a lui-même ouvert la
 * connexion bancaire peu avant (marque posée au départ vers Bridge).
 */

const STORAGE_KEY = "newbi-bank-connect-started";
// Durée laissée pour se connecter à sa banque (authentification forte
// comprise) avant que le retour ne soit plus reconnu
export const BANK_CONNECT_MAX_AGE_MS = 60 * 60 * 1000;

function storage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Paramètres d'adresse posés par Bridge ou par le retour de l'API. */
export function hasBankConnectReturnParams(search) {
  const params = new URLSearchParams(search || "");
  return (
    params.has("item_id") ||
    params.has("status") ||
    params.get("banking_success") === "true"
  );
}

/** À appeler juste avant de partir vers la page de connexion de Bridge. */
export function markBankConnectStarted(now = Date.now()) {
  try {
    storage()?.setItem(STORAGE_KEY, String(now));
  } catch {
    // Stockage indisponible (navigation privée) : pas de synchro au retour,
    // le webhook et la synchro planifiée prennent le relais
  }
}

/** Part vers la connexion bancaire en marquant le départ. */
export function goToBankConnect(url) {
  markBankConnectStarted();
  window.location.href = url;
}

/** Vrai si ce navigateur a ouvert une connexion bancaire récemment. */
export function hasPendingBankConnect(now = Date.now()) {
  let startedAt = null;
  try {
    startedAt = Number(storage()?.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
  if (!startedAt || !Number.isFinite(startedAt)) return false;
  const age = now - startedAt;
  return age >= 0 && age <= BANK_CONNECT_MAX_AGE_MS;
}

/** Retire la marque (retour traité ou ignoré). */
export function clearBankConnectStarted() {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
}

/**
 * Retour réel d'une connexion bancaire : paramètres de retour dans
 * l'adresse ET connexion ouverte depuis ce navigateur peu avant.
 */
export function isRealBankConnectReturn(search, now = Date.now()) {
  return hasBankConnectReturnParams(search) && hasPendingBankConnect(now);
}
