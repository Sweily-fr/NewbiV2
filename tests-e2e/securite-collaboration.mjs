/**
 * Outils de sécurité du lot « collaboration » (kanban, calendrier,
 * transferts, documents partagés, signatures), en plus de securite.mjs :
 *   - photo() : un document tel qu'en base, sans ses dates de mise à jour,
 *     pour vérifier qu'un refus ne change rien ;
 *   - verifierRefusCollab() : comme verifierRefus, mais accepte aussi les
 *     réponses « { success: false, message } » de certaines opérations
 *     (événements, transferts), qui disent leur refus sans erreur GraphQL ;
 *   - refusSansEffet() : appel direct + refus explicite + base inchangée.
 */
import { expect } from "@playwright/test";
import { appelApi } from "./securite.mjs";
import { base } from "./base.mjs";

/** Codes et messages d'un refus de l'API (droits, session, donnée introuvable). */
export const REFUS =
  /FORBIDDEN|UNAUTHENTICATED|UNAUTHORIZED|NOT_FOUND|permission|autoris|droit|acc[eè]s|interdit|non trouv|introuvable|n'existe pas|not found|membre de l'organisation|connect|authentifi|session|expir|invalide|r[ôo]le/i;

const SANS_DATES = ({ updatedAt, lastActivity, lastAccessedAt, ...reste }) => reste;

/** Documents d'une collection (filtre Mongo), triés, sans dates de mise à jour. */
export async function photo(collection, filtre) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(SANS_DATES));
}

/** Messages d'erreur d'une réponse, avec leur code. */
export const messagesDe = (reponse) =>
  [
    ...reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`),
    ...Object.values(reponse.data || {})
      .filter((v) => v && typeof v === "object" && !Array.isArray(v) && v.success === false)
      .map((v) => `success=false ${v.message || ""}`),
  ].join(" | ");

/**
 * La réponse est un refus : aucune donnée utile pour `champ` (null, liste
 * vide, ou « success: false »), et une explication (erreur de droits,
 * d'authentification, ou « introuvable »).
 */
export function verifierRefusCollab(reponse, champ, contexte) {
  expect(reponse.sansReponse, `${contexte} : l'API n'a pas répondu (requête bloquée)`).not.toBe(true);
  const valeur = reponse.data?.[champ];
  const echec = valeur && typeof valeur === "object" && !Array.isArray(valeur) && valeur.success === false;
  const vide = valeur === null || valeur === undefined || valeur === false || (Array.isArray(valeur) && valeur.length === 0) || echec;
  expect(vide, `${contexte} : l'API ne doit rien renvoyer pour « ${champ} » (reçu ${JSON.stringify(valeur)?.slice(0, 300)})`).toBe(true);
  if (!Array.isArray(valeur)) {
    expect(messagesDe(reponse), `${contexte} : l'API doit expliquer son refus`).toMatch(REFUS);
  }
}

/** La réponse est une réussite : pas d'erreur, et une donnée (sans « success: false »). */
export function verifierReussite(reponse, champ, contexte) {
  expect(reponse.sansReponse, `${contexte} : l'API n'a pas répondu (requête bloquée)`).not.toBe(true);
  expect(reponse.errors.map((e) => e.message), `${contexte} : erreurs de l'API`).toEqual([]);
  const valeur = reponse.data?.[champ];
  expect(valeur, `${contexte} : réponse vide`).toBeTruthy();
  if (valeur && typeof valeur === "object" && "success" in valeur) {
    expect(valeur.success, `${contexte} : l'API répond « ${valeur.message} »`).toBe(true);
  }
  return valeur;
}

/**
 * Opération décrite par un test de sécurité :
 *   { nom, champ, requete, variables(w, qui), temoin(qui): [collection, filtre] }
 * Appel direct avec la session de la page, refus explicite, base inchangée.
 */
export async function refusSansEffet(page, op, qui, w, { organisation = w } = {}) {
  const [collection, filtre] = op.temoin(qui);
  const avant = await photo(collection, filtre);
  const reponse = await appelApi(page, op.requete, op.variables(w, qui), { organisation, delai: 15_000 });
  verifierRefusCollab(reponse, op.champ, `${op.nom} (${qui})`);
  expect(await photo(collection, filtre), `${op.nom} (${qui}) : la base a changé malgré le refus`).toBe(avant);
  return reponse;
}

/** Une réponse ne contient aucune de ces valeurs (identifiants, noms) : rien ne fuit. */
export function sansFuite(reponse, valeurs, contexte) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const v of valeurs) expect(texte, `${contexte} : « ${v} » renvoyé`).not.toContain(v);
}
