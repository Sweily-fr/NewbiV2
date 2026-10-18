import { expect } from "@playwright/test";

/**
 * Suivi des requêtes de données de chaque page : requêtes RSC de Next
 * (navigations, préchargements) et appels GraphQL vers l'API. Branché par la
 * fixture de outils.mjs.
 */
const suivis = new WeakMap();

export function suivreRequetes(page) {
  const suivi = { enCours: new Set(), derniereActivite: Date.now() };
  const estDonnee = (req) => req.url().includes("_rsc=") || req.url().includes("/graphql");
  const fin = (req) => {
    if (!suivi.enCours.delete(req)) return;
    suivi.derniereActivite = Date.now();
  };
  page.on("request", (req) => {
    if (!estDonnee(req)) return;
    suivi.enCours.add(req);
    suivi.derniereActivite = Date.now();
  });
  page.on("requestfinished", fin);
  page.on("requestfailed", fin);
  suivis.set(page, suivi);
}

const CALME_MS = 600;

/** Aucune requête de données en cours depuis CALME_MS (et au moins CALME_MS d'attente). */
export async function attendreCalme(page) {
  const debut = Date.now();
  const suivi = suivis.get(page);
  if (!suivi) return;
  await expect
    .poll(
      () => {
        const maintenant = Date.now();
        return suivi.enCours.size === 0 && maintenant - suivi.derniereActivite >= CALME_MS && maintenant - debut >= CALME_MS;
      },
      { message: "Des requêtes (Next ou GraphQL) sont toujours en cours", timeout: 45_000, intervals: [100] },
    )
    .toBe(true);
}

/**
 * La page est prête quand :
 *   1. React a pris la main dessus (hydratation), sinon un clic ou une saisie
 *      sont perdus sans erreur ;
 *   2. le repère de la page (`pret`, ex. le titre « Factures clients ») est
 *      visible, sinon une lecture trouve encore le squelette de chargement ;
 *   3. plus aucune requête de données n'est en cours (préchargements de Next,
 *      requêtes GraphQL lancées à l'affichage).
 */
export async function attendrePagePrete(page, { pret } = {}) {
  await expect
    .poll(() => page.evaluate(() => Object.keys(document.documentElement).some((k) => k.startsWith("__reactFiber"))), {
      message: "La page n'a pas été hydratée par React",
      timeout: 45_000,
    })
    .toBe(true);
  if (pret) await expect(pret).toBeVisible({ timeout: 45_000 });
  await attendreCalme(page);
}

/** Ouvre une page et attend qu'elle soit prête. Renvoie la réponse HTTP. */
export async function ouvrir(page, url, options) {
  const reponse = await page.goto(url);
  await attendrePagePrete(page, options);
  return reponse;
}

/**
 * Clique comme un humain : survol, fin du préchargement déclenché par le
 * survol, puis clic. Si le clic suit le survol de quelques millisecondes,
 * comme le fait Playwright, Next annule ce préchargement et la navigation
 * reste bloquée pour toujours (constaté sur newbi-admin).
 */
export async function cliquer(page, cible) {
  await cible.hover();
  await attendreCalme(page);
  await cible.click();
}

/** Clique, attend l'URL voulue, puis que la nouvelle page soit prête. */
export async function cliquerPuisAttendre(page, cible, url, options) {
  await attendrePagePrete(page);
  await cliquer(page, cible);
  await expect(page).toHaveURL(url, { timeout: 30_000 });
  await attendrePagePrete(page, options);
}
