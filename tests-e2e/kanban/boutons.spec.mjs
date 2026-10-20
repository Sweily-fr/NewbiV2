/**
 * Kanban : les boutons selon le rôle, là où le site les montre ou les cache.
 * La page d'un tableau porte des fenêtres sans nom et un compteur de présence
 * qui varie ; plutôt qu'une énumération exacte (fragile), ces tests vérifient
 * l'essentiel : ce que chaque rôle peut faire (créer, exporter, partager,
 * ajouter une colonne, supprimer) est visible pour qui en a le droit, caché
 * pour les autres. L'API, elle, est contrôlée dans securite.spec.mjs.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";

import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { TABLEAUX } from "../donnees/lot-collaboration.mjs";

const APOLLO = /go\.apollo\.dev\/c\/err|An error occurred! For more details/;
const id = (doc) => doc._id.toHexString();

const ouvrirListe = (page) => ouvrir(page, "/dashboard/outils/kanban", { pret: page.getByRole("button", { name: "Vue grille" }) });
const ouvrirTableau = (page) =>
  ouvrir(page, `/dashboard/outils/kanban/${id(TABLEAUX.lecture)}`, { pret: page.getByRole("tab", { name: "List" }) });
const ouvrirNouveau = (page) => ouvrir(page, "/dashboard/outils/kanban/new", { pret: page.getByRole("heading", { name: "Créer un nouveau tableau" }) });

/* --- Barre d'outils de la liste des tableaux : boutons communs décrits ----- */


/* --- Tests de visibilité par rôle (liste et page d'un tableau) ------------- */

test.describe("Kanban (liste) : le propriétaire voit créer, exporter, supprimer", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: APOLLO });
  test("Barre d'outils complète", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("button", { name: "Nouvelle liste" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exporter" })).toBeVisible();
  });
  test("Le menu d'une ligne propose Modifier et Supprimer", async ({ page }) => {
    await ouvrirListe(page);
    await page.locator("tbody tr button:has(svg.lucide-ellipsis)").first().click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Modifier" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Supprimer" })).toBeVisible();
  });
});

test.describe("Kanban (liste) : l'Éditeur crée et exporte, sans supprimer", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR), erreursConsoleAutorisees: APOLLO });
  test("Barre d'outils avec création et export", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("button", { name: "Nouvelle liste" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exporter" })).toBeVisible();
  });
  test("Le menu d'une ligne propose Modifier mais pas Supprimer", async ({ page }) => {
    await ouvrirListe(page);
    await page.locator("tbody tr button:has(svg.lucide-ellipsis)").first().click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Modifier" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Supprimer" })).toHaveCount(0);
  });
});

test.describe("Kanban (liste) : le Membre ne voit ni créer, ni exporter, ni supprimer", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE), erreursConsoleAutorisees: APOLLO });
  test("Pas de création ni d'export", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("button", { name: "Nouvelle liste" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Exporter" })).toHaveCount(0);
  });
});

test.describe("Kanban (tableau) : partage et colonnes selon le rôle", () => {
  for (const [role, token, peut] of [
    ["propriétaire", SESSION_TOKEN_COLLAB, true],
    ["éditeur", SESSION_TOKEN_COLLAB_EDITEUR, true],
    ["membre", SESSION_TOKEN_COLLAB_MEMBRE, false],
  ]) {
    test.describe(`Rôle ${role}`, () => {
      test.use({ storageState: connecte(token), erreursConsoleAutorisees: APOLLO });
      test(`Partager et « Ajouter une colonne » : ${peut ? "visibles" : "cachés"}`, async ({ page }) => {
        await ouvrirTableau(page);
        const partager = page.getByRole("button", { name: "Partager" });
        const colonne = page.getByRole("button", { name: "Ajouter une colonne" }).first();
        if (peut) {
          await expect(partager).toBeVisible();
          await expect(colonne).toBeVisible();
        } else {
          await expect(partager).toHaveCount(0);
          await expect(colonne).toHaveCount(0);
        }
      });
    });
  }
});

test.describe("Kanban (nouveau tableau) : création", () => {
  test.describe("Propriétaire", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: APOLLO });
    test("« Créer le tableau » présent, grisé tant que le titre est vide", async ({ page }) => {
      await ouvrirNouveau(page);
      const bouton = page.getByRole("button", { name: "Créer le tableau" });
      await expect(bouton).toBeVisible();
      await expect(bouton).toBeDisabled();
      await page.getByPlaceholder("Ex: Projet Marketing Q1").fill("Un titre");
      await expect(bouton).toBeEnabled();
    });
  });
  test.describe("Membre", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE), erreursConsoleAutorisees: APOLLO });
    test("« Créer le tableau » absent pour un rôle sans création", async ({ page }) => {
      await ouvrirNouveau(page);
      await expect(page.getByRole("button", { name: "Créer le tableau" })).toHaveCount(0);
    });
  });
});

/* --- Comportement de chaque bouton de la barre d'outils (propriétaire) ----- */

test.describe("Kanban (liste) : chaque bouton de la barre d'outils agit", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: APOLLO });

  test("« Nouvelle liste » ouvre la fenêtre de création", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Nouvelle liste" }).first().click();
    await expect(page.getByRole("dialog").filter({ has: page.getByText("Nouvelle liste", { exact: true }) })).toBeVisible();
  });

  test("« Exporter » télécharge un CSV (contenant les tableaux) puis un Excel", async ({ page }) => {
    await ouvrirListe(page);
    for (const [item, motif] of [["CSV (.csv)", /\.csv$/], ["Excel (.xlsx)", /\.xlsx$/]]) {
      await page.getByRole("button", { name: "Exporter" }).click();
      const [fichier] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("menuitem", { name: item }).click(),
      ]);
      expect(fichier.suggestedFilename()).toMatch(motif);
      if (item.includes("csv")) {
        const flux = await fichier.createReadStream();
        const morceaux = [];
        for await (const m of flux) morceaux.push(m);
        const texte = Buffer.concat(morceaux).toString("utf8");
        expect(texte, "Le CSV exporté ne contient pas les tableaux").toContain(TABLEAUX.lecture.title);
      }
    }
  });

  test("« Filtres » propose « Favoris uniquement »", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await expect(page.getByRole("menu").getByText("Favoris uniquement")).toBeVisible();
  });

  test("« Vue grille » puis « Vue tableau » changent l'affichage sans erreur", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Vue grille" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Vue tableau" }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("La taille de page propose 10 à 50", async ({ page }) => {
    await ouvrirListe(page);
    await page.locator("main").getByRole("combobox").last().click();
    for (const n of ["10", "20", "30", "40", "50"]) {
      await expect(page.getByRole("option", { name: n, exact: true })).toBeVisible();
    }
  });
});
