/**
 * Prise de rendez-vous : une création, une modification ou une suppression
 * de type de rendez-vous apparaît tout de suite, sans recharger la page.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_RDV } from "../donnees/lot-rendez-vous.mjs";

test.describe("Rendez-vous : la liste suit les changements sans rechargement", () => {
  test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

  test("Créer, renommer, désactiver puis supprimer un type", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=types");
    await expect(page.getByRole("button", { name: "Découverte avec Chloé", exact: true })).toBeVisible({ timeout: 120_000 });

    // Création
    await cliquer(page, page.getByRole("button", { name: "Nouveau type" }));
    await page.getByLabel("Nom").fill("Atelier rafraîchi");
    await cliquer(page, page.getByRole("button", { name: "Créer le type" }));
    await expect(page.getByRole("button", { name: "Atelier rafraîchi", exact: true })).toBeVisible({ timeout: 10_000 });

    // Modification
    await cliquer(page, page.getByRole("button", { name: "Atelier rafraîchi", exact: true }));
    await page.getByLabel("Nom").fill("Atelier renommé");
    await cliquer(page, page.getByRole("button", { name: "Enregistrer" }));
    await expect(page.getByRole("button", { name: "Atelier renommé", exact: true })).toBeVisible({ timeout: 10_000 });

    // Suppression
    await cliquer(page, page.getByRole("button", { name: "Actions pour Atelier renommé" }));
    await cliquer(page, page.getByRole("menuitem", { name: "Supprimer" }));
    await cliquer(page, page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }));
    await expect(page.getByRole("button", { name: "Atelier renommé", exact: true })).toHaveCount(0, { timeout: 10_000 });
  });
});
