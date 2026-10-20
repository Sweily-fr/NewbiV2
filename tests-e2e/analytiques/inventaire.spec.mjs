/**
 * Relevé des pages de pilotage (E2E_INVENTAIRE=1 seulement) : Analytiques
 * (chaque onglet), Vue d'ensemble, correspondance avec le plan comptable.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const ANALYTIQUES = "/dashboard/outils/analytiques";

test.describe("Relevé des analytiques (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  relever({
    "pil-analytiques": ANALYTIQUES,
    "pil-vue-ensemble": "/dashboard/outils/analytiques/vue-densemble",
    "pil-pcg": "/dashboard/analytics",
  });
  for (const [onglet, cle] of [["Rentabilité", "rentabilite"], ["Trésorerie", "tresorerie"], ["Clients", "clients"], ["Taxes", "taxes"]]) {
    releverEtat(`pil-analytiques-${cle}`, async (page) => {
      await ouvrir(page, ANALYTIQUES);
      await page.getByRole("tab", { name: onglet }).click();
      await page.waitForTimeout(800);
    });
  }
  releverEtat("pil-analytiques-periode-personnalisee", async (page) => {
    await ouvrir(page, ANALYTIQUES);
    await page.getByRole("button", { name: "Année en cours" }).click();
    await page.getByRole("button", { name: "Période personnalisée" }).click();
    await page.waitForTimeout(500);
  }, { zone: (p) => p.getByRole("dialog").last() });
});

test.describe("Relevé des analytiques (membre)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });
  relever({ "pil-analytiques-membre": ANALYTIQUES, "pil-vue-ensemble-membre": "/dashboard/outils/analytiques/vue-densemble" });
});
