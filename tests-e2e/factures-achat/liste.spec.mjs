/**
 * Factures d'achat : ce que la liste et la fiche affichent comparé à la base
 * (onglets, pages, devise, plusieurs taux, transactions rapprochées),
 * recherche sans accents, filtres, export (contenu du fichier), et chaque
 * action vérifiée en base (payée, supprimée, actions groupées, menu de
 * ligne, modification, rapprochement avec une ou deux transactions,
 * déliaison, catégorie propagée, justificatifs). Lecture : « Achats »
 * (jamais modifiée) ; actions : « Saisie Achats », une facture par action.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { FACTURES_ACHAT, FACTURES_ACHAT_REMPLISSAGE, FACTURES_ACHAT_SAISIE, TRANSACTIONS, TRANSACTIONS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats, lireCsv, simulerApercus } from "../achats-banque.mjs";

const FA = FACTURES_ACHAT;
const FAS = FACTURES_ACHAT_SAISIE;
const TS = TRANSACTIONS_SAISIE;
const URL = "/dashboard/outils/factures-achat";
const RECHERCHE = "Recherchez par fournisseur, n° facture ou montant...";
const ORG_ACHATS = COMPTES.achats.organisation._id;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const enBase = async (doc) => (await base()).collection("purchaseinvoices").findOne({ _id: doc._id });
const txEnBase = async (doc) => (await base()).collection("transactions").findOne({ _id: doc._id });
// Le numéro de facture est une colonne masquée au départ : une ligne se repère par le fournisseur
// (après une recherche par numéro quand plusieurs factures ont le même fournisseur).
const ligne = (page, f) => page.getByRole("row").filter({ hasText: f.supplierName });
const lignesDonnees = (page) => page.getByRole("row").filter({ has: page.locator("button:has(svg.lucide-ellipsis)") });

async function ouvrirListe(page) {
  await ouvrir(page, URL, { pret: page.getByRole("tab", { name: /^Toutes/ }) });
  await expect(page.getByRole("row").nth(1)).toBeVisible();
}

/** Fiche (tiroir) d'une facture, par le lien direct « ?id= ». */
async function ouvrirFiche(page, f) {
  await ouvrir(page, `${URL}?id=${f._id.toHexString()}`, { pret: page.getByRole("dialog", { name: "Détail de la facture" }) });
  const tiroir = page.getByRole("dialog", { name: "Détail de la facture" });
  await expect(tiroir).toContainText(f.invoiceNumber || f.supplierName);
  await attendreCalme(page);
  return tiroir;
}

async function rechercher(page, texte) {
  await page.getByPlaceholder(RECHERCHE).fill(texte);
  await attendreCalme(page);
  await page.waitForTimeout(500);
}

/** Fournisseurs des lignes affichées (hors en-tête). */
async function fournisseursAffiches(page) {
  const lignes = page.getByRole("row").filter({ has: page.getByRole("button", { name: /icône ellipsis|Actions/ }).or(page.locator("button:has(svg.lucide-ellipsis)")) });
  return lignes.evaluateAll((rs) => rs.map((r) => r.innerText.replace(/\s+/g, " ").trim()));
}

// --- Affichage (« Achats ») ---------------------------------------------------------

test.describe("Factures d'achat : ce que la liste affiche", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("Onglets : chaque compteur égale le nombre de factures en base", async ({ page }) => {
    await ouvrirListe(page);
    const db = (await base()).collection("purchaseinvoices");
    const compte = (filtre) => db.countDocuments({ workspaceId: ORG_ACHATS, ...filtre });
    for (const [onglet, filtre] of [
      ["Toutes", {}],
      ["À payer", { status: "TO_PAY" }],
      ["En retard", { status: "OVERDUE" }],
      ["Payées", { status: "PAID" }],
    ]) {
      await expect.soft(page.getByRole("tab", { name: new RegExp(`^${onglet} ${await compte(filtre)}$`) }), `Compteur de l'onglet « ${onglet} »`).toBeVisible();
    }
  });

  test("Onglet « En retard » : seule la facture en retard", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("tab", { name: /^En retard/ }).click();
    await attendreCalme(page);
    const lignes = await fournisseursAffiches(page);
    expect(lignes.length).toBe(1);
    expect(lignes[0]).toContain(FA.provence.supplierName);
  });

  test("Deux pages de 25 : la plus récente en tête, chaque facture une fois", async ({ page }) => {
    await ouvrirListe(page);
    const total = [...Object.values(FA), ...FACTURES_ACHAT_REMPLISSAGE].length;
    const page1 = await fournisseursAffiches(page);
    expect(page1.length).toBe(25);
    expect(page1[0], "La facture la plus récente (Adobe, 49,99 €) doit être en tête").toContain("49,99");
    await cliquer(page, page.getByRole("button", { name: "Page suivante" }));
    await attendreCalme(page);
    expect((await fournisseursAffiches(page)).length).toBe(total - 25);
  });

  // Chaque facture se reconnaît à son montant (le nom d'un fournisseur connu peut être remplacé par celui d'une marque).
  for (const [nom, saisie, attendu, montant] of [
    ["sans accent (« meta » trouve « Méta »)", "meta", FA.meta, "29,00"],
    ["sans accent (« electricite » trouve « Électricité »)", "electricite", FA.provence, "78,40"],
    ["par le numéro de facture", "HON-T3", FA.martin, "700,00"],
    ["par le montant (« 245 »)", "245", FA.hotel, "245,00"],
  ]) {
    test(`Recherche ${nom}`, async ({ page }) => {
      await ouvrirListe(page);
      await rechercher(page, saisie);
      const lignes = await fournisseursAffiches(page);
      expect(lignes.length, `Résultats : ${JSON.stringify(lignes)}`).toBe(1);
      expect(lignes[0], `« ${attendu.supplierName} » attendu`).toContain(montant);
    });
  }

  test("Le fournisseur « Adobe Systems » s'affiche sous son nom, pas sous celui d'une autre marque", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, FA.adobe.invoiceNumber);
    const lignes = await fournisseursAffiches(page);
    expect(lignes.length).toBe(1);
    expect(lignes[0], "« Adobe Systems » s'affiche « Microsoft » (le motif « ms » de « Systems » est pris pour Microsoft)").not.toContain("Microsoft");
  });

  test("Filtre « Statut : En retard » puis « Effacer tous les filtres »", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("menuitem", { name: "Statut" }).click();
    await page.getByRole("menu").last().getByText("En retard", { exact: true }).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await attendreCalme(page);
    expect((await fournisseursAffiches(page)).every((l) => l.includes(FA.provence.supplierName))).toBe(true);
  });

  test("Facture en dollars : montants affichés en dollars, pas en euros", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, FA.aws.invoiceNumber);
    await expect(lignesDonnees(page)).toHaveCount(1);
    await expect(lignesDonnees(page).first()).toContainText(/\$|USD/);
    await expect(lignesDonnees(page).first()).not.toContainText("€");
  });

  test("Fiche d'une facture à deux taux de TVA : une ligne par taux, totaux justes", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FA.imprimerie);
    await expect(tiroir).toContainText(/20\s?%/);
    await expect(tiroir).toContainText(/5,5\s?%/);
    await expect(tiroir).toContainText(/465,50\s?€/);
  });

  test("Fiche d'une facture payée en deux virements : les deux transactions rapprochées sont listées", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FA.martin);
    await expect(tiroir.getByText(TRANSACTIONS.martin1.description)).toBeVisible();
    await expect(tiroir.getByText(TRANSACTIONS.martin2.description)).toBeVisible();
  });

  test("Fiche d'une facture rapprochée : le lien mène à la transaction", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FA.adobe);
    const lien = tiroir.getByRole("link").filter({ hasText: TRANSACTIONS.adobe.description });
    await cliquer(page, lien);
    await expect(page).toHaveURL(new RegExp(`/dashboard/outils/transactions\\?transactionId=${TRANSACTIONS.adobe._id.toHexString()}`));
  });

  test("Les transactions proposées au rapprochement se choisissent au clavier (boutons)", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FA.tilleuls);
    await tiroir.getByRole("button", { name: "Rechercher une transaction" }).click();
    await tiroir.getByPlaceholder("Libellé, référence, montant...").fill("LOYER");
    await attendreCalme(page);
    await expect(tiroir.getByText(TRANSACTIONS.loyer.description)).toBeVisible();
    await expect(
      tiroir.getByRole("button", { name: new RegExp(TRANSACTIONS.loyer.description) }),
      "Les transactions proposées ne sont pas des boutons : impossible de les choisir au clavier ou avec un lecteur d'écran",
    ).toBeVisible({ timeout: 3_000 });
  });

  test("Fiche avec justificatif : l'aperçu s'affiche", async ({ page }) => {
    await simulerApercus(page);
    const tiroir = await ouvrirFiche(page, FA.cafe);
    await expect(tiroir.getByText(FA.cafe.files[0].originalFilename).or(tiroir.getByRole("button", { name: "Retirer ce justificatif" })).first()).toBeVisible();
  });
});

test.describe("Factures d'achat : export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  async function exporter(page) {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const dialogue = fenetre(page, "Exporter les factures");
    const [telechargement] = await Promise.all([page.waitForEvent("download"), dialogue.getByRole("button", { name: "Exporter" }).click()]);
    const chemin = test.info().outputPath(telechargement.suggestedFilename());
    await telechargement.saveAs(chemin);
    return { nom: telechargement.suggestedFilename(), lignes: lireCsv(readFileSync(chemin, "utf8").trimEnd()) };
  }

  test("CSV : une ligne par facture, montants, détail de TVA, catégorie et statut justes", async ({ page }) => {
    const { nom, lignes } = await exporter(page);
    expect(nom).toMatch(/^factures-achat-\d{4}-\d{2}-\d{2}\.csv$/);
    const [entete, ...factures] = lignes;
    expect(entete).toEqual(["Fournisseur", "N° Facture", "Date d'émission", "Date d'échéance", "Montant HT", "TVA", "Détail TVA", "Montant TTC", "Catégorie", "Statut", "Mode de paiement", "Date de paiement", "Notes"]);
    expect(factures.length).toBe(await (await base()).collection("purchaseinvoices").countDocuments({ workspaceId: ORG_ACHATS }));
    const imprimerie = factures.find((l) => l[1] === FA.imprimerie.invoiceNumber);
    expect(imprimerie.slice(4, 8)).toEqual(["400.00", "65.50", "20 % : 300.00 HT / 60.00 TVA ; 5.5 % : 100.00 HT / 5.50 TVA", "465.50"]);
    const provence = factures.find((l) => l[1] === FA.provence.invoiceNumber);
    expect(provence[0]).toBe(FA.provence.supplierName);
    expect(provence[9]).toBe("En retard");
  });

  test("CSV : un fournisseur avec des guillemets reste dans sa cellule", async ({ page }) => {
    const { lignes } = await exporter(page);
    const [entete, ...factures] = lignes;
    expect(factures.every((l) => l.length === entete.length), "Les guillemets du nom de fournisseur décalent les colonnes du fichier").toBe(true);
    expect(factures.find((l) => l[1] === FA.guillemets.invoiceNumber)?.[0]).toBe(FA.guillemets.supplierName);
  });

  test("CSV : la devise des factures en dollars est indiquée", async ({ page }) => {
    const { lignes } = await exporter(page);
    const [entete, ...factures] = lignes;
    const aws = factures.find((l) => l[1] === FA.aws.invoiceNumber);
    expect(entete.join(";") + aws.join(";"), "La facture de 120 $ est exportée « 120.00 » sans devise : lue comme 120 €").toMatch(/USD|\$|Devise/);
  });
});

test.describe("Factures d'achat : texte particulier à l'export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("CSV : un fournisseur qui commence par « = » n'est pas lu comme une formule par le tableur", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const dialogue = fenetre(page, "Exporter les factures");
    const [telechargement] = await Promise.all([page.waitForEvent("download"), dialogue.getByRole("button", { name: "Exporter" }).click()]);
    const chemin = test.info().outputPath("export.csv");
    await telechargement.saveAs(chemin);
    const [, ...factures] = lireCsv(readFileSync(chemin, "utf8").trimEnd());
    const formule = factures.find((l) => (l[0] || "").includes("HYPERLINK"));
    expect(formule, "Facture au fournisseur « =HYPERLINK(…) » absente de l'export").toBeTruthy();
    expect(formule[0], "La cellule commence par « = » : le tableur l'exécute comme une formule").not.toMatch(/^[=+\-@]/);
    expect(formule[1], "Le numéro « =1+1 » est calculé par le tableur").not.toMatch(/^[=+\-@]/);
  });
});

// --- Actions (« Saisie Achats ») ----------------------------------------------------

test.describe("Factures d'achat : chaque action vérifiée en base", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("« Payée » dans la fiche : statut payé et date de paiement", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FAS.aPayer);
    await tiroir.getByRole("button", { name: "Payée" }).click();
    await expect(notification(page, "Facture marquée comme payée")).toBeVisible();
    const doc = await enBase(FAS.aPayer);
    expect(doc.status).toBe("PAID");
    expect(doc.paymentDate).toBeTruthy();
  });

  test("Supprimer depuis la fiche : confirmation, puis plus en base", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FAS.aSupprimer);
    await tiroir.locator("button:has(svg.lucide-trash2)").last().click();
    await fenetre(page, "Supprimer cette facture ?").getByRole("button", { name: "Supprimer" }).click();
    await expect.poll(() => enBase(FAS.aSupprimer)).toBeNull();
  });

  test("Supprimer une facture rapprochée : sa transaction redevient à rapprocher", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FAS.rapprocheeASupprimer);
    await tiroir.locator("button:has(svg.lucide-trash2)").last().click();
    await fenetre(page, "Supprimer cette facture ?").getByRole("button", { name: "Supprimer" }).click();
    await expect.poll(() => enBase(FAS.rapprocheeASupprimer)).toBeNull();
    const tx = await txEnBase(TS.rapprocheeASupprimer);
    expect(tx.linkedPurchaseInvoiceIds.map(String)).toEqual([]);
    expect(tx.reconciliationStatus).toBe("unmatched");
  });

  async function selectionner(page, factures) {
    await ouvrirListe(page);
    await rechercher(page, factures[0].invoiceNumber.slice(0, -1));
    await expect(lignesDonnees(page)).toHaveCount(factures.length);
    for (const l of await lignesDonnees(page).all()) await l.getByRole("checkbox").check();
  }

  test("Actions groupées « Marquer payées » : les deux factures payées", async ({ page }) => {
    await selectionner(page, [FAS.groupeStatut1, FAS.groupeStatut2]);
    await page.getByRole("button", { name: "Actions groupées" }).click();
    await page.getByRole("menuitem", { name: "Marquer payées" }).click();
    await expect(notification(page, "2 facture(s) mise(s) à jour")).toBeVisible();
    for (const f of [FAS.groupeStatut1, FAS.groupeStatut2]) expect((await enBase(f)).status).toBe("PAID");
  });

  test("Actions groupées « Catégoriser » : sous-catégorie et catégorie large enregistrées", async ({ page }) => {
    await selectionner(page, [FAS.groupeCategorie1, FAS.groupeCategorie2]);
    await page.getByRole("button", { name: "Actions groupées" }).click();
    await page.getByRole("menuitem", { name: "Catégoriser" }).click();
    await page.getByRole("menuitem", { name: "Logiciels", exact: true }).click();
    await expect(notification(page, /2 facture\(s\) catégorisée\(s\)/)).toBeVisible();
    for (const f of [FAS.groupeCategorie1, FAS.groupeCategorie2]) {
      const doc = await enBase(f);
      expect({ sous: doc.subcategory, large: doc.category }).toEqual({ sous: "logiciel", large: "SOFTWARE" });
    }
  });

  test("Suppression groupée : confirmation, puis plus en base", async ({ page }) => {
    await selectionner(page, [FAS.groupeSupprimer1, FAS.groupeSupprimer2]);
    await page.getByRole("button", { name: "Supprimer (2)" }).click();
    await fenetre(page, "Confirmer la suppression").getByRole("button", { name: "Supprimer" }).click();
    await expect.poll(async () => [await enBase(FAS.groupeSupprimer1), await enBase(FAS.groupeSupprimer2)]).toEqual([null, null]);
  });

  test("Menu d'une ligne « Archiver » : facture archivée", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, FAS.menuStatut.invoiceNumber);
    await expect(lignesDonnees(page)).toHaveCount(1);
    await cliquer(page, lignesDonnees(page).first().locator("button:has(svg.lucide-ellipsis)"));
    await page.getByRole("menuitem", { name: "Archiver" }).click();
    await expect(notification(page, "1 facture(s) mise(s) à jour")).toBeVisible();
    expect((await enBase(FAS.menuStatut)).status).toBe("ARCHIVED");
  });

  test("Menu d'une ligne « Catégoriser » : catégorie du référentiel enregistrée", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, FAS.menuCategorie.invoiceNumber);
    await expect(lignesDonnees(page)).toHaveCount(1);
    await cliquer(page, lignesDonnees(page).first().locator("button:has(svg.lucide-ellipsis)"));
    await page.getByRole("menuitem", { name: "Catégoriser" }).click();
    await page.getByRole("menuitem", { name: "Conseil", exact: true }).click();
    await expect.poll(async () => (await enBase(FAS.menuCategorie)).subcategory).toBe("conseil");
  });

  test("Modifier depuis la fiche : fournisseur et notes enregistrés", async ({ page }) => {
    await ouvrirFiche(page, FAS.aModifier);
    // En modification, le nom du fournisseur est dans un champ : la fiche se repère comme dernière fenêtre.
    const tiroir = page.getByRole("dialog").last();
    await tiroir.getByRole("button", { name: "Modifier" }).click();
    await tiroir.getByPlaceholder("Nom du fournisseur").fill("Fournisseur renommé à la main");
    await tiroir.getByPlaceholder("Commentaires internes...").fill("Note ajoutée après coup");
    await tiroir.getByRole("button", { name: "Enregistrer" }).click();
    await expect.poll(async () => (await enBase(FAS.aModifier)).notes).toBe("Note ajoutée après coup");
    expect((await enBase(FAS.aModifier)).supplierName).toBe("Fournisseur renommé à la main");
  });

  test("Rapprocher avec une transaction (recherche dans la fiche) : liée des deux côtés, facture payée", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FAS.aRapprocher);
    await tiroir.getByRole("button", { name: "Rechercher une transaction" }).click();
    await tiroir.getByPlaceholder("Libellé, référence, montant...").fill("A RAPPROCHER 110");
    await attendreCalme(page);
    await tiroir.getByText(TS.aRapprocher.description).click();
    await expect.poll(async () => (await enBase(FAS.aRapprocher)).linkedTransactionIds.map(String)).toEqual([TS.aRapprocher._id.toHexString()]);
    expect((await enBase(FAS.aRapprocher)).status).toBe("PAID");
    const tx = await txEnBase(TS.aRapprocher);
    expect(tx.linkedPurchaseInvoiceIds.map(String)).toEqual([FAS.aRapprocher._id.toHexString()]);
    expect(tx.reconciliationStatus).toBe("matched");
  });

  test("Rapprocher une facture de deux virements (acompte et solde) : deux liens", async ({ page }) => {
    for (const t of [TS.premierPaiement, TS.secondPaiement]) {
      // La fiche se ferme après chaque rapprochement : on la rouvre pour le second virement.
      const tiroir = await ouvrirFiche(page, FAS.deuxPaiements);
      const bouton = tiroir.getByRole("button", { name: /Rechercher une transaction|Rattacher une autre transaction/ }).first();
      await cliquer(page, bouton);
      await tiroir.getByPlaceholder("Libellé, référence, montant...").fill(t.description.split(" ").slice(-1)[0]);
      await attendreCalme(page);
      await tiroir.getByText(t.description).click();
      await expect.poll(async () => (await enBase(FAS.deuxPaiements)).linkedTransactionIds.map(String)).toContain(t._id.toHexString());
    }
    expect((await enBase(FAS.deuxPaiements)).linkedTransactionIds.length).toBe(2);
  });

  test("Détacher la transaction : liens retirés des deux côtés, facture de nouveau à payer", async ({ page }) => {
    const tiroir = await ouvrirFiche(page, FAS.delier);
    await tiroir.getByRole("button", { name: "Détacher cette transaction" }).click();
    await expect(notification(page, "Transaction détachée")).toBeVisible();
    const doc = await enBase(FAS.delier);
    expect(doc.linkedTransactionIds).toEqual([]);
    expect(doc.status).toBe("TO_PAY");
    expect((await txEnBase(TS.delier)).reconciliationStatus).toBe("unmatched");
  });

  test("Montant d'une facture rapprochée : modification refusée avec un message", async ({ page }) => {
    const fiche = await ouvrirFiche(page, FAS.rapprocheeMontant);
    await fiche.getByRole("button", { name: "Modifier" }).click();
    // En modification, la fenêtre s'appelle « Modifier la facture ».
    const tiroir = page.getByRole("dialog", { name: "Modifier la facture" });
    const ttc = tiroir.getByPlaceholder("0.00", { exact: true }).first();
    await ttc.fill("");
    await ttc.pressSequentially("99");
    await tiroir.getByRole("button", { name: "Enregistrer" }).click();
    await etape(page, "Message affiché", async () => {
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: /rapprochée|Déliez/i }).first()).toBeVisible();
    }, { capture: "ecran" });
    expect((await enBase(FAS.rapprocheeMontant)).amountTTC).toBe(88);
  });

  test("Catégorie d'une facture rapprochée changée : la transaction prend la même (la facture fait foi)", async ({ page }) => {
    const fiche = await ouvrirFiche(page, FAS.rapprocheeCategorie);
    await fiche.getByRole("button", { name: "Modifier" }).click();
    const tiroir = page.getByRole("dialog", { name: "Modifier la facture" });
    await tiroir.getByRole("combobox").nth(1).click();
    await page.getByPlaceholder("Rechercher une catégorie...").fill("telephone");
    await page.getByRole("option", { name: "Téléphone", exact: true }).click();
    await tiroir.getByRole("button", { name: "Enregistrer" }).click();
    await expect.poll(async () => (await enBase(FAS.rapprocheeCategorie)).subcategory).toBe("telephone");
    await expect.poll(async () => (await txEnBase(TS.rapprocheeCategorie)).category, { message: "La catégorie de la facture n'est pas passée à la transaction rapprochée" }).toBe("telephone");
  });

});

test.describe("Factures d'achat : retirer un justificatif", () => {
  // Confirmation par une fenêtre native du navigateur (« Retirer ce justificatif de la facture ? »), acceptée ici.
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS), dialoguesAttendus: /Retirer ce justificatif/ });

  test("Retirer le justificatif : plus en base", async ({ page }) => {
    await simulerApercus(page);
    page.on("dialog", (d) => d.accept().catch(() => {}));
    const tiroir = await ouvrirFiche(page, FAS.avecJustificatif);
    await tiroir.getByRole("button", { name: "Retirer ce justificatif" }).first().click();
    await expect.poll(async () => (await enBase(FAS.avecJustificatif)).files.length).toBe(0);
  });
});
