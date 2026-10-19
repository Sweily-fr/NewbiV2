/**
 * Réglages communs au serveur de test et aux tests de bout en bout de
 * Newbi (site + API). Aucune valeur de prod : base Mongo en mémoire, secrets
 * et session propres aux tests, services externes coupés.
 */
import { createHmac } from "node:crypto";
import path from "node:path";

// Ports à part pour ne jamais gêner les serveurs de dev (3000 et 4000).
// E2E_PORT : un second lancement en parallèle, avec ses propres dossiers.
export const PORT = Number(process.env.E2E_PORT) || 3201;
export const PORT_API = PORT + 1000;
export const BASE_URL = `http://localhost:${PORT}`;
export const API_URL = `http://localhost:${PORT_API}`;
const SUFFIXE = PORT === 3201 ? "" : `-${PORT}`;
export const DOSSIERS = {
  build: `.next-e2e-newbi${SUFFIXE}`,
  resultats: `tests-e2e/resultats${SUFFIXE}`,
  rapportHtml: `tests-e2e/rapport-html${SUFFIXE}`,
};

/**
 * Copie de newbi-api à lancer. En CI, le workflow la récupère dans
 * `newbi-api/` ; en local, NEWBI_API_DIR pointe vers une copie dédiée, SANS
 * fichier .env (l'API lirait sinon les vraies clés, voir serveur.mjs).
 */
export const API_DIR = path.resolve(process.env.NEWBI_API_DIR || "newbi-api");

export const BASE_DE_DONNEES = "newbi-e2e";
/** Écrit par serveur.mjs : adresse de la base en mémoire, pour que les tests la relisent. */
export const FICHIER_ETAT = path.resolve(`tests-e2e/.serveur${SUFFIXE}.json`);
export const SECRET = "e2e-secret-local-uniquement-jamais-en-prod-0123456789";
export const SECRET_INTERNE = "e2e-secret-interne-local-uniquement";
export const SESSION_TOKEN = "e2eSessionTokenNewbiLocalUniquement";
/** Session du compte de l'organisation « Liste » (factures pré-remplies). */
export const SESSION_TOKEN_LISTE = "e2eSessionTokenNewbiListeUniquement";
/** Session du compte de l'organisation « Avoirs » (factures à créditer). */
export const SESSION_TOKEN_AVOIRS = "e2eSessionTokenNewbiAvoirsUniquement";
/** Session du propriétaire de l'organisation « Clients » (contacts, listes, segments). */
export const SESSION_TOKEN_CLIENTS = "e2eSessionTokenNewbiClientsUniquement";
/** Membre de l'organisation « Clients » avec le rôle « Membre » (lecture seule partout). */
export const SESSION_TOKEN_LECTEUR = "e2eSessionTokenNewbiLecteurUniquement";
/** Membre de l'organisation « Clients » avec le rôle « Éditeur » (rien supprimer). */
export const SESSION_TOKEN_EDITEUR = "e2eSessionTokenNewbiEditeurUniquement";
/** Propriétaire d'une autre organisation, qui tente d'atteindre les données des autres. */
export const SESSION_TOKEN_INTRUS = "e2eSessionTokenNewbiIntrusUniquement";
/** Propriétaire d'une organisation sur l'offre d'entrée (« freelance ») : ses plafonds. */
export const SESSION_TOKEN_FREELANCE = "e2eSessionTokenNewbiFreelanceUniquement";
/** Propriétaire de l'organisation « Réglages » : tests qui changent la configuration (champs, import…). */
export const SESSION_TOKEN_REGLAGES = "e2eSessionTokenNewbiReglagesUniquement";
// Sessions propres à un lot : entre ses deux repères (une chaîne unique par compte).
// ── Lot factures ──
// ── fin du lot factures ──
// ── Lot devis-bc-bl ──
// ── fin du lot devis-bc-bl ──
// ── Lot achats-banque ──
// ── fin du lot achats-banque ──
// ── Lot parametres-auth ──
// ── fin du lot parametres-auth ──
// ── Lot collaboration ──
/** Propriétaire de l'organisation « Collab » (kanban, calendrier, transferts, documents partagés, signatures). */
export const SESSION_TOKEN_COLLAB = "e2eSessionTokenNewbiCollabUniquement";
/** Membre de « Collab » avec le rôle « Membre » (lecture seule). */
export const SESSION_TOKEN_COLLAB_MEMBRE = "e2eSessionTokenNewbiCollabMembreUniquement";
/** Membre de « Collab » avec le rôle « Éditeur » (crée et modifie, ne supprime pas). */
export const SESSION_TOKEN_COLLAB_EDITEUR = "e2eSessionTokenNewbiCollabEditeurUniquement";
/** Membre de « Collab » avec le rôle « Comptable » (kanban et signatures fermés). */
export const SESSION_TOKEN_COLLAB_COMPTABLE = "e2eSessionTokenNewbiCollabComptableUniquement";
/** Propriétaire d'une organisation sur l'offre d'entrée : plafonds du lot (automatisations, transferts). */
export const SESSION_TOKEN_COLLAB_FREELANCE = "e2eSessionTokenNewbiCollabFreelanceUniquement";
// ── fin du lot collaboration ──
// ── Lot pilotage ──
// ── fin du lot pilotage ──

/** État de navigateur connecté avec la session donnée (pour `test.use({ storageState })`). */
export const connecte = (token) => ({ cookies: [sessionCookie(token)], origins: [] });

/** Cookie de session Better Auth signé comme le fait better-call (HMAC SHA-256). */
export function sessionCookie(token = SESSION_TOKEN) {
  const signature = createHmac("sha256", SECRET).update(token).digest("base64");
  return {
    name: "better-auth.session_token",
    value: encodeURIComponent(`${token}.${signature}`),
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  };
}
