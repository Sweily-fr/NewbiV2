/**
 * Catalogue de créations commun aux éditeurs à prix (devis, bons de
 * commande) : pour chaque cas, ce que l'utilisateur saisit, la notification,
 * le retour à la liste et ce qui est enregistré en base. Les factures ont
 * leur propre catalogue (factures/creation.spec.mjs).
 */
import { test, expect, etape } from "./outils.mjs";
import { documentsAvecArticle } from "./base.mjs";
import { ajouterArticle, choisirClient, continuer, enregistrerBrouillon, notifications, ouvrirEditeur } from "./editeur.mjs";

export const ALPHA = "Entreprise Alpha SAS";
/** Article nommé de façon unique pour retrouver le document de son cas. */
export const article = (cas, nom, champs = {}) => ({ nom: `${nom} (cas ${cas})`, ...champs });

/**
 * Déclare un test par cas. `document` : { describe, editeur, liste, collection,
 * boutonCreer, messageCree }.
 */
export function catalogueDeCreation(document, cas) {
  test.describe(document.describe, () => {
    for (const c of cas) {
      test(c.titre, async ({ page }) => {
        const { numero, client, article: attenduArticle, ...attendu } = c.attendu;

        await etape(page, "Client et informations", async () => {
          await ouvrirEditeur(page, document.editeur);
          await choisirClient(page, c.client || ALPHA);
          if (c.avantContinuer) await c.avantContinuer(page);
          await continuer(page);
        }, { capture: "ecran" });

        await etape(page, "Articles", async () => {
          if (c.avantArticles) await c.avantArticles(page);
          for (const [i, a] of c.articles.entries()) await ajouterArticle(page, i + 1, a);
          if (c.avantCreation) await c.avantCreation(page);
        }, { capture: "ecran" });

        await etape(page, c.action === "brouillon" ? "Enregistrement du brouillon" : "Création", async () => {
          if (c.action === "brouillon") {
            await enregistrerBrouillon(page);
            await expect(notifications(page).filter({ hasText: "Brouillon sauvegardé" })).toBeVisible();
          } else {
            await page.getByRole("button", { name: document.boutonCreer }).click();
            await expect(notifications(page).filter({ hasText: document.messageCree })).toBeVisible();
          }
          await expect(page).toHaveURL(new RegExp(`${document.liste}(\\?|$)`));
        }, { capture: "ecran" });

        await etape(page, "Enregistrement en base", async () => {
          const docs = await documentsAvecArticle(document.collection, c.articles[0].nom);
          expect(docs, "Un et un seul document enregistré pour ce cas").toHaveLength(1);
          const [doc] = docs;
          expect.soft(doc, "Document enregistré").toMatchObject(attendu);
          expect.soft(doc.client, "Client du document").toMatchObject(client || { name: ALPHA });
          if (numero) expect.soft(String(doc.number), "Numéro").toMatch(numero);
          expect.soft(doc.items, "Articles").toHaveLength(c.articles.length);
          if (attenduArticle) expect.soft(doc.items[0], "Premier article").toMatchObject(attenduArticle);
          if (c.verifier) c.verifier(doc);
        });
      });
    }
  });
}
