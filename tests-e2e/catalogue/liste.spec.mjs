/**
 * Catalogue : ce que la liste affiche comparé à la base (pages, compteur,
 * ordre, colonnes, champs personnalisés, produits liés), recherche, filtre
 * par catégorie, et chaque action vérifiée en base (modifier, supprimer,
 * suppression groupée, copier la référence, produits liés « X pour Y »,
 * champs personnalisés, image). Lecture : « Achats » (jamais modifiée) ;
 * actions : « Saisie Achats », un produit par action.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CHAMPS_SAISIE, PRODUITS, PRODUITS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_FREELANCE_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";

const RECHERCHE = "Recherchez par nom ou par référence...";
const ORG_ACHATS = COMPTES.achats.organisation._id;
const ORG_SAISIE = COMPTES.saisieAchats.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const ligne = (page, nom) => page.getByRole("row").filter({ has: page.getByText(nom, { exact: true }) });
const enBase = async (produit) => (await base()).collection("products").findOne({ _id: produit._id });

async function ouvrirCatalogue(page) {
  await ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("heading", { name: "Gestion du Catalogue" }) });
  await expect(page.getByRole("row").nth(1)).toBeVisible();
}

async function rechercher(page, texte) {
  await page.getByPlaceholder(RECHERCHE).fill(texte);
  await attendreCalme(page);
  await page.waitForTimeout(500);
}

/** Noms affichés dans le tableau, dans l'ordre. */
async function nomsAffiches(page) {
  const lignes = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Actions du produit" }) });
  const noms = [];
  for (const l of await lignes.all()) noms.push((await l.getByRole("cell").nth(1).innerText()).trim());
  return noms;
}

async function actionDuProduit(page, nom, action) {
  await rechercher(page, nom);
  await cliquer(page, ligne(page, nom).getByRole("button", { name: "Actions du produit" }));
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

// --- Affichage (organisation « Achats ») ----------------------------------------

test.describe("Catalogue : ce que la liste affiche", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("Deux pages de 10 : chaque produit une fois, aucun d'une autre entreprise, compteur juste", async ({ page }) => {
    await ouvrirCatalogue(page);
    const enBaseNoms = (await (await base()).collection("products").find({ workspaceId: ORG_ACHATS }).toArray()).map((p) => p.name);
    const page1 = await nomsAffiches(page);
    expect(page1.length, "10 produits par page").toBe(10);
    await cliquer(page, page.getByRole("button", { name: "Page suivante" }));
    await attendreCalme(page);
    const page2 = await nomsAffiches(page);
    expect([...page1, ...page2].sort(), "Les deux pages réunies doivent montrer exactement le catalogue").toEqual([...enBaseNoms].sort());
    await expect(page.getByText(`0 sur ${enBaseNoms.length} ligne(s) sélectionnée(s).`)).toBeVisible();
  });

  test("Ordre alphabétique français : « Écran » avec les E, « Câble » avec les C", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "20" }).click();
    await attendreCalme(page);
    const noms = await nomsAffiches(page);
    const attendu = [...noms].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    expect(noms, "Les noms qui commencent par une lettre accentuée sont rangés à la fin de la liste").toEqual(attendu);
  });

  test("Prix et taux de TVA au format français (1 200,00 €, 5,5 %)", async ({ page }) => {
    await ouvrirCatalogue(page);
    await rechercher(page, PRODUITS.audit.name);
    await expect.soft(ligne(page, PRODUITS.audit.name), "Prix affiché « 1200.00 € » au lieu de « 1 200,00 € »").toContainText(/1\s200,00\s€/);
    await rechercher(page, PRODUITS.livre.name);
    await expect.soft(ligne(page, PRODUITS.livre.name), "Taux affiché « 5.5% » au lieu de « 5,5 % »").toContainText(/5,5\s?%/);
  });

  test("Produit offert et TVA à 0 % : « 0,00 € » et « 0 % » affichés, pas un tiret", async ({ page }) => {
    await ouvrirCatalogue(page);
    await rechercher(page, PRODUITS.visite.name);
    await expect.soft(ligne(page, PRODUITS.visite.name), "Un produit à 0 € affiche « - » comme s'il n'avait pas de prix").toContainText(/0[,.]00\s?€/);
    await rechercher(page, PRODUITS.formation.name);
    await expect.soft(ligne(page, PRODUITS.formation.name), "Une TVA à 0 % s'affiche « - » comme si le taux manquait").toContainText(/\b0\s?%/);
  });

  test("Champs personnalisés : une colonne par champ (à afficher), avec la valeur de chaque produit", async ({ page }) => {
    await ouvrirCatalogue(page);
    // Colonnes des champs personnalisés masquées au départ : on les affiche.
    for (const champ of ["Fournisseur habituel", "Stock"]) {
      await page.getByRole("button", { name: "Filtres" }).click();
      await page.getByRole("menuitem", { name: /^Colonnes visibles/ }).click();
      await page.getByRole("menu").last().getByText(champ, { exact: true }).click();
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
    await expect(page.getByRole("columnheader", { name: "Fournisseur habituel" })).toBeVisible();
    await rechercher(page, PRODUITS.audit.name);
    await expect(ligne(page, PRODUITS.audit.name)).toContainText("Cabinet Martin");
    await rechercher(page, PRODUITS.cable.name);
    await expect(ligne(page, PRODUITS.cable.name)).toContainText("42");
  });

  test("Produits liés : la fiche de « Pose de carrelage » montre « 1 pour 1 m² » et « 1 pour 5 m² »", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS.pose.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    await expect(fiche).toBeVisible();
    await expect(fiche.getByRole("spinbutton", { name: `Quantité de ${PRODUITS.carrelage.name} à ajouter` })).toHaveValue("1");
    await expect(fiche.getByRole("spinbutton", { name: `Quantité de ${PRODUITS.colle.name} à ajouter` })).toHaveValue("1");
    const bases = fiche.getByRole("spinbutton", { name: `Quantité de ${PRODUITS.pose.name} servant de base` });
    await expect(bases).toHaveCount(2);
    expect(await bases.evaluateAll((els) => els.map((e) => e.value))).toEqual(["1", "5"]);
  });

  test("Les produits d'une autre entreprise n'apparaissent jamais", async ({ page }) => {
    await ouvrirCatalogue(page);
    await rechercher(page, PRODUITS_SAISIE.aModifier.name);
    await expect(page.getByRole("row").filter({ hasText: PRODUITS_SAISIE.aModifier.name })).toHaveCount(0);
  });
});

test.describe("Catalogue : recherche et filtres", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  for (const [nom, saisie, attendus] of [
    ["sans accent (« ecran »)", "ecran", [PRODUITS.ecran.name]],
    ["par la référence", "DEV-001", [PRODUITS.developpement.name]],
    ["par la catégorie", "Matériaux", [PRODUITS.carrelage.name, PRODUITS.colle.name]],
    ["en majuscules (« CABLE »)", "CABLE", [PRODUITS.cable.name]],
  ]) {
    test(`Recherche ${nom}`, async ({ page }) => {
      await ouvrirCatalogue(page);
      await rechercher(page, saisie);
      expect((await nomsAffiches(page)).sort()).toEqual([...attendus].sort());
    });
  }

  test("Recherche exacte (bouton « Aa ») : « ecran » ne trouve plus « Écran »", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Respecter les majuscules et les accents" }).click();
    await rechercher(page, "ecran");
    expect(await nomsAffiches(page)).toEqual([]);
    await rechercher(page, "Écran");
    expect(await nomsAffiches(page)).toEqual([PRODUITS.ecran.name]);
  });

  test("Filtre par catégorie : seuls les produits « Formation »", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: "Filtrer par catégorie" }).click();
    // Cases sans nom accessible : on clique sur leur libellé.
    await page.getByRole("menu").last().getByText("Formation", { exact: true }).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await attendreCalme(page);
    expect(await nomsAffiches(page)).toEqual([PRODUITS.formation.name]);
  });

  test("20 produits par page : tout le catalogue sur une page", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "20" }).click();
    await attendreCalme(page);
    const total = await (await base()).collection("products").countDocuments({ workspaceId: ORG_ACHATS });
    expect((await nomsAffiches(page)).length).toBe(Math.min(20, total));
    await expect(page.getByRole("button", { name: "Page suivante" })).toBeDisabled();
  });
});

// --- Actions (organisation « Saisie Achats ») -------------------------------------

test.describe("Catalogue : chaque action vérifiée en base", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Modifier un produit : prix à virgule et catégorie enregistrés", async ({ page }) => {
    const p = PRODUITS_SAISIE.aModifier;
    await ouvrirCatalogue(page);
    await actionDuProduit(page, p.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    const prix = fiche.getByPlaceholder("0.00", { exact: true });
    await prix.fill("");
    await prix.pressSequentially("150.75");
    await fiche.getByPlaceholder("Ex: Matériel informatique, Fournitures de bureau...").fill("Prestations premium");
    await fiche.getByRole("button", { name: "Modifier le produit et/ou service" }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    await expect(notification(page, "Produit modifié avec succès")).toBeVisible();
    const doc = await enBase(p);
    expect(doc.unitPrice).toBe(150.75);
    expect(doc.category).toBe("Prestations premium");
  });

  test("Supprimer un produit : confirmation, puis plus en base ni dans la liste", async ({ page }) => {
    const p = PRODUITS_SAISIE.aSupprimer;
    await ouvrirCatalogue(page);
    await actionDuProduit(page, p.name, "Supprimer");
    const confirmation = fenetre(page, "Confirmer la suppression");
    await expect(confirmation).toContainText(p.name);
    await confirmation.getByRole("button", { name: "Supprimer" }).click();
    await expect(notification(page, "Produit supprimé avec succès")).toBeVisible();
    expect(await enBase(p)).toBeNull();
    await expect(ligne(page, p.name)).toHaveCount(0);
  });

  test("Supprimer un produit lié : il disparaît des produits liés de l'autre fiche", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.cibleLiee.name, "Supprimer");
    await fenetre(page, "Confirmer la suppression").getByRole("button", { name: "Supprimer" }).click();
    await expect(notification(page, "Produit supprimé avec succès")).toBeVisible();
    expect(await enBase(PRODUITS_SAISIE.cibleLiee)).toBeNull();
    expect((await enBase(PRODUITS_SAISIE.parentLie)).linkedProducts, "Le lien vers le produit supprimé est resté").toEqual([]);
  });

  test("Suppression groupée : deux produits cochés, supprimés après confirmation", async ({ page }) => {
    await ouvrirCatalogue(page);
    await rechercher(page, "Lot à supprimer");
    for (const p of [PRODUITS_SAISIE.lotA, PRODUITS_SAISIE.lotB]) await ligne(page, p.name).getByRole("checkbox", { name: "Select row" }).check();
    await page.getByRole("button", { name: "Supprimer (2)" }).click();
    const confirmation = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: "Êtes-vous absolument sûr" });
    await confirmation.getByRole("button", { name: "Supprimer" }).click();
    await expect(notification(page, /2 produits supprimés/)).toBeVisible();
    expect(await enBase(PRODUITS_SAISIE.lotA)).toBeNull();
    expect(await enBase(PRODUITS_SAISIE.lotB)).toBeNull();
  });

  test("Copier la référence : la référence est dans le presse-papiers", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.aCopier.name, "Copier référence");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PRODUITS_SAISIE.aCopier.reference);
  });

  test("Produit lié « 1 sous-couche pour 10 m² » ajouté à « Pose de parquet » : enregistré", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.parquet.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    await fiche.getByRole("combobox").nth(2).click();
    await page.getByPlaceholder("Rechercher un produit...").fill("Sous-couche");
    await page.getByRole("button", { name: new RegExp(PRODUITS_SAISIE.sousCouche.name) }).or(page.getByRole("option", { name: new RegExp(PRODUITS_SAISIE.sousCouche.name) })).first().click();
    await fiche.getByRole("spinbutton", { name: `Quantité de ${PRODUITS_SAISIE.parquet.name} servant de base` }).fill("10");
    await fiche.getByRole("spinbutton", { name: `Quantité de ${PRODUITS_SAISIE.sousCouche.name} à ajouter` }).fill("1");
    await fiche.getByRole("button", { name: "Modifier le produit et/ou service" }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    const doc = await enBase(PRODUITS_SAISIE.parquet);
    expect(doc.linkedProducts.map((l) => ({ produit: String(l.productId), quantite: l.quantity, base: l.per, arrondi: l.rounding }))).toEqual([
      { produit: PRODUITS_SAISIE.sousCouche._id.toHexString(), quantite: 1, base: 10, arrondi: "UP" },
    ]);
  });

  test("Renommer un produit avec le nom d'un autre : refusé avec un message", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.renommer.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    await fiche.getByPlaceholder("Ex: Ordinateur portable Dell XPS 13").fill(PRODUITS_SAISIE.doublon.name);
    await fiche.getByRole("button", { name: "Modifier le produit et/ou service" }).click();
    await expect(notification(page, /existe déjà/i).first()).toBeVisible();
    await expect(fiche).toBeVisible();
    expect((await enBase(PRODUITS_SAISIE.renommer)).name).toBe(PRODUITS_SAISIE.renommer.name);
  });

  test("Produit existant au nom avec « œ » : sa modification (prix) est enregistrée", async ({ page }) => {
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.boeuf.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    const prix = fiche.getByPlaceholder("0.00", { exact: true });
    await prix.fill("15");
    await fiche.getByRole("button", { name: "Modifier le produit et/ou service" }).click();
    await etape(page, "Fiche enregistrée sans message d'erreur", async () => {
      await expect(fiche, "La fiche d'un produit existant au nom avec « œ » ne peut plus être enregistrée").toBeHidden({ timeout: 10_000 });
    }, { capture: "ecran" });
    expect((await enBase(PRODUITS_SAISIE.boeuf)).unitPrice).toBe(15);
  });

  test("Champ personnalisé : créé dans « Champs », puis rempli sur un produit", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Champs" }).click();
    await page.getByRole("button", { name: "Nouveau champ" }).click();
    const creation = fenetre(page, "Nouveau champ personnalisé");
    await creation.getByRole("textbox", { name: "Nom du champ *" }).or(creation.getByPlaceholder(/Nom du champ/)).first().fill("Garantie (mois)");
    await creation.getByRole("button", { name: "Créer" }).click();
    await expect(creation).toBeHidden({ timeout: 15_000 });
    const champ = await (await base()).collection("productcustomfields").findOne({ workspaceId: ORG_SAISIE, name: "Garantie (mois)" });
    expect(champ, "Champ personnalisé enregistré").not.toBeNull();
    await page.keyboard.press("Escape");
    await ouvrirCatalogue(page);
    await actionDuProduit(page, PRODUITS_SAISIE.champ.name, "Modifier");
    const fiche = fenetre(page, "Modifier le produit et/ou service");
    await fiche.getByPlaceholder("Garantie (mois)").fill("24 mois");
    await fiche.getByRole("button", { name: "Modifier le produit et/ou service" }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    const doc = await enBase(PRODUITS_SAISIE.champ);
    expect((doc.customFields || []).find((c) => String(c.fieldId) === String(champ._id))?.value).toBe("24 mois");
  });

  test("Champ personnalisé supprimé : plus en base", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Champs" }).click();
    const panneau = fenetre(page, "Champs personnalisés produits");
    const rangee = panneau.locator("div").filter({ hasText: CHAMPS_SAISIE.aSupprimer.name }).filter({ has: page.locator("svg.lucide-trash2") }).last();
    await rangee.locator("button:has(svg.lucide-trash2)").click();
    await fenetre(page, "Supprimer le champ").getByRole("button", { name: "Supprimer" }).click();
    await expect.poll(async () => (await base()).collection("productcustomfields").countDocuments({ _id: CHAMPS_SAISIE.aSupprimer._id })).toBe(0);
  });

  test("Image du produit : l'envoi impossible (stockage injoignable en test) est signalé, la fiche reste utilisable", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Ajouter un produit" }).click();
    const fiche = fenetre(page, "Ajouter un produit et/ou service");
    const [selecteur] = await Promise.all([page.waitForEvent("filechooser"), fiche.getByRole("button", { name: "Ajouter une image" }).click()]);
    await selecteur.setFiles({
      name: "produit.png",
      mimeType: "image/png",
      buffer: Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000" + "1f15c4890000000d49444154789c63f80f0400" + "09fb03fde355f29c0000000049454e44ae426082", "hex"),
    });
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: /image/i }).first(), "Aucun message quand l'image ne peut pas être envoyée").toBeVisible({ timeout: 20_000 });
    await fiche.getByPlaceholder("Ex: Ordinateur portable Dell XPS 13").fill("Produit sans image envoyée");
    await fiche.getByPlaceholder("0.00", { exact: true }).fill("9");
    await fiche.getByRole("button", { name: "Créer le produit et/ou service" }).click();
    await expect(fiche).toBeHidden({ timeout: 15_000 });
    const doc = await (await base()).collection("products").findOne({ workspaceId: ORG_SAISIE, name: "Produit sans image envoyée" });
    expect(doc, "Le produit n'a pas pu être créé après l'échec de l'image").not.toBeNull();
    expect(doc.imageUrl ?? null).toBeNull();
  });
});

/**
 * Catalogue de plus de 100 produits (offre d'entrée, « Article 001 » à
 * « Article 105 ») : la page charge 100 produits et filtre sur place. Les
 * suivants ne doivent pas disparaître du catalogue.
 */
test.describe("Catalogue : plus de 100 produits", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_FREELANCE_ACHATS) });

  test("Les 105 produits sont comptés et le 105e se trouve par la recherche", async ({ page }) => {
    await ouvrirCatalogue(page);
    await expect.soft(page.getByText(/0 sur 105 ligne\(s\) sélectionnée\(s\)\./), "Le catalogue annonce moins de 105 produits").toBeVisible();
    await rechercher(page, "Article 105");
    expect(await nomsAffiches(page), "« Article 105 » est introuvable dans un catalogue de plus de 100 produits").toEqual(["Article 105"]);
  });
});
