/**
 * « Tous les champs » des éditeurs de devis et de bons de commande (même
 * formulaire) : un article, puis les paramètres du document (notes,
 * conditions générales, bas de page). Organisation « Atelier » (compte par
 * défaut des tests) : chaque cas crée son document, retrouvé en base par le
 * nom unique de son article.
 *
 * Valeurs acceptées : de vraies saisies (accents, « œ », apostrophe
 * typographique « ’ » que mettent d'office le Mac et l'iPhone, « n° »,
 * montants à virgule, accent décomposé d'un texte copié depuis un Mac, trait
 * d'union conditionnel d'un texte copié depuis Word). Un refus de l'une
 * d'elles est un défaut : la saisie d'un vrai client serait impossible.
 */
import { expect } from "@playwright/test";
import { verifierFormulaire, marque } from "../champs.mjs";
import { documentsAvecArticle } from "../base.mjs";
import { attendreCalme } from "../navigation.mjs";
import { ALPHA } from "../creation.mjs";
import { choisirClient, continuer, ouvrirEditeur } from "../editeur.mjs";

// Caractères invisibles écrits par leur code (l'outil d'écriture des fichiers les transformerait).
const ACCENT_DECOMPOSE = String.fromCharCode(0x301);
const TRAIT_CONDITIONNEL = String.fromCharCode(0xad);

const etapeArticles = (page) => page.getByText("Articles et produits").first();

async function ouvrirArticle(page, document) {
  await ouvrirEditeur(page, document.editeur);
  await choisirClient(page, ALPHA);
  await continuer(page);
  await page.getByRole("button", { name: "Ajouter un article" }).first().click();
  await expect(page.locator("#item-description-0")).toBeVisible();
  return etapeArticles(page);
}

/** Remplit le premier article ; une valeur absente laisse le champ tel quel. */
async function remplirArticle(page, v) {
  const champs = [
    ["#item-description-0", v.nom],
    ["#item-quantity-0", v.quantite],
    ["#item-price-0", v.prix],
    ["#item-details-0", v.details],
  ];
  for (const [selecteur, valeur] of champs) {
    if (valeur === undefined) continue;
    const champ = page.locator(selecteur);
    if (!(await champ.count())) continue;
    await champ.fill(String(valeur));
  }
  await attendreCalme(page);
}

const retourALaListe = (document) => async (_zone, page, timeout = 15_000) => expect(page).toHaveURL(new RegExp(`${document.liste}(\\?|$)`), { timeout });
const enregistreParArticle = (document) => async (v) => (await documentsAvecArticle(document.collection, v.nom || v.article))[0] || null;

/**
 * `document` : { nom (« Nouveau devis »), editeur, liste, collection, boutonCreer, appliquer }.
 */
export function champsDeLArticle(document) {
  verifierFormulaire({
    nom: `${document.nom} : article`,
    ouvrir: (page) => ouvrirArticle(page, document),
    remplir: (zone, v) => remplirArticle(zone.page(), v),
    valider: (zone) => zone.page().getByRole("button", { name: document.boutonCreer }).click(),
    valeurs: (cas) => ({ nom: `Article ${marque(cas)} ${document.collection}`, quantite: "2", prix: "150", details: "" }),
    enregistre: enregistreParArticle(document),
    ferme: retourALaListe(document),
    champs: {
      Désignation: {
        cle: "nom",
        obligatoire: true,
        lu: (doc) => doc.items[0].description,
        acceptes: {
          "avec « œ », apostrophe typographique et « n° »": `Œuvre d’art n° 3 ${document.collection}`,
          "avec un accent décomposé (copié depuis un Mac)": `Cafe${ACCENT_DECOMPOSE} en grains ${document.collection}`,
          "avec un trait d'union conditionnel (copié depuis Word)": `Instal${TRAIT_CONDITIONNEL}lation électrique ${document.collection}`,
          "avec un émoji": `Livraison express 🚚 ${document.collection}`,
          "texte piégé (balise image)": `<img src=x onerror=alert(1)> ${document.collection}`,
        },
      },
      Quantité: {
        cle: "quantite",
        lu: (doc) => doc.items[0].quantity,
        normaliser: (v) => Number(String(v).replace(",", ".")),
        acceptes: { "décimale avec une virgule (1,5)": "1,5", "une demi-journée (0,5)": "0,5" },
      },
      "Prix unitaire": {
        cle: "prix",
        lu: (doc) => doc.items[0].unitPrice,
        normaliser: (v) => Number(String(v).replace(",", ".")),
        acceptes: { "avec une virgule (1234,56)": "1234,56", "à zéro (prestation offerte)": "0" },
      },
      "Détails supplémentaires": {
        cle: "details",
        lu: (doc) => doc.items[0].details,
        acceptes: { "sur deux lignes": "Ligne 1\nLigne 2", "avec accents et « n° »": "Pièce n° 12, façade côté rue" },
      },
    },
  });
}

/** Paramètres du document : ouverts depuis l'étape « client », appliqués, puis un article unique. */
export function champsDesParametres(document) {
  async function ouvrirParametres(page) {
    await ouvrirEditeur(page, document.editeur);
    await choisirClient(page, ALPHA);
    await page.locator("main button:has(svg.lucide-settings)").first().click();
    await expect(page.getByRole("button", { name: document.appliquer })).toBeVisible();
    return page.locator("main");
  }
  async function remplir(zone, v) {
    const page = zone.page();
    for (const [selecteur, valeur] of [
      ["#header-notes", v.entete],
      ["#terms-conditions", v.cgv],
      ["#footer-notes", v.basDePage],
    ]) {
      if (valeur !== undefined) await page.locator(selecteur).fill(valeur);
    }
    await page.getByRole("button", { name: document.appliquer }).click();
    await page.waitForTimeout(500);
    // Toujours dans les paramètres : le refus s'affiche ici, rien à saisir de plus.
    if (await page.getByRole("button", { name: document.appliquer }).isVisible().catch(() => false)) return;
    await continuer(page);
    await page.getByRole("button", { name: "Ajouter un article" }).first().click();
    await page.locator("#item-description-0").fill(v.article);
    const prix = page.locator("#item-price-0");
    await prix.fill("100");
    await attendreCalme(page);
    if ((await prix.inputValue()) !== "100") await prix.fill("100");
    await expect(prix).toHaveValue("100");
  }
  verifierFormulaire({
    nom: `${document.nom} : paramètres`,
    ouvrir: ouvrirParametres,
    remplir,
    valider: async (zone) => {
      const bouton = zone.page().getByRole("button", { name: document.boutonCreer });
      if (await bouton.isVisible().catch(() => false)) await bouton.click();
    },
    valeurs: (cas) => ({ article: `Paramètres ${marque(cas)} ${document.collection}`, entete: "", cgv: "", basDePage: "" }),
    enregistre: enregistreParArticle(document),
    ferme: retourALaListe(document),
    champs: {
      "Notes d'en-tête": {
        cle: "entete",
        lu: (doc) => doc.headerNotes,
        refuses: { "de 1 001 caractères": "n".repeat(1001) },
        acceptes: { "avec « œ », « ’ » et « n° »": "Cœur de l’ouvrage : livraison prévue n° 3", "sur deux lignes": "Première ligne\nSeconde ligne" },
      },
      "Conditions générales": {
        cle: "cgv",
        lu: (doc) => doc.termsAndConditions,
        acceptes: { "longues (6 000 caractères)": "Article 1. ".repeat(600).trim(), "texte piégé (balise image)": "Conditions <img src=x onerror=alert(1)>" },
      },
      "Notes de bas de page": {
        cle: "basDePage",
        lu: (doc) => doc.footerNotes,
        acceptes: { "de 2 500 caractères (au-delà de l'ancienne limite de 2 000)": "Bas de page. ".repeat(192).trim() },
      },
    },
  });
}
