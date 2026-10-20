/**
 * Pilotage > Analytiques : les indicateurs de chaque période (prédéfinie ou
 * personnalisée) comparés à ceux recalculés depuis la base (attendus.mjs).
 * Les documents de « Pilotage » couvrent le mois en cours, les mois
 * précédents et l'année précédente ; une facture est émise et payée un jour
 * précis, à midi, pour la période personnalisée d'un seul jour.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { bornes, entier, indicateurs, texteSimple } from "./attendus.mjs";

const W = COMPTES.pilotage.organisation._id;
const ANALYTIQUES = "/dashboard/outils/analytiques";

/** Valeur affichée d'un indicateur (« CA HT net » → « 6 869 »). */
export async function indicateur(page, libelle) {
  const valeur = page.getByText(libelle, { exact: true }).first().locator("xpath=../following-sibling::div[1]/span[1]");
  return texteSimple(await valeur.innerText({ timeout: 15_000 }));
}

export async function ouvrirAnalytiques(page) {
  await ouvrir(page, ANALYTIQUES, { pret: page.getByText("CA HT net", { exact: true }).first() });
}

/** Choisit une période prédéfinie dans le filtre de l'en-tête. */
export async function choisirPeriode(page, periode) {
  await page.locator("main").getByRole("button", { name: /Mois en cours|3 derniers mois|Année en cours|Année précédente|Période personnalisée|\d{4}/ }).first().click();
  const filtre = page.getByRole("dialog").last();
  await filtre.getByRole("button", { name: periode, exact: true }).click();
  await expect(filtre).toBeHidden();
  await attendreCalme(page);
}

/** Période personnalisée saisie dans les champs « Du » et « Au ». */
export async function periodePersonnalisee(page, debut, fin) {
  await page.locator("main").getByRole("button", { name: /Mois en cours|3 derniers mois|Année en cours|Année précédente|Période personnalisée|\d{4}/ }).first().click();
  const filtre = page.getByRole("dialog").last();
  await filtre.getByRole("button", { name: "Période personnalisée", exact: true }).click();
  await filtre.getByLabel("Date de début").fill(debut);
  await filtre.getByLabel("Date de fin").fill(fin);
  await page.keyboard.press("Escape");
  await attendreCalme(page);
}

/** Les indicateurs affichés valent ceux attendus (attente le temps du rechargement). */
async function comparer(page, attendu, cles) {
  const LIBELLES = { caNet: "CA HT net", depenses: "Dépenses HT", marge: "Marge brute", emises: "Factures émises" };
  for (const cle of cles) {
    const voulu = cle === "emises" ? String(attendu[cle]) : entier(attendu[cle]);
    await expect.poll(() => indicateur(page, LIBELLES[cle]), { message: `${LIBELLES[cle]} : ${voulu} attendu`, timeout: 20_000 }).toBe(voulu);
  }
}

test.describe("Analytiques : indicateurs de chaque période (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  for (const periode of ["Année en cours", "Mois en cours", "3 derniers mois", "Année précédente"]) {
    test(`${periode} : CA HT net, dépenses, marge et factures émises comme en base`, async ({ page }) => {
      const attendu = await indicateurs(W, bornes(periode));
      await ouvrirAnalytiques(page);
      if (periode !== "Année en cours") await choisirPeriode(page, periode);
      await etape(page, `${periode} : ${JSON.stringify(attendu)}`, () => comparer(page, attendu, ["caNet", "depenses", "marge", "emises"]), { capture: "ecran" });
    });
  }

  test("Période personnalisée sur plusieurs mois (année précédente saisie à la main) : comme en base", async ({ page }) => {
    const periode = bornes("Année précédente");
    const attendu = await indicateurs(W, periode);
    await ouvrirAnalytiques(page);
    await periodePersonnalisee(page, periode.debut, periode.fin);
    await comparer(page, attendu, ["caNet", "depenses", "emises"]);
  });

  test("Période personnalisée d'un seul jour : la facture émise ce jour-là est comptée (date de fin incluse)", async ({ page }) => {
    const f = FACTURES_PILOTAGE.jourPrecis;
    const jour = f.issueDate.toISOString().slice(0, 10);
    const attendu = await indicateurs(W, { debut: jour, fin: jour });
    expect(attendu.emises, "Données de départ : une facture émise ce jour-là").toBeGreaterThan(0);
    await ouvrirAnalytiques(page);
    await periodePersonnalisee(page, jour, jour);
    await etape(
      page,
      `Du ${jour} au ${jour}`,
      async () => {
        const affiche = await indicateur(page, "Factures émises");
        expect(affiche, `${attendu.emises} facture(s) émise(s) le ${jour} ; la période s'arrête à minuit au début du dernier jour, qui n'est donc pas compté`).toBe(String(attendu.emises));
      },
      { capture: "ecran" },
    );
  });

  test("Période personnalisée à l'envers (fin avant début) : refusée avec un message", async ({ page }) => {
    await ouvrirAnalytiques(page);
    await page.locator("main").getByRole("button", { name: "Année en cours" }).click();
    const filtre = page.getByRole("dialog").last();
    await filtre.getByRole("button", { name: "Période personnalisée", exact: true }).click();
    await filtre.getByLabel("Date de début").fill("2026-06-30");
    await filtre.getByLabel("Date de fin").fill("2026-06-01");
    await etape(page, "Message affiché", () => expect(filtre.getByText("La date de fin doit être postérieure à la date de début")).toBeVisible(), { capture: "ecran" });
    await page.keyboard.press("Escape");
    await expect(page.locator("main").getByRole("button", { name: /30 juin 2026 - 01 juin 2026/ }), "La période à l'envers a été appliquée").toHaveCount(0);
  });

  test("Taux de recouvrement : jamais plus de 100 %", async ({ page }) => {
    await ouvrirAnalytiques(page);
    const texte = await indicateur(page, "Taux recouvrement");
    const taux = Number(texte.replace("%", "").replace(",", "."));
    expect(taux, `Taux affiché : ${texte} (encaissé divisé par l'impayé, au lieu de la part encaissée du facturé)`).toBeLessThanOrEqual(100);
  });
});

test.describe("Analytiques : onglet Trésorerie (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Créances en cours et factures en retard (TTC, à ce jour) comme en base", async ({ page }) => {
    const attendu = await indicateurs(W, bornes("Année en cours"));
    await ouvrirAnalytiques(page);
    await page.getByRole("tab", { name: "Trésorerie" }).click();
    await expect(page.getByText("Créances en cours TTC", { exact: true })).toBeVisible();
    await expect.poll(() => indicateur(page, "Créances en cours TTC"), { timeout: 20_000 }).toBe(entier(attendu.creances));
    await expect.poll(() => indicateur(page, "Factures en retard TTC"), { timeout: 20_000 }).toBe(entier(attendu.enRetard));
  });

  test("Solde bancaire : comptes et espèces", async ({ page }) => {
    await ouvrirAnalytiques(page);
    await page.getByRole("tab", { name: "Trésorerie" }).click();
    await expect.poll(() => indicateur(page, "Solde bancaire"), { timeout: 20_000 }).toBe(entier(12550));
  });
});

test.describe("Analytiques : le Membre (lecture seule) voit les mêmes chiffres", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });

  test("Année en cours : CA HT net et dépenses comme en base", async ({ page }) => {
    const attendu = await indicateurs(W, bornes("Année en cours"));
    await ouvrirAnalytiques(page);
    await comparer(page, attendu, ["caNet", "depenses"]);
  });
});
