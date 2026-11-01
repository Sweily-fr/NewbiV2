/**
 * Outils des tests du calendrier sur l'espace « Agenda » (lot-calendrier.mjs) :
 * appels aux routes de l'API hors GraphQL (webhooks, abonnement iCal,
 * connexions OAuth) avec ou sans la session du navigateur, state OAuth signé
 * comme l'API (pour éprouver ses refus sans joindre Google ni Microsoft).
 */
import { createHmac, randomBytes } from "node:crypto";
import { ouvrir } from "../navigation.mjs";
import { SECRET } from "../config.mjs";
import { base } from "../base.mjs";

/** Page publique du site (sans requêtes de l'espace) : l'origine qui porte la session. */
export const surLeSite = (page) => ouvrir(page, "/mentions-legales");

/** Jeton JWT de la session du navigateur (comme le site avant chaque appel à l'API). */
export async function jetonDeSession(page) {
  return page.evaluate(() =>
    fetch("/api/auth/token", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => d.token || null)
      .catch(() => null),
  );
}

/**
 * Requête vers une route de l'API ou du site, hors navigateur (aucune erreur
 * de console pour un refus attendu). `session` : envoie le JWT de la page.
 * Renvoie { statut, entetes, texte, json }.
 */
export async function appelRoute(page, url, { methode = "GET", session = false, entetes = {}, corps, redirections = 0 } = {}) {
  const headers = { ...entetes };
  if (session) {
    const jeton = await jetonDeSession(page);
    if (jeton) headers.authorization = `Bearer ${jeton}`;
  }
  const reponse = await page.request.fetch(url, {
    method: methode,
    headers,
    data: corps,
    maxRedirects: redirections,
    failOnStatusCode: false,
    timeout: 20_000,
  });
  const texte = await reponse.text();
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {}
  return { statut: reponse.status(), entetes: reponse.headers(), texte, json };
}

/**
 * State OAuth signé comme signedOAuthState.js de l'API (HMAC du secret de
 * test) : sert à éprouver les contrôles qui suivent la signature (expiration,
 * droit, usage unique) sans passer par le fournisseur.
 */
export function stateSigne(purpose, { userId, workspaceId, dureeMs = 10 * 60_000, emisIlYaMs = 0, ...reste }) {
  const issuedAt = Date.now() - emisIlYaMs;
  const encode = Buffer.from(
    JSON.stringify({
      userId: String(userId),
      workspaceId: String(workspaceId),
      ...reste,
      purpose,
      issuedAt,
      expiresAt: issuedAt + dureeMs,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(`oauth-state:${encode}`).digest("base64url");
  return `${encode}.${signature}`;
}

/** Un document tel qu'en base (dates de mise à jour exclues), pour comparer avant et après. */
export async function documentEnBase(collection, filtre) {
  const doc = await (await base()).collection(collection).findOne(filtre);
  if (!doc) return null;
  const { updatedAt, ...reste } = doc;
  return JSON.stringify(reste);
}

export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
