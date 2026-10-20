/**
 * Recherche globale (Ctrl+K, ou « Recherche » dans la barre latérale) :
 * résultats de l'espace actif seulement, numéro de facture écrit comme
 * ailleurs (préfixe, tiret, numéro) et retrouvable tel quel, texte piégé
 * affiché comme du texte, actions de création réservées aux rôles qui créent.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_INTRUS, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { CONTACTS_PILOTAGE, FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";

const F = FACTURES_PILOTAGE.aEncaisser;
const REFERENCE = `${F.prefix}-${F.number}`;
const fenetreRecherche = (page) => page.getByRole("dialog").filter({ has: page.getByPlaceholder("Rechercher ou aller à...") });

async function ouvrirRecherche(page) {
  await ouvrir(page, "/dashboard");
  await page.keyboard.press("Control+k");
  await expect(page.getByPlaceholder("Rechercher ou aller à...")).toBeVisible();
}

async function rechercher(page, texte) {
  await page.getByPlaceholder("Rechercher ou aller à...").fill(texte);
  await expect(fenetreRecherche(page).getByText("Recherche...")).toHaveCount(0, { timeout: 15_000 });
  await page.waitForTimeout(800);
}

const groupe = (page, titre) => fenetreRecherche(page).locator("[cmdk-group]").filter({ has: page.locator("[cmdk-group-heading]", { hasText: titre }) });

test.describe("Recherche globale (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("« Recherche » de la barre latérale ouvre la recherche", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await cliquer(page, page.locator("[data-slot=sidebar]").getByRole("link", { name: "Recherche" }));
    await expect(page.getByPlaceholder("Rechercher ou aller à...")).toBeVisible();
  });

  test("Un client trouvé par son nom, sans accents ni majuscules ; le choisir ouvre sa fiche", async ({ page }) => {
    await ouvrirRecherche(page);
    await rechercher(page, "societe pilote");
    const client = groupe(page, "Clients").getByRole("option", { name: new RegExp(CONTACTS_PILOTAGE.pilote.name) });
    await expect(client).toBeVisible();
    await client.click();
    await expect(page).toHaveURL(/\/dashboard\/clients\?id=/, { timeout: 30_000 });
  });

  test("Une facture trouvée par son numéro s'affiche avec son numéro complet (préfixe, tiret, numéro)", async ({ page }) => {
    await ouvrirRecherche(page);
    await rechercher(page, F.number);
    const factures = groupe(page, "Factures");
    await expect(factures).toBeVisible();
    await etape(page, "Numéro affiché", async () => expect(factures, `Attendu « ${REFERENCE} » (affiché collé : « ${F.prefix}${F.number} »)`).toContainText(REFERENCE), { capture: "ecran" });
  });

  test("Une facture retrouvée par son numéro complet, tel que la liste des factures l'affiche", async ({ page }) => {
    await ouvrirRecherche(page);
    await rechercher(page, REFERENCE);
    await etape(page, `Recherche de « ${REFERENCE} »`, async () => expect(groupe(page, "Factures"), `Aucun résultat pour « ${REFERENCE} »`).toBeVisible({ timeout: 5_000 }), { capture: "ecran" });
  });

  test("Nom de client piégé : affiché comme du texte dans les résultats, rien ne s'exécute", async ({ page }) => {
    await ouvrirRecherche(page);
    await rechercher(page, "Piège");
    await expect(fenetreRecherche(page).getByText(/Piège <img/).first()).toBeVisible();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code du nom de client s'est exécuté").toBeNull();
  });

  test("Sans saisie : actions rapides de création proposées au propriétaire", async ({ page }) => {
    await ouvrirRecherche(page);
    await expect(groupe(page, "Actions rapides")).toContainText("Nouvelle facture");
  });
});

test.describe("Recherche globale (Membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });

  test("Aucune action de création proposée", async ({ page }) => {
    await ouvrirRecherche(page);
    await expect(groupe(page, "Actions rapides")).toHaveCount(0);
    await expect(fenetreRecherche(page).getByRole("option", { name: /^Nouvelle facture$|^Nouveau devis$/ })).toHaveCount(0);
  });
});

test.describe("Recherche globale (autre entreprise)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  test("Ne trouve aucun client ni aucune facture de « Pilotage »", async ({ page }) => {
    await ouvrirRecherche(page);
    for (const texte of ["Pilote", F.number, "Piège"]) {
      await rechercher(page, texte);
      await expect.soft(fenetreRecherche(page), `« ${texte} » : résultat de « Pilotage »`).not.toContainText(CONTACTS_PILOTAGE.pilote.name);
      await expect.soft(fenetreRecherche(page), `« ${texte} »`).not.toContainText(`${F.prefix}`);
    }
  });
});
