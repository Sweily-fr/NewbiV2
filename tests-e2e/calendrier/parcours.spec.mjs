/**
 * Calendrier : parcours vérifiés en base. Création, modification et
 * suppression d'un événement par le propriétaire, chacun sur sa propre donnée.
 * Plus la validation du titre (obligatoire, texte piégé refusé par le site).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_COLLAB } from "../config.mjs";
import { EVENEMENTS } from "../donnees/lot-collaboration.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

const COLLAB = COMPTES.collab.organisation._id;
const events = () => base().then((db) => db.collection("events"));
const parTitre = async (titre) => (await events()).findOne({ workspaceId: COLLAB, title: titre });

async function ouvrirNouvelEvenement(page) {
  await ouvrir(page, "/dashboard/calendar", { pret: page.getByRole("button", { name: "Nouvel événement" }) });
  await cliquer(page, page.getByRole("button", { name: "Nouvel événement" }));
  const panneau = page.getByRole("dialog").filter({ hasText: "Nouvel événement" });
  await expect(panneau).toBeVisible();
  await attendreCalme(page);
  return panneau;
}

test.describe("Calendrier : création d'un événement", () => {
  test("Un événement avec titre est enregistré", async ({ page }) => {
    const titre = "Point hebdomadaire œuvre à livrer";
    const panneau = await ouvrirNouvelEvenement(page);
    await panneau.getByPlaceholder("Titre de l'événement").fill(titre);
    await etape(
      page,
      "Créer l'événement",
      async () => {
        await panneau.getByRole("button", { name: "Créer" }).click();
        await expect(panneau).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await etape(page, "L'événement est en base, titre intact", async () => {
      await expect.poll(() => parTitre(titre), { timeout: 10_000 }).not.toBeNull();
      const doc = await parTitre(titre);
      expect(doc.title, "Le titre a été altéré").toBe(titre);
    });
  });

  test("Sans titre : refusé avec un message, rien enregistré", async ({ page }) => {
    const panneau = await ouvrirNouvelEvenement(page);
    await panneau.getByRole("button", { name: "Créer" }).click();
    await etape(
      page,
      "Un message signale le titre manquant",
      async () => {
        await expect(panneau.getByText("Le titre est requis")).toBeVisible();
        await expect(panneau).toBeVisible();
      },
      { capture: "ecran" },
    );
  });

  test("Un titre piégé est refusé par le site", async ({ page }) => {
    const panneau = await ouvrirNouvelEvenement(page);
    await panneau.getByPlaceholder("Titre de l'événement").fill(`<script>alert(1)</script>`);
    await panneau.getByRole("button", { name: "Créer" }).click();
    await etape(
      page,
      "Caractères non autorisés signalés, rien enregistré",
      async () => {
        await expect(panneau.getByText(/Caractères non autorisés/)).toBeVisible();
        expect(await (await events()).findOne({ workspaceId: COLLAB, title: { $regex: "script" } }), "Un titre piégé a été enregistré").toBeNull();
      },
      { capture: "ecran" },
    );
  });
});

test.describe("Calendrier : modification et suppression", () => {
  test("Modifier le titre d'un événement", async ({ page }) => {
    const nouveau = "Réunion décalée à 15 h";
    await ouvrir(page, "/dashboard/calendar", { pret: page.getByRole("button", { name: new RegExp(EVENEMENTS.modifier.title) }) });
    await page.getByRole("button", { name: new RegExp(EVENEMENTS.modifier.title) }).first().click();
    const panneau = page.getByRole("dialog").filter({ hasText: "Modifier l'événement" });
    await expect(panneau).toBeVisible();
    await panneau.getByPlaceholder("Titre de l'événement").fill(nouveau);
    await etape(
      page,
      "Enregistrer",
      async () => {
        await panneau.getByRole("button", { name: "Enregistrer" }).click();
        await expect(panneau).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await expect.poll(async () => (await (await events()).findOne({ _id: EVENEMENTS.modifier._id }))?.title, { timeout: 10_000 }).toBe(nouveau);
  });

  test("Supprimer un événement", async ({ page }) => {
    await ouvrir(page, "/dashboard/calendar", { pret: page.getByRole("button", { name: new RegExp(EVENEMENTS.supprimer.title) }) });
    await page.getByRole("button", { name: new RegExp(EVENEMENTS.supprimer.title) }).first().click();
    const panneau = page.getByRole("dialog").filter({ hasText: "Modifier l'événement" });
    await expect(panneau).toBeVisible();
    await etape(
      page,
      "Supprimer depuis le panneau",
      async () => {
        await panneau.getByRole("button", { name: "Supprimer" }).first().click();
        await expect(panneau).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await expect.poll(() => (events()).then((c) => c.findOne({ _id: EVENEMENTS.supprimer._id })), { timeout: 10_000 }).toBeNull();
  });
});
