/**
 * Correspondance des catégories bancaires avec le plan comptable (PCG) :
 * nombre de correspondances, filtre de confiance et recherche comparés à la
 * table renvoyée par l'API ; libellés en français.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { appelApi } from "../securite.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE } from "../config.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

const RECHERCHE = "Rechercher par catégorie, compte PCG...";

async function ouvrirPcg(page) {
  await ouvrir(page, "/dashboard/analytics", { pret: page.getByPlaceholder(RECHERCHE) });
  const r = await appelApi(page, `query { pcgMappingTable { bridgeCategoryId bridgeLabel parentCategory pcgNumero pcgIntitule confidence } }`);
  expect(r.errors, "Table de correspondance de l'API").toEqual([]);
  return r.data.pcgMappingTable;
}

const compteur = (page) => page.getByText(/^\d+ correspondances? affichées?$/);

test("Toutes les correspondances de l'API sont affichées", async ({ page }) => {
  const table = await ouvrirPcg(page);
  await expect(compteur(page)).toHaveText(`${table.length} correspondance${table.length > 1 ? "s" : ""} affichée${table.length > 1 ? "s" : ""}`);
});

test("Filtre « Fiable » : seulement les correspondances fiables", async ({ page }) => {
  const table = await ouvrirPcg(page);
  const fiables = table.filter((e) => String(e.confidence).toLowerCase() === "high").length;
  await page.locator("main").getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "Fiable" }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await attendreCalme(page);
  await expect(compteur(page)).toHaveText(new RegExp(`^${fiables} correspondances? affichées?$`));
});

test("Recherche par numéro de compte : seules les lignes de ce compte restent", async ({ page }) => {
  const table = await ouvrirPcg(page);
  const numero = table.find((e) => e.pcgNumero)?.pcgNumero;
  await page.getByPlaceholder(RECHERCHE).fill(numero);
  await attendreCalme(page);
  const lignes = page.locator("main table tbody tr");
  expect(await lignes.count()).toBeGreaterThan(0);
  for (const texte of await lignes.allInnerTexts()) expect.soft(texte, `Ligne sans le compte ${numero}`).toContain(numero.slice(0, 3));
});

test("Les catégories du filtre sont en français", async ({ page }) => {
  await ouvrirPcg(page);
  await page.locator("main").getByRole("combobox").first().click();
  const options = (await page.getByRole("option").allInnerTexts()).map((t) => t.trim());
  const anglais = options.filter((o) => ["Incomes", "Misc.", "Home", "Shopping", "Health", "Bank", "Business", "Food", "Entertainment", "Bills", "Transfers", "Personal care"].includes(o));
  expect(anglais, "Catégories affichées en anglais dans l'interface française").toEqual([]);
});
