import { v4 as uuidv4 } from "uuid";

function hasMarketingConsent() {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    return JSON.parse(consent).marketing === true;
  } catch {
    return false;
  }
}

export async function trackEvent({
  eventName,
  email,
  phone,
  value,
  currency = "EUR",
}) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;

  const eventId = uuidv4();

  // 1. Pixel côté navigateur
  if (window.fbq) {
    window.fbq("track", eventName, { value, currency }, { eventID: eventId });
  }

  // 2. CAPI côté serveur
  await fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, email, phone, value, currency, eventId }),
  });
}
