// Attribution des inscriptions côté client.
//
// Objectif : savoir, pour chaque compte créé, d'où vient la personne
// (campagne Google Ads, recherche Google naturelle, assistant IA, lien d'un
// autre site, accès direct) et quelle page l'a convaincue, afin de lire le
// rendement de chaque canal et de chaque article dans la base, et d'importer
// plus tard les conversions « essai → payant » dans Google Ads (import de
// conversions hors ligne par gclid).
//
// Deux niveaux, pour respecter le Consent Mode / CNIL :
//   - Les paramètres UTM, la page d'arrivée, le site d'origine (réduit à
//     origine + chemin) et la dernière page vue sont des données de
//     navigation, pas des identifiants : stockés dès l'arrivée.
//   - Les identifiants de clic Google (gclid, gbraid, wbraid) sont des
//     traceurs : stockés uniquement si le consentement marketing est donné
//     (même clé `cookie_consent` que MarketingPixels).
//
// Le tout est envoyé UNE fois, juste après la création du compte, à
// POST /api/attribution qui ne l'écrit que si l'utilisateur n'en a pas déjà.

export const ATTRIBUTION_STORAGE_KEY = "newbi_attribution";
const SENT_KEY_PREFIX = "newbi_attribution_sent_";
// Fenêtre de conversion Google Ads par défaut : 90 jours.
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];
export const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"];

// Pages sans valeur d'attribution : parcours de connexion et d'inscription
// (le retour d'OAuth Google y arrive avec accounts.google.com pour référent),
// application, API et rendus techniques.
const NON_PUBLIC_PREFIXES = [
  "/auth",
  "/dashboard",
  "/api",
  "/onboarding",
  "/create-workspace",
  "/accept-invitation",
  "/invitation-gestionnaire",
  "/banking-callback",
  "/pay",
  "/pdf-generator",
  "/reactivate-account",
  "/mobile-non-disponible",
];

export function isPublicPath(pathname) {
  if (!pathname) return false;
  return !NON_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasMarketingConsent() {
  try {
    const raw = localStorage.getItem("cookie_consent");
    return raw ? JSON.parse(raw)?.marketing === true : false;
  } catch {
    return false;
  }
}

// Site d'origine du chargement : `null` pour une navigation interne,
// `undefined` sans référent (accès direct, application, référent masqué).
// Réduit à origine + chemin : la chaîne de requête d'un site tiers peut
// contenir des données personnelles (recherche, adresse e-mail).
export function externalReferrer(referrer, currentHost) {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    if (url.host === currentHost) return null;
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

function writeStoredAttribution(record) {
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // stockage indisponible : on abandonne silencieusement
  }
}

export function readStoredAttribution() {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.capturedAt || Date.now() - data.capturedAt > MAX_AGE_MS) {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Extrait les paramètres d'attribution d'une URL (chaîne de recherche).
export function parseAttributionParams(search) {
  const params = new URLSearchParams(search || "");
  const utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 200);
  }
  const clickIds = {};
  for (const k of CLICK_ID_KEYS) {
    const v = params.get(k);
    if (v) clickIds[k] = v.slice(0, 200);
  }
  return { utm, clickIds };
}

// À appeler à l'arrivée sur une page (chargement complet).
// - Avec des paramètres de campagne : dernier clic gagnant, la nouvelle
//   visite écrase l'attribution précédente (modèle Google Ads par défaut).
// - Sans paramètre (Google naturel, assistant IA, lien d'un autre site,
//   accès direct) : premier contact gagnant, on n'écrase ni une campagne ni
//   un premier contact déjà connus, et on ignore les chargements venus du
//   site lui-même ou d'une page non publique.
export function captureAttributionFromLocation() {
  if (typeof window === "undefined") return null;
  const { utm, clickIds } = parseAttributionParams(window.location.search);
  const hasUtm = Object.keys(utm).length > 0;
  const hasClickId = Object.keys(clickIds).length > 0;
  const referrer = externalReferrer(document.referrer, window.location.host);

  if (!hasUtm && !hasClickId) {
    if (referrer === null || !isPublicPath(window.location.pathname)) {
      return null;
    }
    const stored = readStoredAttribution();
    if (stored?.landingPage) return null;
    const record = {
      // Garde la dernière page déjà notée si l'enregistrement n'avait qu'elle.
      ...stored,
      landingPage: window.location.pathname,
      referrer,
      capturedAt: Date.now(),
    };
    writeStoredAttribution(record);
    return record;
  }

  const consent = hasMarketingConsent();
  // Rappel après acceptation des cookies : la page courante est déjà notée,
  // elle ne doit pas disparaître avec l'enregistrement remplacé.
  const { lastPage, lastPageAt } = readStoredAttribution() || {};
  const record = {
    lastPage,
    lastPageAt,
    ...utm,
    ...(consent ? clickIds : {}),
    // Sans consentement on garde la trace qu'un clic Ads a eu lieu, sans l'id.
    hadClickId: hasClickId,
    landingPage: window.location.pathname,
    referrer: referrer || undefined,
    capturedAt: Date.now(),
  };
  writeStoredAttribution(record);
  return record;
}

// À appeler à chaque changement de page publique : la dernière page vue
// avant l'inscription est celle qui a convaincu (article, page produit,
// générateur…), souvent différente de la page d'arrivée.
export function rememberLastPage(pathname) {
  if (typeof window === "undefined" || !isPublicPath(pathname)) return;
  const record = readStoredAttribution() || { capturedAt: Date.now() };
  record.lastPage = pathname.slice(0, 500);
  record.lastPageAt = Date.now();
  writeStoredAttribution(record);
}

// Envoie l'attribution stockée pour le compte fraîchement créé. Une seule
// fois par utilisateur (clé locale), et seulement s'il y a quelque chose.
export async function sendAttribution(userId) {
  if (typeof window === "undefined" || !userId) return false;
  const sentKey = `${SENT_KEY_PREFIX}${userId}`;
  try {
    if (localStorage.getItem(sentKey)) return false;
  } catch {
    // ignore
  }
  const stored = readStoredAttribution();
  if (!stored) return false;

  try {
    const res = await fetch("/api/attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stored),
      keepalive: true,
    });
    if (!res.ok) return false;
    try {
      localStorage.setItem(sentKey, String(Date.now()));
    } catch {
      // ignore
    }
    return true;
  } catch {
    return false;
  }
}
