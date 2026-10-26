/**
 * Pilotage > Vue d'ensemble : solde, chiffre d'affaires (mensuel,
 * trimestriel, annuel), « À payer » et « Encours clients » comparés à la base.
 * « Encours clients » ne doit compter que les factures émises non réglées :
 * ni les brouillons, ni seulement les 50 dernières factures créées.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CLIENT_CABINET, SESSION_TOKEN_PILOTAGE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { achatsAPayer, bornes, encoursClients, euros, indicateurs, texteSimple } from "./attendus.mjs";

const W = COMPTES.pilotage.organisation._id;
const W_BOULANGERIE = COMPTES.clientCabinet.organisation._id;
const MONTANT = /-?\d[\d ]*,\d{2} €/;

async function ouvrirVueEnsemble(page) {
  await ouvrir(page, "/dashboard/outils/analytiques/vue-densemble", { pret: page.getByText("Encours Clients", { exact: true }) });
}

const montantApres = async (page, libelle) => {
  const texte = texteSimple(await page.getByText(libelle, { exact: true }).locator("xpath=following-sibling::span[1]").innerText());
  return texte.match(MONTANT)?.[0] ?? texte;
};
const montantCarte = async (page, titre) => {
  const carte = page.locator("main [data-slot=card]").filter({ has: page.getByText(titre, { exact: true }) });
  const texte = texteSimple(await carte.locator(".text-xl").first().innerText());
  return texte.match(MONTANT)?.[0] ?? texte;
};

test.describe("Vue d'ensemble (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Solde de trésorerie : comptes et espèces", async ({ page }) => {
    await ouvrirVueEnsemble(page);
    await expect.poll(() => montantCarte(page, "Solde de Trésorerie")).toBe(euros(12550));
  });

  for (const [choix, periode] of [
    [null, "Année en cours"],
    ["Mensuel", "Mois en cours"],
    ["Trimestriel", "Trimestre en cours"],
  ]) {
    test(`Chiffre d'affaires ${choix ?? "Annuel (par défaut)"} : CA HT net de la période, comme en base`, async ({ page }) => {
      const { caNet } = await indicateurs(W, bornes(periode));
      await ouvrirVueEnsemble(page);
      if (choix) {
        await page.locator("main [data-slot=card]").filter({ has: page.getByText("Chiffre d'Affaires", { exact: true }) }).getByRole("combobox").click();
        await page.getByRole("option", { name: choix }).click();
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await attendreCalme(page);
      }
      await expect.poll(() => montantCarte(page, "Chiffre d'Affaires"), { message: `${periode} : ${euros(caNet)} attendu`, timeout: 20_000 }).toBe(euros(caNet));
    });
  }

  test("« À payer » : factures d'achat non payées (TTC)", async ({ page }) => {
    const attendu = await achatsAPayer(W);
    await ouvrirVueEnsemble(page);
    await expect.poll(() => montantApres(page, "À Payer")).toBe(euros(attendu));
  });

  test("« Encours clients » : factures émises non réglées, sans les brouillons", async ({ page }) => {
    const attendu = await encoursClients(W);
    await ouvrirVueEnsemble(page);
    await etape(
      page,
      `Encours attendu ${euros(attendu)}`,
      async () => {
        const affiche = await montantApres(page, "Encours Clients");
        expect(affiche, `Encours affiché ${affiche} ; ${euros(attendu)} attendu (un brouillon n'est pas une créance)`).toBe(euros(attendu));
      },
      { capture: "ecran" },
    );
  });
});

test.describe("Vue d'ensemble d'un espace de plus de 50 factures (Boulangerie Cliente)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENT_CABINET) });

  test("« Encours clients » compte toutes les factures non réglées, pas seulement les 50 dernières", async ({ page }) => {
    const attendu = await encoursClients(W_BOULANGERIE);
    await ouvrirVueEnsemble(page);
    const affiche = await montantApres(page, "Encours Clients");
    expect(affiche, `Encours affiché ${affiche} ; ${euros(attendu)} attendu (les factures anciennes non réglées manquent)`).toBe(euros(attendu));
  });
});
