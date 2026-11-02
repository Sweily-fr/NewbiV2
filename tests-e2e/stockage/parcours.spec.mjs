/**
 * Stockage des espaces : écran Paramètres > Stockage, bandeaux 80 % et
 * 100 %, refus des nouveaux envois (code STORAGE_QUOTA_EXCEEDED) et
 * proposition « packs ou offre supérieure ».
 *
 * Les prix Stripe des packs ne sont pas configurés en CI : l'achat de packs
 * est masqué et seule la montée en gamme est proposée (comportement voulu
 * quand les variables manquent).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte } from "../config.mjs";
import { appelApi, envoiFichierApi } from "../securite.mjs";
import { COMPTES_STOCKAGE, MEMBRES_STOCKAGE } from "../donnees/lot-stockage.mjs";

const PLEIN = COMPTES_STOCKAGE.plein.organisation._id;
const PLEIN_ID = PLEIN.toHexString();
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
const REFUS = /Espace de stockage plein : 75 Go utilisés sur 75 Go/;

const ouvrirStockage = async (page) => {
  await ouvrir(page, "/dashboard?parametres=stockage");
  await expect(page.getByTestId("stockage-resume")).toBeVisible({ timeout: 30_000 });
};

const codeRefus = (reponse) => reponse.errors?.[0]?.extensions?.code;

test.describe("Stockage : écran et bandeaux (propriétaire, espace plein)", () => {
  test.use({ storageState: connecte(COMPTES_STOCKAGE.plein.token) });

  test("Paramètres > Stockage dit l'espace utilisé, le quota et le reste", async ({ page }) => {
    await ouvrirStockage(page);
    await expect(page.getByTestId("stockage-resume")).toHaveText(
      "75 Go utilisés sur 75 Go, il vous reste 0 Go.",
    );
    await expect(page.getByText("Offre Freelance : 75 Go.")).toBeVisible();
  });

  test("Le détail est donné par type de fichier et par personne, avec « Non attribué »", async ({ page }) => {
    await ouvrirStockage(page);
    const types = page.getByTestId("stockage-par-type");
    await expect(types).toContainText("Documents partagés");
    await expect(types).toContainText("60 Go");
    const personnes = page.getByTestId("stockage-par-personne");
    await expect(personnes).toContainText("Sacha Stockage");
    await expect(personnes).toContainText("Non attribué");
  });

  test("Sans prix Stripe des packs, seule l'offre supérieure est proposée, avec son prix", async ({ page }) => {
    await ouvrirStockage(page);
    await expect(page.getByTestId("offre-packs")).toHaveCount(0);
    // L'absence de packs est expliquée, pas seulement cachée
    await expect(page.getByTestId("packs-indisponibles")).toBeVisible();
    const offre = page.getByTestId("offre-superieure");
    await expect(offre).toContainText("Passer à l'offre TPE");
    await expect(offre).toContainText("400 Go de stockage, 48,99 € TTC/mois");
    await offre.getByRole("button", { name: "Passer à l'offre TPE" }).click();
    await expect(page.getByText("Choisissez le plan adapté à vos besoins.")).toBeVisible();
  });

  test("Le bandeau annonce l'espace plein et ouvre l'écran Stockage", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const bandeau = page.getByTestId("bandeau-stockage");
    await expect(bandeau).toContainText("les nouveaux envois de fichiers sont refusés");
    await bandeau.getByRole("button", { name: "Gérer le stockage" }).click();
    await expect(page.getByTestId("stockage-resume")).toBeVisible();
  });
});

test.describe("Stockage : alerte à 80 %", () => {
  test.use({ storageState: connecte(COMPTES_STOCKAGE.presque.token) });

  test("Le bandeau prévient à 80 % sans bloquer", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await expect(page.getByTestId("bandeau-stockage")).toContainText(
      "Espace de stockage utilisé à 82 % (330 Go sur 400 Go)",
    );
  });
});

test.describe("Stockage : membre sans accès à l'abonnement", () => {
  test.use({ storageState: connecte(MEMBRES_STOCKAGE.membre.token) });

  test("Le membre voit l'état, sans détail ni achat", async ({ page }) => {
    await ouvrirStockage(page);
    await expect(page.getByTestId("stockage-resume")).toContainText("75 Go utilisés sur 75 Go");
    await expect(page.getByTestId("stockage-par-type")).toHaveCount(0);
    await expect(page.getByTestId("offre-superieure")).toHaveCount(0);
    await expect(page.getByText(/réservés aux personnes qui gèrent l.abonnement/)).toBeVisible();
  });
});

test.describe("Stockage : refus des nouveaux envois", () => {
  test.use({
    storageState: connecte(COMPTES_STOCKAGE.plein.token),
    // Échec d'envoi journalisé par l'écran des documents partagés
    erreursConsoleAutorisees: /Erreur upload|Espace de stockage plein/,
  });

  test("Document partagé : refusé par l'API avec le code dédié, rien n'est créé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await envoiFichierApi(
      page,
      `mutation($w: ID!, $file: Upload!) { uploadSharedDocument(workspaceId: $w, file: $file) { success message } }`,
      { w: PLEIN_ID },
      { name: "devis.pdf", mimeType: "application/pdf", buffer: PDF },
      { organisation: PLEIN_ID },
    );
    expect(codeRefus(reponse)).toBe("STORAGE_QUOTA_EXCEEDED");
    expect(reponse.errors[0].message).toMatch(REFUS);
    expect(reponse.errors[0].message).not.toMatch(/€|http/);
    const offre = reponse.errors[0].extensions.details.offer;
    expect(offre.upgrade).toMatchObject({ plan: "pme", label: "TPE" });
    expect(offre.packs.additionalPacks).toBe(1);
    expect(await (await base()).collection("shareddocuments").countDocuments({ workspaceId: PLEIN })).toBe(0);
  });

  test("Transfert de fichiers : le départ d'un envoi en plusieurs parties est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `mutation { startMultipartUpload(transferId: "e2e-stockage-t1", fileId: "e2e-stockage-f1", fileName: "rushes.mp4", fileSize: 1000000, mimeType: "video/mp4", totalParts: 1) { uploadId } }`,
      {},
      { organisation: PLEIN_ID },
    );
    expect(codeRefus(reponse)).toBe("STORAGE_QUOTA_EXCEEDED");
    expect(reponse.errors[0].message).toMatch(REFUS);
  });

  test("Scan OCR d'une facture d'achat : refusé avant l'analyse", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await envoiFichierApi(
      page,
      `mutation($file: Upload!, $w: String!) { processDocumentOcr(file: $file, workspaceId: $w) { success message } }`,
      { w: PLEIN_ID },
      { name: "facture.pdf", mimeType: "application/pdf", buffer: PDF },
      { organisation: PLEIN_ID },
    );
    expect(codeRefus(reponse)).toBe("STORAGE_QUOTA_EXCEEDED");
  });

  test("Envoi depuis l'écran : la fenêtre de refus propose l'offre supérieure avec son prix", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/documents-partages", { pret: page.getByPlaceholder("Rechercher...") });
    await page.getByRole("button", { name: "Ajouter" }).first().click();
    const choix = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Importer des fichiers" }).click();
    await (await choix).setFiles({ name: "contrat.pdf", mimeType: "application/pdf", buffer: PDF });
    const fenetre = page.getByTestId("refus-stockage");
    await expect(fenetre).toBeVisible({ timeout: 30_000 });
    await expect(fenetre).toContainText(REFUS);
    await expect(fenetre).toContainText("Vos fichiers existants restent disponibles");
    await expect(fenetre.getByTestId("offre-superieure")).toContainText("48,99 € TTC/mois");
    expect(await (await base()).collection("shareddocuments").countDocuments({ workspaceId: PLEIN })).toBe(0);
  });
});
