/**
 * Relevé de la mise en page (E2E_INVENTAIRE=1 seulement) : barre latérale
 * et en-tête de chaque rôle de « Pilotage », du client du cabinet, et du
 * cabinet dans son espace gestionnaire ; page Favoris.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { inventorier } from "../exploration.mjs";
import { enregistrer, relever } from "../releve.mjs";
import {
  connecte,
  SESSION_TOKEN_CABINET,
  SESSION_TOKEN_CLIENT_CABINET,
  SESSION_TOKEN_PILOTAGE,
  SESSION_TOKEN_PILOTAGE_EDITEUR,
  SESSION_TOKEN_PILOTAGE_MEMBRE,
} from "../config.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const barreLaterale = (p) => p.locator("[data-slot=sidebar]").first();
const enTete = (p) => p.locator("main > header").first();

for (const [nom, token, url] of [
  ["proprietaire", SESSION_TOKEN_PILOTAGE, "/dashboard"],
  ["editeur", SESSION_TOKEN_PILOTAGE_EDITEUR, "/dashboard"],
  ["membre", SESSION_TOKEN_PILOTAGE_MEMBRE, "/dashboard"],
  ["client-cabinet", SESSION_TOKEN_CLIENT_CABINET, "/dashboard"],
  ["cabinet-dossier", SESSION_TOKEN_CABINET, "/dashboard"],
  ["cabinet-espace", SESSION_TOKEN_CABINET, "/dashboard/gestionnaire"],
]) {
  test.describe(`Relevé de la mise en page (${nom})`, () => {
    test.use({ storageState: connecte(token) });
    test(`Relevé : pil-mise-en-page-${nom}`, async ({ page, surveillance }) => {
      test.setTimeout(30 * 60_000);
      const ouvrirPage = (p) => ouvrir(p, url);
      enregistrer(`pil-barre-laterale-${nom}`, await inventorier(page, { ouvrir: ouvrirPage, zone: barreLaterale, problemes: surveillance }));
      enregistrer(`pil-en-tete-${nom}`, await inventorier(page, { ouvrir: ouvrirPage, zone: enTete, problemes: surveillance }));
    });
  });
}

test.describe("Relevé de la page Favoris", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  relever({ "pil-favoris": "/dashboard/favoris" });
  test("Relevé : pil-recherche-globale", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    const ouvrirRecherche = async (p) => {
      await ouvrir(p, "/dashboard");
      await p.keyboard.press("Control+k");
      await p.getByPlaceholder("Rechercher ou aller à...").waitFor();
    };
    enregistrer("pil-recherche-globale", await inventorier(page, { ouvrir: ouvrirRecherche, zone: (p) => p.getByRole("dialog").last(), problemes: surveillance }));
  });
});
