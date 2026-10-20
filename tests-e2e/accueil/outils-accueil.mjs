/**
 * Lecture de l'accueil : cadres, montants et compteurs tels qu'affichés.
 */
import { expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { texteSimple } from "./attendus.mjs";

/** Liste des banques simulée : sans elle, la fenêtre « Connecter votre banque » interroge Bridge (injoignable en CI, erreur 500). */
export const BANQUES_SIMULEES = { institutions: [{ id: 101, name: "Banque Simulée", logo: null, groupName: "Banque Simulée" }] };

export async function simulerBanques(page) {
  if (page.__banquesSimulees) return;
  page.__banquesSimulees = true;
  await page.route("**/api/banking-connect/bridge/institutions**", (route) => route.fulfill({ status: 200, json: BANQUES_SIMULEES }));
}

/** Ouvre l'accueil, une fois ses cadres chargés (« À traiter » est affiché pour tous les rôles). */
export async function ouvrirAccueil(page) {
  await simulerBanques(page);
  await ouvrir(page, "/dashboard", { pret: page.getByRole("heading", { name: "À traiter" }) });
  // Squelettes des cadres : attendre la fin du chargement des montants
  await expect(page.locator("main [data-slot=skeleton], main [data-slot=card] .animate-pulse")).toHaveCount(0, { timeout: 30_000 });
}

export const carte = (page, texte) => page.locator("main [data-slot=card]").filter({ has: page.getByText(texte, { exact: true }) });
export const cadreDuMois = (page) => carte(page, "Ventes (TTC)");
export const cadreSolde = (page) => page.locator("main [data-slot=card]").filter({ has: page.getByText(/^Solde (du compte|des comptes)$/) });

const MONTANT = /-?\d[\d ]*,\d{2} €/;

/** Le premier montant (« 1 440,00 € ») écrit dans un élément. */
export async function montantDans(locator) {
  const texte = texteSimple(await locator.first().innerText({ timeout: 10_000 }));
  return texte.match(MONTANT)?.[0] ?? `(aucun montant dans « ${texte} »)`;
}

/** Montant écrit juste après un libellé (« Ventes (TTC) » puis « 1 440,00 € »). */
export const montantApres = (zone, libelle) => montantDans(zone.getByText(libelle, { exact: true }).locator("xpath=following-sibling::*[1]"));

/** Nombre affiché dans une ligne du cadre « À traiter » (« Factures en retard 2 »). */
export async function compteur(page, libelle) {
  const lien = page.getByRole("link", { name: new RegExp(`^${libelle}\\s*\\d+$`) });
  await expect(lien, `Ligne « ${libelle} » du cadre « À traiter »`).toBeVisible();
  const nom = texteSimple(await lien.innerText());
  return Number(nom.match(/(\d+)$/)[1]);
}
