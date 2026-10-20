/**
 * Catalogue : tous les boutons de la page, pour le propriétaire, l'Éditeur
 * et le Membre de l'organisation « Achats » (jamais modifiée). Chaque
 * élément est essayé sur une page neuve avec son effet attendu ; un élément
 * sans description fait échouer « Chaque élément de la page est décrit et
 * testé ». Les actions qui modifient dès le clic renvoient à leur parcours.
 */
import { test, expect, fenetre } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { verifierBoutons } from "../exploration.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { PRODUITS } from "../donnees/lot-achats-banque.mjs";
import { connecteAchats } from "../achats-banque.mjs";

const ouvrirCatalogue = (page) => ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("row").filter({ hasText: PRODUITS.audit.name }) });

const RECHERCHE_EXACTE = { "button Respecter les majuscules et les accents": { etat: /\[pressed\]/ } };
const FILTRES = {
  "button Filtres": { menu: ["Effacer tous les filtres", "Filtrer par catégorie", "Colonnes visibles 6"] },
  "button Filtres > Effacer tous les filtres": { sansEffet: "aucun filtre n'est actif" },
  // Sous-menus de cases à cocher (pas d'éléments de menu) : voir liste.spec.mjs pour leur effet.
  "button Filtres > Filtrer par catégorie": { menu: [] },
  "button Filtres > Colonnes visibles 6": { menu: [] },
};
const PAGINATION = {
  "button Première page": { desactive: "première page affichée" },
  "button Page précédente": { desactive: "première page affichée" },
  "button Page suivante": { contenu: true },
  "button Dernière page": { contenu: true },
  "combobox icône chevron-down": { options: ["10", "20", "30", "40", "50"] },
};
const EXPORT = {
  "button Exporter": { menu: ["CSV", "Excel"] },
  "button Exporter > CSV": { fenetre: "Exporter en CSV" },
  "button Exporter > Excel": { fenetre: "Exporter en Excel" },
};
const SELECTION = {
  "checkbox Select all": { etat: /\[checked\]/ },
  "checkbox Select row": { etat: /\[checked\]/ },
};

test.describe("Catalogue (propriétaire)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  verifierBoutons({
    test,
    titre: "Catalogue",
    ouvrir: ouvrirCatalogue,
    boutons: {
      "button Champs": { fenetre: "Champs personnalisés produits" },
      "button Importer": { fenetre: "Importer des produits" },
      ...EXPORT,
      "button Ajouter un produit": { fenetre: "Ajouter un produit et/ou service" },
      ...RECHERCHE_EXACTE,
      ...FILTRES,
      "button Actions du produit": { menu: ["Modifier", "Copier référence", "Supprimer"] },
      "button Actions du produit > Modifier": { fenetre: "Modifier le produit et/ou service" },
      // Copier ne confirme rien aujourd'hui (les transactions affichent « Description copiée ») :
      // attendu, une confirmation. Le contenu copié est vérifié dans liste.spec.mjs.
      "button Actions du produit > Copier référence": { notification: /copi/i },
      "button Actions du produit > Supprimer": { fenetre: "Confirmer la suppression" },
      ...PAGINATION,
      ...SELECTION,
    },
  });

  test.describe("Panneau des champs personnalisés", () => {
    test("Création, modification et suppression proposées pour chaque champ", async ({ page }) => {
      await ouvrirCatalogue(page);
      await page.getByRole("button", { name: "Champs" }).click();
      const panneau = fenetre(page, "Champs personnalisés produits");
      await expect(panneau.getByRole("button", { name: "Nouveau champ" })).toBeEnabled();
      await expect(panneau.locator("button:has(svg.lucide-pen)")).toHaveCount(2);
      await expect(panneau.locator("button:has(svg.lucide-trash2)")).toHaveCount(2);
      await panneau.getByRole("button", { name: "Nouveau champ" }).click();
      await expect(fenetre(page, "Nouveau champ personnalisé")).toBeVisible();
    });
  });
});

test.describe("Catalogue (éditeur)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_EDITEUR_ACHATS) });

  verifierBoutons({
    test,
    titre: "Catalogue",
    ouvrir: ouvrirCatalogue,
    boutons: {
      "button Importer": { fenetre: "Importer des produits" },
      ...EXPORT,
      "button Ajouter un produit": { fenetre: "Ajouter un produit et/ou service" },
      ...RECHERCHE_EXACTE,
      ...FILTRES,
      "button Actions du produit": { menu: ["Modifier", "Copier référence"] },
      "button Actions du produit > Modifier": { fenetre: "Modifier le produit et/ou service" },
      "button Actions du produit > Copier référence": { parcours: "liste.spec.mjs : copier la référence" },
      ...PAGINATION,
      ...SELECTION,
    },
  });
});

test.describe("Catalogue (membre, lecture seule)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_LECTEUR_ACHATS) });

  verifierBoutons({
    test,
    titre: "Catalogue",
    ouvrir: ouvrirCatalogue,
    boutons: {
      ...RECHERCHE_EXACTE,
      ...FILTRES,
      "button Actions du produit": { menu: ["Copier référence"] },
      "button Actions du produit > Copier référence": { parcours: "liste.spec.mjs : copier la référence" },
      ...PAGINATION,
    },
  });

  test("Le Membre consulte la fiche d'un produit (produits liés, description) sans pouvoir la modifier", async ({ page }) => {
    await ouvrirCatalogue(page);
    // Aucun moyen d'ouvrir la fiche : le menu ne propose que « Copier référence ».
    await page.getByRole("row").filter({ hasText: PRODUITS.pose.name }).getByText(PRODUITS.pose.name, { exact: true }).click();
    await expect(
      page.getByRole("dialog").filter({ has: page.getByText(/Détails du produit/) }),
      "Le Membre ne peut pas consulter la fiche d'un produit (description complète, produits liés)",
    ).toBeVisible({ timeout: 5_000 });
  });
});
