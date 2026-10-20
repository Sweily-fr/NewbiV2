/**
 * Liste des factures de l'organisation « Factures » : compteurs, filtres,
 * recherche, tri, pagination et exports (contenu des fichiers téléchargés).
 * L'organisation « Réglages Factures » (57 factures émises) sert aux cas
 * « plus de 50 factures » et aux valeurs qui ressemblent à des formules.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape } from "../outils.mjs";
import { attendreCalme, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES, SESSION_TOKEN_FACTURES_REGLAGES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { F, FORMULE, IMPORTEES, reference, VOLUME } from "../donnees/lot-factures.mjs";
import { chercher, fenetreTitree, ligne, notifications, ouvrirListe, RECHERCHE } from "./pages.mjs";

const ORG = COMPTES.factures.organisation._id;
const ORG_REGLAGES = COMPTES.facturesReglages.organisation._id;
const facturesDe = async (org) => (await base()).collection("invoices").find({ workspaceId: org }).toArray();
const importeesDe = async (org) => (await base()).collection("imported_invoices").find({ workspaceId: org, status: { $nin: ["REJECTED", "ARCHIVED"] } }).toArray();
const lignesAffichees = (page) => page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "Sélectionner la ligne" }) });
const onglet = (page, nom) => page.getByRole("tab", { name: new RegExp(`^${nom} \\d+$`) });

async function exporter(page, format, { periode = null } = {}) {
  await page.getByRole("button", { name: /^Exporter/ }).first().click();
  await page.getByRole("menuitem", { name: format, exact: true }).click();
  const fenetre = fenetreTitree(page, `Exporter en ${format}`);
  await expect(fenetre).toBeVisible();
  if (periode) await periode(fenetre);
  const [fichier] = await Promise.all([page.waitForEvent("download"), fenetre.getByRole("button", { name: "Exporter" }).click()]);
  return { nom: fichier.suggestedFilename(), texte: readFileSync(await fichier.path(), "utf8").replace(/^﻿/, "") };
}

test.describe("Factures : liste (compteurs et filtres)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Onglets : compteurs justes (factures et factures importées)", async ({ page }) => {
    await ouvrirListe(page);
    const factures = await facturesDe(ORG);
    const importees = await importeesDe(ORG);
    const aujourdhui = new Date(new Date().toDateString());
    const compter = (filtre) => factures.filter(filtre).length;
    const attendus = {
      "Toutes les factures": factures.length + importees.length,
      Brouillons: compter((f) => f.status === "DRAFT"),
      "En retard": compter((f) => f.status === "PENDING" && new Date(f.dueDate) < aujourdhui),
    };
    for (const [nom, nombre] of Object.entries(attendus)) {
      await expect.soft(onglet(page, nom), `Onglet « ${nom} »`).toHaveAccessibleName(`${nom} ${nombre}`);
    }
  });

  test("Filtre « Type de facture » > « Importées » : seulement les factures importées", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: /^Type de facture/ }).click();
    await page.getByRole("menu").last().getByText("Importées", { exact: true }).click();
    await page.keyboard.press("Escape");
    await attendreCalme(page);
    await etape(page, "Résultat du filtre", async () => {
      await expect(page.getByRole("row").filter({ hasText: IMPORTEES.validee.originalInvoiceNumber })).toHaveCount(1);
      await expect(ligne(page, F.attente), "Une facture créée sur Newbi est affichée").toHaveCount(0);
    }, { capture: "ecran" });
  });

  test("Filtre « Filtrer par statut » > « Annulée » : seulement les factures annulées", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: /^Filtrer par statut/ }).click();
    await page.getByRole("menu").last().getByText("Annulée", { exact: true }).click();
    await page.keyboard.press("Escape");
    await attendreCalme(page);
    await expect(ligne(page, F.annulee)).toHaveCount(1);
    await expect(ligne(page, F.attente)).toHaveCount(0);
    await expect(ligne(page, F.payee)).toHaveCount(0);
  });

  test("Colonnes visibles : masquer la colonne « Échéance » la retire du tableau", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("columnheader", { name: /^Échéance/ }).first()).toBeVisible();
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: /^Colonnes visibles/ }).click();
    await page.getByRole("menu").last().getByText("Échéance", { exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("columnheader", { name: /^Échéance/ })).toHaveCount(0);
    await expect(ligne(page, F.attente), "La facture reste listée").toHaveCount(1);
  });

  for (const [nom, saisie, attendue, absente] of [
    ["par le nom du client, sans accent", "lumiere", F.attente, F.payee],
    ["par le numéro seul", F.complete.number, F.complete, F.attente],
    ["par le montant", "840", F.complete, F.attente],
    ["par le montant tel qu'affiché (840,00)", "840,00", F.complete, F.attente],
  ]) {
    test(`Recherche ${nom}`, async ({ page }) => {
      await ouvrirListe(page);
      await page.getByPlaceholder(RECHERCHE).fill(saisie);
      await attendreCalme(page);
      await expect(ligne(page, attendue), `${reference(attendue)} doit être trouvée`).toHaveCount(1);
      await expect(ligne(page, absente), "Une facture sans rapport est affichée").toHaveCount(0);
    });
  }

  test("« Respecter les majuscules et les accents » : « lumiere » ne trouve plus « Lumière »", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Respecter les majuscules et les accents" }).click();
    await page.getByPlaceholder(RECHERCHE).fill("lumiere");
    await attendreCalme(page);
    await expect(ligne(page, F.attente)).toHaveCount(0);
    await page.getByPlaceholder(RECHERCHE).fill("Lumière");
    await attendreCalme(page);
    await expect(ligne(page, F.attente)).toHaveCount(1);
  });

  test("Recherche sans résultat : message clair", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByPlaceholder(RECHERCHE).fill("zzz-aucune-facture");
    await attendreCalme(page);
    await expect(lignesAffichees(page)).toHaveCount(0);
    await expect(page.getByText(/aucune? (facture|résultat)/i).first()).toBeVisible();
  });

  test("Un texte piégé dans la recherche ne s'exécute pas", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByPlaceholder(RECHERCHE).fill(`<img src=x onerror="window.__piege=1">`);
    await attendreCalme(page);
    expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
  });

  test("Pagination : 10 lignes par page, puis la page suivante sans doublon", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "10", exact: true }).click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await attendreCalme(page);
    const page1 = await lignesAffichees(page).allInnerTexts();
    expect(page1, "10 lignes par page").toHaveLength(10);
    await cliquer(page, page.getByRole("button", { name: "Go to next page" }));
    await attendreCalme(page);
    const page2 = await lignesAffichees(page).allInnerTexts();
    expect(page2.length).toBe(10);
    expect(page2.filter((t) => page1.includes(t)), "Lignes en double d'une page à l'autre").toEqual([]);
  });
});

test.describe("Factures : exports", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Export CSV : une ligne par facture de la liste, les bonnes valeurs, rien des autres entreprises", async ({ page }) => {
    await ouvrirListe(page);
    const { nom, texte } = await exporter(page, "CSV");
    expect(nom).toMatch(/^factures_export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
    const enTete = lignes[0].split(";");
    for (const colonne of ["Numéro", "Client", "Date d'émission", "Total HT (€)", "Total TTC (€)", "Statut"]) expect.soft(enTete, `Colonne « ${colonne} »`).toContain(colonne);
    const factures = await facturesDe(ORG);
    const importees = await importeesDe(ORG);
    expect.soft(lignes.length - 1, "Une ligne par facture (créées et importées)").toBe(factures.length + importees.length);
    const complete = lignes.find((l) => l.includes(reference(F.complete)));
    expect(complete, `Ligne de ${reference(F.complete)}`).toBeTruthy();
    for (const valeur of [F.complete.client.name, "700.00", "840.00", "En attente"]) expect.soft(complete, `Valeur « ${valeur} »`).toContain(valeur);
    expect(texte, "Une facture d'une autre entreprise est exportée").not.toContain("Société Gamma");
  });

  test("Export Excel : un tableau avec chaque facture", async ({ page }) => {
    await ouvrirListe(page);
    const { nom, texte } = await exporter(page, "Excel");
    expect(nom).toMatch(/\.xls$/);
    expect(texte).toContain("<table");
    expect(texte).toContain(reference(F.complete));
    expect(texte).toContain(F.retard.client.name);
  });

  test("Export de la sélection : seulement les factures cochées", async ({ page }) => {
    await ouvrirListe(page);
    for (const f of [F.attente, F.payee]) {
      await chercher(page, f);
      await ligne(page, f).getByRole("checkbox", { name: "Sélectionner la ligne" }).check();
    }
    await page.getByPlaceholder(RECHERCHE).fill("");
    await attendreCalme(page);
    const { texte } = await exporter(page, "CSV");
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
    expect(lignes.length - 1, "Deux factures cochées, deux lignes").toBe(2);
    expect(texte).toContain(reference(F.attente));
    expect(texte).toContain(reference(F.payee));
  });

  test("Sage et Cegid : grisés avec un cadenas sur l'offre PME (offre Entreprise)", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: /^Exporter/ }).first().click();
    for (const nom of ["Sage Compta", "Cegid Expert"]) {
      await expect(page.getByRole("menuitem", { name: nom })).toHaveAttribute("data-disabled", "");
    }
    await expect(page.getByRole("menuitem", { name: "FEC (Format légal)" })).not.toHaveAttribute("data-disabled", "");
  });

  test.describe("Export FEC (fichier des écritures comptables, art. A47 A-1 du LPF)", () => {
    let fec = null;
    test.beforeEach(async ({ page }) => {
      await ouvrirListe(page);
      fec = await exporter(page, "FEC (Format légal)");
    });

    test("La première ligne porte le nom des 18 champs", async () => {
      const premiere = fec.texte.split(/\r?\n/)[0];
      expect(premiere, "Pas de ligne d'en-tête : la norme exige le nom des champs en première ligne").toBe(
        "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise",
      );
    });

    test("Le fichier est nommé SirenFECAAAAMMJJ.txt", async () => {
      expect(fec.nom, "Nom de fichier hors norme").toMatch(new RegExp(`^${COMPTES.factures.organisation.siret.slice(0, 9)}FEC\\d{8}\\.txt$`));
    });

    test("Les brouillons ne sont pas des écritures comptables : absents du FEC", async () => {
      expect(fec.texte, `Le brouillon ${reference(F.brouillon)} est exporté dans le FEC`).not.toContain(F.brouillon.number);
    });

    test("Les montants utilisent la virgule comme séparateur décimal", async () => {
      const montants = fec.texte
        .split(/\r?\n/)
        .filter((l) => l.startsWith("VTE"))
        .flatMap((l) => l.split("|").slice(11, 13));
      expect(montants.filter((m) => /^\d+\.\d{2}$/.test(m)), "Montants écrits avec un point décimal").toEqual([]);
    });
  });
});

test.describe("Factures : plus de 50 factures", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_REGLAGES) });

  test("Toutes les factures sont comptées, cherchables et exportées (pas seulement les 50 dernières créées)", async ({ page }) => {
    await ouvrirListe(page);
    const toutes = await facturesDe(ORG_REGLAGES);
    await etape(page, "Compteur de l'onglet", async () => {
      await expect.soft(onglet(page, "Toutes les factures"), "Le compteur s'arrête aux 50 factures chargées").toHaveAccessibleName(`Toutes les factures ${toutes.length}`);
    }, { capture: "ecran" });
    await etape(page, "La plus ancienne facture se retrouve par la recherche", async () => {
      await page.getByPlaceholder(RECHERCHE).fill(VOLUME.n1.client.name);
      await attendreCalme(page);
      await expect.soft(ligne(page, VOLUME.n1), `${reference(VOLUME.n1)} introuvable : la liste ne charge que les 50 factures créées en dernier`).toHaveCount(1);
    });
    await page.getByPlaceholder(RECHERCHE).fill("");
    await attendreCalme(page);
    const { texte } = await exporter(page, "CSV");
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
    expect(lignes.length - 1, "L'export « toutes les factures » s'arrête aux 50 chargées").toBe(toutes.length);
  });

  test("Export CSV : une valeur qui commence par « = » ne devient pas une formule (injection dans le tableur)", async ({ page }) => {
    await ouvrirListe(page);
    const { texte } = await exporter(page, "CSV");
    const ligneFormule = texte.split(/\r?\n/).find((l) => l.includes("HYPERLINK"));
    expect(ligneFormule, "Facture au client « formule » absente de l'export").toBeTruthy();
    const cellules = ligneFormule.split(";").map((c) => c.replace(/^"|"$/g, ""));
    const dangereuses = cellules.filter((c) => /^[=+\-@]/.test(c) && /[A-Za-z(]/.test(c));
    expect(dangereuses, `Cellule exécutée comme formule à l'ouverture dans Excel (client « ${FORMULE.client} »)`).toEqual([]);
  });
});
