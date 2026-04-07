import { NextResponse } from "next/server";

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

export async function POST(request) {
  const { eventName, email, phone, eventId, value, currency } =
    await request.json();

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

  const data = await response.json();
  return NextResponse.json(data);
}
