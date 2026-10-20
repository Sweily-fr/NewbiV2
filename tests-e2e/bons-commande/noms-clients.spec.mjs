/**
 * Bons de commande : un client au nom réel (« œ », apostrophe typographique)
 * bloque le changement de statut du bon (règles de nom de l'API, voir
 * ../devis/noms-clients.spec.mjs).
 */
import { test, etape } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { BC_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { actionDeLigne, epingler, relu } from "../devis/ventes.mjs";

test.use({
  storageState: connecte(SESSION_TOKEN_VENTES),
  erreursConsoleAutorisees: /Erreur lors du changement de statut|ApolloError|Le nom du client est invalide/,
});

test.describe("Bons de commande : clients aux noms réels", () => {
  test("Marquer comme validé le bon de « Cœur d’Artichaut SAS » : validé", async ({ page }) => {
    const b = B.coeurAValider;
    await epingler(page, "bc", b);
    await etape(page, "Marquer comme validé", async () => {
      await actionDeLigne(page, "bc", b, "Marquer comme validé");
      await page.waitForTimeout(1_500);
    }, { capture: "ecran" });
    await relu("bc", b, (x) => x?.status, "Le bon n'a pas pu être validé (nom du client refusé par l'API)").toBe("VALIDATED");
  });
});
