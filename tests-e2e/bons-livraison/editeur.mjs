/**
 * Éditeur de bons de livraison (/dashboard/outils/bons-de-livraison/new) :
 * ce qui lui est propre (transporteur, adresse de livraison, pas de prix) ;
 * le client, les articles et le brouillon sont communs (../editeur.mjs).
 */
import { expect } from "@playwright/test";
import { ouvrirEditeur } from "../editeur.mjs";

export const EDITEUR = "/dashboard/outils/bons-de-livraison/new";
export const LISTE = "/dashboard/outils/bons-de-livraison";

export const nouveauBonLivraison = (page) => ouvrirEditeur(page, EDITEUR);

export async function transport(page, { transporteur, suivi }) {
  if (transporteur) await page.getByPlaceholder(/Ex\. Chronopost/).fill(transporteur);
  if (suivi) await page.getByPlaceholder("Ex. XY123456789FR").fill(suivi);
}

/**
 * Adresse de livraison saisie à la main (au lieu de celle du client). En
 * décochant, les champs reprennent l'adresse du client : chaque champ donné
 * la remplace, "" la vide.
 */
export async function adresseSaisie(page, { destinataire, rue, codePostal, ville }) {
  await page.getByRole("checkbox", { name: "Utiliser l'adresse du client" }).uncheck();
  const champs = [
    ["Nom du destinataire ou du site", destinataire],
    ["Numéro et rue", rue],
    ["75001", codePostal],
    ["Paris", ville],
  ];
  for (const [indication, valeur] of champs) {
    if (valeur !== undefined) await page.getByPlaceholder(indication, { exact: true }).fill(valeur);
  }
}

export async function creerBonLivraison(page) {
  await page.getByRole("button", { name: "Créer le bon de livraison" }).click();
}

/** Message affiché par la liste après une création (pas une notification sonner). */
export async function messageCree(page) {
  await expect(page).toHaveURL(new RegExp(`${LISTE}(\\?|$)`));
  await expect(page.getByText("Bon de livraison créé avec succès")).toBeVisible();
}
