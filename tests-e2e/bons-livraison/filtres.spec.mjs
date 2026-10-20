/**
 * Liste des bons de livraison : filtres (statut, client) et recherche,
 * comparés à la base, organisation « Ventes ».
 */
import { test, expect } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BL_VENTES as B, CLIENTS_VENTES } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe, rechercher } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });
const ORG = COMPTES.ventes.organisation._id;
const lignes = (page) => page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Sélectionner la ligne" }) });

async function filtrer(page, sousMenu, choix) {
  await page.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "50" }).click();
  await attendreCalme(page);
  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByRole("menuitem", { name: sousMenu }).click();
  await page.getByRole("menu").last().getByText(choix, { exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await attendreCalme(page);
}

test.describe("Bons de livraison : filtres et recherche", () => {
  test("Filtrer par statut « Expédié » : seulement les bons expédiés", async ({ page }) => {
    await ouvrirListe(page, "bl");
    await filtrer(page, "Filtrer par statut", "Expédié");
    const expedies = await chercherEnBase("deliverynotes", { workspaceId: ORG, status: "SHIPPED" });
    await expect(lignes(page)).toHaveCount(expedies.length);
    await expect(ligneDe(page, "bl", B.expedie)).toHaveCount(1);
  });

  test("Filtrer par client « Hélène Martin » : seulement ses bons", async ({ page }) => {
    await ouvrirListe(page, "bl");
    await filtrer(page, "Filtrer par client", CLIENTS_VENTES.martin.name);
    const siens = await chercherEnBase("deliverynotes", { workspaceId: ORG, "client.name": CLIENTS_VENTES.martin.name });
    await expect(lignes(page)).toHaveCount(siens.length);
  });

  test("Recherche par numéro de suivi : le bon expédié est trouvé, lui seul", async ({ page }) => {
    await ouvrirListe(page, "bl");
    await rechercher(page, "bl", B.expedie.trackingNumber);
    await expect(lignes(page)).toHaveCount(1);
    await expect(ligneDe(page, "bl", B.expedie)).toHaveCount(1);
  });
});
