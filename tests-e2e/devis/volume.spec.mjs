/**
 * Organisation « Volume » : 56 devis, plus que les 50 que la liste charge
 * (useQuotes, limit 50, filtrage et compteurs calculés sur la page chargée).
 * Les devis plus anciens doivent rester comptés, trouvables et exportés.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VOLUME } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { DEVIS_VOLUME } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe, rechercher, reference, telecharger } from "./ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VOLUME) });
const tous = () => chercherEnBase("quotes", { workspaceId: COMPTES.volume.organisation._id });

test.describe("Devis : plus de 50 devis", () => {
  test("L'onglet « Tous les devis » compte tous les devis de l'organisation", async ({ page }) => {
    await ouvrirListe(page, "devis");
    const total = (await tous()).length;
    await expect(page.getByRole("tab", { name: /^Tous les devis/ }), `${total} devis en base`).toHaveAccessibleName(`Tous les devis ${total}`);
  });

  test("Le plus ancien devis se retrouve par la recherche", async ({ page }) => {
    const d = DEVIS_VOLUME[0];
    await ouvrirListe(page, "devis");
    await rechercher(page, "devis", reference(d));
    await etape(page, "Résultat de la recherche", async () => {
      await expect(ligneDe(page, "devis", d), `${reference(d)} introuvable : seuls les 50 devis les plus récents sont chargés`).toHaveCount(1);
    }, { capture: "ecran" });
  });

  test("Export CSV : tous les devis de l'organisation, pas seulement les 50 derniers", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await page.getByRole("button", { name: "Exporter" }).click();
    await page.getByRole("menuitem", { name: "CSV", exact: true }).click();
    const f = page.getByRole("dialog", { name: "Exporter en CSV" });
    const { chemin } = await telecharger(page, () => f.getByRole("button", { name: "Exporter", exact: true }).click());
    const lignes = readFileSync(chemin, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
    expect(lignes.length - 1, "Nombre de devis exportés").toBe((await tous()).length);
  });
});
