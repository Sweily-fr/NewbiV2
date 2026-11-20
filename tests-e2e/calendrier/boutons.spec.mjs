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

  // Options secondaires regroupées dans le menu « … » de la barre d'outils
  const ouvrirOptions = (page) => cliquer(page, page.getByRole("button", { name: "Plus d'options" }));

  test("« … › Calendriers connectés » ouvre les calendriers externes", async ({ page }) => {
    await ouvrirCalendrier(page);
    await ouvrirOptions(page);
    await cliquer(page, page.getByRole("menuitem", { name: /Calendriers connectés/ }));
    await expect(page.getByText("Calendriers externes")).toBeVisible();
  });

  test("« … › Synchroniser maintenant » annonce le résultat sans erreur", async ({ page }) => {
    await ouvrirCalendrier(page);
    await ouvrirOptions(page);
    await cliquer(page, page.getByRole("menuitem", { name: "Synchroniser maintenant" }));
    await expect(page.locator("[data-sonner-toast]")).toContainText(/calendrier\(s\) synchronisé/);
  });

  test("« … › Étiquettes de couleur » et « Recevoir le calendrier ailleurs » s'ouvrent", async ({ page }) => {
    await ouvrirCalendrier(page);
    await ouvrirOptions(page);
    await cliquer(page, page.getByRole("menuitem", { name: "Étiquettes de couleur" }));
    await expect(page.getByRole("dialog", { name: "Étiquettes de couleur" })).toBeVisible();
    await page.keyboard.press("Escape");
    await ouvrirOptions(page);
    await cliquer(page, page.getByRole("menuitem", { name: "Recevoir le calendrier ailleurs" }));
    await expect(page.getByRole("dialog", { name: "Recevoir le calendrier ailleurs" })).toBeVisible();
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
    await cliquer(page, page.getByRole("button", { name: "Suivant" }));
    await cliquer(page, page.getByRole("button", { name: "Précédent" }));
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
    await cliquer(page, page.getByRole("button", { name: "Plus d'options" }));
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Synchroniser maintenant" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: /Calendriers connectés/ })).toHaveCount(0);
  });

  test("Les boutons de navigation restent disponibles", async ({ page }) => {
    await ouvrirCalendrier(page);
    await expect(page.getByRole("button", { name: "Mois" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Aujourd'hui" })).toBeVisible();
  });
});
