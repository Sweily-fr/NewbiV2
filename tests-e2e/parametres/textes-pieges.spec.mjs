/**
 * Textes piégés : un nom d'entreprise, une enseigne, une adresse et un nom de
 * banque écrits par le propriétaire, un nom de membre et un nom de rôle
 * personnalisé, contenant du HTML qui exécute du code. Ouverts par un autre
 * membre de l'espace, ils doivent s'afficher comme du texte : rien ne doit
 * s'exécuter (la surveillance échoue sur toute boîte de dialogue, et la page
 * ne doit pas porter la marque posée par le code).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_AUTH, ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";
import { contenuParametres, ouvrirParametres } from "../authentification/outils-auth.mjs";

const marque = (page) => page.evaluate(() => window.__piege ?? null);

async function rienNeSExecute(page, ou) {
  await page.waitForTimeout(1_500);
  await etape(page, `${ou} : rien ne s'exécute`, async () => expect(await marque(page), `Le code piégé s'est exécuté (${ou})`).toBeNull(), { capture: "ecran" });
}

test.describe("Textes piégés vus par un membre de l'espace", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.piegeMembre.token) });

  test("Tableau de bord : le nom de l'entreprise s'affiche comme du texte", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await rienNeSExecute(page, "tableau de bord");
  });

  for (const [onglet, ou] of [
    ["generale", "Paramètres > Générale"],
    ["coordonnees-bancaires", "Paramètres > Coordonnées bancaires"],
    ["roles", "Paramètres > Rôles"],
    ["espaces", "Paramètres > Espaces"],
  ]) {
    test(`${ou} : les textes de l'entreprise s'affichent comme du texte`, async ({ page }) => {
      await ouvrirParametres(page, onglet);
      await rienNeSExecute(page, ou);
    });
  }
});

test.describe("Textes piégés vus par le propriétaire", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.piegeProprietaire.token) });

  test("Liste des membres : le nom piégé d'un membre et de son rôle s'affichent comme du texte", async ({ page }) => {
    await ouvrirParametres(page, "espaces", { pret: (z) => z.getByRole("row").filter({ hasText: "Piège" }) });
    await contenuParametres(page).getByRole("row").filter({ hasText: "Piège" }).first().click();
    await expect(contenuParametres(page).getByPlaceholder("Rechercher par nom ou email")).toBeVisible();
    await expect(contenuParametres(page).getByText(COMPTES_AUTH.piegeMembre.utilisateur.email).first()).toBeVisible();
    await rienNeSExecute(page, "liste des membres");
  });

  test("Rôles : le nom piégé d'un rôle personnalisé s'affiche comme du texte", async ({ page }) => {
    await ouvrirParametres(page, "roles");
    await expect(contenuParametres(page).getByText(ROLES_PERSO.piege.name, { exact: false }).first()).toBeVisible();
    await rienNeSExecute(page, "liste des rôles");
    await contenuParametres(page).getByRole("button", { name: /Rôle <img/ }).first().click();
    await rienNeSExecute(page, "fenêtre du rôle");
  });
});
