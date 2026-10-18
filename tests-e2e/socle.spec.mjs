/**
 * Socle : le compte de test est connecté, l'organisation est complète et la
 * liste des factures s'affiche, sans erreur ni appel vers l'extérieur.
 */
import { test, expect, verifierTextesPropres } from "./outils.mjs";
import { ouvrir } from "./navigation.mjs";

test("Connecté : la liste des factures s'affiche", async ({ page }) => {
  await ouvrir(page, "/dashboard/outils/factures", { pret: page.getByText("Factures clients").first() });
  await expect(page).toHaveURL(/\/dashboard\/outils\/factures/);
  await verifierTextesPropres(page);
});
