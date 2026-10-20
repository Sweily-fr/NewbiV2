/**
 * Outils du lot « parametres-auth » : connexion par l'API de Better Auth,
 * respect de ses limites de requêtes, fenêtre des Paramètres.
 *
 * Limites de Better Auth (règles par défaut, par adresse IP et par chemin,
 * en mémoire du serveur du site) : 3 connexions, inscriptions ou changements
 * de mot de passe par 10 s, 3 demandes de réinitialisation par minute,
 * 3 essais par 10 s sur chaque route de la double authentification. Tous les
 * tests d'une machine viennent de la même adresse : avant chaque appel, on
 * attend que le quota le permette, et chaque appel est noté dans un fichier
 * (un test qui échoue relance le processus de Playwright, la mémoire ne
 * suffit pas).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "@playwright/test";
import { BASE_URL, PORT, sessionCookie } from "../config.mjs";
import { ouvrir } from "../navigation.mjs";

const FICHIER_QUOTAS = path.join(os.tmpdir(), `e2e-newbi-quotas-auth-${PORT}.json`);

/**
 * Visiteur sans session qui a déjà répondu à la bannière des cookies
 * (« nécessaires seulement ») : sans cela, elle s'ouvre comme une fenêtre
 * par-dessus les pages publiques.
 */
export const SANS_SESSION = {
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        { name: "cookie_consent", value: JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false }) },
        { name: "cookie_consent_date", value: "2026-10-01T00:00:00.000Z" },
      ],
    },
  ],
};

/** Fenêtre (ms) et nombre d'appels permis, par chemin de Better Auth. */
const QUOTAS = [
  [/^\/(sign-in|sign-up|change-password|change-email)/, 10_000, 3],
  [/^\/(request-password-reset|send-verification-email|forget-password)/, 60_000, 3],
  [/^\/two-factor\//, 10_000, 3],
];

function lireQuotas() {
  try {
    return JSON.parse(readFileSync(FICHIER_QUOTAS, "utf8"));
  } catch {
    return {};
  }
}

function regle(chemin) {
  return QUOTAS.find(([motif]) => motif.test(chemin));
}

/** Note un appel déjà fait (sans attendre), ex. les essais d'un test de limite. */
export function noterAppel(chemin, quand = Date.now()) {
  const quotas = lireQuotas();
  quotas[chemin] = [...(quotas[chemin] || []), quand].slice(-20);
  mkdirSync(path.dirname(FICHIER_QUOTAS), { recursive: true });
  writeFileSync(FICHIER_QUOTAS, JSON.stringify(quotas));
}

/**
 * Attend que Better Auth accepte un appel de plus sur ce chemin, puis le note.
 * Son compteur ne repart à zéro qu'après une fenêtre entière sans appel
 * depuis le dernier accepté : on rejoue ce calcul sur les appels notés, et
 * s'il en reste moins d'un de libre, on attend la fin de la fenêtre (marge
 * de 1,5 s). `chemin` : chemin Better Auth, ex. "/sign-in/email".
 */
export async function attendreQuota(chemin) {
  const r = regle(chemin);
  if (!r) return;
  const [, fenetre, max] = r;
  const marge = 1_500;
  const appels = (lireQuotas()[chemin] || []).slice().sort((a, b) => a - b);
  let compte = 0;
  let dernier = 0;
  for (const t of appels) {
    compte = t - dernier > fenetre ? 1 : Math.min(compte + 1, max);
    dernier = t;
  }
  const reste = dernier + fenetre + marge - Date.now();
  if (compte >= max - 1 && reste > 0) await new Promise((fin) => setTimeout(fin, reste));
  noterAppel(chemin);
}

/**
 * Appel d'une route de Better Auth depuis la page (cookies du navigateur,
 * origine du site), comme le fait le client du site. Renvoie { statut, corps }.
 */
export async function appelAuth(page, chemin, { methode = "POST", corps = undefined, quota = true } = {}) {
  if (quota) await attendreQuota(chemin);
  return page.evaluate(
    async ({ chemin, methode, corps }) => {
      const res = await fetch(`/api/auth${chemin}`, {
        method: methode,
        credentials: "include",
        headers: corps === undefined ? {} : { "Content-Type": "application/json" },
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
      const texte = await res.text();
      let json = null;
      try {
        json = JSON.parse(texte);
      } catch {
        json = texte;
      }
      return { statut: res.status, corps: json };
    },
    { chemin, methode, corps },
  );
}

/** Appel d'une route du site (/api/...) avec les cookies de la page. */
export async function appelSite(page, url, { methode = "GET", corps = undefined } = {}) {
  return page.evaluate(
    async ({ url, methode, corps }) => {
      const res = await fetch(url, {
        method: methode,
        credentials: "include",
        headers: corps === undefined ? {} : { "Content-Type": "application/json" },
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
      const texte = await res.text();
      let json = null;
      try {
        json = JSON.parse(texte);
      } catch {
        json = texte;
      }
      return { statut: res.status, corps: json };
    },
    { url, methode, corps },
  );
}

/** Se connecte par l'API (e-mail et mot de passe) ; la page doit être sur le site. */
export async function connexionApi(page, email, motDePasse) {
  return appelAuth(page, "/sign-in/email", { corps: { email, password: motDePasse } });
}

/**
 * Page d'inscription : elle ne devient jamais « calme » (requêtes répétées),
 * ouverte avec page.goto puis l'attente de son contenu et de React.
 */
export async function ouvrirInscription(page, pret) {
  await page.goto("/auth/signup");
  await expect(pret).toBeVisible({ timeout: 45_000 });
  await expect
    .poll(() => page.evaluate(() => Object.keys(document.documentElement).some((k) => k.startsWith("__reactFiber"))), { timeout: 45_000 })
    .toBe(true);
  await page.waitForTimeout(500);
}

/** Session de test et bannière des cookies déjà répondue (pages hors tableau de bord). */
export const connecteAvecConsentement = (token) => ({ cookies: [sessionCookie(token)], origins: SANS_SESSION.origins });

// --- Fenêtre des Paramètres -------------------------------------------------

export const fenetreParametres = (page) => page.getByRole("dialog", { name: "Paramètres de l'application" });
/** Colonne de gauche (onglets) de la fenêtre des Paramètres. */
export const menuParametres = (page) => fenetreParametres(page).locator("form > div > div").nth(0);
/** Contenu de l'onglet ouvert, avec le pied de la fenêtre (Annuler, Sauvegarder). */
export const contenuParametres = (page) => fenetreParametres(page).locator("form > div > div").nth(1);

/**
 * Ouvre la fenêtre des Paramètres sur un onglet par l'adresse
 * (/dashboard?parametres=<onglet>, lien des e-mails de demande d'accès).
 */
export async function ouvrirParametres(page, onglet, { pret } = {}) {
  await ouvrir(page, `/dashboard?parametres=${onglet}`, { pret: fenetreParametres(page) });
  if (pret) await expect(pret(contenuParametres(page))).toBeVisible({ timeout: 30_000 });
  return contenuParametres(page);
}

/** Onglets de la fenêtre : identifiant (adresse) → libellé du menu. */
export const ONGLETS = {
  notifications: "Notifications",
  preferences: "Préférences",
  generale: "Générale",
  "coordonnees-bancaires": "Coordonnées bancaires",
  "informations-legales": "Informations légales",
  securite: "Sécurité",
  espaces: "Espaces",
  roles: "Rôles",
  applications: "Applications",
  "comptes-bancaires": "Comptes bancaires",
  "facturation-electronique": "Facturation électronique",
  subscription: "Abonnement",
  facturation: "Facturation",
  "user-info": "Compte",
};
