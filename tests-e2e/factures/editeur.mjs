/**
 * Éditeur de factures (/dashboard/outils/factures/new) : ce qui lui est
 * propre ; le reste est commun à tous les éditeurs (../editeur.mjs).
 */
import { choisirOption, ouvrirEditeur } from "../editeur.mjs";

export { ajouterArticle, choisirClient, continuer, enregistrerBrouillon, notifications, remiseGlobale } from "../editeur.mjs";

export async function nouvelleFacture(page) {
  await ouvrirEditeur(page, "/dashboard/outils/factures/new");
}

export async function choisirType(page, libelle) {
  await choisirOption(page, page.getByRole("combobox").filter({ hasText: /^Facture/ }).first(), libelle);
}

export async function creerFacture(page) {
  await page.getByRole("button", { name: "Créer la facture" }).click();
}
