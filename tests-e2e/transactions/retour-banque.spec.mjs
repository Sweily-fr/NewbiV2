/**
 * /banking-callback : page publique de retour après la connexion d'une
 * banque (Bridge), qui rebondit vers l'app mobile (newbi://) et propose de
 * la télécharger. Ouverte sans session, comme depuis le navigateur du
 * téléphone.
 */
import { test, expect } from "../outils.mjs";

test.use({
  storageState: { cookies: [], origins: [] },
  // Le rebond vers l'app (newbi://banking-callback) n'a pas d'application dans le navigateur de test.
  erreursConsoleAutorisees: /newbi:\/\/|scheme does not have a registered handler|Failed to launch/,
});

test.describe("Retour de la connexion bancaire", () => {
  test("La page s'affiche sans session : message de fin et lien de téléchargement", async ({ page }) => {
    const reponse = await page.goto("/banking-callback");
    expect(reponse?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: "Connexion bancaire terminée" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Télécharger Newbi" })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.locator("img[alt='Newbi']")).toHaveJSProperty("complete", true);
  });

  test("Titre de l'onglet sans tiret cadratin", async ({ page }) => {
    await page.goto("/banking-callback");
    expect(await page.title(), "Le titre de l'onglet contient un tiret cadratin « — »").not.toContain("—");
  });

  test("Erreur de la banque en paramètre : rien d'exécuté, la page reste lisible", async ({ page }) => {
    await page.goto(`/banking-callback?error=${encodeURIComponent("<img src=x onerror=alert(1)>")}`);
    await expect(page.getByRole("heading", { name: "Connexion bancaire terminée" })).toBeVisible();
    expect(await page.locator("img[src='x']").count()).toBe(0);
  });
});
