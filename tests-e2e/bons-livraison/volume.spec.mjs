/**
 * Organisation « Volume » : 55 bons de livraison, plus que les 50 que la
 * liste charge. Les plus anciens doivent rester comptés et trouvables.
 */
import { test, expect } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VOLUME } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BL_VOLUME } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe, rechercher, reference } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VOLUME) });

test.describe("Bons de livraison : plus de 50 bons", () => {
  test("L'onglet « Tous » compte tous les bons de l'organisation", async ({ page }) => {
    await ouvrirListe(page, "bl");
    const total = (await chercherEnBase("deliverynotes", { workspaceId: COMPTES.volume.organisation._id })).length;
    await expect(page.getByRole("tab", { name: /^Tous \d+$/ })).toHaveAccessibleName(`Tous ${total}`);
  });

  test("Le plus ancien bon se retrouve par la recherche", async ({ page }) => {
    const b = BL_VOLUME[0];
    await ouvrirListe(page, "bl");
    await rechercher(page, "bl", reference(b));
    await expect(ligneDe(page, "bl", b), `${reference(b)} introuvable : seuls les 50 bons les plus récents sont chargés`).toHaveCount(1);
  });
});
