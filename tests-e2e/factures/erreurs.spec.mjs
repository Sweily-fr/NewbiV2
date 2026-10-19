/**
 * Erreurs de saisie dans l'éditeur de factures : l'utilisateur doit voir ce
 * qui ne va pas, et aucune facture ne doit être enregistrée.
 */
import { test, expect, etape } from "../outils.mjs";
import { facturesAvecArticle } from "../base.mjs";
import {
  ajouterArticle,
  choisirClient,
  continuer,
  creerFacture,
  enregistrerBrouillon,
  notifications,
  nouvelleFacture,
  remiseGlobale,
} from "./editeur.mjs";

const ALPHA = "Entreprise Alpha SAS";

/** Ouvre l'éditeur, choisit le client et passe aux articles. */
async function jusquAuxArticles(page) {
  await nouvelleFacture(page);
  await choisirClient(page, ALPHA);
  await continuer(page);
}

async function aucuneFacture(nomArticle) {
  expect(await facturesAvecArticle(nomArticle), "Aucune facture ne doit être enregistrée").toHaveLength(0);
}

test.describe("Factures : erreurs de saisie", () => {
  test("Sans client : impossible de continuer, message clair", async ({ page }) => {
    await nouvelleFacture(page);
    await etape(page, "Continuer sans client", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(notifications(page).filter({ hasText: "Veuillez sélectionner un client pour continuer" })).toBeVisible();
      await expect(page.getByText("Sélection d'un client").first()).toBeVisible();
    }, { capture: "ecran" });
  });

  test("Sans article : un message explique pourquoi la facture n'est pas créée", async ({ page }) => {
    await jusquAuxArticles(page);
    await etape(page, "Créer sans article", async () => {
      await creerFacture(page);
      await expect(
        notifications(page).filter({ hasText: "Veuillez ajouter au moins un article à la facture" }),
        "Un message doit expliquer qu'il faut au moins un article",
      ).toBeVisible();
      await expect(page).toHaveURL(/\/factures\/new/);
    }, { capture: "ecran" });
  });

  test("Article sans nom, en brouillon : message « articles incomplets »", async ({ page }) => {
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { quantite: 1, prix: 120 });
    await etape(page, "Enregistrer le brouillon", async () => {
      await enregistrerBrouillon(page);
      const message = notifications(page).filter({ hasText: "La facture n'a pas pu être enregistrée" });
      await expect(message).toBeVisible();
      await expect(message).toContainText("Certains articles sont incomplets");
    }, { capture: "ecran" });
  });

  test("Article sans nom, à la création : l'utilisateur voit pourquoi rien ne se passe", async ({ page }) => {
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { quantite: 1, prix: 130 });
    await etape(page, "Créer la facture", async () => {
      await creerFacture(page);
      await expect(
        notifications(page).filter({ hasText: "Certains articles sont incomplets" }),
        "Un message doit expliquer pourquoi la facture n'est pas créée",
      ).toBeVisible();
      await expect(page).toHaveURL(/\/factures\/new/);
    }, { capture: "ecran" });
  });

  test("TVA à 0 % sans mention d'exonération : refusée", async ({ page }) => {
    const nom = "Formation sans mention (cas erreur TVA)";
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { nom, quantite: 1, prix: 500, tva: /^0%/ });
    await etape(page, "Enregistrer le brouillon", async () => {
      await enregistrerBrouillon(page);
      await expect(notifications(page).filter({ hasText: "La facture n'a pas pu être enregistrée" })).toContainText("texte d'exonération de TVA requis");
    }, { capture: "ecran" });
    await aucuneFacture(nom);
  });

  test("Remise globale de 150 % : refusée", async ({ page }) => {
    const nom = "Prestation (cas erreur remise)";
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { nom, quantite: 1, prix: 500 });
    await remiseGlobale(page, { valeur: 150 });
    // Message sous le champ, dès la saisie.
    await expect(page.getByText("La remise ne peut pas dépasser 100%")).toBeVisible();
    await etape(page, "Créer la facture", async () => {
      await creerFacture(page);
      await expect(page).toHaveURL(/\/factures\/new/);
    }, { capture: "ecran" });
    await aucuneFacture(nom);
  });

  test("Nom d'article avec « € » : refusé avec une explication", async ({ page }) => {
    const nom = "Forfait 100 € (cas erreur caractère)";
    await jusquAuxArticles(page);
    await ajouterArticle(page, 1, { nom, quantite: 1, prix: 100 });
    await etape(page, "Créer la facture", async () => {
      await creerFacture(page);
      await expect(
        notifications(page).or(page.getByText(/caractère|invalide|non autorisé/i)).first(),
        "Un message doit expliquer le refus",
      ).toBeVisible();
    }, { capture: "page" });
    await aucuneFacture(nom);
  });
});
