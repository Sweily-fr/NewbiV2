/**
 * Bons de commande : chaque parcours vérifié en base, organisation « Ventes »
 * (propriétaire). Statuts depuis le panneau et le menu, conversion en
 * facture, envoi par e-mail, PDF, suppression groupée, export. Chaque
 * parcours a son bon (donnees/lot-devis-bc-bl.mjs).
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre, SELECTEUR_NOTIFICATION_ERREUR, SELECTEUR_NOTIFICATION_SUCCES } from "../outils.mjs";
import { attendreCalme, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BC_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { actionDeLigne, chercherEnBase, enBase, epingler, ligneDe, notification, ouvrirListe, ouvrirPanneau, reference, relu, rechercher, telecharger, textePdf, texteUtile } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const ORG = COMPTES.ventes.organisation._id;
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\s/g, " ");
const idsDe = (liste) => (liste || []).map((x) => (typeof x?.toHexString === "function" ? x.toHexString() : String(x?._id ?? x)));

test.describe("Bons de commande : statuts", () => {
  test("Valider depuis le panneau : « Validé » en base", async ({ page }) => {
    const p = await ouvrirPanneau(page, "bc", B.aValiderPanneau);
    await etape(page, "Valider", async () => {
      await cliquer(page, p.getByRole("button", { name: "Valider", exact: true }));
      await expect(notification(page, /validé/i)).toBeVisible();
    }, { capture: "ecran" });
    await relu("bc", B.aValiderPanneau, (b) => b?.status, "Statut en base").toBe("VALIDATED");
  });

  test("Repasser en brouillon un bon en attente : « Brouillon » en base", async ({ page }) => {
    const b = B.aRepasserBrouillon;
    await epingler(page, "bc", b);
    await etape(page, "Repasser en brouillon", async () => {
      await actionDeLigne(page, "bc", b, "Repasser en brouillon");
      await expect(notification(page, "Bon de commande repassé en brouillon")).toBeVisible();
    }, { capture: "ecran" });
    await relu("bc", b, (x) => x?.status, "Statut en base").toBe("DRAFT");
  });
});

test.describe("Bons de commande : conversion en facture", () => {
  test("Bon livré converti : la facture créée reprend le client, les articles et les prix, et elle est liée au bon", async ({ page }) => {
    const b = B.aFacturer;
    await epingler(page, "bc", b);
    await etape(page, "Convertir en facture", async () => {
      await actionDeLigne(page, "bc", b, "Convertir en facture");
      await expect(page).toHaveURL(/\/dashboard\/outils\/factures\/new/);
      await expect(page.getByRole("combobox").filter({ hasText: b.client.name })).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    await etape(page, "Créer la facture", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(page.getByText("Articles et produits").first()).toBeVisible();
      await page.getByRole("button", { name: "Créer la facture" }).click();
      await expect(notification(page, "Facture créée avec succès")).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    const [facture] = await chercherEnBase("invoices", { workspaceId: ORG, "items.description": b.items[0].description });
    expect(facture, "Facture enregistrée").toBeTruthy();
    expect.soft(facture.client?.name).toBe(b.client.name);
    expect.soft(facture.items.map((a) => [a.description, a.quantity, a.unitPrice]), "Articles repris du bon").toEqual(b.items.map((a) => [a.description, a.quantity, a.unitPrice]));
    expect.soft(facture.finalTotalTTC, "Total TTC").toBe(b.finalTotalTTC);
    expect.soft(facture.purchaseOrderNumber, "Référence du bon de commande sur la facture").toBe(reference(b));
    await relu("bc", b, (x) => idsDe(x?.linkedInvoices), "Le bon liste sa facture").toContain(facture._id.toHexString());
  });
});

test.describe("Bons de commande : envoi par e-mail", () => {
  test("Envoi en échec (service d'e-mail injoignable) : le site le dit, sans annoncer de succès", async ({ page }) => {
    const b = B.aEnvoyer;
    await epingler(page, "bc", b);
    await cliquer(page, ligneDe(page, "bc", b).locator("button:has(svg.lucide-mail)"));
    const f = page.getByRole("dialog").filter({ hasText: "Envoyer le bon de commande" });
    await expect(f).toBeVisible();
    await etape(page, "Envoyer au client", async () => {
      await f.getByRole("button", { name: /Envoyer au client/ }).click();
      await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).or(page.locator(SELECTEUR_NOTIFICATION_ERREUR)).first(), "Aucune annonce après l'envoi, ni succès ni erreur").toBeVisible({ timeout: 45_000 });
    }, { capture: "ecran" });
    const succes = await page.locator(SELECTEUR_NOTIFICATION_SUCCES).allInnerTexts().catch(() => []);
    expect(succes.map((t) => t.replace(/\s+/g, " ").trim()), "Un envoi qui a échoué est annoncé réussi").toEqual([]);
  });
});

test.describe("Bons de commande : PDF", () => {
  test("Télécharger le PDF d'un bon en attente : un vrai PDF, au numéro et au montant du bon", async ({ page }) => {
    test.setTimeout(150_000);
    const b = B.pdf;
    const p = await ouvrirPanneau(page, "bc", b);
    const { nom, chemin } = await telecharger(page, () => cliquer(page, p.getByRole("button", { name: "Télécharger PDF" })), { timeout: 90_000 });
    expect(nom).toBe(`bon-de-commande_${reference(b)}.pdf`);
    const pdf = await textePdf(chemin);
    expect(pdf.entete, "Le fichier est un PDF").toBe("%PDF-");
    expect(pdf.pages, "Au moins une page").toBeGreaterThan(0);
    if (!texteUtile(pdf)) {
      // PDF image (génération côté serveur coupée en test) : contenu non lisible, seul le fichier est vérifié.
      test.info().annotations.push({ type: "info", description: "PDF image : texte non vérifiable en test" });
      return;
    }
    expect.soft(pdf.texte, "Numéro du bon dans le PDF").toContain(b.number);
    expect.soft(pdf.texte, "Client dans le PDF").toContain(b.client.name);
    expect.soft(pdf.texte.replace(/\s/g, ""), "Montant TTC dans le PDF").toContain(euros(b.finalTotalTTC).replace(/\s/g, ""));
  });
});

test.describe("Bons de commande : actions groupées et export", () => {
  test("Supprimer deux brouillons sélectionnés : tous deux supprimés, les autres restent", async ({ page }) => {
    await ouvrirListe(page, "bc");
    await rechercher(page, "bc", "Fromagerie Durand");
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "50" }).click();
    await attendreCalme(page);
    for (const b of [B.aSupprimerGroupe1, B.aSupprimerGroupe2]) await ligneDe(page, "bc", b).getByRole("checkbox").check();
    await etape(page, "Supprimer la sélection", async () => {
      await page.getByRole("button", { name: "Supprimer (2)" }).click();
      const confirmation = fenetre(page, "Confirmer la suppression");
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole("button", { name: /Supprimer/ }).last().click();
      await attendreCalme(page);
    }, { capture: "ecran" });
    for (const b of [B.aSupprimerGroupe1, B.aSupprimerGroupe2]) await expect.poll(() => enBase("bc", b), { message: `${reference(b)} encore en base` }).toBeNull();
    expect(await enBase("bc", B.brouillon), "Un brouillon non sélectionné a été supprimé").not.toBeNull();
  });

  async function exporterCsv(page) {
    await page.getByRole("button", { name: "Exporter" }).click();
    await page.getByRole("menuitem", { name: "CSV", exact: true }).click();
    const f = page.getByRole("dialog", { name: "Exporter en CSV" });
    await expect(f).toBeVisible();
    const { chemin } = await telecharger(page, () => f.getByRole("button", { name: "Exporter", exact: true }).click());
    return readFileSync(chemin, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  }

  test("Export CSV : une ligne par bon de l'organisation, avec numéro, client et montant", async ({ page }) => {
    await ouvrirListe(page, "bc");
    const lignes = await exporterCsv(page);
    const tous = await chercherEnBase("purchaseorders", { workspaceId: ORG });
    expect(lignes.length - 1, "Une ligne par bon de commande").toBe(tous.length);
    const l = lignes.find((x) => x.includes(reference(B.aExporter))) || "";
    expect.soft(l).toContain(B.aExporter.client.name);
    expect.soft(l).toContain(B.aExporter.finalTotalTTC.toFixed(2));
  });

  test("Export CSV : le statut est écrit en clair (« Validé »), pas en code", async ({ page }) => {
    await ouvrirListe(page, "bc");
    const lignes = await exporterCsv(page);
    const l = lignes.find((x) => x.includes(reference(B.aExporter))) || "";
    expect(l, "Statut d'un bon validé dans l'export").toContain("Validé");
    expect(lignes.join("\n"), "Codes techniques de statut dans le fichier").not.toMatch(/;(VALIDATED|CONFIRMED|IN_PROGRESS|DELIVERED);/);
  });
});
