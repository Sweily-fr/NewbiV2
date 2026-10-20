/**
 * Mise en page : bouton « Notifications » de la barre latérale (compteur,
 * fenêtre, notifications personnelles, texte piégé), page Favoris, et pages
 * de développement qui ne doivent pas être ouvertes en production.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { NOTIFICATIONS_PILOTAGE } from "../donnees/lot-pilotage.mjs";

const boutonNotifications = (page) => page.locator("[data-slot=sidebar]").getByRole("button", { name: /^Notifications/ });

test.describe("Notifications (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Le bouton annonce le nombre de notifications non lues", async ({ page }) => {
    const nonLues = await (await base()).collection("notifications").countDocuments({ userId: COMPTES.pilotage.utilisateur._id, workspaceId: COMPTES.pilotage.organisation._id, read: false });
    await ouvrir(page, "/dashboard");
    await expect(boutonNotifications(page)).toHaveAccessibleName(new RegExp(`^Notifications\\s*${nonLues}$`));
  });

  test("Le bouton ouvre les notifications ; un titre piégé s'affiche comme du texte", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await cliquer(page, boutonNotifications(page));
    const parametres = fenetre(page, "Paramètres de l'application");
    await expect(parametres).toBeVisible();
    await etape(page, "Notifications affichées", async () => {
      await expect(parametres.getByText(NOTIFICATIONS_PILOTAGE.nonLue.title, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
      await expect(parametres.getByText(/Membre <img/).first()).toBeVisible();
    }, { capture: "ecran" });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code de la notification s'est exécuté").toBeNull();
  });
});

test.describe("Notifications (Membre de « Pilotage »)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });

  test("Les notifications du propriétaire ne lui sont ni comptées ni montrées", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await expect(boutonNotifications(page)).toHaveAccessibleName(/^Notifications$/);
    await cliquer(page, boutonNotifications(page));
    const parametres = fenetre(page, "Paramètres de l'application");
    await expect(parametres).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(parametres).not.toContainText(NOTIFICATIONS_PILOTAGE.nonLue.message);
  });
});

test.describe("Favoris", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("La page s'ouvre, titrée « Favoris »", async ({ page }) => {
    const reponse = await ouvrir(page, "/dashboard/favoris", { pret: page.getByRole("heading", { name: "Favoris" }) });
    expect(reponse.status()).toBeLessThan(400);
  });

  test("La page liste des favoris, ou dit comment en ajouter", async ({ page }) => {
    await ouvrir(page, "/dashboard/favoris", { pret: page.getByRole("heading", { name: "Favoris" }) });
    const texte = (await page.locator("main").innerText()).replace(/\s+/g, " ").trim();
    await etape(page, "Contenu", async () => expect(texte.replace(/^.*Favoris/, "").trim(), "La page ne contient qu'un titre : ni favori, ni explication").not.toBe(""), { capture: "ecran" });
  });
});

test.describe("Pages de développement", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  for (const chemin of ["/dashboard/test-rbac", "/dashboard/loaderTest", "/test-animation-pro"]) {
    test(`${chemin} n'est pas ouverte en production`, async ({ page }) => {
      const reponse = await page.request.get(chemin);
      expect(reponse.status(), `${chemin} répond ${reponse.status()} : page de test servie en production`).toBe(404);
    });
  }
});
