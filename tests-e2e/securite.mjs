/**
 * Contrôles de sécurité : ce qu'une personne pourrait faire en contournant
 * l'interface (console du navigateur, script) avec sa propre session. Le
 * masquage d'un bouton ne suffit pas : l'API doit refuser elle-même.
 *
 *   - appelApi() : requête GraphQL directe, avec le jeton de la session du
 *     navigateur, exactement comme le site ;
 *   - refuse() : la réponse est un refus (aucune donnée, une erreur de droits
 *     ou d'authentification), jamais une réussite silencieuse.
 */
import { expect } from "@playwright/test";
import { API_URL, BASE_URL } from "./config.mjs";

/**
 * Appelle l'API GraphQL avec la session de la page (la page doit être sur le
 * site). `organisation` : en-tête x-organization-id, comme le site l'envoie.
 * `delai` (ms) : au-delà, la requête est abandonnée et `sansReponse` vaut true
 * (une requête que l'API laisse sans réponse bloque l'écran de l'utilisateur).
 * Renvoie { statut, data, errors, sansReponse }.
 */
export async function appelApi(page, query, variables = {}, { organisation = null, delai = 0 } = {}) {
  return page.evaluate(
    async ({ query, variables, api, organisation, delai }) => {
      const jeton = await fetch("/api/auth/token", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => d.token || null)
        .catch(() => null);
      const arret = new AbortController();
      const minuteur = delai ? setTimeout(() => arret.abort(), delai) : null;
      try {
        const res = await fetch(`${api}/graphql`, {
          method: "POST",
          credentials: "include",
          signal: arret.signal,
          headers: {
            "Content-Type": "application/json",
            "x-app-client": "web",
            ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
            ...(organisation ? { "x-organization-id": organisation } : {}),
          },
          body: JSON.stringify({ query, variables }),
        });
        const corps = await res.json().catch(() => ({}));
        return { statut: res.status, data: corps.data ?? null, errors: corps.errors ?? [], sansReponse: false };
      } catch (erreur) {
        if (arret.signal.aborted) return { statut: 0, data: null, errors: [], sansReponse: true };
        throw erreur;
      } finally {
        if (minuteur) clearTimeout(minuteur);
      }
    },
    { query, variables, api: API_URL, organisation, delai },
  );
}

/** Codes et messages d'un refus de l'API. */
const REFUS = /FORBIDDEN|UNAUTHENTICATED|UNAUTHORIZED|NOT_FOUND|permission|autoris|droit|acc[eè]s|interdit|non trouv|introuvable|n'existe pas|not found/i;

/**
 * La réponse est un refus : aucune donnée pour `champ`, et une erreur qui
 * dit pourquoi (droits, authentification, ou « introuvable » pour une
 * donnée d'une autre organisation, qu'il ne faut même pas confirmer).
 */
export function verifierRefus(reponse, champ, contexte) {
  const valeur = reponse.data?.[champ];
  const vide = valeur === null || valeur === undefined || (Array.isArray(valeur) && valeur.length === 0);
  expect(vide, `${contexte} : l'API ne doit rien renvoyer pour « ${champ} » (reçu ${JSON.stringify(valeur)?.slice(0, 200)})`).toBe(true);
  const messages = reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
  if (!Array.isArray(valeur)) {
    expect(messages, `${contexte} : l'API doit expliquer son refus`).toMatch(REFUS);
  }
}

/** Fragments d'identifiants utiles aux requêtes de contrôle. */
export const id = (doc) => doc._id.toHexString();

/**
 * Jeton de l'API pour la session de la page, sans ouvrir de page : utile
 * aux rôles dont le tableau de bord n'est pas le sujet du test.
 */
export async function jetonApi(page) {
  const reponse = await page.request.get(`${BASE_URL}/api/auth/token`, { failOnStatusCode: false });
  if (!reponse.ok()) return null;
  return (await reponse.json().catch(() => ({}))).token || null;
}

/**
 * Comme appelApi, sans page chargée : requête GraphQL envoyée depuis le
 * contexte du navigateur (cookies de la session), avec le jeton de l'API.
 */
export async function appelApiDirect(page, query, variables = {}, { organisation = null, delai = 30_000 } = {}) {
  const jeton = await jetonApi(page);
  const res = await page.request.post(`${API_URL}/graphql`, {
    headers: {
      "Content-Type": "application/json",
      "x-app-client": "web",
      ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
      ...(organisation ? { "x-organization-id": organisation } : {}),
    },
    data: { query, variables },
    timeout: delai,
    failOnStatusCode: false,
  });
  const corps = await res.json().catch(() => ({}));
  return { statut: res.status(), data: corps.data ?? null, errors: corps.errors ?? [], sansReponse: false };
}

/**
 * Mutation GraphQL avec un fichier (envoi multipart, comme le site) :
 * `fichier` = { name, mimeType, buffer } placé dans la variable `file`.
 */
export async function envoiFichierApi(page, query, variables, fichier, { organisation = null } = {}) {
  const jeton = await jetonApi(page);
  const res = await page.request.post(`${API_URL}/graphql`, {
    headers: {
      "Apollo-Require-Preflight": "true",
      "x-app-client": "web",
      ...(jeton ? { authorization: `Bearer ${jeton}` } : {}),
      ...(organisation ? { "x-organization-id": organisation } : {}),
    },
    multipart: {
      operations: JSON.stringify({ query, variables: { ...variables, file: null } }),
      map: JSON.stringify({ 0: ["variables.file"] }),
      0: fichier,
    },
    timeout: 30_000,
    failOnStatusCode: false,
  });
  const corps = await res.json().catch(() => ({}));
  return { statut: res.status(), data: corps.data ?? null, errors: corps.errors ?? [] };
}

/** Messages des erreurs d'une réponse, en une ligne (pour les assertions). */
export const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
