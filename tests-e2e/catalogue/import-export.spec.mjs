/**
 * Catalogue : export (CSV, Excel, sélection) et import de vrais fichiers
 * (CSV d'Excel français, Windows-1252, .xlsx, fichier exporté par Newbi,
 * lignes invalides, doublons, noms et prix réels). Le contenu des fichiers
 * exportés et chaque produit importé sont vérifiés. Export de référence :
 * « Achats » ; imports et cas particuliers : « Saisie Achats ».
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { PRODUITS, PRODUITS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats, lireCsv } from "../achats-banque.mjs";

const XLSX = createRequire(import.meta.url)("xlsx");
const ORG_ACHATS = COMPTES.achats.organisation._id;
const ORG_SAISIE = COMPTES.saisieAchats.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const produitEnBase = async (name) => (await base()).collection("products").findOne({ workspaceId: ORG_SAISIE, name });

async function ouvrirCatalogue(page) {
  await ouvrir(page, "/dashboard/catalogues", { pret: page.getByRole("heading", { name: "Gestion du Catalogue" }) });
  await expect(page.getByRole("row").nth(1)).toBeVisible();
}

/** Exporte (CSV ou Excel) et renvoie le contenu du fichier téléchargé. */
async function exporter(page, format) {
  await page.getByRole("button", { name: /^Exporter/ }).click();
  await page.getByRole("menuitem", { name: format === "csv" ? "CSV" : "Excel", exact: true }).click();
  const dialogue = fenetre(page, format === "csv" ? "Exporter en CSV" : "Exporter en Excel");
  const [telechargement] = await Promise.all([page.waitForEvent("download"), dialogue.getByRole("button", { name: "Exporter" }).click()]);
  const chemin = test.info().outputPath(telechargement.suggestedFilename());
  await telechargement.saveAs(chemin);
  return { nom: telechargement.suggestedFilename(), contenu: readFileSync(chemin, "utf8") };
}

/** Lignes d'un export Excel (tableau HTML), lu comme le lirait un tableur. */
async function lireExcel(page, html) {
  return page.evaluate((h) => {
    const doc = new DOMParser().parseFromString(h, "text/html");
    return [...doc.querySelectorAll("tr")].map((tr) => [...tr.querySelectorAll("th,td")].map((c) => c.textContent));
  }, html);
}

const enTetesExport = ["Nom", "Référence", "Catégorie", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité", "Description", "Date de création", "Date de modification"];

test.describe("Catalogue : export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("CSV : tout le catalogue, une ligne par produit, valeurs et accents justes", async ({ page }) => {
    await ouvrirCatalogue(page);
    const { nom, contenu } = await exporter(page, "csv");
    expect(nom).toMatch(/^Catalogue_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/);
    const [entete, ...lignes] = lireCsv(contenu.trimEnd());
    expect(entete).toEqual(enTetesExport);
    const total = await (await base()).collection("products").countDocuments({ workspaceId: ORG_ACHATS });
    expect(lignes.length, "Une ligne par produit du catalogue").toBe(total);
    const audit = lignes.find((l) => l[0] === PRODUITS.audit.name);
    expect(audit.slice(0, 7)).toEqual([PRODUITS.audit.name, "AUD-001", "Prestations", "1200.00", "20.00", "jour", PRODUITS.audit.description]);
    expect(lignes.some((l) => l[0] === PRODUITS.ecran.name), "Le nom accentué « Écran 27 pouces » doit être intact").toBe(true);
  });

  test("Excel : tout le catalogue, une ligne par produit", async ({ page }) => {
    await ouvrirCatalogue(page);
    const { nom, contenu } = await exporter(page, "excel");
    expect(nom).toMatch(/^Catalogue_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.xls$/);
    const [entete, ...lignes] = await lireExcel(page, contenu);
    expect(entete).toEqual(enTetesExport);
    const total = await (await base()).collection("products").countDocuments({ workspaceId: ORG_ACHATS });
    expect(lignes.length).toBe(total);
    expect(lignes.find((l) => l[0] === PRODUITS.pose.name)?.slice(1, 6)).toEqual(["POS-CAR", "Prestations", "45.00", "10.00", "m²"]);
  });

  test("Produits cochés : seuls ceux-là sont exportés", async ({ page }) => {
    await ouvrirCatalogue(page);
    for (const p of [PRODUITS.audit, PRODUITS.colle]) {
      await page.getByRole("row").filter({ has: page.getByText(p.name, { exact: true }) }).getByRole("checkbox", { name: "Select row" }).check();
    }
    await expect(page.getByRole("button", { name: "Exporter 2" })).toBeVisible();
    const { contenu } = await exporter(page, "csv");
    const [, ...lignes] = lireCsv(contenu.trimEnd());
    expect(lignes.map((l) => l[0]).sort()).toEqual([PRODUITS.audit.name, PRODUITS.colle.name].sort());
  });
});

test.describe("Catalogue : textes particuliers à l'export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  async function exporterProduit(page, produit, format) {
    await ouvrirCatalogue(page);
    await page.getByPlaceholder("Recherchez par nom ou par référence...").fill(produit.reference);
    await attendreCalme(page);
    await page.getByRole("row").filter({ hasText: produit.reference }).getByRole("checkbox", { name: "Select row" }).check();
    return exporter(page, format);
  }

  test("CSV : une description sur deux lignes reste dans sa cellule", async ({ page }) => {
    const { contenu } = await exporterProduit(page, PRODUITS_SAISIE.multiligne, "csv");
    const lignes = lireCsv(contenu.trimEnd());
    expect(lignes.length, "La description sur deux lignes coupe le produit en deux lignes du fichier").toBe(2);
    expect(lignes[1][6]).toBe(PRODUITS_SAISIE.multiligne.description);
  });

  test("CSV : un nom qui commence par « = » n'est pas lu comme une formule par le tableur", async ({ page }) => {
    const { contenu } = await exporterProduit(page, PRODUITS_SAISIE.formule, "csv");
    const [, produit] = lireCsv(contenu.trimEnd());
    expect(produit[0], "La cellule commence par « = » : le tableur l'exécute comme une formule (lien piégé)").not.toMatch(/^[=+\-@]/);
  });

  test("Excel : un texte avec « < », « > » et « & » reste du texte dans sa cellule", async ({ page }) => {
    const { contenu } = await exporterProduit(page, PRODUITS_SAISIE.symboles, "excel");
    const [, produit] = await lireExcel(page, contenu);
    expect(produit[6], "La description est lue comme du HTML dans le fichier Excel (balises interprétées, texte perdu)").toBe(PRODUITS_SAISIE.symboles.description);
  });
});

// --- Import ----------------------------------------------------------------------

const EN_TETES = ["Nom", "Référence", "Catégorie", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité", "Description"];
const csv = (lignes) => lignes.map((l) => l.join(";")).join("\r\n");
function fichier(nom, contenu) {
  const chemin = test.info().outputPath(nom);
  writeFileSync(chemin, contenu);
  return chemin;
}

async function deposer(page, chemin) {
  await ouvrirCatalogue(page);
  await page.getByRole("button", { name: "Importer" }).click();
  const dialogue = fenetre(page, "Importer des produits");
  await expect(dialogue).toBeVisible();
  await dialogue.locator("input[type=file]").setInputFiles(chemin);
  return dialogue;
}

async function importer(page, chemin, { attendus }) {
  const dialogue = await deposer(page, chemin);
  await dialogue.getByRole("button", { name: "Suivant" }).click();
  await attendreCalme(page);
  const bouton = dialogue.getByRole("button", { name: /^Importer \d+ produit/ });
  await expect(bouton, `Bouton « Importer ${attendus} produit(s) »`).toHaveText(new RegExp(`Importer ${attendus} produit`));
  await etape(page, "Importer", async () => {
    await bouton.click();
    await expect(notification(page, /importé|erreur/).first(), "L'import ne se termine pas").toBeVisible({ timeout: 30_000 });
  }, { capture: "ecran" });
  return dialogue;
}

test.describe("Catalogue : import", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("CSV d'Excel (point-virgule, BOM, accents, prix et TVA à virgule) : chaque produit enregistré avec ses valeurs", async ({ page }) => {
    const chemin = fichier(
      "produits-excel.csv",
      "﻿" +
        csv([
          EN_TETES,
          ["Pain de campagne", "PAIN-01", "Boulangerie", "3,20", "5,5", "unité", "Farine T80 et levain"],
          ["Éclair au café", "ECL-01", "Pâtisserie", "2,90", "5,5", "unité", "Crème pâtissière au café"],
        ]),
    );
    await importer(page, chemin, { attendus: 2 });
    const pain = await produitEnBase("Pain de campagne");
    expect(pain, "Produit importé").not.toBeNull();
    expect.soft(pain.reference).toBe("PAIN-01");
    expect.soft(pain.category).toBe("Boulangerie");
    expect.soft(pain.unitPrice).toBe(3.2);
    expect.soft(pain.vatRate).toBe(5.5);
    expect.soft(pain.unit).toBe("unité");
    const eclair = await produitEnBase("Éclair au café");
    expect.soft(eclair?.category, "Accents du fichier").toBe("Pâtisserie");
  });

  test("CSV enregistré par Excel en Windows-1252 : les accents restent justes", async ({ page }) => {
    const chemin = fichier("produits-windows-1252.csv", Buffer.from(csv([EN_TETES, ["Pâté en croûte", "PAT-01", "Charcuterie", "12,50", "5,5", "unité", "Recette traditionnelle"]]), "latin1"));
    await importer(page, chemin, { attendus: 1 });
    const doc = await (await base()).collection("products").findOne({ workspaceId: ORG_SAISIE, reference: "PAT-01" });
    expect(doc, "Produit importé").not.toBeNull();
    expect(doc.name, "Accents abîmés à l'import (lecture en UTF-8 d'un fichier Windows-1252)").toBe("Pâté en croûte");
  });

  test("Classeur Excel (.xlsx) : les produits sont importés", async ({ page }) => {
    const feuille = XLSX.utils.aoa_to_sheet([EN_TETES, ["Plateau de fromages", "FRO-01", "Fromagerie", 24, 5.5, "unité", "Pour 6 personnes"]]);
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Produits");
    const chemin = fichier("produits.xlsx", XLSX.write(classeur, { type: "buffer", bookType: "xlsx" }));
    await importer(page, chemin, { attendus: 1 });
    const doc = await produitEnBase("Plateau de fromages");
    expect(doc?.unitPrice).toBe(24);
    expect(doc?.vatRate).toBe(5.5);
  });

  test("Fichier exporté par Newbi (point décimal, colonnes de dates) : réimporté à l'identique", async ({ page }) => {
    const chemin = fichier(
      "catalogue-newbi.csv",
      "﻿" + csv([enTetesExport, ["Réimport Newbi", "RIN-01", "Prestations", "1200.50", "20.00", "jour", "Exporté puis réimporté", "01/10/2026 10:00", "02/10/2026 11:00"]]),
    );
    await importer(page, chemin, { attendus: 1 });
    const doc = await produitEnBase("Réimport Newbi");
    expect(doc, "Produit réimporté").not.toBeNull();
    expect.soft(doc.unitPrice).toBe(1200.5);
    expect.soft(doc.vatRate).toBe(20);
    expect.soft(doc.unit).toBe("jour");
    expect.soft(doc.category).toBe("Prestations");
  });

  test("Lignes invalides (nom d'une lettre, prix en lettres, TVA de 150 %) : écartées, les autres importées", async ({ page }) => {
    const chemin = fichier(
      "lignes-invalides.csv",
      csv([EN_TETES, ["Produit valide importé", "VAL-01", "", "10", "20", "unité", ""], ["A", "UNE-01", "", "10", "20", "unité", ""], ["Prix en lettres", "PRX-01", "", "dix", "20", "unité", ""], ["TVA impossible", "TVA-01", "", "10", "150", "unité", ""]]),
    );
    await importer(page, chemin, { attendus: 1 });
    expect(await produitEnBase("Produit valide importé")).not.toBeNull();
    for (const ref of ["UNE-01", "PRX-01", "TVA-01"]) expect(await (await base()).collection("products").findOne({ workspaceId: ORG_SAISIE, reference: ref }), `Ligne ${ref} importée`).toBeNull();
  });

  test("Produit déjà au catalogue (même nom) : signalé, pas annoncé « importé », pas de doublon", async ({ page }) => {
    const chemin = fichier("doublon.csv", csv([EN_TETES, [PRODUITS_SAISIE.doublon.name, "DEJ-IMP", "", "20", "20", "unité", ""]]));
    await importer(page, chemin, { attendus: 1 });
    await page.waitForTimeout(1_000);
    expect(await (await base()).collection("products").countDocuments({ workspaceId: ORG_SAISIE, name: PRODUITS_SAISIE.doublon.name }), "Doublon créé").toBe(1);
    const succes = await notification(page, /produit importé/).count();
    expect(succes, "Le produit refusé par l'API (nom déjà pris) est annoncé « 1 produit importé »").toBe(0);
    expect(await notification(page, /erreur/).count(), "Le refus n'est pas signalé").toBeGreaterThan(0);
  });

  test("Nom avec « œ » (Crème au cœur coulant) : importé", async ({ page }) => {
    const chemin = fichier("ligature.csv", csv([EN_TETES, ["Moelleux au cœur coulant", "COE-01", "Pâtisserie", "6,50", "10", "unité", ""]]));
    await importer(page, chemin, { attendus: 1 });
    await page.waitForTimeout(1_000);
    const doc = await (await base()).collection("products").findOne({ workspaceId: ORG_SAISIE, reference: "COE-01" });
    const succes = await notification(page, /produit importé/).count();
    expect.soft(succes && !doc, "Le produit est annoncé « importé » alors que l'API l'a refusé").toBe(false);
    expect(doc, "Un nom avec « œ » ne peut pas être importé").not.toBeNull();
  });

  test("Prix « 1 234,56 » (séparateur de milliers) : importé à 1 234,56 €", async ({ page }) => {
    const chemin = fichier("milliers.csv", csv([EN_TETES, ["Prestation annuelle", "ANN-01", "", "1 234,56", "20", "année", ""]]));
    await importer(page, chemin, { attendus: 1 });
    const doc = await produitEnBase("Prestation annuelle");
    expect(doc, "Produit importé").not.toBeNull();
    expect(doc.unitPrice, "Le prix « 1 234,56 » est lu « 1 » : le produit est importé au mauvais prix").toBe(1234.56);
  });

  test("Texte piégé dans le fichier : importé comme du texte, jamais exécuté", async ({ page }) => {
    const piege = `<img src=x-import onerror="window.__piege=1">`;
    const chemin = fichier("piege.csv", csv([EN_TETES, ["Produit importé piégé", "PIE-IMP", piege, "5", "20", "unité", piege]]));
    await importer(page, chemin, { attendus: 1 });
    await ouvrirCatalogue(page);
    await page.getByPlaceholder("Recherchez par nom ou par référence...").fill("PIE-IMP");
    await attendreCalme(page);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
    expect(await page.locator("img[src='x-import']").count()).toBe(0);
  });

  test("Fichier sans ligne de données : message clair, rien d'importé", async ({ page }) => {
    const dialogue = await deposer(page, fichier("vide.csv", csv([EN_TETES])));
    await dialogue.getByRole("button", { name: "Suivant" }).click();
    await expect(notification(page, /aucune ligne de données/)).toBeVisible();
  });

  test("Fichier qui n'est pas un tableur : refusé avec un message", async ({ page }) => {
    const dialogue = await deposer(page, fichier("notes.txt", "ceci n'est pas un catalogue"));
    const suivant = dialogue.getByRole("button", { name: "Suivant" });
    if (await suivant.isEnabled({ timeout: 2_000 }).catch(() => false)) await suivant.click();
    await page.waitForTimeout(800);
    const messages = await page.locator("[data-sonner-toast]:has(svg.text-red-500), .text-red-500, .text-destructive, [role=alert]").count();
    expect(messages + ((await suivant.isDisabled({ timeout: 2_000 }).catch(() => false)) ? 1 : 0), "Un fichier texte est accepté sans explication").toBeGreaterThan(0);
  });

  test("Modèle CSV : téléchargé avec les colonnes attendues par l'import", async ({ page }) => {
    await ouvrirCatalogue(page);
    await page.getByRole("button", { name: "Importer" }).click();
    const dialogue = fenetre(page, "Importer des produits");
    const [telechargement] = await Promise.all([page.waitForEvent("download"), dialogue.getByRole("link", { name: "Télécharger un template CSV" }).click()]);
    const chemin = test.info().outputPath("modele.csv");
    await telechargement.saveAs(chemin);
    const [entete] = lireCsv(readFileSync(chemin, "utf8").trimEnd());
    expect(entete).toEqual(EN_TETES);
  });
});
