/**
 * Outils communs aux listes de documents (devis, bons de commande, bons de
 * livraison) : formats affichés, ligne d'un document, menu de ligne et
 * panneau latéral.
 */
import { expect } from "@playwright/test";
import { attendreCalme, cliquer, ouvrir } from "./navigation.mjs";
import { base } from "./base.mjs";

export const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\s/g, " ");
export const date = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }).format(d);
export const reference = (d) => `${d.prefix}-${d.number}`;

/** Ouvre une liste, prête quand son titre s'affiche. */
export async function ouvrirListe(page, chemin, titre) {
  await ouvrir(page, chemin, { pret: page.getByRole("heading", { name: titre }) });
}

/** Ligne d'un document, repérée par sa référence (« D-092026-0001 »). */
export const ligne = (page, doc) => page.getByRole("row", { name: new RegExp(`${reference(doc)}\\b`) });

/** Onglet de filtre rapide : libellé suivi de son compteur. */
export const onglet = (page, libelle) => page.getByRole("tab", { name: new RegExp(`^${libelle} \\d+$`) });

/**
 * Tape dans la recherche de la liste : la liste n'affiche que 10 lignes par
 * page, un document plus ancien peut être sur la page suivante.
 */
export async function rechercher(page, texte) {
  await page.getByPlaceholder(/^Recherchez par/).fill(texte);
}

/** Ouvre le menu « ... » d'une ligne et choisit une action. */
export async function actionDeLigne(page, doc, action) {
  await cliquer(page, ligne(page, doc).getByRole("button", { name: "Ouvrir le menu" }));
  await page.getByRole("menuitem", { name: action }).click();
}

/** Ouvre le panneau latéral d'un document en cliquant sur sa ligne. */
export async function ouvrirPanneau(page, doc, titre) {
  await cliquer(page, ligne(page, doc).getByText(doc.client.name));
  await expect(page.getByRole("heading", { name: titre })).toBeVisible();
  await attendreCalme(page);
}

/** Document tel qu'enregistré en base (null s'il a été supprimé). */
export async function enBase(collection, doc) {
  return (await base()).collection(collection).findOne({ _id: doc._id });
}

/** Documents d'une organisation, pour calculer les compteurs attendus. */
export async function documentsDe(collection, organisation) {
  return (await base()).collection(collection).find({ workspaceId: organisation._id }).toArray();
}

/** Statut en base, relu jusqu'à ce qu'il change (les actions sont asynchrones). */
export function statutEnBase(collection, doc) {
  return expect.poll(async () => (await enBase(collection, doc))?.status, { message: "Statut en base" });
}
