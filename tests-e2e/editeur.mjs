/**
 * Actions communes aux éditeurs de documents (factures, devis, bons de
 * commande, bons de livraison), écrites avec les libellés que voit
 * l'utilisateur : les modules n'ont pas de data-testid. Assistants en deux
 * étapes : client et informations, puis articles.
 */
import { expect } from "@playwright/test";
import { attendreCalme, ouvrir } from "./navigation.mjs";

/** Ouvre un éditeur vierge, prêt quand le choix du client s'affiche. */
export async function ouvrirEditeur(page, chemin) {
  await ouvrir(page, chemin, { pret: page.getByText("Sélection d'un client").first() });
}

/** Choisit un client existant dans la liste déroulante. */
export async function choisirClient(page, nom) {
  await page.getByRole("combobox").filter({ hasText: "Rechercher un client" }).click();
  await page.getByRole("dialog").getByRole("button", { name: nom, exact: true }).click();
  await expect(page.getByRole("combobox").filter({ hasText: nom })).toBeVisible();
}

/** Choisit une option d'une liste déroulante (Radix Select) repérée par sa valeur affichée. */
export async function choisirOption(page, liste, option) {
  await liste.click();
  await page.getByRole("option", { name: option }).click();
}

/** Passe à l'étape des articles. */
export async function continuer(page) {
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByText("Articles et produits").first()).toBeVisible();
}

/**
 * Zone de l'article n (accordéon), ouverte si besoin. Repérée par l'identifiant
 * de son champ « Nom » : le titre de l'accordéon devient le nom saisi.
 */
async function zoneArticle(page, n) {
  const i = n - 1;
  const zone = page.getByRole("region").filter({ has: page.locator(`#item-description-${i}`) });
  if (!(await page.locator(`#item-description-${i}`).isVisible())) {
    // L'en-tête peut commencer par la poignée « Réorganiser cet article ».
    await page.getByRole("button", { name: new RegExp(`Article ${n}\\b`) }).click();
  }
  await expect(page.locator(`#item-description-${i}`)).toBeVisible();
  return zone;
}

/**
 * Ajoute l'article n (1, 2…) et le remplit. Champs optionnels :
 * quantite, prix, tva (libellé de l'option, ex. /^0%/), mention (TVA à 0 %),
 * remise { valeur, type: "Pourcentage" | "Montant" }.
 */
export async function ajouterArticle(page, n, { nom, quantite, prix, tva, mention, remise } = {}) {
  const i = n - 1;
  await page.getByRole("button", { name: "Ajouter un article" }).first().click();
  const zone = await zoneArticle(page, n);
  if (nom !== undefined) await page.locator(`#item-description-${i}`).fill(nom);
  if (quantite !== undefined) await page.locator(`#item-quantity-${i}`).fill(String(quantite));
  if (prix !== undefined) await page.locator(`#item-price-${i}`).fill(String(prix));
  if (tva) await choisirOption(page, zone.getByRole("combobox").filter({ hasText: /TVA|Taux|%/ }).last(), tva);
  if (mention) await choisirOption(page, zone.getByRole("combobox").filter({ hasText: /mention/i }), mention);
  if (remise) {
    await zone.getByText("+ Ajouter une remise à l'article").click();
    await page.locator(`#item-discount-${i}`).fill(String(remise.valeur));
    if (remise.type === "Montant") await choisirOption(page, zone.getByRole("combobox").filter({ hasText: /%|€/ }).last(), /€|Montant/);
  }
  await attendreCalme(page);
}

/** Remise globale : { valeur, type: "Pourcentage" | "Montant" }. */
export async function remiseGlobale(page, { valeur, type = "Pourcentage" }) {
  if (type === "Montant") await choisirOption(page, page.getByRole("combobox").filter({ hasText: "Pourcentage (%)" }), /Montant fixe/);
  await page.getByRole("spinbutton", { name: "Valeur de la remise" }).fill(String(valeur));
}

export async function enregistrerBrouillon(page) {
  await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
}

/** Notifications affichées (sonner), texte complet. */
export function notifications(page) {
  return page.locator("[data-sonner-toast]");
}
