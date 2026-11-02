/**
 * Accueil : la synchronisation bancaire complète ne part qu'au retour réel
 * d'une connexion bancaire ouverte depuis ce navigateur. Un simple lien vers
 * /dashboard?status=… ou ?item_id=… ne lance rien.
 */
import { test, expect, etape } from "../outils.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE } from "../config.mjs";
import { ouvrirAccueil } from "./outils-accueil.mjs";
import { ouvrir } from "../navigation.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

const MARQUE = "newbi-bank-connect-started";

/** Compte les appels à la synchronisation complète (simulée, sans Bridge). */
async function compterSynchros(page) {
  const appels = [];
  await page.route("**/api/banking-sync/full", (route) => {
    appels.push(route.request().url());
    return route.fulfill({ status: 200, json: { success: true } });
  });
  return appels;
}

test.describe("Accueil : retour de connexion bancaire", () => {
  for (const params of ["?status=success", "?item_id=123&success=true"]) {
    test(`un lien ${params} sans connexion ouverte ne lance aucune synchronisation`, async ({ page }) => {
      const appels = await compterSynchros(page);
      await ouvrirAccueil(page);
      await ouvrir(page, `/dashboard${params}`, { pret: page.getByRole("heading", { name: "À traiter" }) });
      // La synchronisation part 1,5 s après l'arrivée : on laisse passer ce délai
      await page.waitForTimeout(3_000);
      await etape(page, "Aucune synchronisation", () => expect(appels).toHaveLength(0));
    });
  }

  test("retour réel (connexion ouverte depuis ce navigateur) : une synchronisation", async ({ page }) => {
    const appels = await compterSynchros(page);
    await ouvrirAccueil(page);
    await page.evaluate((cle) => localStorage.setItem(cle, String(Date.now())), MARQUE);
    await ouvrir(page, "/dashboard?item_id=123&success=true", { pret: page.getByRole("heading", { name: "À traiter" }) });
    await etape(page, "Une synchronisation", () => expect.poll(() => appels.length, { timeout: 15_000 }).toBe(1));
    // Marque consommée : recharger la même adresse ne relance rien
    expect(await page.evaluate((cle) => localStorage.getItem(cle), MARQUE)).toBeNull();
  });
});
