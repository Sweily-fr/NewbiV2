/**
 * Erreurs de saisie dans l'éditeur de bons de livraison : l'utilisateur doit
 * voir ce qui ne va pas, et rien ne doit être enregistré.
 */
import { test, expect, etape } from "../outils.mjs";
import { documentsAvecArticle } from "../base.mjs";
import { ajouterArticle, choisirClient, continuer, notifications } from "../editeur.mjs";
import { ALPHA } from "../creation.mjs";
import { adresseSaisie, creerBonLivraison, EDITEUR, nouveauBonLivraison } from "./editeur.mjs";

const resteSurLEditeur = (page) => expect(page).toHaveURL(new RegExp(`${EDITEUR}$`));

async function jusquAuxArticles(page, avantContinuer) {
  await nouveauBonLivraison(page);
  await choisirClient(page, ALPHA);
  if (avantContinuer) await avantContinuer(page);
  await continuer(page);
}

test.describe("Bons de livraison : erreurs de saisie", () => {
  test("Sans client : impossible de continuer, message clair", async ({ page }) => {
    await nouveauBonLivraison(page);
    await etape(page, "Continuer sans client", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(notifications(page).filter({ hasText: "Veuillez sélectionner un client pour continuer" })).toBeVisible();
    }, { capture: "ecran" });
  });

  test("Sans article : un message explique pourquoi le bon n'est pas créé", async ({ page }) => {
    await jusquAuxArticles(page);
    await etape(page, "Créer sans article", async () => {
      await creerBonLivraison(page);
      await expect(notifications(page).filter({ hasText: "Ajoutez au moins un article" })).toBeVisible();
      await resteSurLEditeur(page);
    }, { capture: "ecran" });
  });

  test("Article sans désignation : message « articles incomplets »", async ({ page }) => {
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { quantite: 2 });
    await etape(page, "Créer", async () => {
      await creerBonLivraison(page);
      await expect(notifications(page).filter({ hasText: "Certains articles sont incomplets" })).toBeVisible();
      await resteSurLEditeur(page);
    }, { capture: "ecran" });
  });

  test("Adresse de livraison incomplète : refusée avec une explication", async ({ page }) => {
    const nom = "Colis sans adresse complète (cas erreur adresse)";
    await jusquAuxArticles(page, (p) => adresseSaisie(p, { rue: "5 rue Incomplète", codePostal: "", ville: "" }));
    await ajouterArticle(page, 1, { nom, quantite: 1 });
    await etape(page, "Créer", async () => {
      await creerBonLivraison(page);
      await expect(notifications(page).filter({ hasText: "L'adresse de livraison doit comporter rue, code postal et ville" })).toBeVisible();
      await resteSurLEditeur(page);
    }, { capture: "ecran" });
    expect(await documentsAvecArticle("deliverynotes", nom), "Rien ne doit être enregistré").toHaveLength(0);
  });
});
