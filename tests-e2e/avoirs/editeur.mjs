/**
 * Éditeur d'avoirs (/dashboard/outils/factures/<id>/avoir/nouveau), ouvert
 * depuis une facture : étape 1 type, remboursement et motif ; étape 2 les
 * articles de la facture repris en quantité négative.
 */
import { expect } from "@playwright/test";
import { attendreCalme, cliquer, ouvrir } from "../navigation.mjs";
import { choisirOption } from "../editeur.mjs";

export const LISTE_FACTURES = "/dashboard/outils/factures";
export const reference = (f) => `${f.prefix}-${f.number}`;
export const ligneFacture = (page, f) => page.getByRole("row", { name: new RegExp(`${reference(f)}\\b`) });

export async function ouvrirFactures(page) {
  await ouvrir(page, LISTE_FACTURES, { pret: page.getByRole("heading", { name: "Factures clients" }) });
}

export async function panneauFacture(page, f) {
  await cliquer(page, ligneFacture(page, f).getByText(f.client.name));
  await expect(page.getByText(`Facture ${reference(f)}`, { exact: true })).toBeVisible();
  await attendreCalme(page);
}

export async function nouvelAvoir(page, f) {
  await ouvrir(page, `${LISTE_FACTURES}/${f._id.toHexString()}/avoir/nouveau`, { pret: page.getByText("Facture d'origine").first() });
}

export const choisirType = (page, libelle) => choisirOption(page, page.getByRole("combobox").filter({ hasText: "Correction d'erreur" }), libelle);
export const choisirRemboursement = (page, libelle) =>
  choisirOption(page, page.getByRole("combobox").filter({ hasText: "Déduction sur prochaine facture" }), libelle);

export async function suivant(page) {
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("Articles et produits").first()).toBeVisible();
}

/** Ouvre l'article i (0, 1…) repris de la facture si son accordéon est replié. */
export async function ouvrirArticle(page, i, nom) {
  const champ = page.locator(`#item-quantity-${i}`);
  if (!(await champ.isVisible())) await page.getByRole("button", { name: new RegExp(nom) }).first().click();
  await expect(champ).toBeVisible();
  return champ;
}

export async function creerAvoir(page) {
  await page.getByRole("button", { name: "Créer l'avoir" }).click();
}
