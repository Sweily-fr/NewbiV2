/**
 * Relevé des pages déjà couvertes au départ (voir releve.mjs) ; chaque
 * fonctionnalité ajoute les siennes dans `<dossier>/inventaire.spec.mjs`.
 */
import { test } from "./outils.mjs";
import { ouvrir } from "./navigation.mjs";
import { inventorier } from "./exploration.mjs";
import { relever, enregistrer } from "./releve.mjs";
import { connecte, sessionCookie, SESSION_TOKEN_LISTE, SESSION_TOKEN_AVOIRS, SESSION_TOKEN_CLIENTS, SESSION_TOKEN_LECTEUR, SESSION_TOKEN_EDITEUR } from "./config.mjs";
import { CLIENTS } from "./donnees/base.mjs";
import { CONTACTS, LISTES_CLIENTS, SEGMENTS } from "./donnees/clients.mjs";
import { FACTURES_LISTE } from "./donnees/factures-liste.mjs";
import { DEVIS_LISTE } from "./donnees/devis-liste.mjs";
import { BONS_COMMANDE_LISTE } from "./donnees/bons-commande-liste.mjs";
import { BONS_LIVRAISON_LISTE } from "./donnees/bons-livraison-liste.mjs";
import { AVOIRS, FACTURES_AVOIRS } from "./donnees/avoirs.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

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

// Pages des contacts, vues par chaque rôle de l'organisation « Clients ».
const PAGES_CLIENTS = {
  contacts: "/dashboard/clients",
  "contact-complet": `/dashboard/clients/${id(CONTACTS.complet)}`,
  "contact-particulier": `/dashboard/clients/${id(CONTACTS.particulier)}`,
  "contact-bloque": `/dashboard/clients/${id(CONTACTS.bloque)}`,
  "contact-avec-factures": `/dashboard/clients/${id(CONTACTS.avecFactures)}`,
  listes: "/dashboard/clients/listes",
  "liste-prospects": `/dashboard/clients/listes?listId=${id(LISTES_CLIENTS.prospects)}`,
  segments: "/dashboard/clients/segments",
  "segment-lyonnais": `/dashboard/clients/segments?segmentId=${id(SEGMENTS.lyonnais)}`,
  bloques: "/dashboard/clients/blocked",
};

const PAGES_SANS_CONNEXION = {
  connexion: "/auth/login",
  inscription: "/auth/signup",
  "mot-de-passe-oublie": "/auth/forget-password",
};

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

for (const [role, token] of [["proprietaire", SESSION_TOKEN_CLIENTS], ["lecteur", SESSION_TOKEN_LECTEUR], ["editeur", SESSION_TOKEN_EDITEUR]]) {
  test.describe(`Relevé des contacts (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever(Object.fromEntries(Object.entries(PAGES_CLIENTS).map(([nom, url]) => [`clients-${role}-${nom}`, url])));
  });
}

// États particuliers : une ligne sélectionnée (actions groupées), onglets d'une fiche.
test.describe("Relevé des contacts (états)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });
  const ouvrirAvecSelection = async (p) => {
    await ouvrir(p, "/dashboard/clients");
    await p.getByRole("checkbox", { name: "Select row" }).first().check();
    await p.waitForTimeout(500);
  };
  test("Relevé : clients-selection", async ({ page, surveillance }) => {
    test.setTimeout(20 * 60_000);
    enregistrer("clients-selection", await inventorier(page, { ouvrir: ouvrirAvecSelection, problemes: surveillance }));
  });
  relever({
    "clients-notes": `/dashboard/clients/${id(CONTACTS.complet)}?tab=notes`,
    "clients-factures": `/dashboard/clients/${id(CONTACTS.avecFactures)}?tab=invoices`,
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
