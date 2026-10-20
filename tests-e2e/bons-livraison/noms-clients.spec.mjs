/**
 * Bons de livraison : des clients aux noms réels (« œ », apostrophe
 * typographique, chiffres) bloquent le changement de statut du bon : l'API
 * refuse le nom du client et celui de l'adresse de livraison (voir
 * ../devis/noms-clients.spec.mjs).
 */
import { test, etape } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { BL_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { actionDeLigne, epingler, relu } from "../devis/ventes.mjs";

test.use({
  storageState: connecte(SESSION_TOKEN_VENTES),
  erreursConsoleAutorisees: /Erreur lors du changement de statut|ApolloError|Le nom du client est invalide|Le nom complet doit contenir/,
});

test.describe("Bons de livraison : clients aux noms réels", () => {
  for (const [nom, b] of [
    ["« Cœur d’Artichaut SAS » (« œ » et apostrophe typographique)", B.coeurAExpedier],
    ["« Studio 54 Production » (chiffres)", B.studioAExpedier],
  ]) {
    test(`Marquer comme expédié le bon de ${nom} : expédié`, async ({ page }) => {
      await epingler(page, "bl", b);
      await etape(page, "Marquer comme expédié", async () => {
        await actionDeLigne(page, "bl", b, "Marquer comme expédié");
        await page.waitForTimeout(1_500);
      }, { capture: "ecran" });
      await relu("bl", b, (x) => x?.status, "Le bon n'a pas pu être expédié (nom refusé par l'API)").toBe("SHIPPED");
    });
  }
});
