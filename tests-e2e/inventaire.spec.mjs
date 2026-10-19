/**
 * Relevé de toutes les pages (E2E_INVENTAIRE=1 seulement) : pour chaque page,
 * chaque bouton, onglet, case, liste et lien est essayé sur une page neuve, et
 * chaque élément de chaque menu ; le résultat (fenêtres ouvertes et leurs
 * champs, navigations, téléchargements, erreurs) est écrit en JSON dans
 * tests-e2e/inventaire-resultats/, publié par la CI. Sert à écrire les tests
 * de chaque fonctionnalité et à vérifier qu'aucun élément n'est oublié ; ce
 * n'est pas un test en soi (il ne vérifie rien).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "./outils.mjs";
import { ouvrir } from "./navigation.mjs";
import { inventorier, contenu } from "./exploration.mjs";
import { sessionCookie, SESSION_TOKEN_LISTE, SESSION_TOKEN_AVOIRS } from "./config.mjs";
import { CLIENTS } from "./donnees/base.mjs";
import { FACTURES_LISTE } from "./donnees/factures-liste.mjs";
import { DEVIS_LISTE } from "./donnees/devis-liste.mjs";
import { BONS_COMMANDE_LISTE } from "./donnees/bons-commande-liste.mjs";
import { BONS_LIVRAISON_LISTE } from "./donnees/bons-livraison-liste.mjs";
import { AVOIRS, FACTURES_AVOIRS } from "./donnees/avoirs.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const DOSSIER = path.resolve("tests-e2e/inventaire-resultats");
const id = (doc) => doc._id.toHexString();

const PAGES_LISTE = {
  accueil: "/dashboard",
  factures: "/dashboard/outils/factures",
  "facture-nouvelle": "/dashboard/outils/factures/new",
  "facture-consultation": `/dashboard/outils/factures/${id(FACTURES_LISTE.aEncaisser)}`,
  "facture-edition": `/dashboard/outils/factures/${id(FACTURES_LISTE.brouillon)}/editer`,
  devis: "/dashboard/outils/devis",
  "devis-nouveau": "/dashboard/outils/devis/new",
  "devis-edition": `/dashboard/outils/devis/${id(DEVIS_LISTE.brouillon)}/editer`,
  "bons-commande": "/dashboard/outils/bons-commande",
  "bon-commande-nouveau": "/dashboard/outils/bons-commande/new",
  "bon-commande-edition": `/dashboard/outils/bons-commande/${id(BONS_COMMANDE_LISTE.brouillon)}/editer`,
  "bons-livraison": "/dashboard/outils/bons-de-livraison",
  "bon-livraison-nouveau": "/dashboard/outils/bons-de-livraison/new",
  "bon-livraison-edition": `/dashboard/outils/bons-de-livraison/${id(BONS_LIVRAISON_LISTE.brouillon)}/editer`,
  clients: "/dashboard/clients",
  "client-fiche": `/dashboard/clients/${id(CLIENTS.gamma)}`,
  "clients-listes": "/dashboard/clients/listes",
  "clients-segments": "/dashboard/clients/segments",
  "clients-bloques": "/dashboard/clients/blocked",
  catalogue: "/dashboard/catalogues",
  "factures-achat": "/dashboard/outils/factures-achat",
  transactions: "/dashboard/outils/transactions",
  prevision: "/dashboard/outils/prevision",
  analytiques: "/dashboard/outils/analytiques",
  "vue-ensemble": "/dashboard/outils/analytiques/vue-densemble",
  "correspondance-pcg": "/dashboard/analytics",
  kanban: "/dashboard/outils/kanban",
  "kanban-nouveau": "/dashboard/outils/kanban/new",
  calendrier: "/dashboard/calendar",
  transferts: "/dashboard/outils/transferts-fichiers",
  "transfert-nouveau": "/dashboard/outils/transferts-fichiers/new",
  "documents-partages": "/dashboard/outils/documents-partages",
  signatures: "/dashboard/outils/signatures-mail",
  gestionnaire: "/dashboard/gestionnaire",
};

const PAGES_AVOIRS = {
  "avoir-nouveau": `/dashboard/outils/factures/${id(FACTURES_AVOIRS.aCrediterTotal)}/avoir/nouveau`,
  "avoir-existant": `/dashboard/outils/factures/${id(FACTURES_AVOIRS.avecAvoir)}/avoir/${id(AVOIRS.existant)}`,
};

const PAGES_SANS_CONNEXION = {
  connexion: "/auth/login",
  inscription: "/auth/signup",
  "mot-de-passe-oublie": "/auth/forget-password",
};

function enregistrer(nom, releve) {
  mkdirSync(DOSSIER, { recursive: true });
  writeFileSync(path.join(DOSSIER, `${nom}.json`), JSON.stringify(releve, null, 2));
}

function relever(pages, { zone = contenu } = {}) {
  for (const [nom, url] of Object.entries(pages)) {
    test(`Relevé : ${nom}`, async ({ page, surveillance }) => {
      test.setTimeout(20 * 60_000);
      const releve = await inventorier(page, { ouvrir: (p) => ouvrir(p, url), zone, problemes: surveillance });
      enregistrer(nom, releve);
    });
  }
}

test.describe("Relevé des pages (compte Liste)", () => {
  test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_LISTE)], origins: [] } });
  relever(PAGES_LISTE);

  // Barre latérale et en-tête communs, relevés une fois.
  test("Relevé : barre latérale et en-tête", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    const ouvrirAccueil = (p) => ouvrir(p, "/dashboard");
    enregistrer(
      "mise-en-page-barre-laterale",
      await inventorier(page, { ouvrir: ouvrirAccueil, zone: (p) => p.locator("[data-slot=sidebar]").first(), problemes: surveillance }),
    );
    enregistrer("mise-en-page-en-tete", await inventorier(page, { ouvrir: ouvrirAccueil, zone: (p) => p.locator("main > header").first(), problemes: surveillance }));
  });
});

test.describe("Relevé des pages (compte Avoirs)", () => {
  test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_AVOIRS)], origins: [] } });
  relever(PAGES_AVOIRS);
});

test.describe("Relevé des pages (sans connexion)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  relever(PAGES_SANS_CONNEXION, { zone: (p) => p.locator("body") });
});
