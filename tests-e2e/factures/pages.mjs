/**
 * Ouverture des pages des factures (liste, panneau, consultation, éditeur,
 * paramètres, relances, avoirs) pour les tests du lot, et repères communs.
 */
import { expect } from "@playwright/test";
import { attendreCalme, cliquer, ouvrir } from "../navigation.mjs";
import { CLIENTS_FACTURES, reference } from "../donnees/lot-factures.mjs";

export const LISTE = "/dashboard/outils/factures";
export const id = (doc) => doc._id.toHexString();
export const RECHERCHE = /Recherchez par numéro, client ou montant/;

/** Date telle que l'éditeur l'écrit sur ses boutons (« 12 octobre 2026 », heure de Paris). */
export const jourLong = (d) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(d);
export const dansJours = (n) => new Date(Date.now() + n * 86_400_000);

/** Les éditeurs demandent « Quitter sans enregistrer ? » à la fermeture : jamais entre deux pages d'un test. */
export async function sansAlerteDeSortie(page) {
  await page.evaluate(() => window.addEventListener("beforeunload", (e) => e.stopImmediatePropagation(), true)).catch(() => {});
}

export const ligne = (page, f) => page.getByRole("row", { name: new RegExp(`${reference(f).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`) });
export const panneau = (page) => page.locator("div.fixed.right-0.border-l.shadow-lg");
export const fenetreTitree = (page, titre) => page.getByRole("dialog").filter({ has: page.getByText(titre, { exact: true }) }).last();
export const notifications = (page) => page.locator("[data-sonner-toast]");

export async function ouvrirListe(page) {
  await sansAlerteDeSortie(page);
  await ouvrir(page, LISTE, { pret: page.getByRole("heading", { name: "Factures clients" }) });
}

/** Tape dans la recherche de la liste la référence de la facture (« F-092026-0001 »). */
export async function chercher(page, f) {
  await page.getByPlaceholder(RECHERCHE).fill(reference(f));
  await attendreCalme(page);
  await expect(ligne(page, f), `Facture ${reference(f)} dans la liste`).toHaveCount(1);
}

/** Ouvre le panneau d'une facture depuis la liste. */
export async function ouvrirPanneau(page, f) {
  await ouvrirListe(page);
  await chercher(page, f);
  await cliquer(page, ligne(page, f).getByText(f.client.name).first());
  await expect(panneau(page)).toBeVisible();
  await expect(panneau(page).getByRole("heading", { name: `Facture ${reference(f)}` })).toBeVisible();
  await attendreCalme(page);
}

/** Ouvre le menu « … » de la ligne d'une facture et choisit une action. */
export async function actionDeLigne(page, f, action) {
  await chercher(page, f);
  await cliquer(page, ligne(page, f).getByRole("button", { name: "Ouvrir le menu" }));
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

export async function ouvrirPage(page, url, options) {
  await sansAlerteDeSortie(page);
  await ouvrir(page, url, options);
}

export const ouvrirConsultation = (f) => (page) => ouvrirPage(page, `${LISTE}/${id(f)}`, { pret: page.getByText("Sélection d'un client").first() });
export const ouvrirEdition = (f) => (page) => ouvrirPage(page, `${LISTE}/${id(f)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
export const ouvrirNouvelle = (page) => ouvrirPage(page, `${LISTE}/new`, { pret: page.getByText("Sélection d'un client").first() });

export async function choisirClient(page, nom = CLIENTS_FACTURES.lumiere.name) {
  await page.getByRole("combobox").filter({ hasText: "Rechercher un client" }).click();
  await page.getByRole("dialog").getByRole("button", { name: nom, exact: true }).click();
  await expect(page.getByRole("combobox").filter({ hasText: nom })).toBeVisible();
}

export async function etapeArticles(page, nomClient) {
  await ouvrirNouvelle(page);
  await choisirClient(page, nomClient);
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByText("Articles et produits").first()).toBeVisible();
  await attendreCalme(page);
}

/** Boutons à icône seule de l'en-tête de la liste (sans nom accessible) : 0 = relances, 1 = paramètres. */
export const boutonEnTete = (page, rang) => page.getByRole("heading", { name: "Factures clients" }).locator("xpath=../..").getByRole("button").nth(rang);

export async function ouvrirRelances(page) {
  await ouvrirListe(page);
  await boutonEnTete(page, 0).click();
  await expect(fenetreTitree(page, "Relances automatiques")).toBeVisible();
  await attendreCalme(page);
  return fenetreTitree(page, "Relances automatiques");
}

export const zoneParametres = (page) => page.locator("div.fixed.inset-0.z-50").filter({ has: page.getByText("Paramètres des factures", { exact: true }) }).last();

export async function ouvrirParametres(page) {
  await ouvrirListe(page);
  await boutonEnTete(page, 1).click();
  await expect(zoneParametres(page)).toBeVisible();
  await expect(zoneParametres(page).getByRole("textbox", { name: "Préfixe de facture" })).toBeVisible();
  await attendreCalme(page);
  return zoneParametres(page);
}

export const ouvrirAvoirNouveau = (f) => (page) => ouvrirPage(page, `${LISTE}/${id(f)}/avoir/nouveau`, { pret: page.getByText("Facture d'origine").first() });
export const ouvrirAvoirExistant = (f, a) => (page) => ouvrirPage(page, `${LISTE}/${id(f)}/avoir/${id(a)}`, { pret: page.getByText("Facture d'origine").first() });
