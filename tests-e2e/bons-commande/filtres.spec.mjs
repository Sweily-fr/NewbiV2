/**
 * Liste des bons de commande : filtres (statut, client), comparés à la base,
 * organisation « Ventes ».
 */
import { test, expect } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BC_VENTES as B, CLIENTS_VENTES } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });
const ORG = COMPTES.ventes.organisation._id;
const lignes = (page) => page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: /S[eé]lectionner la ligne/ }) });

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

test.describe("Bons de commande : filtres", () => {
  test("Filtrer par statut « Annulé » : seulement les bons annulés", async ({ page }) => {
    await ouvrirListe(page, "bc");
    await filtrer(page, "Filtrer par statut", "Annulé");
    const annules = await chercherEnBase("purchaseorders", { workspaceId: ORG, status: "CANCELED" });
    await expect(lignes(page)).toHaveCount(annules.length);
    await expect(ligneDe(page, "bc", B.annule)).toHaveCount(1);
  });

  test("Filtrer par client « Hélène Martin » : tous ses bons, et rien d'autre", async ({ page }) => {
    await ouvrirListe(page, "bc");
    await filtrer(page, "Filtrer par client", CLIENTS_VENTES.martin.name);
    const siens = await chercherEnBase("purchaseorders", { workspaceId: ORG, "client.name": CLIENTS_VENTES.martin.name });
    await expect(lignes(page)).toHaveCount(siens.length);
    await expect(ligneDe(page, "bc", B.enAttente), "Un bon d'un autre client est affiché").toHaveCount(0);
  });
});
