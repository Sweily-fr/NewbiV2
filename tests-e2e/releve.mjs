/**
 * Relevé des pages (E2E_INVENTAIRE=1 seulement) : pour chaque page, chaque
 * bouton, onglet, case, liste et lien est essayé sur une page neuve, et chaque
 * élément de chaque menu ; le résultat (fenêtres ouvertes et leurs champs,
 * navigations, téléchargements, erreurs) est écrit en JSON dans
 * tests-e2e/inventaire-resultats/, publié par la CI. Sert à écrire les tests
 * de chaque fonctionnalité et à vérifier qu'aucun élément n'est oublié ; ce
 * n'est pas un test en soi (il ne vérifie rien).
 *
 * Chaque fonctionnalité a son fichier `<dossier>/inventaire.spec.mjs` (lancé
 * seulement avec E2E_INVENTAIRE=1, voir playwright.config.mjs).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "./outils.mjs";
import { ouvrir } from "./navigation.mjs";
import { inventorier, contenu } from "./exploration.mjs";

const DOSSIER = path.resolve("tests-e2e/inventaire-resultats");

export function enregistrer(nom, releve) {
  mkdirSync(DOSSIER, { recursive: true });
  writeFileSync(path.join(DOSSIER, `${nom}.json`), JSON.stringify(releve, null, 2));
}

/** Un relevé par page : { nom du fichier JSON: adresse }. `zone` : partie de la page relevée. */
export function relever(pages, { zone = contenu } = {}) {
  for (const [nom, url] of Object.entries(pages)) {
    test(`Relevé : ${nom}`, async ({ page, surveillance }) => {
      test.setTimeout(20 * 60_000);
      const releve = await inventorier(page, { ouvrir: (p) => ouvrir(p, url), zone, problemes: surveillance });
      enregistrer(nom, releve);
    });
  }
}

/** Relevé d'une page dans un état particulier (ligne sélectionnée, onglet ouvert…) : `ouvrirEtat(page)` y mène. */
export function releverEtat(nom, ouvrirEtat, { zone = contenu } = {}) {
  test(`Relevé : ${nom}`, async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    enregistrer(nom, await inventorier(page, { ouvrir: ouvrirEtat, zone, problemes: surveillance }));
  });
}
