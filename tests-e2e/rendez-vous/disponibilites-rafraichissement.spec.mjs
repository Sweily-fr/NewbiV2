/**
 * Prise de rendez-vous, onglet Disponibilités : une plage ajoutée, modifiée
 * ou retirée, une exception ajoutée ou retirée s'affichent telles
 * qu'enregistrées, sans recharger la page (barre d'enregistrement fermée).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { champHeure, choisirHeure } from "./outils-rdv.mjs";

const barre = (page) => page.getByRole("button", { name: "Enregistrer", exact: true });

async function enregistrer(page) {
  await cliquer(page, barre(page));
  await expect(barre(page)).toHaveCount(0, { timeout: 10_000 });
}

test.describe("Rendez-vous : Disponibilités suit les changements sans rechargement", () => {
  test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

  test("Ajouter, modifier, retirer une plage et une exception", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/rendez-vous?onglet=disponibilites");
    const lundiFin1 = champHeure(page, "Lundi, fin de la plage 1");
    await expect(lundiFin1).toBeVisible({ timeout: 120_000 });

    // Modifier une plage
    await choisirHeure(page, "Lundi, fin de la plage 1", "12:00");
    await enregistrer(page);
    await expect(lundiFin1).toHaveText("12:00");

    // Ajouter une plage au lundi
    const lundi = page.getByRole("listitem").filter({ has: lundiFin1 });
    await cliquer(page, lundi.getByRole("button", { name: "Ajouter une plage" }));
    await choisirHeure(page, "Lundi, début de la plage 2", "14:00");
    await choisirHeure(page, "Lundi, fin de la plage 2", "17:00");
    await enregistrer(page);
    await expect(champHeure(page, "Lundi, fin de la plage 2")).toHaveText("17:00");

    // Retirer la plage ajoutée
    await cliquer(page, lundi.getByRole("button", { name: "Retirer la plage 2" }));
    await enregistrer(page);
    await expect(champHeure(page, "Lundi, fin de la plage 2")).toHaveCount(0);

    // Ajouter une exception
    await cliquer(page, page.getByRole("button", { name: "Ajouter une date" }));
    // Mois suivant : en fin de mois, le mois en cours peut n'avoir que
    // quelques jours encore cliquables
    await page.locator("[data-slot=popover-content] .rdp-button_next").click();
    const jours = page.locator("[data-slot=popover-content] button[data-day]:not([disabled])");
    await cliquer(page, jours.nth(3));
    await expect(page.getByText("Aucune exception.")).toHaveCount(0);
    await enregistrer(page);
    await expect(page.getByText("Aucune exception.")).toHaveCount(0);

    // État identique après rechargement (témoin)
    await page.reload();
    await expect(champHeure(page, "Lundi, fin de la plage 1")).toHaveText("12:00", { timeout: 60_000 });
    await expect(page.getByText("Aucune exception.")).toHaveCount(0);
  });
});
