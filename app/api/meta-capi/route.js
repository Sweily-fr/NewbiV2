import { NextResponse } from "next/server";
import {
  createRelayRateLimiter,
  readRelayEvent,
  tooManyRelayCalls,
} from "@/src/lib/security/tracking-relay";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

const isRateLimited = createRelayRateLimiter();

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

export async function POST(request) {
  if (isRateLimited(request)) return tooManyRelayCalls();
  const { body, error } = await readRelayEvent(request);
  if (error) return error;
  const { eventName, email, phone, eventId, value, currency } = body;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ skipped: true });
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: request.headers.get("referer") || "",
        user_data: {
          em: email ? [await hashData(email)] : undefined,
          ph: phone ? [await hashData(phone)] : undefined,
          client_ip_address: request.headers.get("x-forwarded-for") || "",
          client_user_agent: request.headers.get("user-agent") || "",
        },
        custom_data: {
          value,
          currency: currency || "EUR",
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  // Réponse de Meta gardée pour le serveur : le navigateur n'en a pas l'usage
  if (!response.ok) {
    console.error("[META CAPI] Événement refusé :", response.status);
  }
  return NextResponse.json({ success: response.ok });
}
