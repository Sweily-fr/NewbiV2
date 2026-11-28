/**
 * Origines de confiance de Better Auth (callbackURL, redirections après
 * vérification, contrôle CSRF) et proxy d'autorisation de l'application
 * mobile.
 *
 * Application mobile : elle s'annonce par l'en-tête « expo-origin »
 * (« newbi:// », son scheme). Une redirection vers un scheme de confiance
 * autre que http(s) reçoit le cookie de session dans son adresse (plugin
 * @better-auth/expo) : seuls « newbi:// » et, hors production, « exp:// »
 * (Expo Go, développement) sont donc acceptés, jamais une valeur libre de
 * l'en-tête.
 */

const BASE_ORIGINS = [
  "https://newbi.fr",
  "https://www.newbi.fr",
  "https://newbi-v2.vercel.app",
  "newbi://",
];

// Site lancé sur le poste (développement, tests de bout en bout) : jamais
// une origine de confiance du site de production
const LOCAL_ORIGIN = "http://localhost:3000";

const LOCAL_IP_ORIGIN =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

/** Production de www.newbi.fr (les déploiements de prévisualisation n'en sont pas). */
export function isProductionDeployment(env = process.env) {
  return env.VERCEL_ENV === "production";
}

/** Schemes d'application mobile acceptés selon l'environnement. */
export function mobileSchemes(env = process.env) {
  return isProductionDeployment(env) ? ["newbi://"] : ["newbi://", "exp://"];
}

/** Valeur de l'en-tête expo-origin acceptée comme origine (scheme de l'application seulement). */
export function isAcceptedExpoOrigin(value, env = process.env) {
  if (typeof value !== "string" || !value) return false;
  return mobileSchemes(env).some((scheme) => value.startsWith(scheme));
}

/** Origine http(s) d'une adresse (« https://x.fr/chemin/ » → « https://x.fr »), sinon null. */
function httpOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

/**
 * Adresses du déploiement lui-même, telles que sa configuration les déclare :
 * l'URL du site (BETTER_AUTH_URL, NEXT_PUBLIC_BETTER_AUTH_URL,
 * NEXT_PUBLIC_SITE_URL) et, hors production, les adresses Vercel du
 * déploiement (VERCEL_URL, VERCEL_BRANCH_URL). Sans elles, un environnement
 * servi sur un autre domaine que www.newbi.fr (staging, prévisualisation)
 * refusait l'inscription et la connexion par « Invalid origin » dès que
 * BETTER_AUTH_URL ne correspondait pas exactement à l'adresse ouverte.
 * Aucune valeur de la requête n'est lue ici.
 */
export function deploymentOrigins(env = process.env) {
  const declared = [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_BETTER_AUTH_URL,
    env.NEXT_PUBLIC_SITE_URL,
  ];
  const vercel = isProductionDeployment(env)
    ? []
    : [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
        .filter(Boolean)
        .map((host) => (/^https?:\/\//.test(host) ? host : `https://${host}`));
  return [...declared, ...vercel].map(httpOrigin).filter(Boolean);
}

/**
 * ADDITIONAL_TRUSTED_ORIGINS, séparées par des virgules. Une adresse http(s)
 * est ramenée à son origine : « https://staging.newbi.fr/ » (barre finale)
 * ou une adresse avec chemin ne correspondait jamais à l'en-tête Origin.
 * Les motifs (« https://*.vercel.app ») et les schemes restent tels quels.
 */
function additionalOrigins(env) {
  return (env.ADDITIONAL_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => httpOrigin(o) ?? o.replace(/\/+$/, ""));
}

export function buildTrustedOrigins(request, env = process.env) {
  const origins = [
    ...BASE_ORIGINS,
    ...(isProductionDeployment(env) ? [] : [LOCAL_ORIGIN]),
    ...mobileSchemes(env).filter((s) => !BASE_ORIGINS.includes(s)),
    ...deploymentOrigins(env),
    ...additionalOrigins(env),
  ];

  // Le plugin @better-auth/expo envoie "expo-origin" au lieu de "Origin".
  const expoOrigin = request?.headers?.get?.("expo-origin");
  if (expoOrigin && isAcceptedExpoOrigin(expoOrigin, env)) {
    origins.push(expoOrigin);
  }

  // En dev uniquement : autoriser les IPs locales privées (RFC1918)
  // pour le test du flow mobile (web view chargée depuis l'IP du Mac).
  if (env.NODE_ENV === "development") {
    const requestOrigin = request?.headers?.get?.("origin");
    if (requestOrigin && LOCAL_IP_ORIGIN.test(requestOrigin)) {
      origins.push(requestOrigin);
    }
  }

  return [...new Set(origins)];
}

/**
 * Fournisseurs vers lesquels le proxy d'autorisation de l'application
 * mobile (/expo-authorization-proxy) peut rediriger : ceux de la connexion
 * sociale (auth.js, socialProviders).
 */
const OAUTH_AUTHORIZATION_HOSTS = new Set([
  "accounts.google.com",
  "appleid.apple.com",
  "github.com",
]);

export function isAllowedAuthorizationURL(value) {
  if (typeof value !== "string") return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    OAUTH_AUTHORIZATION_HOSTS.has(url.hostname)
  );
}
