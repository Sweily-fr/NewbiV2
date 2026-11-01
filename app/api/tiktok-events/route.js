import { NextResponse } from "next/server";
import { sendTikTokEvent } from "@/src/utils/tiktokEventsServer";
import {
  createRelayRateLimiter,
  readRelayEvent,
  tooManyRelayCalls,
} from "@/src/lib/security/tracking-relay";

const isRateLimited = createRelayRateLimiter();

// Relais navigateur → TikTok Events API. Le pixel côté client envoie le même
// event_id : TikTok déduplique pixel + serveur sur ce couple (event, event_id).
export async function POST(request) {
  if (isRateLimited(request)) return tooManyRelayCalls();
  const { body, error } = await readRelayEvent(request);
  if (error) return error;

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

  // Réponse de TikTok gardée pour le serveur
  if (!data) return NextResponse.json({ skipped: true });
  return NextResponse.json({ success: data.code === 0 });
}
