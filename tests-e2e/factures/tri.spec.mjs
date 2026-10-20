/**
 * Tri de la liste des factures par les en-têtes de colonnes (organisation
 * « Factures ») : ordre obtenu, et en-têtes utilisables au clavier.
 */
import { test, expect } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_FACTURES } from "../config.mjs";
import { ouvrirListe } from "./pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

const montant = (t) => Number(t.replace(/[^\d,-]/g, "").replace(",", "."));

/** Valeurs d'une colonne, dans l'ordre affiché (repérée par son en-tête). */
async function colonne(page, titre) {
  const entetes = await page.getByRole("columnheader").allInnerTexts();
  const i = entetes.findIndex((t) => t.trim().startsWith(titre));
  expect(i, `Colonne « ${titre} » introuvable (${entetes.join(" | ")})`).toBeGreaterThanOrEqual(0);
  const lignes = page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Sélectionner la ligne" }) });
  // En-tête et corps sont deux tableaux : une colonne technique peut décaler les cellules du corps.
  const decalage = Math.max(0, (await lignes.first().getByRole("cell").count()) - entetes.length);
  const valeurs = [];
  for (const l of await lignes.all()) valeurs.push(((await l.getByRole("cell").nth(i + decalage).innerText().catch(() => "")) || "").trim());
  return valeurs;
}

async function trierPar(page, titre) {
  await page.getByRole("columnheader").filter({ hasText: titre }).getByText(titre, { exact: true }).click();
  await attendreCalme(page);
}

test.describe("Factures : tri", () => {
  test("Tri par montant TTC : croissant, puis décroissant", async ({ page }) => {
    await ouvrirListe(page);
    await trierPar(page, "Montant TTC");
    const croissant = (await colonne(page, "Montant TTC")).map(montant).filter((n) => !Number.isNaN(n));
    expect(croissant.length).toBeGreaterThan(5);
    expect(croissant, "Montants dans l'ordre croissant").toEqual([...croissant].sort((a, b) => a - b));
    await trierPar(page, "Montant TTC");
    const decroissant = (await colonne(page, "Montant TTC")).map(montant).filter((n) => !Number.isNaN(n));
    expect(decroissant, "Montants hors d'ordre décroissant (les factures importées, montant lu ailleurs, restent en tête)").toEqual([...decroissant].sort((a, b) => b - a));
  });

  test("Tri par client : ordre alphabétique", async ({ page }) => {
    await ouvrirListe(page);
    await trierPar(page, "Client");
    const noms = (await colonne(page, "Client")).map((t) => t.split("\n")[0].trim()).filter(Boolean);
    const attendu = [...noms].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    expect(noms.map((n) => n.toLowerCase()), "Clients hors de l'ordre alphabétique (un « à » est classé après les lettres sans accent)").toEqual(attendu.map((n) => n.toLowerCase()));
  });

  test("Les en-têtes de tri s'utilisent au clavier (boutons)", async ({ page }) => {
    await ouvrirListe(page);
    for (const titre of ["Client", "Montant TTC", "Date d'émission"]) {
      const entete = page.getByRole("columnheader").filter({ hasText: titre }).first();
      await expect(entete.getByRole("button"), `Tri par « ${titre} » : simple zone cliquable, inaccessible au clavier et aux lecteurs d'écran`).toHaveCount(1);
    }
  });
});
