/**
 * Documents partagés : commandes selon le rôle, et création d'un dossier
 * (vérifiée en base ; l'envoi de fichiers passe par R2, absent en CI). La page
 * porte une arborescence de dossiers aux nombreux boutons sans nom : on teste
 * les commandes nommées et leur présence par rôle, pas une énumération exacte.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";

const COLLAB = COMPTES.collab.organisation._id;
const ouvrirDocs = (page) =>
  ouvrir(page, "/dashboard/outils/documents-partages", { pret: page.getByPlaceholder("Rechercher...") });
const boutonIcone = (page, icone) => page.locator(`main button:has(svg.lucide-${icone})`);

test.describe("Documents partagés (propriétaire) : les commandes agissent", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("« Ajouter » propose d'importer des fichiers ou un dossier", async ({ page }) => {
    await ouvrirDocs(page);
    await page.getByRole("button", { name: "Ajouter" }).first().click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Importer des fichiers" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Importer un dossier" })).toBeVisible();
  });

  test("Le bouton « Nouveau dossier » ouvre sa fenêtre", async ({ page }) => {
    await ouvrirDocs(page);
    await boutonIcone(page, "folder-plus").first().click();
    await expect(page.getByRole("dialog").filter({ hasText: "Nouveau dossier" })).toBeVisible();
  });

  test("Le bouton « Automatisations » ouvre la fenêtre des automatisations", async ({ page }) => {
    await ouvrirDocs(page);
    await boutonIcone(page, "zap").first().click();
    await expect(page.getByRole("dialog").filter({ hasText: "Automatisations" })).toBeVisible();
  });

  test("Le tri propose Nom, Date, Taille", async ({ page }) => {
    await ouvrirDocs(page);
    await boutonIcone(page, "arrow-up-down").first().click();
    const menu = page.getByRole("menu");
    for (const choix of ["Nom", "Date", "Taille"]) await expect(menu.getByRole("menuitem", { name: choix })).toBeVisible();
  });
});

test.describe("Documents partagés (éditeur) : peut ajouter", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR) });
  test("« Ajouter » et « Nouveau dossier » visibles", async ({ page }) => {
    await ouvrirDocs(page);
    await expect(page.getByRole("button", { name: "Ajouter" }).first()).toBeVisible();
    await expect(boutonIcone(page, "folder-plus").first()).toBeVisible();
  });
});

test.describe("Documents partagés (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test("Ni import, ni nouveau dossier, ni automatisations", async ({ page }) => {
    await ouvrirDocs(page);
    await expect(page.getByRole("button", { name: "Ajouter" })).toHaveCount(0);
    await expect(boutonIcone(page, "folder-plus")).toHaveCount(0);
    await expect(boutonIcone(page, "zap")).toHaveCount(0);
  });
});

test.describe("Documents partagés : création d'un dossier", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });
  test("Un dossier est créé et enregistré en base", async ({ page }) => {
    const nom = "Dossier parcours œuvre";
    await ouvrirDocs(page);
    await boutonIcone(page, "folder-plus").first().click();
    const fenetre = page.getByRole("dialog").filter({ hasText: "Nouveau dossier" });
    await expect(fenetre).toBeVisible();
    await fenetre.getByPlaceholder("Nom du dossier").fill(nom);
    await attendreCalme(page);
    await etape(
      page,
      "Créer le dossier",
      async () => {
        await fenetre.getByRole("button", { name: "Créer" }).click();
        await expect(fenetre).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await expect
      .poll(() => base().then((db) => db.collection("sharedfolders").findOne({ workspaceId: COLLAB, name: nom })), { timeout: 10_000 })
      .not.toBeNull();
  });
});
