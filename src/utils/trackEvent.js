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
