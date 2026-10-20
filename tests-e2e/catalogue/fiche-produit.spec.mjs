/**
 * Fiche produit (« Ajouter un produit ») : tous les champs, avec le compte
 * « Saisie Achats ». Chaque cas est un produit distinct, retrouvé en base par
 * sa référence propre au cas.
 *
 * Valeurs acceptées : de vrais noms de produits (« Bœuf bourguignon »,
 * « L’Atelier », « Vis n° 6 », « m² »), des prix à virgule, des taux de TVA
 * réduits, des unités. Un refus de l'une d'elles est un défaut : le produit
 * ne pourrait pas être saisi.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { PRODUITS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";

test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

const ORG = COMPTES.saisieAchats.organisation._id;
const slug = (cas) => marque(cas).toLowerCase().replace(/\s+/g, "-");
/** Lettres seules, uniques par cas (un nom de produit ne doit pas en reprendre un autre). */
function lettres(cas) {
  let h = 0;
  for (const c of marque(cas)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let s = "";
  for (let i = 0; i < 6; i++, h = Math.floor(h / 26)) s += String.fromCharCode(97 + (h % 26));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const INDICATIONS = {
  nom: "Ex: Ordinateur portable Dell XPS 13",
  reference: "Ex: DELL-XPS13-2024",
  categorie: "Ex: Matériel informatique, Fournitures de bureau...",
  description: "Description détaillée du produit...",
};

async function ouvrirCatalogue(page) {
  await ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("heading", { name: "Gestion du Catalogue" }) });
}

async function ouvrirFiche(page) {
  await ouvrirCatalogue(page);
  await page.getByRole("button", { name: "Ajouter un produit" }).click();
  const fenetre = page.getByRole("dialog").filter({ has: page.getByText("Ajouter un produit et/ou service", { exact: true }) });
  await expect(fenetre).toBeVisible();
  await attendreCalme(page);
  return fenetre;
}

/** Choisit une option d'une liste Radix de la fiche (0 : TVA, 1 : unité). */
async function choisir(fenetre, rang, option) {
  const page = fenetre.page();
  await fenetre.getByRole("combobox").nth(rang).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}

async function remplir(fenetre, v) {
  for (const [cle, indication] of Object.entries(INDICATIONS)) {
    if (v[cle] !== undefined) await fenetre.getByPlaceholder(indication, { exact: true }).fill(v[cle]);
  }
  if (v.prix !== undefined) {
    // Saisie au clavier, comme une personne (« 12,50 » avec la virgule française).
    const prix = fenetre.getByPlaceholder("0.00", { exact: true });
    await prix.fill("");
    if (v.prix) await prix.pressSequentially(v.prix);
  }
  if (v.tva) await choisir(fenetre, 0, v.tva);
  if (v.unite) await choisir(fenetre, 1, v.unite);
}

async function produitEnregistre(v) {
  const ou = [{ reference: v.reference }];
  if (v.nom && v.nom.trim()) ou.push({ name: v.nom.trim() });
  return (await base()).collection("products").findOne({ workspaceId: ORG, $or: ou });
}

const boutonValider = (fenetre) => fenetre.getByRole("button", { name: "Créer le produit et/ou service" });

verifierFormulaire({
  nom: "Nouveau produit",
  ouvrir: ouvrirFiche,
  remplir,
  valider: (fenetre) => boutonValider(fenetre).click(),
  boutonValider,
  valeurs: (cas) => ({
    nom: `Produit ${lettres(cas)}`,
    reference: `REF-${slug(cas)}`.slice(0, 40),
    prix: "42",
    categorie: "Tests",
    description: "Créé par le test des champs",
  }),
  enregistre: produitEnregistre,
  champs: {
    "Nom du produit": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.name,
      refuses: { "d'une seule lettre": "A", "avec des chevrons": "Produit <b>gras</b>", "de 201 caractères": "P".repeat(201) },
      acceptes: {
        "avec accents et chiffres": "Câble électrique 2,5 mm Évolution",
        "avec ligature œ (Bœuf bourguignon)": "Bœuf bourguignon maison",
        "avec apostrophe typographique (L’Atelier)": "Coffret L’Atelier du goût",
        "avec « n° » et « m² »": "Dalle n° 6 de 1 m²",
      },
    },
    Référence: {
      cle: "reference",
      lu: (doc) => doc.reference,
      acceptes: { "avec tirets et barre oblique": "REF-2026/001-B" },
    },
    "Prix unitaire (HT)": {
      cle: "prix",
      obligatoire: true,
      sansEspaces: true,
      lu: (doc) => doc.unitPrice,
      refuses: { négatif: "-5" },
      acceptes: { "avec une virgule (12,50)": "12,50", "nul (produit offert)": "0", "de 1 000 000 €": "1000000" },
      normaliser: (v) => Number(v.replace(",", ".")),
    },
    "Taux de TVA": {
      cle: "tva",
      lu: (doc) => doc.vatRate,
      acceptes: { "5,5 % (taux réduit)": "5,5% - Taux réduit", "0 % (exonéré)": "0% - Exonéré" },
      normaliser: (v) => Number(v.split("%")[0].replace(",", ".")),
    },
    Unité: {
      cle: "unite",
      lu: (doc) => doc.unit,
      acceptes: { "mètre carré": "m² - mètre carré", heure: "heure" },
      normaliser: (v) => v.split(" - ")[0],
    },
    Catégorie: {
      cle: "categorie",
      lu: (doc) => doc.category,
      acceptes: { "avec accents": "Matériel électrique", "texte piégé (balise image)": "<img src=x onerror=alert(1)>" },
    },
    Description: {
      cle: "description",
      lu: (doc) => doc.description,
      acceptes: { "sur deux lignes": "Première ligne\nSeconde ligne", "texte piégé (balise image)": "<img src=x onerror=alert(1)> description" },
    },
  },
});

// --- Cas qui touchent un produit existant ------------------------------------

test.describe("Nouveau produit : doublons et produits existants", () => {
  test("Même nom qu'un produit du catalogue : refusé, avec un message", async ({ page }) => {
    const fenetre = await ouvrirFiche(page);
    await remplir(fenetre, { nom: PRODUITS_SAISIE.doublon.name, reference: "DOUBLON-NOM", prix: "20" });
    await boutonValider(fenetre).click();
    await etape(page, "Message « existe déjà »", async () => {
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: /existe déjà/i }).first()).toBeVisible();
    }, { capture: "ecran" });
    await expect(fenetre).toBeVisible();
    expect(await (await base()).collection("products").countDocuments({ workspaceId: ORG, name: PRODUITS_SAISIE.doublon.name })).toBe(1);
  });

  test("Même nom suivi d'une espace : refusé aussi, pas de second produit", async ({ page }) => {
    const fenetre = await ouvrirFiche(page);
    await remplir(fenetre, { nom: `${PRODUITS_SAISIE.doublon.name} `, reference: "DOUBLON-ESPACE", prix: "20" });
    await boutonValider(fenetre).click();
    await page.waitForTimeout(1_500);
    expect(
      await (await base()).collection("products").countDocuments({ workspaceId: ORG, name: PRODUITS_SAISIE.doublon.name }),
      "Un second produit du même nom a été créé (l'espace finale contourne le contrôle des doublons)",
    ).toBe(1);
  });

  test("Le texte piégé saisi dans la fiche reste du texte dans la liste et la fiche", async ({ page }) => {
    const piege = "<img src=x-fiche onerror=\"window.__piege='execute'\">";
    const fenetre = await ouvrirFiche(page);
    await remplir(fenetre, { nom: "Produit au texte piégé", reference: "PIEGE-FICHE", prix: "5", categorie: piege, description: piege });
    await boutonValider(fenetre).click();
    await expect(fenetre).toBeHidden({ timeout: 15_000 });
    await ouvrirCatalogue(page);
    await page.getByPlaceholder("Recherchez par nom ou par référence...").fill("PIEGE-FICHE");
    await attendreCalme(page);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code saisi dans la fiche s'est exécuté").toBeNull();
    expect(await page.locator("img[src='x-fiche']").count(), "La balise saisie dans la fiche a été créée dans la page").toBe(0);
  });
});
