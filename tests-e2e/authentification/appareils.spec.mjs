/**
 * Appareils et sessions : liste des appareils connectés (Paramètres >
 * Sécurité), révoquer un appareil, se déconnecter de tous les autres, page
 * « Gérer mes appareils » (/auth/manage-devices). Chaque compte a ses
 * propres sessions semées (iPhone, Firefox sous Windows) : les révoquer ne
 * touche aucun autre compte de test.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_AUTH } from "../donnees/lot-parametres-auth.mjs";
import { appelSite, contenuParametres, ouvrirParametres } from "./outils-auth.mjs";

const sessionParJeton = async (token) => (await base()).collection("session").findOne({ token });

test.describe("Paramètres > Sécurité : appareils connectés", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.appareils.token), erreursConsoleAutorisees: /multi-session\/revoke|status of 401/ });
  test.beforeEach(async () => {
    await (await base()).collection("organization").updateOne({ _id: COMPTES_AUTH.appareils.organisation._id }, { $set: { "sessionSettings.maxSessions": 3 } });
  });

  test("Les trois appareils du compte sont listés", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    const contenu = contenuParametres(page);
    await expect(contenu.getByRole("button", { name: "Révoquer" }).first()).toBeVisible();
    await expect(contenu.getByRole("button", { name: "Révoquer" }), "Une ligne « Révoquer » par autre appareil").toHaveCount(2);
  });

  // Les appareils sont lus par listSessions (toutes les sessions du compte), mais
  // révoqués par multiSession.revoke, qui n'accepte que les sessions de CE navigateur.
  test("Révoquer un autre appareil : sa session est fermée", async ({ page }) => {
    await ouvrirParametres(page, "securite");
    const contenu = contenuParametres(page);
    await contenu.getByRole("button", { name: "Révoquer" }).first().click();
    const alerte = page.getByRole("alertdialog", { name: "Révoquer la session" });
    await alerte.getByRole("button", { name: "Révoquer" }).click();
    await page.waitForTimeout(2_000);
    const restantes = [COMPTES_AUTH.appareils.sessions[1].token, COMPTES_AUTH.appareils.sessions[2].token];
    const ouvertes = [];
    for (const t of restantes) if (await sessionParJeton(t)) ouvertes.push(t);
    expect(ouvertes.length, "Aucun des deux autres appareils n'a été déconnecté : « Erreur lors de la déconnexion de l'appareil »").toBe(1);
    expect(await sessionParJeton(COMPTES_AUTH.appareils.token), "La session en cours a été fermée").not.toBeNull();
  });
});

test.describe("Paramètres > Sécurité : déconnexion de tous les appareils", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.appareilsTous.token), erreursConsoleAutorisees: /status of 401|\/api\/auth\/token/ });
  test("Tous les appareils sont déconnectés, y compris celui-ci", async ({ page }) => {
    await (await base()).collection("organization").updateOne({ _id: COMPTES_AUTH.appareilsTous.organisation._id }, { $set: { "sessionSettings.maxSessions": 3 } });
    await ouvrirParametres(page, "securite");
    await contenuParametres(page).getByRole("button", { name: "Déconnexion globale" }).click();
    await page.getByRole("alertdialog", { name: "Déconnexion globale" }).getByRole("button", { name: "Déconnecter tout" }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
    expect(await (await base()).collection("session").countDocuments({ userId: COMPTES_AUTH.appareilsTous.utilisateur._id })).toBe(0);
  });
});

test.describe("Gérer mes appareils (/auth/manage-devices)", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.gestionAppareils.token) });

  test("Révoquer l'autre session puis continuer vers le tableau de bord", async ({ page }) => {
    await page.goto("/auth/manage-devices");
    const revoquer = page.getByRole("button", { name: /^Révoquer la session/ });
    await expect(revoquer.first()).toBeVisible({ timeout: 30_000 });
    await revoquer.first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Révoquer", exact: true }).click();
    await expect.poll(() => sessionParJeton(COMPTES_AUTH.gestionAppareils.sessions[1].token)).toBeNull();
    expect(await sessionParJeton(COMPTES_AUTH.gestionAppareils.token), "La session en cours a été fermée").not.toBeNull();
    await page.getByRole("button", { name: "Continuer vers le dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });
});

test.describe("Sessions : un compte ne ferme jamais celles d'un autre", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.intrusSessions.token), erreursConsoleAutorisees: /status of 4\d\d/ });
  test("Révoquer la session d'un autre compte par son identifiant : refusé, la session reste ouverte", async ({ page }) => {
    await ouvrir(page, "/mentions-legales");
    const cible = COMPTES_AUTH.cibleSessions.sessions[1];
    const visee = await sessionParJeton(cible.token);
    await etape(page, "Par l'identifiant de la session", async () => {
      const r = await appelSite(page, "/api/revoke-session", { methode: "POST", corps: { sessionId: visee._id.toHexString() } });
      expect(r.statut).toBeGreaterThanOrEqual(400);
    });
    await etape(page, "Par son jeton", async () => {
      const r = await appelSite(page, "/api/revoke-session", { methode: "POST", corps: { sessionToken: cible.token } });
      expect(r.statut).toBeGreaterThanOrEqual(400);
    });
    expect(await sessionParJeton(cible.token), "La session d'un autre compte a été fermée").not.toBeNull();
  });
});
