// Attribution marketing (Google Ads / UTM) côté client.
//
// Objectif : savoir, pour chaque compte créé, de quelle campagne il vient,
// afin de pouvoir importer plus tard les conversions « essai → payant » dans
// Google Ads (import de conversions hors ligne par gclid) et lire le ROI par
// campagne dans la base.
//
// Deux niveaux, pour respecter le Consent Mode / CNIL :
//   - Les paramètres UTM et la page d'arrivée sont des données de campagne,
//     pas des identifiants : stockés dès l'arrivée.
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

function hasMarketingConsent() {
  try {
    const raw = localStorage.getItem("cookie_consent");
    return raw ? JSON.parse(raw)?.marketing === true : false;
  } catch {
    return false;
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

// À appeler à l'arrivée sur une page. Dernier clic gagnant : une nouvelle
// visite avec des paramètres écrase l'attribution précédente (modèle Google
// Ads par défaut). Sans paramètre dans l'URL, on ne touche à rien.
export function captureAttributionFromLocation() {
  if (typeof window === "undefined") return null;
  const { utm, clickIds } = parseAttributionParams(window.location.search);
  const hasUtm = Object.keys(utm).length > 0;
  const hasClickId = Object.keys(clickIds).length > 0;
  if (!hasUtm && !hasClickId) return null;

  const consent = hasMarketingConsent();
  const record = {
    ...utm,
    ...(consent ? clickIds : {}),
    // Sans consentement on garde la trace qu'un clic Ads a eu lieu, sans l'id.
    hadClickId: hasClickId,
    landingPage: window.location.pathname,
    referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
    capturedAt: Date.now(),
  };
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // stockage indisponible : on abandonne silencieusement
  }
  return record;
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
