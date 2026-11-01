/**
 * Catalogue : contrôles de l'API sur les produits créés ou modifiés
 * directement (espace « Catalogue Contrôles », donnees/lot-clients-catalogue.mjs) :
 * image d'un autre espace, bornes des prix et des textes, valeurs des champs
 * personnalisés, pagination. Un refus dit pourquoi et ne laisse rien en base.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { COMPTES_CC, PRODUITS_CC, CHAMPS_PRODUIT_CC, CHAMPS_CC } from "../donnees/lot-clients-catalogue.mjs";

test.use({ storageState: connecte(COMPTES_CC.catalogue.token) });

const COMPTE = COMPTES_CC.catalogue;
const ORG = id(COMPTE.organisation);
const AUTRE_ESPACE = id(COMPTES_CC.integrite.organisation);
const CREER = `mutation($input: CreateProductInput!) { createProduct(input: $input) { id imageUrl } }`;
const MODIFIER = `mutation($id: ID!, $input: UpdateProductInput!) { updateProduct(id: $id, input: $input) { id imageUrl } }`;
const appel = (page, requete, variables) => appelApi(page, requete, variables, { organisation: ORG });
const messages = (reponse) => reponse.errors.map((e) => e.message).join(" | ");
const produitEnBase = async (name) => (await base()).collection("products").findOne({ workspaceId: COMPTE.organisation._id, name });
const produit = (name, extra = {}) => ({ workspaceId: ORG, name, unitPrice: 10, vatRate: 20, unit: "unité", ...extra });

test.beforeEach(async ({ page }) => {
  await ouvrir(page, "/dashboard");
});

test.describe("Catalogue : image d'un produit", () => {
  for (const [cas, url] of [
    ["d'un autre compte R2", "https://pub-autre-compte.r2.dev/x/products/pixel.png"],
    ["rangée dans un autre espace", `https://pub-autre-compte.r2.dev/${AUTRE_ESPACE}/products/pixel.png`],
  ]) {
    test(`Créer un produit avec une image ${cas} : image non enregistrée`, async ({ page }) => {
      const nom = `Produit image ${cas}`;
      await appel(page, CREER, { input: produit(nom, { imageUrl: url }) });
      const doc = await produitEnBase(nom);
      if (doc) expect(doc.imageUrl ?? null, "Image d'ailleurs enregistrée sur le produit").toBeNull();
    });

    test(`Modifier un produit avec une image ${cas} : image non enregistrée`, async ({ page }) => {
      await appel(page, MODIFIER, { id: id(PRODUITS_CC.image), input: { imageUrl: url } });
      const doc = await (await base()).collection("products").findOne({ _id: PRODUITS_CC.image._id });
      expect(doc.imageUrl ?? null, "Image d'ailleurs enregistrée sur le produit").toBeNull();
    });
  }
});

test.describe("Catalogue : bornes des champs d'un produit", () => {
  for (const [cas, extra] of [
    ["prix unitaire de 1e15 €", { unitPrice: 1e15 }],
    ["unité de 10 000 caractères", { unit: "u".repeat(10_000) }],
    ["référence de 10 000 caractères", { reference: "R".repeat(10_000) }],
    ["catégorie de 10 000 caractères", { category: "C".repeat(10_000) }],
    ["description de 200 000 caractères", { description: "d".repeat(200_000) }],
  ]) {
    test(`${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      const nom = `Produit borné ${cas}`;
      const reponse = await appel(page, CREER, { input: produit(nom, extra) });
      expect(reponse.data?.createProduct ?? null, `Produit créé avec ${cas}`).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await produitEnBase(nom)).toBeNull();
    });
  }

  test("Prix de 0,0001 € et TVA de 5,5 % : enregistrés tels quels", async ({ page }) => {
    const reponse = await appel(page, CREER, { input: produit("Vis à l'unité", { unitPrice: 0.0001, vatRate: 5.5 }) });
    expect(reponse.errors).toEqual([]);
    const doc = await produitEnBase("Vis à l'unité");
    expect(doc.unitPrice).toBe(0.0001);
    expect(doc.vatRate).toBe(5.5);
  });
});

test.describe("Catalogue : champs personnalisés contrôlés par l'API", () => {
  for (const [cas, champ, value] of [
    ["nombre « abc »", CHAMPS_PRODUIT_CC.nombre, "abc"],
    ["choix hors des options", CHAMPS_PRODUIT_CC.choix, "luxe"],
    ["valeur objet", CHAMPS_PRODUIT_CC.nombre, { $gt: "" }],
    ["champ d'un autre espace", CHAMPS_CC.nombre, "12"],
  ]) {
    test(`Créer un produit avec ${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      const nom = `Produit champ ${cas}`;
      const reponse = await appel(page, CREER, { input: produit(nom, { customFields: [{ fieldId: id(champ), value }] }) });
      expect(reponse.data?.createProduct ?? null).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await produitEnBase(nom)).toBeNull();
    });
  }

  test("Valeurs justes (nombre, option) : enregistrées", async ({ page }) => {
    const reponse = await appel(page, CREER, { input: produit("Produit aux champs justes", { customFields: [{ fieldId: id(CHAMPS_PRODUIT_CC.nombre), value: 2.5 }, { fieldId: id(CHAMPS_PRODUIT_CC.choix), value: "standard" }] }) });
    expect(reponse.errors).toEqual([]);
    expect((await produitEnBase("Produit aux champs justes")).customFields).toHaveLength(2);
  });
});

test.describe("Catalogue : pagination hostile", () => {
  test("products avec page 0 ou -1, taille 0, -5 ou 100 000 : réponse bornée, jamais d'erreur technique", async ({ page }) => {
    for (const [p, l] of [[0, 10], [-1, 10], [1, 0], [1, -5], [1, 100_000]]) {
      const reponse = await appel(page, `query($w: ID!, $p: Int, $l: Int) { products(workspaceId: $w, page: $p, limit: $l) { products { id } } }`, { w: ORG, p, l });
      expect.soft(reponse.errors, `page ${p} taille ${l}`).toEqual([]);
    }
  });
});
