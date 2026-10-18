/**
 * Erreurs de saisie communes aux éditeurs à prix (devis, bons de commande) :
 * l'utilisateur doit voir ce qui ne va pas, et rien ne doit être enregistré.
 * Les factures ont les leurs (factures/erreurs.spec.mjs).
 */
import { test, expect, etape } from "./outils.mjs";
import { documentsAvecArticle } from "./base.mjs";
import { ajouterArticle, choisirClient, continuer, enregistrerBrouillon, notifications, ouvrirEditeur, remiseGlobale } from "./editeur.mjs";
import { ALPHA } from "./creation.mjs";

/**
 * `document` : { describe, editeur, collection, boutonCreer, nom (« le devis »),
 * messageSansArticle, messageBrouillonRefuse }.
 */
export function erreursDeSaisie(document) {
  const creer = (page) => page.getByRole("button", { name: document.boutonCreer }).click();
  const resteSurLEditeur = (page) => expect(page).toHaveURL(new RegExp(`${document.editeur}$`));

  async function jusquAuxArticles(page) {
    await ouvrirEditeur(page, document.editeur);
    await choisirClient(page, ALPHA);
    await continuer(page);
  }
  async function rienEnBase(nomArticle) {
    expect(await documentsAvecArticle(document.collection, nomArticle), "Rien ne doit être enregistré").toHaveLength(0);
  }

  test.describe(document.describe, () => {
    test("Sans client : impossible de continuer, message clair", async ({ page }) => {
      await ouvrirEditeur(page, document.editeur);
      await etape(page, "Continuer sans client", async () => {
        await page.getByRole("button", { name: /Continuer/ }).click();
        await expect(notifications(page).filter({ hasText: "Veuillez sélectionner un client pour continuer" })).toBeVisible();
        await expect(page.getByText("Sélection d'un client").first()).toBeVisible();
      }, { capture: "ecran" });
    });

    test(`Sans article : un message explique pourquoi ${document.nom} n'est pas créé`, async ({ page }) => {
      await jusquAuxArticles(page);
      await etape(page, "Créer sans article", async () => {
        await creer(page);
        await expect(notifications(page).filter({ hasText: document.messageSansArticle }), "Message « au moins un article »").toBeVisible();
        await resteSurLEditeur(page);
      }, { capture: "ecran" });
    });

    test("Article sans nom : message « articles incomplets »", async ({ page }) => {
      await jusquAuxArticles(page);
      await ajouterArticle(page, 1, { quantite: 1, prix: 120 });
      await etape(page, "Créer", async () => {
        await creer(page);
        await expect(notifications(page).filter({ hasText: "Certains articles sont incomplets" })).toBeVisible();
        await resteSurLEditeur(page);
      }, { capture: "ecran" });
    });

    test("TVA à 0 % sans mention d'exonération : brouillon refusé", async ({ page }) => {
      const nom = `Formation sans mention (cas erreur TVA ${document.collection})`;
      await jusquAuxArticles(page);
      await ajouterArticle(page, 1, { nom, quantite: 1, prix: 500, tva: /^0%/ });
      await etape(page, "Enregistrer le brouillon", async () => {
        await enregistrerBrouillon(page);
        await expect(notifications(page).filter({ hasText: document.messageBrouillonRefuse })).toContainText("texte d'exonération de TVA requis");
      }, { capture: "ecran" });
      await rienEnBase(nom);
    });

    test("Remise globale de 150 % : refusée", async ({ page }) => {
      const nom = `Prestation (cas erreur remise ${document.collection})`;
      await jusquAuxArticles(page);
      await ajouterArticle(page, 1, { nom, quantite: 1, prix: 500 });
      await remiseGlobale(page, { valeur: 150 });
      await expect(page.getByText("La remise ne peut pas dépasser 100%")).toBeVisible();
      await etape(page, "Créer", async () => {
        await creer(page);
        await resteSurLEditeur(page);
      }, { capture: "ecran" });
      await rienEnBase(nom);
    });
  });
}
