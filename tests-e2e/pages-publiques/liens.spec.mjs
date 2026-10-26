/**
 * Pages publiques à formulaire (contact, générateurs, calculateur, index des
 * outils) : chaque lien interne de la page, de son menu et de son pied de
 * page mène à une page qui existe (ni 404 ni erreur). Plus les liens légaux
 * de l'inscription et l'adresse annoncée aux moteurs de recherche par la
 * page de confidentialité (données structurées).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { visiteur } from "./consentement.mjs";

// Les générateurs appellent pour un visiteur des routes réservées aux comptes
// connectés (401 dans la console) : défaut signalé par outils.spec.mjs.
test.use({ storageState: visiteur(), erreursConsoleAutorisees: /status of 401.*\/api\/auth\/organization\// });

export const PAGES_PUBLIQUES = ["/contact", "/outils/generateur-de-facture", "/outils/generateur-de-devis", "/outils/calculateur-penalites-retard", "/outils"];

/** Liens internes d'une page, menus repliés et pied de page compris. */
async function liensInternes(page) {
  return page.evaluate(() => {
    const liens = new Set();
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) continue;
      liens.add(url.pathname + url.search);
    }
    return [...liens].sort();
  });
}

/** Statut final d'une adresse (redirections suivies). */
async function statut(page, chemin) {
  const reponse = await page.request.get(chemin, { timeout: 60_000 });
  return reponse.status();
}

for (const chemin of PAGES_PUBLIQUES) {
  test(`${chemin} : la page s'ouvre et aucun lien interne n'est cassé`, async ({ page }) => {
    test.setTimeout(6 * 60_000);
    const reponse = await ouvrir(page, chemin);
    expect(reponse.status(), `${chemin} répond`).toBeLessThan(400);
    const liens = await liensInternes(page);
    expect(liens.length, "La page contient des liens internes").toBeGreaterThan(0);
    const casses = [];
    for (const lien of liens) {
      const s = await statut(page, lien);
      if (s >= 400) casses.push(`${lien} (${s})`);
    }
    await etape(page, `${liens.length} liens vérifiés`, async () => expect(casses, `Liens cassés sur ${chemin}`).toEqual([]));
  });
}

test.describe("Inscription : liens légaux", () => {
  // Next précharge le lien cassé (404 dans la console) : c'est le défaut vérifié ci-dessous
  test.use({ erreursConsoleAutorisees: /404.*\/politique-confidentialite|status of 401.*\/api\/auth\/organization\// });

test("Inscription : le lien « Politique de confidentialité » mène à la politique de confidentialité", async ({ page }) => {
  await page.goto("/auth/signup");
  const lien = page.getByRole("link", { name: "Politique de confidentialité" }).first();
  await expect(lien).toBeVisible({ timeout: 30_000 });
  const href = await lien.getAttribute("href");
  await etape(page, `Lien : ${href}`, async () => expect(await statut(page, href), `${href} n'existe pas (la page est /politique-de-confidentialite)`).toBeLessThan(400), { capture: "ecran" });
});

test("Inscription : le lien « Conditions générales » mène aux conditions générales, pas aux mentions légales", async ({ page }) => {
  await page.goto("/auth/signup");
  await expect(page.getByRole("link", { name: "Conditions générales" }).first()).toBeVisible({ timeout: 30_000 });
  const href = await page.getByRole("link", { name: "Conditions générales" }).first().getAttribute("href");
  expect(href, "« Conditions générales » ouvre les mentions légales").not.toBe("/mentions-legales");
});
});

test("Politique de confidentialité : l'adresse annoncée aux moteurs de recherche existe", async ({ page }) => {
  await ouvrir(page, "/politique-de-confidentialite");
  const adresses = await page.evaluate(() => {
    const trouvees = new Set();
    const parcourir = (v) => {
      if (Array.isArray(v)) return v.forEach(parcourir);
      if (!v || typeof v !== "object") return;
      for (const [cle, valeur] of Object.entries(v)) {
        if (cle === "url" && typeof valeur === "string" && /^(\/|https?:\/\/(www\.)?newbi\.fr|https?:\/\/localhost)/.test(valeur)) trouvees.add(valeur);
        else parcourir(valeur);
      }
    };
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        parcourir(JSON.parse(s.textContent));
      } catch {
        // données structurées illisibles : ignorées ici
      }
    }
    return [...trouvees];
  });
  expect(adresses.length, "La page annonce des adresses dans ses données structurées").toBeGreaterThan(0);
  for (const adresse of adresses) {
    const chemin = new URL(adresse, "http://localhost").pathname;
    expect.soft(await statut(page, chemin), `Données structurées : ${adresse} n'existe pas`).toBeLessThan(400);
  }
});
