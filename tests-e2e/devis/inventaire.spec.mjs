/**
 * Relevé des pages des devis (E2E_INVENTAIRE=1 seulement), organisation
 * « Ventes », pour chaque rôle : liste (une ligne épinglée par statut),
 * sélection, panneau, éditeur (étapes, paramètres). Outil pour écrire les
 * tests, il ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { contenu } from "../exploration.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VENTES_EDITEUR, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { DEVIS_VENTES as D } from "../donnees/lot-devis-bc-bl.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { epingler, idDe, ouvrirPanneau, panneau } from "./ventes.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const CLIENT = "Boulangerie Lumière SARL";
const etapeArticles = (chemin) => async (page) => {
  await ouvrirEditeur(page, chemin);
  await choisirClient(page, CLIENT);
  await continuer(page);
};
const etapeArticlesEdition = (doc) => async (page) => {
  await ouvrir(page, `/dashboard/outils/devis/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
  await continuer(page);
};
const parametres = async (page) => {
  await ouvrirEditeur(page, "/dashboard/outils/devis/new");
  await page.locator("main button:has(svg.lucide-settings)").first().click();
  await page.waitForTimeout(800);
};

test.describe("Relevé des devis (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });
  relever({ "ventes-devis": "/dashboard/outils/devis", "ventes-devis-nouveau": "/dashboard/outils/devis/new" });
  for (const [nom, doc] of [
    ["brouillon", D.aSupprimerPanneau],
    ["en-attente", D.aAccepter],
    ["accepte", D.aFacturer],
    ["refuse", D.refuse],
    ["expire", D.expire],
  ]) {
    releverEtat(`ventes-devis-ligne-${nom}`, (page) => epingler(page, "devis", doc));
  }
  // Relevé = chaque bouton cliqué : sur des devis de parcours, jamais sur les devis stables.
  for (const [nom, doc] of [
    ["brouillon", D.aSupprimerGroupe2],
    ["en-attente", D.aRefuser],
    ["accepte", D.aCommander],
    ["refuse", D.refuse],
  ]) {
    releverEtat(`ventes-devis-panneau-${nom}`, (page) => ouvrirPanneau(page, "devis", doc), { zone: panneau });
  }
  releverEtat("ventes-devis-selection", async (page) => {
    await epingler(page, "devis", D.aSupprimerGroupe1);
    await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
    await page.waitForTimeout(500);
  });
  releverEtat("ventes-devis-nouveau-articles", etapeArticles("/dashboard/outils/devis/new"));
  releverEtat("ventes-devis-parametres", parametres);
  relever({
    "ventes-devis-edition-brouillon": `/dashboard/outils/devis/${idDe(D.aValiderBrouillon)}/editer`,
    "ventes-devis-edition-en-attente": `/dashboard/outils/devis/${idDe(D.aModifierEnAttente)}/editer`,
  });
  releverEtat("ventes-devis-edition-brouillon-articles", etapeArticlesEdition(D.avecCgv));
});

// Éditeur : ligne et panneau sur des devis qu'il peut modifier sans gêner les autres relevés.
const DOCS_ROLE = {
  editeur: { ligne: [D.cibleSupprimer, D.aEditerEditeur, D.cibleFacture], panneau: [D.cibleBrouillonValider, D.cibleEnvoyer, D.cibleBc] },
  lecteur: { ligne: [D.brouillon, D.enAttente, D.accepte], panneau: [D.brouillon, D.enAttente, D.accepte] },
};
for (const [role, token] of [
  ["editeur", SESSION_TOKEN_VENTES_EDITEUR],
  ["lecteur", SESSION_TOKEN_VENTES_LECTEUR],
]) {
  test.describe(`Relevé des devis (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`ventes-${role}-devis`]: "/dashboard/outils/devis", [`ventes-${role}-devis-nouveau`]: "/dashboard/outils/devis/new" });
    ["brouillon", "en-attente", "accepte"].forEach((nom, i) => {
      releverEtat(`ventes-${role}-devis-ligne-${nom}`, (page) => epingler(page, "devis", DOCS_ROLE[role].ligne[i]));
      releverEtat(`ventes-${role}-devis-panneau-${nom}`, (page) => ouvrirPanneau(page, "devis", DOCS_ROLE[role].panneau[i]), { zone: panneau });
    });
    releverEtat(`ventes-${role}-devis-edition`, (page) => ouvrir(page, `/dashboard/outils/devis/${idDe(D.brouillon)}/editer`), { zone: contenu });
  });
}
