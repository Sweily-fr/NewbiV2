/**
 * Bons de livraison : tous les champs de l'éditeur (article, transport,
 * adresse de livraison saisie, paramètres), organisation « Atelier ».
 * Chaque cas crée son bon, retrouvé en base par le nom unique de son
 * article. Valeurs acceptées : de vraies adresses et de vrais noms (« n° »,
 * « Cedex », « 12/14 », apostrophe typographique).
 */
import { expect } from "../outils.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { documentsAvecArticle } from "../base.mjs";
import { attendreCalme } from "../navigation.mjs";
import { ALPHA } from "../creation.mjs";
import { choisirClient, continuer } from "../editeur.mjs";
import { LISTE, nouveauBonLivraison } from "./editeur.mjs";

const ACCENT_DECOMPOSE = String.fromCharCode(0x301);
const retourALaListe = async (_zone, page, timeout = 15_000) => expect(page).toHaveURL(new RegExp(`${LISTE}(\\?|$)`), { timeout });
const enregistre = async (v) => (await documentsAvecArticle("deliverynotes", v.nom || v.article))[0] || null;
const creer = (zone) => zone.page().getByRole("button", { name: "Créer le bon de livraison" }).click();

/** Ajoute le premier article et l'ouvre (il arrive replié, titre « Article 1 »). */
async function ouvrirArticle(page) {
  await page.getByRole("button", { name: "Ajouter un article" }).first().click();
  if (!(await page.locator("#item-description-0").isVisible({ timeout: 2_000 }).catch(() => false))) {
    await page.getByRole("button", { name: /Article 1\b/ }).first().click();
  }
  await expect(page.locator("#item-description-0")).toBeVisible();
}

async function ajouterUnArticle(page, nom, quantite = "1") {
  await ouvrirArticle(page);
  await page.locator("#item-description-0").fill(nom);
  await page.locator("#item-quantity-0").fill(quantite);
  await attendreCalme(page);
}

// --- Article ---------------------------------------------------------------------

verifierFormulaire({
  nom: "Nouveau bon de livraison : article",
  ouvrir: async (page) => {
    await nouveauBonLivraison(page);
    await choisirClient(page, ALPHA);
    await continuer(page);
    await ouvrirArticle(page);
    return page.getByText("Articles et produits").first();
  },
  remplir: async (zone, v) => {
    const page = zone.page();
    for (const [selecteur, valeur] of [
      ["#item-description-0", v.nom],
      ["#item-quantity-0", v.quantite],
      ["#item-details-0", v.details],
      ["#item-reference-0", v.reference],
    ]) {
      if (valeur !== undefined) await page.locator(selecteur).fill(String(valeur));
    }
    await attendreCalme(page);
  },
  valider: creer,
  valeurs: (cas) => ({ nom: `Livraison ${marque(cas)}`, quantite: "3", details: "", reference: "" }),
  enregistre,
  ferme: retourALaListe,
  champs: {
    Désignation: {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.items[0].description,
      acceptes: {
        "avec « œ », apostrophe typographique et « n° »": "Œuvre d’art n° 3 livrée",
        "avec un accent décomposé (copié depuis un Mac)": `Cafe${ACCENT_DECOMPOSE} en grains livré`,
        "texte piégé (balise image)": "<img src=x onerror=alert(1)> livré",
      },
    },
    Quantité: {
      cle: "quantite",
      lu: (doc) => doc.items[0].quantity,
      normaliser: (v) => Number(String(v).replace(",", ".")),
      acceptes: { "décimale avec une virgule (2,5)": "2,5", "une demi-palette (0,5)": "0,5" },
    },
    "Référence produit": {
      cle: "reference",
      lu: (doc) => doc.items[0].reference,
      acceptes: { "avec barre oblique et tirets": "REF-2026/A-01" },
    },
    Détails: {
      cle: "details",
      lu: (doc) => doc.items[0].details,
      acceptes: { "numéro de lot et de série": "Lot n° 42 – série SN-7781" },
    },
  },
});

// --- Transport et adresse de livraison ---------------------------------------------

verifierFormulaire({
  nom: "Nouveau bon de livraison : transport et adresse",
  ouvrir: async (page) => {
    await nouveauBonLivraison(page);
    await choisirClient(page, ALPHA);
    await page.getByRole("checkbox", { name: "Utiliser l'adresse du client" }).uncheck();
    return page.locator("main");
  },
  remplir: async (zone, v) => {
    const page = zone.page();
    for (const [indication, valeur] of [
      [/^Ex\. Chronopost/, v.transporteur],
      ["Ex. XY123456789FR", v.suivi],
      ["Nom du destinataire ou du site", v.destinataire],
      ["Numéro et rue", v.rue],
      ["75001", v.codePostal],
      ["Paris", v.ville],
    ]) {
      if (valeur !== undefined) await page.getByPlaceholder(indication, { exact: typeof indication === "string" }).fill(valeur);
    }
    await continuer(page);
    await ajouterUnArticle(page, v.article);
  },
  valider: creer,
  valeurs: (cas) => ({
    article: `Transport ${marque(cas)}`,
    transporteur: "Chronopost",
    suivi: "XY123456789FR",
    destinataire: "Entrepôt Alpha",
    rue: "12 rue des Entrepôts",
    codePostal: "93200",
    ville: "Saint-Denis",
  }),
  enregistre,
  ferme: retourALaListe,
  champs: {
    Transporteur: {
      cle: "transporteur",
      lu: (doc) => doc.carrier,
      refuses: { "de 101 caractères": "T".repeat(101) },
      acceptes: { "avec accents et « & »": "Transports Lefèvre & Fils", "livraison en propre": "Livraison en propre" },
    },
    "Numéro de suivi": {
      cle: "suivi",
      lu: (doc) => doc.trackingNumber,
      refuses: { "avec un chevron": "XY<12>" },
      acceptes: { "avec tirets": "6A-1234-5678" },
    },
    Destinataire: {
      cle: "destinataire",
      lu: (doc) => doc.deliveryAddress?.fullName,
      acceptes: { "avec « n° » et un chiffre": "Entrepôt n° 2", "avec « & »": "Dupont & Fils", "avec apostrophe typographique": "L’Atelier du Bois" },
    },
    Rue: {
      cle: "rue",
      lu: (doc) => doc.deliveryAddress?.street,
      acceptes: { "avec « n° » et bâtiment": "5 rue de l'Église, Bât. A n°3", "avec une barre oblique": "12/14 rue des Tanneurs" },
    },
    Ville: {
      cle: "ville",
      lu: (doc) => doc.deliveryAddress?.city,
      acceptes: { "avec Cedex": "Paris Cedex 08", composée: "Saint-Étienne" },
    },
  },
});

// --- Paramètres (notes) ------------------------------------------------------------

verifierFormulaire({
  nom: "Nouveau bon de livraison : paramètres",
  ouvrir: async (page) => {
    await nouveauBonLivraison(page);
    await choisirClient(page, ALPHA);
    await page.locator("main").getByRole("button", { name: "Paramètres", exact: true }).click();
    await expect(page.getByRole("button", { name: "Appliquer à ce bon de livraison" })).toBeVisible();
    return page.locator("main");
  },
  remplir: async (zone, v) => {
    const page = zone.page();
    for (const [selecteur, valeur] of [
      ["#header-notes", v.entete],
      ["#delivery-notes", v.remarques],
      ["#footer-notes", v.basDePage],
    ]) {
      if (valeur !== undefined) await page.locator(selecteur).fill(valeur);
    }
    await page.getByRole("button", { name: "Appliquer à ce bon de livraison" }).click();
    await page.waitForTimeout(500);
    if (await page.getByRole("button", { name: "Appliquer à ce bon de livraison" }).isVisible().catch(() => false)) return;
    await continuer(page);
    await ajouterUnArticle(page, v.article);
  },
  valider: async (zone) => {
    const bouton = zone.page().getByRole("button", { name: "Créer le bon de livraison" });
    if (await bouton.isVisible().catch(() => false)) await bouton.click();
  },
  valeurs: (cas) => ({ article: `Notes ${marque(cas)}`, entete: "", remarques: "", basDePage: "" }),
  enregistre,
  ferme: retourALaListe,
  champs: {
    "Notes d'en-tête": {
      cle: "entete",
      lu: (doc) => doc.headerNotes,
      refuses: { "de 1 001 caractères": "n".repeat(1001) },
      acceptes: { "avec « œ » et « ’ »": "Livraison du cœur de l’entrepôt" },
    },
    "Remarques de livraison": {
      cle: "remarques",
      lu: (doc) => doc.notes,
      acceptes: { "réserves sur deux lignes": "Carton abîmé\nRéserves émises à la réception", "longues (2 500 caractères)": "Réserve. ".repeat(278).trim() },
    },
    "Notes de bas de page": {
      cle: "basDePage",
      lu: (doc) => doc.footerNotes,
      acceptes: { "avec accents": "Merci de vérifier la marchandise à réception." },
    },
  },
});
