/**
 * Fichiers des factures : import de factures (PDF) depuis la liste, annexe
 * PDF ajoutée à une facture. Le stockage (R2) et l'analyse des PDF (OCR)
 * sont coupés en test : un import ou un envoi qui ne peut pas aboutir doit le
 * dire, jamais se terminer en silence.
 */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { fenetreTitree, notifications, ouvrirListe, ouvrirNouvelle } from "./pages.mjs";

async function pdf(texte = "Facture importée de test") {
  const doc = await PDFDocument.create();
  const p = doc.addPage([595, 842]);
  p.drawText(texte, { x: 50, y: 780, size: 14, font: await doc.embedFont(StandardFonts.Helvetica) });
  return Buffer.from(await doc.save());
}

test.describe("Factures : import de factures", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  async function ouvrirImport(page) {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Importer", exact: true }).click();
    const fenetre = fenetreTitree(page, "Importer des factures");
    await expect(fenetre).toBeVisible();
    return fenetre;
  }

  test("Un fichier qui n'est pas un PDF est refusé avec un message", async ({ page }) => {
    const fenetre = await ouvrirImport(page);
    await fenetre.locator("input[type=file]").setInputFiles({ name: "releve.txt", mimeType: "text/plain", buffer: Buffer.from("pas un pdf") });
    await expect(notifications(page).filter({ hasText: "releve.txt: PDF uniquement" }).first()).toBeVisible();
    await expect(fenetre.getByRole("button", { name: /^Importer/ }).last()).toBeDisabled();
  });

  test.describe(() => {
    // Échec attendu de l'import (stockage coupé en test), que le site écrit dans la console.
    test.use({ erreursConsoleAutorisees: /Import échoué|Erreur GraphQL|Erreur réseau|importInvoiceDirect|GraphQL Error/ });

    test("Un PDF dont l'import échoue : un message explique l'échec", async ({ page }) => {
      const avant = await (await base()).collection("imported_invoices").countDocuments({ workspaceId: COMPTES.factures.organisation._id });
      const fenetre = await ouvrirImport(page);
      await fenetre.locator("input[type=file]").setInputFiles({ name: "facture-fournisseur.pdf", mimeType: "application/pdf", buffer: await pdf() });
      await fenetre.getByRole("button", { name: /^Importer 1 facture/ }).click();
      await etape(page, "Fin de l'import", async () => {
        await expect(notifications(page).filter({ hasText: /Import de 1 facture/ }).first()).toBeHidden({ timeout: 60_000 });
        await attendreCalme(page);
        const apres = await (await base()).collection("imported_invoices").countDocuments({ workspaceId: COMPTES.factures.organisation._id });
        if (apres === avant) {
          await expect(notificationsErreur(page).first(), "L'import a échoué sans aucun message : l'utilisateur ne sait pas que sa facture n'est pas importée").toBeVisible({ timeout: 5_000 });
        } else {
          await expect(notifications(page).filter({ hasText: /importée\(s\)/ }).first()).toBeVisible();
        }
      }, { capture: "ecran" });
    });
  });
});

test.describe("Factures : annexe PDF", () => {
  // Organisation « Atelier » (compte par défaut) : éditeur d'une nouvelle facture.
  async function ajouterAnnexe(page, fichier) {
    await ouvrirNouvelle(page);
    await page.locator("main button:has(svg.lucide-settings)").first().click();
    await expect(page.getByText("Paramètres de la facture").first()).toBeVisible();
    const [selecteur] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Ajouter une annexe PDF" }).click()]);
    await selecteur.setFiles(fichier);
    await attendreCalme(page);
  }

  test("Une annexe qui n'est pas un PDF est refusée avec un message", async ({ page }) => {
    await ajouterAnnexe(page, { name: "conditions.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("PK") });
    await expect(notifications(page).filter({ hasText: "L'annexe doit être un fichier PDF" }).first()).toBeVisible();
  });

  test("Une annexe de plus de 2 Mo est refusée avec un message", async ({ page }) => {
    const gros = Buffer.concat([await pdf(), Buffer.alloc(2_200_000, 32)]);
    await ajouterAnnexe(page, { name: "cgv-lourdes.pdf", mimeType: "application/pdf", buffer: gros });
    await expect(notifications(page).filter({ hasText: "PDF trop volumineux (2 Mo maximum)" }).first()).toBeVisible();
  });

  test.describe(() => {
    test.use({ erreursConsoleAutorisees: /uploadDocumentAnnex|GraphQL Error|annexe/i });
    test("Une annexe PDF valide : ajoutée, ou un message si l'envoi échoue", async ({ page }) => {
      await ajouterAnnexe(page, { name: "conditions-generales.pdf", mimeType: "application/pdf", buffer: await pdf("Conditions générales de vente") });
      await page.waitForTimeout(2_000);
      const ajoutee = await page.getByText("conditions-generales.pdf").first().isVisible().catch(() => false);
      if (!ajoutee) await expect(notificationsErreur(page).first(), "Annexe ni ajoutée ni refusée : aucun message").toBeVisible();
    });
  });
});
