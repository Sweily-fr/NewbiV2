/**
 * Catalogue : droits vérifiés à l'API, pas seulement à l'écran (produits,
 * images, champs personnalisés), pour le Membre, l'Éditeur, une autre
 * entreprise et un visiteur (voir achats-banque.mjs). Plus : un
 * produit d'une autre entreprise ne peut pas être lié, une image venue
 * d'ailleurs n'est pas enregistrée, et un texte piégé écrit par l'Éditeur
 * reste du texte chez le propriétaire.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_INTRUS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { CHAMPS_PRODUITS, CHAMPS_SAISIE, PRODUITS, PRODUITS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { base } from "../base.mjs";
import { ORG, ORG_INTRUS, ORG_SAISIE, PIEGE, avecSession, verifierDroits, verifierPiegeInerte } from "../achats-banque.mjs";

/** Données visées : « Achats » (Membre, intrus, visiteur) ou « Saisie Achats » (Éditeur). */
const CIBLES = {
  [ORG]: { produit: PRODUITS.audit, aSupprimer: PRODUITS.tapis, champ: CHAMPS_PRODUITS.fournisseur, champASupprimer: CHAMPS_PRODUITS.stock, champs: Object.values(CHAMPS_PRODUITS) },
  [ORG_SAISIE]: { produit: PRODUITS_SAISIE.editeur, aSupprimer: PRODUITS_SAISIE.editeur, champ: CHAMPS_SAISIE.aRenommer, champASupprimer: CHAMPS_SAISIE.aSupprimer, champs: Object.values(CHAMPS_SAISIE) },
};
// L'intrus, depuis sa propre organisation, vise les identifiants d'« Achats ».
const cibles = (w) => CIBLES[w] || CIBLES[ORG];
const parId = (doc) => ({ _id: doc._id });
// Image PNG d'un pixel (envoi multipart).
const PNG = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0, 9, 251, 3, 253, 227, 85, 242, 156, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];

const LECTURES = [
  { nom: "Un produit", champ: "product", requete: `query($id: ID!) { product(id: $id) { id name unitPrice } }`, variables: () => ({ id: id(PRODUITS.audit) }) },
  { nom: "Le catalogue", champ: "products", requete: `query($w: ID!) { products(workspaceId: $w, page: 1, limit: 100) { products { id name } totalCount } }`, variables: (w) => ({ w }) },
  { nom: "Les champs personnalisés", champ: "productCustomFields", requete: `query($w: ID!) { productCustomFields(workspaceId: $w) { id name } }`, variables: (w) => ({ w }) },
  { nom: "Un champ personnalisé", champ: "productCustomField", requete: `query($w: ID!, $id: ID!) { productCustomField(workspaceId: $w, id: $id) { id name } }`, variables: (w) => ({ w, id: id(CHAMPS_PRODUITS.fournisseur) }) },
];

const ECRITURES = [
  {
    nom: "Créer un produit",
    editeur: true,
    champ: "createProduct",
    requete: `mutation($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
    variables: (w, qui) => ({ input: { workspaceId: w, name: `Produit créé par ${qui}`, unitPrice: 10, vatRate: 20, unit: "unité" } }),
    temoin: (qui) => ["products", { name: `Produit créé par ${qui}` }],
  },
  {
    nom: "Modifier un produit",
    editeur: true,
    cible: true,
    champ: "updateProduct",
    requete: `mutation($id: ID!, $input: UpdateProductInput!) { updateProduct(id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ id: id(cibles(w).produit), input: { description: `Modifié par ${qui}` } }),
    temoin: (qui, w) => ["products", parId(cibles(w).produit)],
  },
  {
    nom: "Supprimer un produit",
    editeur: false,
    cible: true,
    champ: "deleteProduct",
    requete: `mutation($id: ID!) { deleteProduct(id: $id) }`,
    variables: (w) => ({ id: id(cibles(w).aSupprimer) }),
    temoin: (qui, w) => ["products", parId(cibles(w).aSupprimer)],
  },
  {
    nom: "Envoyer une image de produit",
    editeur: true,
    // L'image part sur le stockage de fichiers (R2), injoignable en CI.
    externe: "stockage de fichiers",
    champ: "uploadProductImage",
    requete: `mutation($w: ID!, $file: Upload!) { uploadProductImage(workspaceId: $w, file: $file) { success url } }`,
    variables: (w) => ({ w, file: null }),
    fichier: { cle: "file", nom: "produit.png", type: "image/png", contenu: PNG },
    // Aucun produit ne change : l'image n'est rattachée qu'à l'enregistrement de la fiche.
    temoin: (qui, w) => ["products", { workspaceId: COMPTE(w), imageUrl: { $exists: true, $ne: null } }],
  },
  {
    nom: "Créer un champ personnalisé",
    editeur: false,
    champ: "createProductCustomField",
    requete: `mutation($w: ID!, $input: CreateProductCustomFieldInput!) { createProductCustomField(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { name: `Champ de ${qui}`, fieldType: "TEXT" } }),
    temoin: (qui) => ["productcustomfields", { name: `Champ de ${qui}` }],
  },
  {
    nom: "Modifier un champ personnalisé",
    editeur: false,
    cible: true,
    champ: "updateProductCustomField",
    requete: `mutation($w: ID!, $id: ID!, $input: UpdateProductCustomFieldInput!) { updateProductCustomField(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({ w, id: id(cibles(w).champ), input: { name: `Renommé par ${qui}` } }),
    temoin: (qui, w) => ["productcustomfields", parId(cibles(w).champ)],
  },
  {
    nom: "Supprimer un champ personnalisé",
    editeur: false,
    cible: true,
    champ: "deleteProductCustomField",
    requete: `mutation($w: ID!, $id: ID!) { deleteProductCustomField(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(cibles(w).champASupprimer) }),
    temoin: (qui, w) => ["productcustomfields", parId(cibles(w).champASupprimer)],
  },
  {
    nom: "Réordonner les champs personnalisés",
    editeur: false,
    cible: true,
    champ: "reorderProductCustomFields",
    requete: `mutation($w: ID!, $ids: [ID!]!) { reorderProductCustomFields(workspaceId: $w, fieldIds: $ids) { id } }`,
    variables: (w) => ({ w, ids: cibles(w).champs.map(id).reverse() }),
    temoin: (qui, w) => ["productcustomfields", { _id: { $in: cibles(w).champs.map((c) => c._id) } }],
  },
];

// Organisation (ObjectId) d'un identifiant d'organisation (témoin des images).
function COMPTE(w) {
  return { [ORG]: PRODUITS.audit.workspaceId, [ORG_SAISIE]: PRODUITS_SAISIE.editeur.workspaceId }[w] || PRODUITS.audit.workspaceId;
}

verifierDroits({
  fonctionnalite: "Catalogue",
  lectures: LECTURES,
  ecritures: ECRITURES,
  fuites: [id(PRODUITS.audit), PRODUITS.audit.name, PRODUITS.ecran.name, id(CHAMPS_PRODUITS.fournisseur), CHAMPS_PRODUITS.fournisseur.name],
});

test.describe("Catalogue : liens et images venus d'ailleurs", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  test("Lier le produit d'une autre entreprise à un produit : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const nom = "Produit de l'intrus avec lien";
    const reponse = await appelApi(
      page,
      `mutation($input: CreateProductInput!) { createProduct(input: $input) { id linkedProducts { productId product { name } } } }`,
      { input: { workspaceId: ORG_INTRUS, name: nom, unitPrice: 5, vatRate: 20, unit: "unité", linkedProducts: [{ productId: id(PRODUITS.pose), quantity: 1 }] } },
      { organisation: ORG_INTRUS },
    );
    expect(JSON.stringify(reponse.data ?? {}), "Le produit lié d'une autre entreprise est renvoyé").not.toContain(PRODUITS.pose.name);
    expect(reponse.errors.map((e) => e.message).join(" | "), "Le lien vers le produit d'une autre entreprise doit être refusé").toMatch(/n'existent pas|introuvable|non trouv/i);
    expect(await (await base()).collection("products").countDocuments({ name: nom }), "Le produit a été créé avec un lien vers une autre entreprise").toBe(0);
  });
});

test.describe("Catalogue : image d'un produit", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Une adresse d'image extérieure envoyée à l'API n'est pas enregistrée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const nom = "Produit avec image extérieure";
    const reponse = await appelApi(
      page,
      `mutation($input: CreateProductInput!) { createProduct(input: $input) { id imageUrl } }`,
      { input: { workspaceId: ORG_SAISIE, name: nom, unitPrice: 5, vatRate: 20, unit: "unité", imageUrl: "https://piege.example/traceur.png" } },
      { organisation: ORG_SAISIE },
    );
    const doc = await (await base()).collection("products").findOne({ name: nom });
    expect(reponse.data?.createProduct?.imageUrl ?? null, "L'image extérieure est renvoyée").toBeNull();
    expect(doc?.imageUrl ?? null, "L'image extérieure a été enregistrée (elle serait chargée dans les PDF)").toBeNull();
  });
});

/**
 * Texte piégé (XSS stockée) : l'Éditeur enregistre, par l'API, une
 * description, une référence et une catégorie qui contiennent du HTML
 * exécutable. Le propriétaire ouvre le catalogue puis la fiche : rien ne
 * doit s'exécuter (la surveillance échoue aussi sur toute boîte de dialogue).
 */
test.describe("Catalogue : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });

  test.beforeAll(async ({ browser }) => {
    const reponse = await avecSession(browser, SESSION_TOKEN_EDITEUR_ACHATS, (page) =>
      appelApi(
        page,
        `mutation($id: ID!, $input: UpdateProductInput!) { updateProduct(id: $id, input: $input) { id } }`,
        { id: id(PRODUITS_SAISIE.piege), input: { description: `${PIEGE} Description`, reference: `${PIEGE}REF`, category: `${PIEGE}Catégorie` } },
        { organisation: ORG_SAISIE },
      ),
    );
    expect(reponse.errors, "L'Éditeur doit pouvoir modifier un produit").toEqual([]);
  });

  test("Liste du catalogue et fiche du produit : le texte s'affiche, rien ne s'exécute", async ({ page }) => {
    await ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("row").filter({ hasText: PRODUITS_SAISIE.piege.name }) });
    await etape(page, "Liste", async () => {
      await page.getByPlaceholder("Recherchez par nom ou par référence...").fill(PRODUITS_SAISIE.piege.name);
      await attendreCalme(page);
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
    await etape(page, "Fiche du produit", async () => {
      await page.getByRole("row").filter({ hasText: PRODUITS_SAISIE.piege.name }).getByRole("button", { name: "Actions du produit" }).click();
      await page.getByRole("menuitem", { name: "Modifier" }).click();
      const fiche = page.getByRole("dialog").filter({ has: page.getByText("Modifier le produit et/ou service", { exact: true }) });
      await expect(fiche.getByPlaceholder("Description détaillée du produit...")).toHaveValue(`${PIEGE} Description`);
      await page.waitForTimeout(1_000);
      await verifierPiegeInerte(page);
    }, { capture: "ecran" });
  });
});
