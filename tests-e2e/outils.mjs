/**
 * Outils communs aux tests de Newbi : contrôles automatiques sur chaque page,
 * coupure de tout appel vers l'extérieur, captures pour la page « Tests » de
 * l'admin. Repris de la suite de newbi-admin (e2e/outils.mjs).
 */
import { test as base, expect } from "@playwright/test";
import { suivreRequetes } from "./navigation.mjs";
import { brancherAnnuaire } from "./donnees/annuaire.mjs";

// Seuls le site et l'API de test sont joignables : Google Ads (balise en dur),
// analytics, recherche d'entreprises de l'État… reçoivent une réponse vide.
const LOCAL = new Set(["localhost", "127.0.0.1"]);

/**
 * Chaque test surveille la page du début à la fin et échoue s'il relève
 * une erreur JavaScript, une erreur dans la console (React compris), une
 * réponse 500 ou une boîte de dialogue (script injecté qui s'exécute).
 * `erreursConsoleAutorisees` : motifs tolérés, ex. la 404 d'un test de 404.
 */
/**
 * Erreurs de console attendues partout : l'aperçu d'une facture demande
 * d'abord son PDF archivé (/api/document-preview), répond 404 quand il n'y en
 * a pas (brouillon, archive absente) et le site affiche alors l'aperçu HTML.
 */
const ERREURS_ATTENDUES = [/404 \S*\/api\/document-preview\//];

export const test = base.extend({
  erreursConsoleAutorisees: [[], { option: true }],
  surveillance: [
    async ({ page, erreursConsoleAutorisees }, use, testInfo) => {
      const problemes = [];
      suivreRequetes(page);
      await page.route(
        (url) => !LOCAL.has(url.hostname) && url.protocol.startsWith("http"),
        (route) => route.fulfill({ status: 204, body: "" }),
      );
      // Recherche d'entreprise : annuaire simulé (le site interroge sinon
      // l'annuaire officiel sur Internet, depuis son serveur).
      await brancherAnnuaire(page);
      // Adresses des réponses en erreur : la console dit seulement « Failed to
      // load resource », sans dire laquelle.
      const introuvables = [];
      page.on("response", (res) => {
        if (res.status() >= 400 && res.status() < 500) introuvables.push(`${res.status()} ${res.url()}`);
      });
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        let texte = msg.text();
        if (/Failed to load resource/.test(texte) && introuvables.length) texte += ` (${introuvables.at(-1)})`;
        if ([...ERREURS_ATTENDUES, ...erreursConsoleAutorisees].some((re) => re.test(texte))) return;
        problemes.push(`Console : ${texte}`);
      });
      page.on("pageerror", (err) => problemes.push(`Erreur JavaScript : ${err.message}`));
      page.on("response", (res) => {
        if (res.status() >= 500) problemes.push(`Erreur serveur ${res.status()} : ${res.url()}`);
      });
      page.on("dialog", (dialog) => {
        // « Quitter sans enregistrer ? » quand un test quitte un éditeur
        // modifié : comportement voulu, on quitte.
        if (dialog.type() === "beforeunload") {
          dialog.accept().catch(() => {});
          return;
        }
        problemes.push(`Boîte de dialogue inattendue : ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
      });
      await use(problemes);
      // Test sans étape capturée (liste.spec) : l'état final de la page.
      if (CAPTURES && !testInfo.attachments.some((a) => a.contentType === "image/jpeg")) {
        const echec = testInfo.status !== testInfo.expectedStatus;
        await capturer(page, echec ? "Page au moment de l'échec" : "Page à la fin du test", { pageEntiere: echec });
      }
      expect(problemes, "Problèmes relevés sur la page pendant le test").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Captures pour la page « Tests » de l'admin (E2E_CAPTURES=1, en CI) : en
 * JPEG compressé, pour que le rapport d'un lancement reste léger.
 */
const CAPTURES = process.env.E2E_CAPTURES === "1";

async function capturer(page, nom, { pageEntiere = false } = {}) {
  if (page.isClosed()) return;
  const body = await page
    .screenshot({ type: "jpeg", quality: pageEntiere ? 45 : 60, fullPage: pageEntiere, timeout: 10_000 })
    .catch(() => null);
  if (body) await test.info().attach(nom, { body, contentType: "image/jpeg" });
}

/**
 * Étape nommée du test (visible dans Playwright et dans l'admin). `capture` :
 * "ecran" (la partie visible) ou "page" (page entière) à la fin de l'étape ;
 * une étape qui échoue est toujours capturée en entier.
 */
export async function etape(page, titre, fn, { capture = null } = {}) {
  return test.step(titre, async () => {
    let echec = false;
    try {
      return await fn();
    } catch (err) {
      echec = true;
      throw err;
    } finally {
      if (CAPTURES && (echec || capture)) await capturer(page, titre, { pageEntiere: echec || capture === "page" });
    }
  });
}

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Normalise les valeurs attendues comme les valeurs lues (espaces insécables compris). */
export function normaliser(valeur) {
  if (Array.isArray(valeur)) return valeur.map(normaliser);
  if (valeur && typeof valeur === "object") return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [norm(k), normaliser(v)]));
  return typeof valeur === "string" ? norm(valeur) : valeur;
}

// Valeurs qui trahissent une donnée mal gérée quand elles s'affichent.
const TEXTES_INTERDITS = [/\bundefined\b/, /\bNaN\b/, /Invalid Date/, /\[object Object\]/, /\bnull\b/, /\bInfinity\b/];

/** Textes visibles de la page (hors données brutes JSON), un nœud par ligne. */
export async function textesVisibles(page) {
  return page.evaluate(() => {
    const racine = document.querySelector("main") || document.body;
    const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    const textes = [];
    while (parcours.nextNode()) {
      const noeud = parcours.currentNode;
      if (noeud.parentElement?.closest("pre, script, style")) continue;
      const t = noeud.data.replace(/\s+/g, " ").trim();
      if (t) textes.push(t);
    }
    return textes.join("\n");
  });
}

/** Texte lu à l'écran dans la zone principale (les blocs repliés n'en font pas partie). */
export async function texteDeLaPage(page) {
  return norm(await page.locator("main").innerText());
}

/** La page n'affiche ni « undefined », ni « NaN », ni « Invalid Date »… */
export async function verifierTextesPropres(page) {
  const textes = await textesVisibles(page);
  for (const motif of TEXTES_INTERDITS) {
    const trouve = textes.split("\n").filter((l) => motif.test(l));
    expect.soft(trouve, `La page affiche « ${motif.source.replace(/\\b/g, "")} »`).toEqual([]);
  }
}

/** Tous les liens internes de la page mènent à une page qui existe (ni 404 ni 500). */
export async function verifierLiens(page) {
  const liens = await page.evaluate(() => [
    ...new Set([...document.querySelectorAll('main a[href^="/"]')].map((a) => a.getAttribute("href"))),
  ]);
  for (const href of liens) {
    const reponse = await page.request.get(href, { maxRedirects: 0 });
    expect.soft(reponse.status(), `Lien ${href}`).toBeLessThan(400);
  }
  return liens;
}
