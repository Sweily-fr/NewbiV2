import { v4 as uuidv4 } from "uuid";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.trim().toLowerCase());
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    dataBuffer,
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sendMetaConversion({
  eventName,
  email,
  phone,
  value,
  currency = "EUR",
}) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn(
      "⚠️ [META CAPI] META_PIXEL_ID ou META_CAPI_TOKEN manquant, skip",
    );
    return null;
  }

  const eventId = uuidv4();

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: {
          em: email ? [await hashData(email)] : undefined,
          ph: phone ? [await hashData(phone)] : undefined,
        },
        custom_data: {
          value,
          currency,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    console.log(
      `✅ [META CAPI] Event "${eventName}" envoyé pour ${email || "unknown"}`,
      data,
    );
    return data;
  } catch (error) {
    console.error(
      `❌ [META CAPI] Erreur envoi event "${eventName}":`,
      error.message,
    );
    return null;
  }
}
