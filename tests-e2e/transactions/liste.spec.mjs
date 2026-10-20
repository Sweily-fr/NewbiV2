/**
 * Transactions : ce que la liste affiche comparé à la base (onglets, pages,
 * comptes, solde, libellés, montants), recherche, filtres (catégorie,
 * méthode de paiement, type à l'API), export (contenu des fichiers), et
 * chaque action vérifiée en base (catégorie du référentiel, libellé,
 * rapprochement avec une facture de vente ou d'achat, déliaison,
 * justificatifs, suggestions de rapprochement). Lecture : « Achats »
 * (jamais modifiée) ; actions : « Saisie Achats » et l'offre d'entrée.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { FACTURES_ACHAT_SAISIE, FACTURES_VENTE, SUGGESTIONS, TRANSACTIONS, TRANSACTIONS_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { connecte, SESSION_TOKEN_ACHATS, SESSION_TOKEN_FREELANCE_ACHATS, SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { appelApi } from "../securite.mjs";
import { connecteAchats, lireCsv, ORG } from "../achats-banque.mjs";

const XLSX = createRequire(import.meta.url)("xlsx");
const T = TRANSACTIONS;
const TS = TRANSACTIONS_SAISIE;
const URL = "/dashboard/outils/transactions";
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const txEnBase = async (doc) => (await base()).collection("transactions").findOne({ _id: doc._id });
const tiroirDe = (page) => page.locator("div.fixed.right-0").filter({ has: page.getByRole("heading", { level: 2 }) }).last();

async function ouvrirListe(page) {
  await ouvrir(page, URL, { pret: page.getByRole("tab", { name: /^Toutes/ }) });
  await expect(page.getByRole("row").nth(1)).toBeVisible();
}

async function ouvrirTiroir(page, t) {
  await ouvrir(page, `${URL}?transactionId=${t._id.toHexString()}`, { pret: tiroirDe(page) });
  await attendreCalme(page);
  return tiroirDe(page);
}

async function rechercher(page, texte) {
  await page.getByRole("textbox", { name: "Filter transactions" }).fill(texte);
  await attendreCalme(page);
  await page.waitForTimeout(600);
}

const lignes = (page) => page.getByRole("row").filter({ has: page.getByRole("button", { name: "Actions de la transaction" }) });
async function textesDesLignes(page) {
  return lignes(page).evaluateAll((rs) => rs.map((r) => r.innerText.replace(/\s+/g, " ").trim()));
}

// --- Affichage (« Achats ») ---------------------------------------------------------

test.describe("Transactions : ce que la liste affiche", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("Onglets : chaque compteur égale le nombre de transactions en base", async ({ page }) => {
    await ouvrirListe(page);
    const col = (await base()).collection("transactions");
    const sansLien = [{ linkedInvoiceIds: { $size: 0 } }, { linkedPurchaseInvoiceIds: { $size: 0 } }, { linkedImportedInvoiceIds: { $size: 0 } }];
    const maintenant = new Date();
    const ilYaUnMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, maintenant.getDate());
    const compte = (filtre) => col.countDocuments({ workspaceId: ORG, deletedAt: null, ...filtre });
    const attendus = {
      Toutes: await compte({}),
      "Régler le dernier mois": await compte({ date: { $gte: ilYaUnMois } }),
      "À rapprocher": await compte({ amount: { $gt: 0 }, reconciliationStatus: { $nin: ["matched", "ignored"] }, "receiptFiles.0": { $exists: false }, $and: sansLien }),
      "Justificatif manquant": await compte({ provider: { $ne: "manual" }, amount: { $lt: 0 }, "receiptFiles.0": { $exists: false }, $and: sansLien }),
    };
    for (const [onglet, n] of Object.entries(attendus)) {
      await expect.soft(page.getByRole("tab", { name: `${onglet} ${n}` }), `Compteur de l'onglet « ${onglet} » (${n} en base)`).toBeVisible();
    }
  });

  test("Onglet « Justificatif manquant » : seulement des dépenses sans pièce", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("tab", { name: /^Justificatif manquant/ }).click();
    await attendreCalme(page);
    const textes = await textesDesLignes(page);
    expect(textes.length).toBeGreaterThan(0);
    expect(textes.some((t) => t.includes(T.loyer.description)), "Le loyer a un justificatif").toBe(false);
    expect(textes.every((t) => /-\d/.test(t)), "Un encaissement figure dans « Justificatif manquant »").toBe(true);
  });

  test("Le solde affiché est la somme des comptes, « Masquer le solde » le floute", async ({ page }) => {
    await ouvrirListe(page);
    const solde = page.getByText(/17\s345,67\s€/).first();
    await expect(solde).toBeVisible();
    await page.getByRole("button", { name: "Masquer le solde" }).click();
    await expect(solde).toHaveClass(/blur/);
    await expect(page.getByRole("button", { name: "Afficher le solde" })).toBeVisible();
  });

  test("Choisir le livret : seules ses transactions, son solde", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Tous les comptes" }).click();
    await page.getByRole("menuitem", { name: /Livret pro/ }).click();
    await attendreCalme(page);
    const textes = await textesDesLignes(page);
    expect(textes.length).toBe(2);
    expect(textes.join(" ")).toContain("LIVRET PRO");
    await expect(page.getByText(/5\s000,00\s€/).first()).toBeVisible();
  });

  test("Deux pages : chaque transaction une fois, la plus récente en tête", async ({ page }) => {
    await ouvrirListe(page);
    const premiere = await textesDesLignes(page);
    expect(premiere[0], "La transaction la plus récente doit être en tête").toMatch(/Spotify|SPOTIFY/);
    await cliquer(page, page.getByRole("button", { name: "Go to next page" }));
    await attendreCalme(page);
    const seconde = await textesDesLignes(page);
    const total = await (await base()).collection("transactions").countDocuments({ workspaceId: ORG, deletedAt: null });
    expect(premiere.length + seconde.length).toBe(total);
  });

  test("Le libellé « PRLV SEPA ADOBE SYSTEMS » est attribué à Adobe, pas à un autre marchand", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, "ADOBE");
    const textes = await textesDesLignes(page);
    expect(textes.length).toBe(1);
    expect(textes[0], "Le prélèvement Adobe s'affiche « Microsoft » (le motif « ms » de « SYSTEMS » est pris pour Microsoft)").not.toContain("Microsoft");
  });

  test("Montants au format français (-1 200,00 €)", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, "LOYER");
    expect((await textesDesLignes(page))[0], "Montant affiché « -1200.00 € » au lieu de « -1 200,00 € »").toMatch(/-1\s200,00\s€/);
  });

  test("Le tiroir d'une transaction est annoncé comme une fenêtre (rôle et titre)", async ({ page }) => {
    await ouvrirTiroir(page, T.carburant);
    await expect(page.getByRole("dialog"), "Le tiroir n'a pas le rôle de fenêtre : un lecteur d'écran ne l'annonce pas et le focus n'y est pas gardé").toHaveCount(1, { timeout: 3_000 });
  });

  test("Copier la description : dans le presse-papiers, avec une confirmation", async ({ page }) => {
    await ouvrirListe(page);
    await rechercher(page, "SPOTIFY");
    await cliquer(page, lignes(page).first().getByRole("button", { name: "Actions de la transaction" }));
    await page.getByRole("menuitem", { name: /Copier description/ }).click();
    await expect(notification(page, "Description copiée dans le presse-papier")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(T.spotify.description);
  });
});

test.describe("Transactions : recherche et filtres", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  for (const [nom, saisie, attendu] of [
    ["sans accent (« cafe » trouve « CAFÉ »)", "grand cafe", T.restaurant],
    ["par le montant (« 64,80 »)", "64,80", T.carburant],
    ["par la référence du virement", "F-2026-0101", T.virementGamma],
  ]) {
    test(`Recherche ${nom}`, async ({ page }) => {
      await ouvrirListe(page);
      await rechercher(page, saisie);
      const textes = await textesDesLignes(page);
      expect(textes.length, `Résultats : ${JSON.stringify(textes)}`).toBe(1);
      expect(textes[0]).toContain(attendu.amount > 0 ? "+" : "-");
    });
  }

  async function ajouterCritere(page, champ) {
    await page.getByRole("button", { name: "Filtres" }).click();
    await page.getByRole("button", { name: "Ajouter un critère" }).click();
    const critere = page.getByRole("dialog", { name: "Filtres" }).or(page.locator("[data-radix-popper-content-wrapper]").filter({ hasText: "Ajouter un critère" })).last();
    if (champ !== "Catégorie") {
      await critere.getByRole("combobox").first().click();
      await page.getByRole("option", { name: champ, exact: true }).click();
    }
    return critere;
  }

  test("Filtre « Catégorie = Carburant » : seulement la dépense de carburant", async ({ page }) => {
    await ouvrirListe(page);
    const critere = await ajouterCritere(page, "Catégorie");
    await critere.getByRole("combobox").last().click();
    await page.getByPlaceholder("Rechercher une catégorie...").fill("carburant");
    await page.getByRole("option", { name: "Carburant", exact: true }).click();
    await page.getByRole("button", { name: "Appliquer" }).click();
    await attendreCalme(page);
    const textes = await textesDesLignes(page);
    expect(textes.length).toBe(1);
    expect(textes[0]).toContain("TOTALENERGIES");
  });

  test("Filtre « Méthode de paiement = Carte » : les paiements affichés « Carte » sont trouvés", async ({ page }) => {
    await ouvrirListe(page);
    const critere = await ajouterCritere(page, "Méthode de paiement");
    await critere.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Carte", exact: true }).click();
    await page.getByRole("button", { name: "Appliquer" }).click();
    await attendreCalme(page);
    const textes = await textesDesLignes(page);
    // Les dépenses par carte de la banque n'ont pas de méthode enregistrée : le site les affiche « Carte » par défaut.
    expect(textes.join(" | "), "Le filtre « Carte » ne trouve aucune des dépenses par carte (CB …) affichées comme telles").toContain("TOTALENERGIES");
  });

  test("Filtre par type à l'API (« Entrées » : CREDIT) : renvoie les encaissements", async ({ page }) => {
    await ouvrirListe(page);
    const reponse = await appelApi(page, `query($w: ID!) { transactions(workspaceId: $w, filters: { type: CREDIT }, limit: 100) { id amount } }`, { w: ORG }, { organisation: ORG });
    expect(reponse.errors).toEqual([]);
    const attendus = await (await base()).collection("transactions").countDocuments({ workspaceId: ORG, deletedAt: null, type: "credit" });
    expect(reponse.data.transactions.length, "Le filtre par type ne renvoie rien (CREDIT envoyé en majuscules, « credit » en base)").toBe(attendus);
  });
});

test.describe("Transactions : export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  async function exporter(page, format) {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: format }).click()]);
    const chemin = test.info().outputPath(telechargement.suggestedFilename());
    await telechargement.saveAs(chemin);
    return { nom: telechargement.suggestedFilename(), chemin };
  }

  test("CSV : une ligne par transaction, libellés et montants justes", async ({ page }) => {
    const { nom, chemin } = await exporter(page, "CSV (.csv)");
    expect(nom).toMatch(/^transactions_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/);
    const contenu = readFileSync(chemin, "utf8");
    const separateur = contenu.split("\n")[0].includes(";") ? ";" : ",";
    const lignesCsv = separateur === ";" ? lireCsv(contenu.trimEnd()) : contenu.trimEnd().split(/\r?\n/).map((l) => l.split(","));
    const total = await (await base()).collection("transactions").countDocuments({ workspaceId: ORG, deletedAt: null });
    expect(lignesCsv.length - 1, "Une ligne par transaction").toBe(total);
    const texte = lignesCsv.map((l) => l.join(" ")).join("\n");
    expect(texte).toContain(T.urssaf.description);
    expect(texte).toMatch(/2\s?400[,.]00|-2400/);
  });

  test("Excel : une ligne par transaction", async ({ page }) => {
    const { nom, chemin } = await exporter(page, "Excel (.xlsx)");
    expect(nom).toMatch(/\.xlsx$/);
    const classeur = XLSX.read(readFileSync(chemin));
    const lignesXlsx = XLSX.utils.sheet_to_json(classeur.Sheets[classeur.SheetNames[0]], { header: 1 }).filter((l) => l.length);
    const total = await (await base()).collection("transactions").countDocuments({ workspaceId: ORG, deletedAt: null });
    expect(lignesXlsx.length - 1).toBe(total);
    expect(JSON.stringify(lignesXlsx)).toContain(T.edf.description);
  });
});

test.describe("Transactions : libellé piégé à l'export", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("CSV : un libellé qui commence par « = » n'est pas lu comme une formule par le tableur", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Exporter" }).click();
    const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "CSV (.csv)" }).click()]);
    const chemin = test.info().outputPath("transactions.csv");
    await telechargement.saveAs(chemin);
    const contenu = readFileSync(chemin, "utf8");
    const ligneFormule = contenu.split(/\r?\n/).find((l) => l.includes("VIREMENT FORMULE"));
    expect(ligneFormule, "Transaction « =1+1 VIREMENT FORMULE » absente de l'export").toBeTruthy();
    const cellules = ligneFormule.split(/[;,](?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, ""));
    expect(cellules.some((c) => /^[=+@]/.test(c) || /^-[^\d]/.test(c)), "Une cellule commence par « = » : le tableur l'exécute comme une formule").toBe(false);
  });
});

// --- Actions (« Saisie Achats ») ----------------------------------------------------

test.describe("Transactions : chaque action vérifiée en base", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Catégorie choisie dans le référentiel, trouvée sans accent : enregistrée et marquée manuelle", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.aCategoriser);
    await tiroir.getByRole("combobox").first().click();
    await page.getByPlaceholder("Rechercher une catégorie...").fill("electricite");
    await page.getByRole("option", { name: "Électricité", exact: true }).click();
    await expect.poll(async () => (await txEnBase(TS.aCategoriser)).category).toBe("electricite");
    const doc = await txEnBase(TS.aCategoriser);
    expect({ manuelle: doc.categoryIsManual, large: doc.expenseCategory }).toEqual({ manuelle: true, large: "UTILITIES" });
  });

  test("Libellé modifié dans le tiroir : enregistré en quittant le champ", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.libelleAModifier);
    const description = tiroir.getByPlaceholder("Description de la transaction");
    await description.fill("Fournitures pour le salon de Lyon");
    await description.blur();
    await expect.poll(async () => (await txEnBase(TS.libelleAModifier)).description).toBe("Fournitures pour le salon de Lyon");
    expect((await txEnBase(TS.libelleAModifier)).descriptionIsManual).toBe(true);
  });

  test("Encaissement rapproché d'une facture de vente : liés des deux côtés, facture payée", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.encaissement);
    const facture = FACTURES_VENTE.aRapprocher;
    const carte = tiroir.locator("div").filter({ hasText: facture.client.name }).filter({ has: page.getByRole("button", { name: "Rapprocher" }) }).last();
    await carte.getByRole("button", { name: "Rapprocher" }).click();
    await expect.poll(async () => (await txEnBase(TS.encaissement)).linkedInvoiceIds.map(String)).toEqual([facture._id.toHexString()]);
    const doc = await (await base()).collection("invoices").findOne({ _id: facture._id });
    expect(doc.status).toBe("COMPLETED");
    expect(doc.linkedTransactionIds.map(String)).toEqual([TS.encaissement._id.toHexString()]);
  });

  test("Facture de vente détachée : liens retirés, facture de nouveau à encaisser", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.encaissementLie);
    await tiroir.locator("[title='Détacher la facture']").first().click();
    await expect(notification(page, "Facture détachée")).toBeVisible();
    expect((await txEnBase(TS.encaissementLie)).linkedInvoiceIds).toEqual([]);
    expect((await (await base()).collection("invoices").findOne({ _id: FACTURES_VENTE.liee._id })).status).toBe("PENDING");
  });

  test("Facture d'achat rattachée depuis la transaction : liées des deux côtés", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.depuisTransaction);
    await tiroir.getByRole("button", { name: "Rattacher" }).click();
    await tiroir.getByPlaceholder("Fournisseur, n° de facture, montant...").fill(FACTURES_ACHAT_SAISIE.depuisTransaction.invoiceNumber);
    await attendreCalme(page);
    await tiroir.getByText(FACTURES_ACHAT_SAISIE.depuisTransaction.invoiceNumber).first().click();
    await expect.poll(async () => (await txEnBase(TS.depuisTransaction)).linkedPurchaseInvoiceIds.map(String)).toEqual([FACTURES_ACHAT_SAISIE.depuisTransaction._id.toHexString()]);
    await expect
      .poll(async () => (await (await base()).collection("purchaseinvoices").findOne({ _id: FACTURES_ACHAT_SAISIE.depuisTransaction._id })).linkedTransactionIds.map(String), { message: "La facture d'achat ne connaît pas la transaction rattachée" })
      .toEqual([TS.depuisTransaction._id.toHexString()]);
  });

  for (const [nom, t] of [
    ["Justificatif retiré : plus sur la transaction", TS.justificatifARetirer],
    ["Justificatif enregistré sans identifiant (ancien script) : se retire aussi", TS.justificatifSansId],
  ]) {
    test(nom, async ({ page }) => {
      await page.route(/\/api\/document-preview\/|\/documents\/imported\//, (r) => r.fulfill({ status: 404, body: "" }));
      const tiroir = await ouvrirTiroir(page, t);
      await tiroir.locator("[title='Retirer']").first().click();
      const confirmation = page.getByRole("alertdialog");
      if (await confirmation.isVisible({ timeout: 2_000 }).catch(() => false)) await confirmation.getByRole("button", { name: /Retirer|Supprimer|Confirmer/ }).click();
      await expect(notification(page, "Justificatif supprimé")).toBeVisible();
      await expect.poll(async () => (await txEnBase(t)).receiptFiles.length).toBe(0);
    });
  }

});

test.describe("Transactions : justificatif quand le stockage est injoignable", () => {
  // Le stockage de fichiers (R2) n'existe pas en test : l'échec de l'envoi est écrit dans la console.
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS), erreursConsoleAutorisees: /ATTACH RECEIPT|Cloudflare|ECONNREFUSED|GraphQL Error|upload/i });

  test("Justificatif ajouté alors que le stockage est injoignable (test) : l'échec est signalé", async ({ page }) => {
    const tiroir = await ouvrirTiroir(page, TS.aCategoriser);
    const champ = tiroir.locator("input[type=file]").first();
    await champ.setInputFiles({ name: "ticket.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF\n") });
    await etape(page, "Message d'échec", async () => {
      await expect(page.locator("[data-sonner-toast]:has(svg.text-red-500)").first(), "L'échec de l'envoi du justificatif n'est pas signalé").toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    expect((await txEnBase(TS.aCategoriser)).receiptFiles.length).toBe(0);
  });
});

test.describe("Transactions : suggestions de rapprochement", () => {
  // Session normale : les cartes de suggestion s'affichent.
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_ACHATS) });

  test("« Rattacher » sur la carte : facture et transaction liées", async ({ page }) => {
    await ouvrir(page, URL, { pret: page.getByRole("tab", { name: /^Toutes/ }) });
    const carte = page.locator(`[data-reconciliation-toast] *`).filter({ hasText: SUGGESTIONS.transaction.description }).filter({ has: page.getByRole("button", { name: "Rattacher" }) }).last();
    await expect(carte).toBeVisible({ timeout: 20_000 });
    await carte.getByRole("button", { name: "Rattacher" }).click();
    await expect.poll(async () => (await txEnBase(SUGGESTIONS.transaction)).linkedPurchaseInvoiceIds.map(String)).toEqual([SUGGESTIONS.facture._id.toHexString()]);
    expect((await (await base()).collection("purchaseinvoices").findOne({ _id: SUGGESTIONS.facture._id })).status).toBe("PAID");
  });

  test("« Masquer » sur la carte : la suggestion disparaît, rien n'est lié", async ({ page }) => {
    await ouvrir(page, URL, { pret: page.getByRole("tab", { name: /^Toutes/ }) });
    const carte = page.locator(`[data-reconciliation-toast] *`).filter({ hasText: SUGGESTIONS.transactionMasquee.description }).filter({ has: page.getByRole("button", { name: "Masquer" }) }).last();
    await expect(carte).toBeVisible({ timeout: 20_000 });
    await carte.getByRole("button", { name: "Masquer" }).click();
    await expect(page.getByText(SUGGESTIONS.transactionMasquee.description).filter({ visible: true })).toHaveCount(1);
    expect((await txEnBase(SUGGESTIONS.transactionMasquee)).linkedPurchaseInvoiceIds).toEqual([]);
  });
});

export { COMPTES };
