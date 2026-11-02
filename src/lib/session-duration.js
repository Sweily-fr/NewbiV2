/**
 * Durée de session choisie par l'espace (Paramètres > Sécurité : 7, 30 ou
 * 90 jours) : une session n'est plus valable au-delà de cette durée après la
 * connexion, même si elle reste active.
 *
 * Appliquée seulement aux espaces qui ont choisi une durée : sans réglage
 * enregistré, les sessions gardent le fonctionnement de Better Auth (30 jours
 * glissants).
 *
 * - À la création d'une session : expiresAt ramené à connexion + durée.
 * - Au renouvellement (get-session, toutes les heures d'activité) : la
 *   nouvelle échéance ne dépasse jamais connexion + durée ; une session déjà
 *   plus vieille que la durée est fermée.
 */
import { ObjectId } from "mongodb";

export const SESSION_DURATIONS_DAYS = [7, 30, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

async function db() {
  const { mongoDb } = await import("./mongodb.js");
  return mongoDb;
}

/** Durée (jours) choisie par l'espace, ou null sans réglage valable. */
export async function readSessionDurationDays(orgId, mongoDb = null) {
  if (!orgId || !ObjectId.isValid(String(orgId))) return null;
  try {
    const org = await (mongoDb || (await db()))
      .collection("organization")
      .findOne(
        { _id: new ObjectId(String(orgId)) },
        { projection: { "sessionSettings.sessionDuration": 1 } },
      );
    const days = org?.sessionSettings?.sessionDuration;
    return SESSION_DURATIONS_DAYS.includes(days) ? days : null;
  } catch {
    return null;
  }
}

/** Échéance maximale d'une session ouverte à `createdAt`. */
export function sessionLimit(createdAt, days) {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + days * DAY_MS);
}

/** session.create.before : échéance ramenée à la durée de l'espace. */
export async function capNewSessionExpiry(session, { mongoDb = null } = {}) {
  const days = await readSessionDurationDays(
    session?.activeOrganizationId,
    mongoDb,
  );
  if (!days) return session;
  const limit = sessionLimit(session.createdAt || new Date(), days);
  if (!limit) return session;
  const current = new Date(session.expiresAt);
  if (!Number.isNaN(current.getTime()) && current <= limit) return session;
  return { ...session, expiresAt: limit };
}

/**
 * session.update.before : renouvellement borné. `context` est le contexte
 * de l'appel Better Auth (get-session y pose la session en cours).
 * Renvoie undefined (rien à changer), { data } (échéance ramenée) ou false
 * (session trop ancienne : supprimée, Better Auth répond 401).
 */
export async function capSessionRenewal(
  data,
  context,
  { mongoDb = null } = {},
) {
  if (!data?.expiresAt) return undefined;
  const current = context?.context?.session?.session;
  if (!current?.createdAt || !current?.token) return undefined;
  const database = mongoDb || (await db());
  const days = await readSessionDurationDays(
    current.activeOrganizationId,
    database,
  );
  if (!days) return undefined;
  const limit = sessionLimit(current.createdAt, days);
  if (!limit) return undefined;
  if (limit <= new Date()) {
    await database.collection("session").deleteOne({ token: current.token });
    return false;
  }
  if (new Date(data.expiresAt) <= limit) return undefined;
  return { data: { ...data, expiresAt: limit } };
}
