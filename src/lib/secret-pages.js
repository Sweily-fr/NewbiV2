/**
 * Pages dont l'adresse porte un secret : lien de transfert et sa clé,
 * tableau public, paiement, invitation, réinitialisation ou vérification,
 * réactivation, jeton de l'application mobile.
 *
 * Les balises tierces (Google Ads, Google Tag Manager, pixels Meta et
 * TikTok, PostHog) reçoivent l'adresse complète de la page : elles ne sont
 * jamais chargées sur ces pages, même avec le consentement.
 */
export const SECRET_PATH_PREFIXES = [
  "/transfer/",
  "/public/",
  "/pay/",
  "/accept-invitation/",
  "/invitation-gestionnaire/",
  "/auth/reset-password",
  "/auth/verify-email",
  "/reactivate-account",
  "/pdf-generator/",
  "/banking-callback",
  // Lien de partage d'un transfert, vu par son propriétaire
  "/dashboard/outils/transferts-fichiers/",
];

// Paramètres d'adresse qui portent un secret ou une adresse e-mail, sur
// n'importe quelle page (ex. /auth/login?invitation=…&email=…)
export const SECRET_QUERY_KEYS = [
  "token",
  "key",
  "t",
  "ott",
  "code",
  "email",
  "invitation",
  "accessKey",
];

export function isSecretLocation(pathname, search = "") {
  const path = typeof pathname === "string" ? pathname : "";
  if (SECRET_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return true;
  }
  let params;
  try {
    params = new URLSearchParams(search || "");
  } catch {
    return false;
  }
  return SECRET_QUERY_KEYS.some((key) => params.has(key));
}

/** Adresse complète (texte) : page à secret ? */
export function isSecretUrl(url) {
  try {
    const parsed = new URL(url, "https://www.newbi.fr");
    return isSecretLocation(parsed.pathname, parsed.search);
  } catch {
    return false;
  }
}

// Secrets proprement dits (jetons, clés) : une navigation interne vers une
// adresse qui en porte recharge la page entière, sans les balises déjà
// chargées. Une adresse e-mail seule (?email=, ?invitation=) n'empêche que
// leur chargement : la navigation interne reste fluide (PostHog n'envoie
// rien depuis ces adresses).
export const RELOAD_QUERY_KEYS = [
  "token",
  "key",
  "t",
  "ott",
  "code",
  "accessKey",
];

/**
 * Même règle, en texte, pour le script du <head> (avant React) :
 * `__isSecretPage(location)` et `__needsFullReload(url)`.
 */
const INLINE_MATCH = (fn, keys) =>
  `function ${fn}(loc){try{var p=loc.pathname||"",s=new URLSearchParams(loc.search||""),pre=${JSON.stringify(
    SECRET_PATH_PREFIXES,
  )},keys=${JSON.stringify(
    keys,
  )};for(var i=0;i<pre.length;i++){if(p.indexOf(pre[i])===0)return true}for(var j=0;j<keys.length;j++){if(s.has(keys[j]))return true}return false}catch(e){return false}}`;

export const SECRET_PAGE_INLINE_SOURCE = `${INLINE_MATCH(
  "__isSecretPage",
  SECRET_QUERY_KEYS,
)}${INLINE_MATCH("__needsFullReload", RELOAD_QUERY_KEYS)}`;
