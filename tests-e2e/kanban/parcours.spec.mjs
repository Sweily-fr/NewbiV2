/**
 * Kanban : parcours vérifiés en base. Création d'un tableau par la page
 * dédiée (/new) et par la fenêtre « Nouvelle liste », chacun avec son propre
 * titre pour ne dépendre d'aucun autre test.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_COLLAB } from "../config.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

const COLLAB = COMPTES.collab.organisation._id;
const boardParTitre = async (titre) => (await base()).collection("boards").findOne({ workspaceId: COLLAB, title: titre });

test.describe("Kanban : création d'un tableau", () => {
  test("Page « Créer un nouveau tableau » : enregistré et ouvert", async ({ page }) => {
    const titre = "Parcours création page dédiée";
    await ouvrir(page, "/dashboard/outils/kanban/new", { pret: page.getByRole("heading", { name: "Créer un nouveau tableau" }) });
    await page.getByPlaceholder("Ex: Projet Marketing Q1").fill(titre);
    await etape(
      page,
      "Créer le tableau",
      async () => {
        await cliquer(page, page.getByRole("button", { name: "Créer le tableau" }));
        await expect(page).toHaveURL(/\/dashboard\/outils\/kanban\/[0-9a-f]{24}$/, { timeout: 30_000 });
      },
      { capture: "ecran" },
    );
    await etape(page, "Le tableau est en base avec ses colonnes par défaut", async () => {
      const board = await boardParTitre(titre);
      expect(board, "Le tableau n'a pas été enregistré").not.toBeNull();
      const colonnes = await (await base()).collection("columns").find({ boardId: board._id }).toArray();
      expect(colonnes.length, "Les colonnes par défaut n'ont pas été créées").toBeGreaterThan(0);
    });
  });

  test("Fenêtre « Nouvelle liste » : enregistrée avec sa catégorie", async ({ page }) => {
    const titre = "Parcours création fenêtre";
    await ouvrir(page, "/dashboard/outils/kanban", { pret: page.getByRole("button", { name: "Nouvelle liste" }).first() });
    await cliquer(page, page.getByRole("button", { name: "Nouvelle liste" }).first());
    const fenetre = page.getByRole("dialog").filter({ has: page.getByText("Nouvelle liste", { exact: true }) });
    await expect(fenetre).toBeVisible();
    await fenetre.getByPlaceholder("Nom de la liste").fill(titre);
    await fenetre.getByPlaceholder("Ex : Design...").fill("Marketing");
    await attendreCalme(page);
    await etape(
      page,
      "Créer la liste",
      async () => {
        await fenetre.getByRole("button", { name: /Créer la liste/ }).click();
        await expect(fenetre).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await etape(page, "Le tableau est en base avec sa catégorie", async () => {
      const board = await expect.poll(() => boardParTitre(titre), { timeout: 10_000 }).not.toBeNull().catch(() => null);
      const doc = await boardParTitre(titre);
      expect(doc, "Le tableau n'a pas été enregistré").not.toBeNull();
      expect(doc.category, "La catégorie n'a pas été enregistrée").toBe("Marketing");
    });
  });
});
