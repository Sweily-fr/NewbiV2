/**
 * Calendrier : les boutons de la barre d'outils, et ce que chaque rôle voit.
 * Les événements portent une heure dans leur nom (variable) : plutôt que de
 * les énumérer, on teste la barre d'outils et l'ouverture d'un événement.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { EVENEMENTS } from "../donnees/lot-collaboration.mjs";

const ouvrirCalendrier = (page) => ouvrir(page, "/dashboard/calendar", { pret: page.getByRole("button", { name: "Mois" }) });

test.describe("Calendrier (propriétaire) : la barre d'outils agit", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("« Nouvel événement » ouvre le panneau de création", async ({ page }) => {
    await ouvrirCalendrier(page);
    await cliquer(page, page.getByRole("button", { name: "Nouvel événement" }));
    await expect(page.getByRole("dialog").filter({ hasText: "Nouvel événement" })).toBeVisible();
  });

  test("« Calendriers » ouvre les calendriers externes", async ({ page }) => {
    await ouvrirCalendrier(page);
    await cliquer(page, page.getByRole("button", { name: "Calendriers" }));
    await expect(page.getByText("Calendriers externes")).toBeVisible();
  });

  test("« Synchroniser » annonce le résultat sans erreur", async ({ page }) => {
    await ouvrirCalendrier(page);
    await cliquer(page, page.getByRole("button", { name: "Synchroniser" }));
    await expect(page.locator("[data-sonner-toast]")).toContainText(/calendrier\(s\) synchronisé/);
  });

  test("« Mois » propose Mois, Semaine, Jour, Agenda", async ({ page }) => {
    await ouvrirCalendrier(page);
    await cliquer(page, page.getByRole("button", { name: "Mois" }).first());
    const menu = page.getByRole("menu");
    for (const vue of ["Mois", "Semaine", "Jour", "Agenda"]) {
      await expect(menu.getByRole("menuitem", { name: new RegExp(vue) })).toBeVisible();
    }
  });

  test("« Précédent », « Suivant » et « Aujourd'hui » naviguent sans erreur", async ({ page }) => {
    await ouvrirCalendrier(page);
    await cliquer(page, page.getByRole("button", { name: "Next" }));
    await cliquer(page, page.getByRole("button", { name: "Previous" }));
    await cliquer(page, page.getByRole("button", { name: "Aujourd'hui" }));
  });

  // Vue Agenda : les événements sont listés quel que soit le jour affiché.
  async function ouvrirAgenda(page) {
    await ouvrirCalendrier(page);
    await page.getByRole("button", { name: "Mois" }).first().click();
    await page.getByRole("menuitem", { name: /Agenda/ }).click();
    await attendreCalme(page);
  }

  test("Cliquer un événement interne ouvre sa modification", async ({ page }) => {
    await ouvrirAgenda(page);
    await page.getByText(EVENEMENTS.lecture.title, { exact: true }).first().click();
    await expect(page.getByRole("dialog").filter({ hasText: "Modifier l'événement" })).toBeVisible();
  });

  test("Un événement externe s'ouvre en lecture seule", async ({ page }) => {
    await ouvrirAgenda(page);
    // Le titre est suivi du badge « Google » dans le même élément : recherche sans « exact ».
    await page.getByText(EVENEMENTS.externe.title).first().click();
    await expect(page.getByRole("dialog").filter({ hasText: /Détails de l'événement/ })).toBeVisible();
  });
});

test.describe("Calendrier (membre, lecture seule) : consulter sans modifier", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });

  test("Ni création, ni synchronisation, ni calendriers externes", async ({ page }) => {
    await ouvrirCalendrier(page);
    await expect(page.getByRole("button", { name: "Nouvel événement" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Synchroniser" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Calendriers" })).toHaveCount(0);
  });

  test("Les boutons de navigation restent disponibles", async ({ page }) => {
    await ouvrirCalendrier(page);
    await expect(page.getByRole("button", { name: "Mois" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Aujourd'hui" })).toBeVisible();
  });
});
