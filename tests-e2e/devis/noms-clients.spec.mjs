/**
 * Devis : des clients aux noms réels. L'API valide le nom du client copié
 * dans chaque document avec des règles plus strictes que la fiche contact :
 * « œ », l'apostrophe typographique « ’ » (mise d'office par le Mac et
 * l'iPhone), « & » et les chiffres y sont refusés (validators.js NAME_REGEX,
 * schemas/address.js). Le devis d'un tel client ne peut alors ni être créé,
 * ni changer de statut, ni être converti. Un test par nom et par action.
 */
import { test, expect, etape } from "../outils.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CLIENTS_VENTES, DEVIS_VENTES as D } from "../donnees/lot-devis-bc-bl.mjs";
import { ajouterArticle, choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";
import { actionDeLigne, chercherEnBase, epingler, notification, relu } from "./ventes.mjs";

test.use({
  storageState: connecte(SESSION_TOKEN_VENTES),
  // Le refus de l'API est écrit dans la console par le site : c'est le défaut testé ici.
  erreursConsoleAutorisees: /Erreur lors du changement de statut|create delivery note failed|Erreur lors de la création|ApolloError|Le nom du client est invalide/,
});

test.describe("Devis : clients aux noms réels", () => {
  test("Accepter le devis de « Cœur d’Artichaut SAS » (« œ » et apostrophe typographique) : accepté", async ({ page }) => {
    const d = D.coeurAAccepter;
    await epingler(page, "devis", d);
    await etape(page, "Accepter le devis", async () => {
      await actionDeLigne(page, "devis", d, "Accepter le devis");
      await page.waitForTimeout(1_500);
    }, { capture: "ecran" });
    await relu("devis", d, (x) => x?.status, "Le devis n'a pas pu être accepté (nom du client refusé par l'API)").toBe("COMPLETED");
  });

  test("Bon de livraison depuis le devis de « Cœur d’Artichaut SAS » : créé", async ({ page }) => {
    const d = D.coeurALivrer;
    await epingler(page, "devis", d);
    await actionDeLigne(page, "devis", d, "Créer un bon de livraison");
    await expect(notification(page, "Bon de livraison créé à partir du devis"), "Le bon de livraison n'a pas été créé (nom du client refusé par l'API)").toBeVisible();
    expect(await chercherEnBase("deliverynotes", { sourceQuote: d._id }), "Bon de livraison en base").toHaveLength(1);
  });

  test("Accepter le devis de « Dupont & Fils » : accepté", async ({ page }) => {
    const d = D.dupontAAccepter;
    await epingler(page, "devis", d);
    await actionDeLigne(page, "devis", d, "Accepter le devis");
    await page.waitForTimeout(1_500);
    await relu("devis", d, (x) => x?.status, "Le devis n'a pas pu être accepté (« & » refusé dans le nom de l'adresse)").toBe("COMPLETED");
  });

  test("Nouveau devis pour « Cœur d’Artichaut SAS » : créé", async ({ page }) => {
    const nom = "Prestation pour Cœur (cas nom réel)";
    await ouvrirEditeur(page, "/dashboard/outils/devis/new");
    await choisirClient(page, CLIENTS_VENTES.coeur.name);
    await continuer(page);
    await ajouterArticle(page, 1, { nom, quantite: 1, prix: 250 });
    await etape(page, "Créer le devis", async () => {
      await page.getByRole("button", { name: "Créer le devis" }).click();
      await page.waitForTimeout(2_000);
    }, { capture: "ecran" });
    await expect
      .poll(async () => (await chercherEnBase("quotes", { workspaceId: COMPTES.ventes.organisation._id, "items.description": nom })).length, {
        message: "Le devis n'a pas été créé (nom du client refusé par l'API)",
        timeout: 10_000,
      })
      .toBe(1);
  });
});
