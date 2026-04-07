import { v4 as uuidv4 } from "uuid";

export async function trackEvent({
  eventName,
  email,
  phone,
  value,
  currency = "EUR",
}) {
  const eventId = uuidv4();

  // 1. Pixel côté navigateur
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, { value, currency }, { eventID: eventId });
  }

  // 2. CAPI côté serveur
  await fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, email, phone, value, currency, eventId }),
  });
}
