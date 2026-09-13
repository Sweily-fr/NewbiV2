import { v4 as uuidv4 } from "uuid";
import { toTikTokEventName } from "@/src/utils/tiktokEventNames";

function hasMarketingConsent() {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    return JSON.parse(consent).marketing === true;
  } catch {
    return false;
  }
}

// Envoie un événement de conversion à Meta et TikTok : pixel navigateur +
// API serveur, avec le même eventId pour la déduplication des deux côtés.
export async function trackEvent({
  eventName,
  email,
  phone,
  value,
  currency = "EUR",
  contentId,
  contentName,
  contentType,
}) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;

  const eventId = uuidv4();
  const url = window.location.href;

  // 1. Pixels côté navigateur
  if (window.fbq) {
    window.fbq("track", eventName, { value, currency }, { eventID: eventId });
  }
  if (window.ttq) {
    const tiktokProps = {};
    if (value !== undefined && value !== null) {
      tiktokProps.value = value;
      tiktokProps.currency = currency;
    }
    if (contentId || contentName || contentType) {
      tiktokProps.content_type = contentType || "product";
      tiktokProps.contents = [
        { content_id: contentId, content_name: contentName },
      ];
    }
    window.ttq.track(toTikTokEventName(eventName), tiktokProps, {
      event_id: eventId,
    });
  }

  // 2. APIs côté serveur (en parallèle, un échec n'empêche pas l'autre)
  const jsonPost = (path, payload) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

  await Promise.all([
    jsonPost("/api/meta-capi", {
      eventName,
      email,
      phone,
      value,
      currency,
      eventId,
    }),
    jsonPost("/api/tiktok-events", {
      eventName,
      email,
      phone,
      value,
      currency,
      eventId,
      contentId,
      contentName,
      contentType,
      url,
    }),
  ]);
}

// --- Google Ads -------------------------------------------------------------
// Le tag gtag (AW-18448267727) est chargé dans le head par app/layout.jsx en
// Consent Mode v2 : sans consentement, Google envoie quand même un ping de
// conversion sans cookie (modélisé ensuite), donc pas de garde consentement ici.
export const GOOGLE_ADS_ID = "AW-18448267727";
export const GOOGLE_ADS_CONVERSIONS = {
  // Conversion « Inscription » créée dans Google Ads le 13/09/2026.
  signup: "zQX2CM-P4PYcEM_z6NxE",
};

// Envoie une conversion Google Ads une seule fois par (conversion, clé) : la
// clé (id utilisateur en général) évite de recompter au rechargement de la
// page ou quand l'inscription email et le retour OAuth passent tous les deux
// par la même page.
export function trackGoogleAdsConversion({ conversion, dedupeKey }) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }
  const label = GOOGLE_ADS_CONVERSIONS[conversion];
  if (!label) return false;

  const storageKey = `gads_conversion_${conversion}_${dedupeKey || "anon"}`;
  try {
    if (dedupeKey && localStorage.getItem(storageKey)) return false;
  } catch {
    // localStorage indisponible : on envoie quand même
  }

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
  });

  try {
    if (dedupeKey) localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    // ignore
  }
  return true;
}

// Compte créé (email ou OAuth) : à appeler avec l'id du nouvel utilisateur.
export function trackSignupConversion(userId) {
  return trackGoogleAdsConversion({ conversion: "signup", dedupeKey: userId });
}
