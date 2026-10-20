/**
 * Changement d'espace depuis l'en-tête (Éditeur de « Pilotage », super admin
 * de « Studio Invitable ») : depuis une page de détail, retour arrière, et
 * second onglet ouvert. Rien ne doit afficher « Erreur de chargement » ni
 * « Ressource introuvable » (incident du 08/10/2026). La session est remise
 * sur « Pilotage » à la fin de chaque test.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendrePagePrete } from "../navigation.mjs";
import { base } from "../base.mjs";
import { id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE_EDITEUR } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { ESPACES_LIBRES, FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { remettreEspace } from "../gestionnaire/outils-gestionnaire.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_EDITEUR) });
test.afterEach(async () => {
  await remettreEspace(SESSION_TOKEN_PILOTAGE_EDITEUR, COMPTES.pilotage.organisation._id);
});

const STUDIO = ESPACES_LIBRES.studio.name;
const ERREURS_AFFICHEES = /Erreur de chargement|Ressource introuvable|Une erreur est survenue/;

const selecteur = (page) => page.locator("main > header").first().locator("button:has(svg.lucide-boxes)");

async function changerPour(page, nom) {
  await selecteur(page).click();
  await page.getByRole("menuitem", { name: new RegExp(`^${nom}`) }).click();
}

async function aucuneErreur(page, contexte) {
  await page.waitForTimeout(1_500);
  await expect(page.locator("body"), `${contexte} : erreur affichée`).not.toContainText(ERREURS_AFFICHEES);
}

test("Depuis la page d'une facture : arrivée sur la liste des factures du nouvel espace, sans erreur", async ({ page }) => {
  await ouvrir(page, `/dashboard/outils/factures/${id(FACTURES_PILOTAGE.aEncaisser)}`);
  await changerPour(page, STUDIO);
  await expect(page).toHaveURL(/\/dashboard\/outils\/factures$/, { timeout: 30_000 });
  await attendrePagePrete(page);
  await etape(
    page,
    "Nouvel espace",
    async () => {
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: `Vous êtes sur l'espace ${STUDIO}` })).toBeVisible();
      await aucuneErreur(page, "Liste des factures du nouvel espace");
      await expect(page.locator("main"), "Une facture de l'ancien espace est encore affichée").not.toContainText(`${FACTURES_PILOTAGE.aEncaisser.prefix}-${FACTURES_PILOTAGE.aEncaisser.number}`);
    },
    { capture: "ecran" },
  );
  const session = await (await base()).collection("session").findOne({ token: SESSION_TOKEN_PILOTAGE_EDITEUR });
  expect(session.activeOrganizationId).toBe(id(ESPACES_LIBRES.studio));
});

test("Retour arrière après un changement d'espace : pas d'erreur", async ({ page }) => {
  await ouvrir(page, "/dashboard/outils/devis");
  await ouvrir(page, `/dashboard/outils/factures/${id(FACTURES_PILOTAGE.aEncaisser)}`);
  await changerPour(page, STUDIO);
  await expect(page).toHaveURL(/\/dashboard\/outils\/factures$/, { timeout: 30_000 });
  await attendrePagePrete(page);
  await page.goBack();
  await attendrePagePrete(page);
  await etape(page, `Retour sur ${new URL(page.url()).pathname}`, () => aucuneErreur(page, "Page précédente"), { capture: "ecran" });
});

test("Second onglet ouvert : il suit le changement d'espace, sans erreur", async ({ page, context }) => {
  await ouvrir(page, "/dashboard/outils/factures");
  const autre = await context.newPage();
  await ouvrir(autre, "/dashboard/outils/devis");
  await page.bringToFront();
  await changerPour(page, STUDIO);
  await expect(page).toHaveURL(/\/dashboard\/outils\/factures$/, { timeout: 30_000 });
  await autre.bringToFront();
  await expect(selecteur(autre), "L'autre onglet affiche encore l'ancien espace").toContainText(STUDIO, { timeout: 30_000 });
  await etape(autre, "Second onglet", () => aucuneErreur(autre, "Second onglet"), { capture: "ecran" });
  await autre.close();
});
