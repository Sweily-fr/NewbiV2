import { NextResponse } from "next/server";
import { createIpRateLimiter } from "./ip-rate-limit";

/**
 * Relais publics navigateur → Meta (Conversions API) et TikTok (Events API).
 * Sans session : seuls les événements qu'un visiteur déclare lui-même sont
 * relayés. Achats et abonnements partent du serveur, après le paiement
 * Stripe (src/lib/auth-plugins.js), jamais d'un appel du navigateur.
 */
export const RELAY_EVENTS = new Set([
  "Lead",
  "Contact",
  "CompleteRegistration",
  "ViewContent",
  "Search",
  "ClickButton",
  "SubmitForm",
  "InitiateCheckout",
]);

// Montant déclaré par le navigateur : au plus le prix annuel de la plus
// grande offre, largement.
export const RELAY_MAX_VALUE = 10_000;

/**
 * Lit et contrôle le corps d'un appel de relais. Renvoie { body } ou
 * { error: NextResponse }.
 */
export async function readRelayEvent(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json({ error: "JSON invalide" }, { status: 400 }),
    };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      error: NextResponse.json({ error: "Corps invalide" }, { status: 400 }),
    };
  }

  const { eventName, value, currency, eventId } = body;
  if (typeof eventName !== "string" || !RELAY_EVENTS.has(eventName)) {
    return {
      error: NextResponse.json(
        { error: "Événement non relayé" },
        { status: 400 },
      ),
    };
  }
  if (
    value !== undefined &&
    value !== null &&
    !(
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= RELAY_MAX_VALUE
    )
  ) {
    return {
      error: NextResponse.json({ error: "Montant invalide" }, { status: 400 }),
    };
  }
  if (
    currency !== undefined &&
    currency !== null &&
    !/^[A-Z]{3}$/.test(String(currency))
  ) {
    return {
      error: NextResponse.json({ error: "Devise invalide" }, { status: 400 }),
    };
  }
  if (
    eventId !== undefined &&
    eventId !== null &&
    !/^[\w-]{1,64}$/.test(String(eventId))
  ) {
    return {
      error: NextResponse.json(
        { error: "Identifiant d'événement invalide" },
        { status: 400 },
      ),
    };
  }
  for (const champ of [
    "email",
    "phone",
    "externalId",
    "contentId",
    "contentName",
    "contentType",
    "url",
  ]) {
    const v = body[champ];
    if (
      v !== undefined &&
      v !== null &&
      (typeof v !== "string" || v.length > 500)
    ) {
      return {
        error: NextResponse.json(
          { error: `Champ « ${champ} » invalide` },
          { status: 400 },
        ),
      };
    }
  }
  return { body };
}

/** Limite par adresse IP, propre à chaque relais. */
export function createRelayRateLimiter() {
  return createIpRateLimiter({ windowMs: 60 * 1000, max: 20 });
}

export const tooManyRelayCalls = () =>
  NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
