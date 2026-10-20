/**
 * Organisation « Volume » : 55 bons de commande, plus que les 50 que la
 * liste charge. Les plus anciens doivent rester comptés et trouvables.
 */
import { test, expect } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VOLUME } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BC_VOLUME } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe, rechercher, reference } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VOLUME) });

test.describe("Bons de commande : plus de 50 bons", () => {
  test("L'onglet « Tous » compte tous les bons de l'organisation", async ({ page }) => {
    await ouvrirListe(page, "bc");
    const total = (await chercherEnBase("purchaseorders", { workspaceId: COMPTES.volume.organisation._id })).length;
    await expect(page.getByRole("tab", { name: /^Tous \d+$/ })).toHaveAccessibleName(`Tous ${total}`);
  });

  test("Le plus ancien bon se retrouve par la recherche", async ({ page }) => {
    const b = BC_VOLUME[0];
    await ouvrirListe(page, "bc");
    await rechercher(page, "bc", reference(b));
    await expect(ligneDe(page, "bc", b), `${reference(b)} introuvable : seuls les 50 bons les plus récents sont chargés`).toHaveCount(1);
  });
});
