import { v4 as uuidv4 } from "uuid";
import { toTikTokEventName } from "@/src/utils/tiktokEventNames";

// TikTok Events API (server-side), doc :
// https://business-api.tiktok.com/portal/docs?id=1771101303285761
const PIXEL_ID = process.env.TIKTOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.TIKTOK_EVENTS_API_TOKEN;
const TEST_EVENT_CODE = process.env.TIKTOK_TEST_EVENT_CODE;
const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

async function sha256(value) {
  const buffer = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

// TikTok attend un numéro au format E.164 avant hachage (ex : +33612345678).
function normalizePhone(phone) {
  const digits = String(phone).replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 10) {
    return `+33${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export function isTikTokEventsConfigured() {
  return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

export async function sendTikTokEvent({
  eventName,
  eventId,
  email,
  phone,
  externalId,
  value,
  currency = "EUR",
  contentId,
  contentName,
  contentType,
  url,
  referrer,
  ip,
  userAgent,
  ttclid,
  ttp,
}) {
  if (!isTikTokEventsConfigured()) {
    console.warn(
      "⚠️ [TIKTOK EVENTS] TIKTOK_PIXEL_ID ou TIKTOK_EVENTS_API_TOKEN manquant, skip",
    );
    return null;
  }

  const user = {};
  if (email) user.email = await sha256(normalizeEmail(email));
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  if (normalizedPhone) user.phone = await sha256(normalizedPhone);
  if (externalId) user.external_id = await sha256(String(externalId));
  if (ip) user.ip = ip;
  if (userAgent) user.user_agent = userAgent;
  if (ttclid) user.ttclid = ttclid;
  if (ttp) user.ttp = ttp;

  // TikTok refuse un événement sans aucun identifiant d'utilisateur.
  if (Object.keys(user).length === 0) {
    console.warn(
      `⚠️ [TIKTOK EVENTS] Event "${eventName}" sans identifiant utilisateur, skip`,
    );
    return null;
  }

  const properties = {};
  if (value !== undefined && value !== null) {
    properties.value = Number(value);
    properties.currency = currency;
  }
  if (contentId || contentName || contentType) {
    properties.content_type = contentType || "product";
    properties.contents = [
      {
        content_id: contentId ? String(contentId) : undefined,
        content_name: contentName,
        content_type: contentType || "product",
      },
    ];
  }

  const event = {
    event: toTikTokEventName(eventName),
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || uuidv4(),
    user,
    ...(Object.keys(properties).length ? { properties } : {}),
    ...(url || referrer ? { page: { url, referrer } } : {}),
  };

  const payload = {
    event_source: "web",
    event_source_id: PIXEL_ID,
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    data: [event],
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (data?.code !== 0) {
      console.error(
        `❌ [TIKTOK EVENTS] Event "${event.event}" refusé (code ${data?.code}): ${data?.message}`,
      );
      return data;
    }

    console.log(
      `✅ [TIKTOK EVENTS] Event "${event.event}" envoyé pour ${email || "unknown"}`,
    );
    return data;
  } catch (error) {
    console.error(
      `❌ [TIKTOK EVENTS] Erreur envoi event "${event.event}":`,
      error.message,
    );
    return null;
  }
}
