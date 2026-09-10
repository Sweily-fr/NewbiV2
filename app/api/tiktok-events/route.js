import { NextResponse } from "next/server";
import { sendTikTokEvent } from "@/src/utils/tiktokEventsServer";

// Relais navigateur → TikTok Events API. Le pixel côté client envoie le même
// event_id : TikTok déduplique pixel + serveur sur ce couple (event, event_id).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    eventName,
    eventId,
    email,
    phone,
    externalId,
    value,
    currency,
    contentId,
    contentName,
    contentType,
    url,
  } = body || {};

  if (!eventName || typeof eventName !== "string") {
    return NextResponse.json({ error: "eventName required" }, { status: 400 });
  }

  const cookies = request.cookies;
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0].trim() || undefined;

  const data = await sendTikTokEvent({
    eventName,
    eventId,
    email,
    phone,
    externalId,
    value,
    currency,
    contentId,
    contentName,
    contentType,
    url: url || request.headers.get("referer") || undefined,
    referrer: undefined,
    ip,
    userAgent: request.headers.get("user-agent") || undefined,
    ttclid: cookies.get("ttclid")?.value,
    ttp: cookies.get("_ttp")?.value,
  });

  return NextResponse.json(data ?? { skipped: true });
}
