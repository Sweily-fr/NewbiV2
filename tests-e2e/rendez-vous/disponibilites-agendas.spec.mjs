/**
 * Prise de rendez-vous, onglet Disponibilités, compte avec des agendas
 * Google et Outlook connectés (lot calendrier) : création de la page, puis
 * chaque réglage enregistré doit s'afficher sans recharger la page.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { AGENDA } from "../donnees/lot-calendrier.mjs";

const enregistrerBtn = (page) => page.getByRole("button", { name: "Enregistrer", exact: true });

async function enregistrer(page) {
  // Clic immédiat : le message « … enregistrées » du coup précédent, posé
  // sur le bouton, doit s'être retiré dès la nouvelle modification
  await cliquer(page, enregistrerBtn(page));
  await expect(enregistrerBtn(page)).toHaveCount(0, { timeout: 10_000 });
}

test.describe("Rendez-vous : Disponibilités avec agendas connectés", () => {
  test.use({ storageState: connecte(AGENDA.token) });

  test("Créer la page puis régler agendas, fuseau, exceptions ouvertes, jours fermés", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/rendez-vous");
    await cliquer(page, page.getByRole("button", { name: "Créer ma page" }));
    await expect(page.getByRole("tab", { name: /Disponibilités/ })).toBeVisible({ timeout: 30_000 });
    await cliquer(page, page.getByRole("tab", { name: /Disponibilités/ }));

    // Agendas lus : décocher le premier
    const cases = page.getByRole("checkbox");
    await expect(cases.first()).toBeChecked({ timeout: 30_000 });
    await cliquer(page, cases.first());
    await enregistrer(page);
    await expect(cases.first()).not.toBeChecked();

    // Le recocher (retour à « tous »)
    await cliquer(page, cases.first());
    await enregistrer(page);
    await expect(cases.first()).toBeChecked();

    // Agenda où écrire : le second choix
    await cliquer(page, page.getByRole("combobox").last());
    const choix = page.getByRole("option");
    const libelle = (await choix.nth(1).textContent()).trim();
    await cliquer(page, choix.nth(1));
    await enregistrer(page);
    await expect(page.getByRole("combobox").last()).toContainText(libelle);

    // Fuseau horaire
    await page.getByLabel("Fuseau horaire de la page").selectOption("America/New_York");
    await enregistrer(page);
    await expect(page.getByLabel("Fuseau horaire de la page")).toHaveValue("America/New_York");

    // Fermer le samedi
    const samedi = page.getByLabel("Samedi ouvert");
    const etaitOuvert = await samedi.isChecked();
    await cliquer(page, samedi);
    await enregistrer(page);
    await expect(samedi).toBeChecked({ checked: !etaitOuvert });

    // Exception avec horaires spéciaux
    await cliquer(page, page.getByRole("button", { name: "Ajouter une date" }));
    await cliquer(page, page.locator("[data-slot=popover-content] button[data-day]:not([disabled])").nth(4));
    await enregistrer(page);
    const special = page.getByRole("switch", { name: /horaires spéciaux/ });
    await cliquer(page, special);
    await enregistrer(page);
    await expect(special).toBeChecked();

    // Supprimer l'exception
    await cliquer(page, page.getByRole("button", { name: /Supprimer l'exception/ }));
    await enregistrer(page);
    await expect(page.getByText("Aucune exception.")).toBeVisible();

    // Témoin : même état après rechargement
    await page.reload();
    await cliquer(page, page.getByRole("tab", { name: /Disponibilités/ }));
    await expect(page.getByLabel("Fuseau horaire de la page")).toHaveValue("America/New_York", { timeout: 60_000 });
    await expect(page.getByRole("combobox").last()).toContainText(libelle);
    await expect(page.getByLabel("Samedi ouvert")).toBeChecked({ checked: !etaitOuvert });
  });
});
