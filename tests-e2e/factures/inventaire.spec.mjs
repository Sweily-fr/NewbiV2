/**
 * Relevé des pages des factures et des avoirs (E2E_INVENTAIRE=1 seulement),
 * pour chaque rôle de l'organisation « Factures » : point de départ des
 * descriptions de boutons (boutons.spec.mjs). Ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import {
  connecte,
  SESSION_TOKEN_FACTURES,
  SESSION_TOKEN_FACTURES_EDITEUR,
  SESSION_TOKEN_FACTURES_LECTEUR,
  SESSION_TOKEN_FACTURES_REGLAGES,
  SESSION_TOKEN_FACTURES_OFFRE,
} from "../config.mjs";
import { AVOIRS_FACTURES, CLIENTS_FACTURES, F, F_OFFRE, NUMEROTATION, reference } from "../donnees/lot-factures.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const id = (doc) => doc._id.toHexString();
const LISTE = "/dashboard/outils/factures";
const ligne = (page, f) => page.getByRole("row", { name: new RegExp(`${reference(f)}\\b`) });
const panneau = (page) => page.locator("div.fixed.right-0.border-l.shadow-lg");
const fenetreParTitre = (titre) => (page) => page.getByRole("dialog").filter({ has: page.getByText(titre, { exact: true }) }).last();

/** Les éditeurs demandent « Quitter sans enregistrer ? » : jamais pendant un relevé. */
async function sansAlerteDeSortie(page) {
  await page
    .evaluate(() => window.addEventListener("beforeunload", (e) => e.stopImmediatePropagation(), true))
    .catch(() => {});
}

async function ouvrirListe(page) {
  await sansAlerteDeSortie(page);
  await ouvrir(page, LISTE, { pret: page.getByRole("heading", { name: "Factures clients" }) });
}

const ouvrirPanneau = (f) => async (page) => {
  await ouvrirListe(page);
  await page.getByPlaceholder(/Recherchez par numéro, client ou montant/).fill(reference(f));
  await attendreCalme(page);
  await cliquer(page, ligne(page, f).getByText(f.client.name).first());
  await panneau(page).waitFor({ state: "visible" });
  await attendreCalme(page);
};

const ouvrirEditeur = (url) => async (page) => {
  await sansAlerteDeSortie(page);
  await ouvrir(page, url);
  await page.waitForTimeout(1_000);
};

async function etapeArticles(page) {
  await ouvrirEditeur(`${LISTE}/new`)(page);
  await page.getByRole("combobox").filter({ hasText: "Rechercher un client" }).click();
  await page.getByRole("dialog").getByRole("button", { name: CLIENTS_FACTURES.lumiere.name, exact: true }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByText("Articles et produits").first().waitFor();
  await attendreCalme(page);
}

async function etapeArticlesAvecLigne(page) {
  await etapeArticles(page);
  await page.getByRole("button", { name: "Ajouter un article" }).first().click();
  await attendreCalme(page);
}

async function parametresDeLaFacture(page) {
  await ouvrirEditeur(`${LISTE}/new`)(page);
  await page.locator("main button:has(svg.lucide-settings)").first().click();
  await page.getByText("Paramètres de la facture").first().waitFor();
  await attendreCalme(page);
}

const onglet = (nom) => async (page) => {
  await ouvrirListe(page);
  await cliquer(page, page.getByRole("tab", { name: new RegExp(`^${nom}`) }));
  await attendreCalme(page);
};

async function avecSelection(page) {
  await ouvrirListe(page);
  await page.getByRole("checkbox", { name: "Sélectionner la ligne" }).first().check();
  await page.waitForTimeout(500);
}

/** Boutons à icône seule de l'en-tête de la liste (sans nom accessible) : relances, puis paramètres. */
const boutonEnTete = (rang) => (page) => page.getByRole("heading", { name: "Factures clients" }).locator("xpath=../..").getByRole("button").nth(rang);

async function relances(page) {
  await ouvrirListe(page);
  await boutonEnTete(0)(page).click();
  await page.getByText("Relances automatiques", { exact: true }).first().waitFor();
  await attendreCalme(page);
}

async function parametres(page) {
  await ouvrirListe(page);
  await boutonEnTete(1)(page).click();
  await page.getByText("Paramètres des factures", { exact: true }).first().waitFor();
  await attendreCalme(page);
}
const zoneParametres = (page) => page.locator("div.fixed.inset-0.z-50").filter({ has: page.getByText("Paramètres des factures", { exact: true }) }).last();

async function avoirArticles(page) {
  await ouvrirEditeur(`${LISTE}/${id(F.attente)}/avoir/nouveau`)(page);
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByText("Articles et produits").first().waitFor();
  await attendreCalme(page);
}

const PAGES_COMMUNES = {
  "consultation-attente": `${LISTE}/${id(F.attente)}`,
  "consultation-payee": `${LISTE}/${id(F.payee)}`,
  "avoir-existant": `${LISTE}/${id(F.avecAvoir)}/avoir/${id(AVOIRS_FACTURES.existant)}`,
};

test.describe("Relevé des factures (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });
  relever({ "fac-liste": LISTE, ...Object.fromEntries(Object.entries(PAGES_COMMUNES).map(([n, u]) => [`fac-${n}`, u])) });
  releverEtat("fac-consultation-brouillon", ouvrirEditeur(`${LISTE}/${id(F.brouillon)}`));
  releverEtat("fac-liste-selection", avecSelection);
  for (const [nom, f] of Object.entries({ brouillon: F.brouillon, attente: F.attente, retard: F.retard, payee: F.payee, annulee: F.annulee, avoir: F.avecAvoir, acompte: F.acompte })) {
    releverEtat(`fac-panneau-${nom}`, ouvrirPanneau(f), { zone: panneau });
  }
  releverEtat("fac-nouvelle", ouvrirEditeur(`${LISTE}/new`));
  releverEtat("fac-nouvelle-articles", etapeArticles);
  releverEtat("fac-nouvelle-articles-ligne", etapeArticlesAvecLigne);
  releverEtat("fac-nouvelle-parametres", parametresDeLaFacture);
  releverEtat("fac-edition", ouvrirEditeur(`${LISTE}/${id(F.brouillon)}/editer`));
  releverEtat("fac-onglet-avoirs", onglet("Avoirs"));
  releverEtat("fac-onglet-recurrentes", onglet("Récurrentes"));
  releverEtat("fac-relances", relances, { zone: fenetreParTitre("Relances automatiques") });
  releverEtat("fac-parametres", parametres, { zone: zoneParametres });
  releverEtat("fac-avoir-nouveau", ouvrirEditeur(`${LISTE}/${id(F.attente)}/avoir/nouveau`));
  releverEtat("fac-avoir-nouveau-articles", avoirArticles);
});

test.describe("Relevé des factures (éditeur)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });
  relever({ "fac-editeur-liste": LISTE, ...Object.fromEntries(Object.entries(PAGES_COMMUNES).map(([n, u]) => [`fac-editeur-${n}`, u])) });
  for (const [nom, f] of Object.entries({ brouillon: F.brouillon, attente: F.attente, payee: F.payee })) {
    releverEtat(`fac-editeur-panneau-${nom}`, ouvrirPanneau(f), { zone: panneau });
  }
  releverEtat("fac-editeur-liste-selection", avecSelection);
  releverEtat("fac-editeur-nouvelle", ouvrirEditeur(`${LISTE}/new`));
  releverEtat("fac-editeur-edition", ouvrirEditeur(`${LISTE}/${id(F.editeurBrouillon)}/editer`));
  releverEtat("fac-editeur-avoir-nouveau", ouvrirEditeur(`${LISTE}/${id(F.attente)}/avoir/nouveau`));
});

test.describe("Relevé des factures (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_LECTEUR) });
  relever({ "fac-lecteur-liste": LISTE, ...Object.fromEntries(Object.entries(PAGES_COMMUNES).map(([n, u]) => [`fac-lecteur-${n}`, u])) });
  for (const [nom, f] of Object.entries({ brouillon: F.brouillon, attente: F.attente, payee: F.payee })) {
    releverEtat(`fac-lecteur-panneau-${nom}`, ouvrirPanneau(f), { zone: panneau });
  }
  releverEtat("fac-lecteur-consultation-brouillon", ouvrirEditeur(`${LISTE}/${id(F.brouillon)}`));
  releverEtat("fac-lecteur-avoir-nouveau", ouvrirEditeur(`${LISTE}/${id(F.attente)}/avoir/nouveau`));
  releverEtat("fac-lecteur-edition", ouvrirEditeur(`${LISTE}/${id(F.brouillon)}/editer`));
});

test.describe("Relevé des factures (réglages et offre d'entrée)", () => {
  test.describe("Réglages", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_REGLAGES) });
    releverEtat("fac-reglages-edition-brouillon", ouvrirEditeur(`${LISTE}/${id(NUMEROTATION.brouillonDuMois)}/editer`));
  });
  test.describe("Offre", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_OFFRE) });
    relever({ "fac-offre-liste": LISTE });
    releverEtat("fac-offre-panneau", ouvrirPanneau(F_OFFRE.attente), { zone: panneau });
  });
});

test.describe("Relevé des pages de paiement (sans connexion)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  relever(
    {
      "fac-paiement-recu": `/pay/invoice/${id(F.payee)}/success`,
      "fac-paiement-annule": `/pay/invoice/${id(F.attente)}/cancel`,
    },
    { zone: (p) => p.locator("body") },
  );
});
