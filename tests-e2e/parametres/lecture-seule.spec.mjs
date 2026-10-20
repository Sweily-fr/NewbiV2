/**
 * Requêtes refusées au chargement du tableau de bord : un espace en lecture
 * seule (essai terminé, sans abonnement) ou un rôle personnalisé limité ne
 * doit pas lancer de requêtes que le serveur refuse (402 « paiement requis »,
 * FORBIDDEN) : elles remplissent la console d'erreurs et peuvent afficher des
 * notifications d'erreur à l'utilisateur. La surveillance des tests échoue
 * sur ces erreurs.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_RECRUTEUR_PARAMETRES } from "../config.mjs";
import { COMPTES_AUTH } from "../donnees/lot-parametres-auth.mjs";

test.describe("Tableau de bord sans requêtes refusées", () => {
  test.describe(() => {
    test.use({ storageState: connecte(COMPTES_AUTH.essaiExpire.token) });
    test("Espace en lecture seule (essai terminé) : aucune requête refusée au chargement", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      await page.waitForTimeout(2_000);
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_RECRUTEUR_PARAMETRES) });
    test("Rôle personnalisé limité aux membres : aucune requête refusée au chargement", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      await page.waitForTimeout(2_000);
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
