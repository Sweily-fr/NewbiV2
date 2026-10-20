/**
 * Liste des devis : filtres (client, statut), colonnes, tri et lignes par
 * page, comparés à la base, organisation « Ventes ».
 */
import { test, expect, etape } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CLIENTS_VENTES, DEVIS_VENTES as D } from "../donnees/lot-devis-bc-bl.mjs";
import { chercherEnBase, ligneDe, ouvrirListe } from "./ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const ORG = COMPTES.ventes.organisation._id;
const lignesAffichees = (page) => page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Sélectionner la ligne" }) });

async function filtrer(page, sousMenu, choix) {
  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByRole("menuitem", { name: sousMenu }).click();
  await page.getByRole("menu").last().getByText(choix, { exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await attendreCalme(page);
}

async function cinquanteParPage(page) {
  await page.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "50" }).click();
  await attendreCalme(page);
}

test.describe("Devis : filtres et colonnes", () => {
  test("Filtrer par client « Hélène Martin » : tous ses devis, et rien d'autre", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await cinquanteParPage(page);
    await filtrer(page, "Filtrer par client", CLIENTS_VENTES.martin.name);
    const siens = await chercherEnBase("quotes", { workspaceId: ORG, "client.name": CLIENTS_VENTES.martin.name });
    await etape(page, "Résultat du filtre", async () => {
      await expect(lignesAffichees(page), "Une ligne par devis du client").toHaveCount(siens.length);
      await expect(ligneDe(page, "devis", D.accepte)).toHaveCount(1);
      await expect(ligneDe(page, "devis", D.enAttente), "Un devis d'un autre client est affiché").toHaveCount(0);
    }, { capture: "ecran" });
  });

  test("Filtrer par statut « Annulé » : seulement les devis annulés", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await cinquanteParPage(page);
    await filtrer(page, "Filtrer par statut", "Annulé");
    const annules = await chercherEnBase("quotes", { workspaceId: ORG, status: "CANCELED" });
    await expect(lignesAffichees(page)).toHaveCount(annules.length);
    await expect(ligneDe(page, "devis", D.refuse)).toHaveCount(1);
    await expect(ligneDe(page, "devis", D.enAttente)).toHaveCount(0);
  });

  test("Masquer la colonne « Référence »", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await expect(page.getByRole("columnheader", { name: /Référence/ })).toBeVisible();
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: /^Colonnes visibles/ }).click();
    await page.getByRole("menu").last().getByText(/^Référence$/).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("columnheader", { name: /Référence/ })).toHaveCount(0);
  });

  test("20 lignes par page : 20 devis affichés", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "20" }).click();
    await attendreCalme(page);
    const total = (await chercherEnBase("quotes", { workspaceId: ORG })).length;
    await expect(lignesAffichees(page)).toHaveCount(Math.min(20, total));
  });
});

test.describe("Devis : tri", () => {
  test("Clic sur l'en-tête « Client » : devis triés par client, de A à Z", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await page.getByRole("columnheader", { name: /Client/ }).getByText("Client").click();
    await attendreCalme(page);
    const noms = [...new Set((await chercherEnBase("quotes", { workspaceId: ORG })).map((d) => d.client.name))].sort((a, b) => a.localeCompare(b, "fr"));
    await expect(lignesAffichees(page).first(), "Premier devis après le tri").toContainText(noms[0]);
  });

  test("Le tri par colonne est utilisable au clavier (en-têtes en boutons)", async ({ page }) => {
    await ouvrirListe(page, "devis");
    const triables = page.getByRole("columnheader").getByRole("button", { name: /Client|Référence|Date|Montant/ });
    expect(await triables.count(), "Les en-têtes triables sont de simples zones cliquables, inaccessibles au clavier et aux lecteurs d'écran").toBeGreaterThan(0);
  });
});
