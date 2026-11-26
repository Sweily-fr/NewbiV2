/**
 * Pages dont l'adresse porte un secret : lien de transfert et sa clé,
 * tableau public, paiement, invitation, réinitialisation ou vérification,
 * réactivation, gestion d'un rendez-vous, billet et inscription à un
 * événement, jeton de l'application mobile.
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
  "/rdv/gerer/",
  // Billetterie : billet (QR code) et lien de gestion d'une inscription
  "/rdv/billet/",
  "/rdv/inscription/",
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
  // Retour du paiement d'une inscription à un événement (jeton de retour,
  // session Stripe)
  "rt",
  "session_id",
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
  // Retour du paiement d'une inscription à un événement (jeton de retour,
  // session Stripe)
  "rt",
  "session_id",
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

/**
 * Visite commencée sur une adresse à recharger (lien de réinitialisation, de
 * vérification, de transfert…) : le script du <head> n'y charge aucune balise
 * et marque la visite (`__markSecretVisit(window)`). Jusqu'au prochain
 * chargement complet, l'adresse à secret reste dans l'historique de ce
 * document (bouton Retour) et la visite continue sans rechargement
 * (« Se connecter », puis le tableau de bord) : aucun pixel ne doit y être
 * chargé (MarketingPixels), sinon il verrait l'adresse au retour arrière ou à
 * la navigation suivante vers une page à secret.
 */
export const SECRET_VISIT_FLAG = "__newbiSecretVisit";

export const SECRET_VISIT_INLINE_SOURCE = `function __markSecretVisit(w) {
  if (__needsFullReload(w.location)) w.${SECRET_VISIT_FLAG} = true;
}`;

/** Visite commencée sur une adresse à recharger (drapeau du <head>) ? */
export function isSecretVisit() {
  return typeof window !== "undefined" && window[SECRET_VISIT_FLAG] === true;
}

/**
 * Script du <head>, sur une page sans secret (balises chargées) :
 * `__guardSecretNavigation(window)`. Un pushState ou un replaceState vers une
 * adresse à recharger (`__needsFullReload`) devient un chargement complet
 * (`location.assign`), et l'appel d'origine est bloqué : la page déjà
 * chargée, et ses balises, ne voient jamais le secret.
 *
 * Un seul `location.assign` par adresse : Next.js passe d'abord par ce
 * pushState, puis recopie l'adresse dans l'historique (HistoryUpdater,
 * replaceState). Un second `location.assign` vers la même adresse annulait le
 * premier chargement (net::ERR_ABORTED). Les appels suivants vers la même
 * adresse sont donc ignorés, jusqu'à une nouvelle action de l'utilisateur
 * (clic, touche) ou un retour sur la page depuis le cache du navigateur : un
 * chargement interrompu (bouton Arrêter) se relance d'un nouveau clic.
 */
export const SECRET_HISTORY_GUARD_SOURCE = `function __guardSecretNavigation(w) {
  var pending = null;
  function reset() { pending = null; }
  w.addEventListener("pointerdown", reset, true);
  w.addEventListener("keydown", reset, true);
  w.addEventListener("pageshow", function(e) { if (e.persisted) reset(); });
  ["pushState", "replaceState"].forEach(function(method) {
    var original = w.history[method];
    w.history[method] = function(state, title, url) {
      try {
        if (url !== undefined && url !== null) {
          var next = new URL(url, w.location.href);
          if (next.origin === w.location.origin && __needsFullReload(next)) {
            if (pending !== next.href) {
              w.location.assign(next.href);
              pending = next.href;
            }
            return;
          }
        }
      } catch (e) {}
      return original.apply(this, arguments);
    };
  });
}`;
