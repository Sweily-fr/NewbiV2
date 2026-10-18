/**
 * Avoirs, avec le compte de l'organisation « Avoirs » (factures à créditer,
 * voir donnees/avoirs.mjs) : création depuis une facture, montants et règles
 * (jamais plus que la facture, pas sur un brouillon), affichage dans la liste.
 */
import { test, expect, etape } from "../outils.mjs";
import { base } from "../base.mjs";
import { cliquer } from "../navigation.mjs";
import { sessionCookie, SESSION_TOKEN_AVOIRS } from "../config.mjs";
import { AVOIRS, FACTURES_AVOIRS as F } from "../donnees/avoirs.mjs";
import { notifications } from "../editeur.mjs";
import { date, euros } from "../liste.mjs";
import {
  choisirRemboursement,
  choisirType,
  creerAvoir,
  LISTE_FACTURES,
  nouvelAvoir,
  ouvrirArticle,
  ouvrirFactures,
  panneauFacture,
  suivant,
} from "./editeur.mjs";

test.use({ storageState: { cookies: [sessionCookie(SESSION_TOKEN_AVOIRS)], origins: [] } });

const avoirsDe = async (f) => (await base()).collection("creditnotes").find({ originalInvoice: f._id }).toArray();
const factureEnBase = async (f) => (await base()).collection("invoices").findOne({ _id: f._id });

test.describe("Avoirs : création", () => {
  test("Avoir total depuis le panneau de la facture : montant négatif, facture inchangée", async ({ page }) => {
    const f = F.aCrediterTotal;
    await ouvrirFactures(page);
    await etape(page, "Panneau de la facture, bouton « Créer » des avoirs", async () => {
      await panneauFacture(page, f);
      await cliquer(page, page.getByRole("button", { name: "Créer", exact: true }));
      await expect(page).toHaveURL(new RegExp(`/factures/${f._id.toHexString()}/avoir/nouveau`));
      await expect(page.getByText("Facture d'origine").first()).toBeVisible();
    }, { capture: "ecran" });
    await etape(page, "Articles repris de la facture, puis création", async () => {
      await suivant(page);
      await expect(await ouvrirArticle(page, 0, f.items[0].description)).toHaveValue("-1");
      await creerAvoir(page);
      await expect(notifications(page).filter({ hasText: "Avoir créé avec succès" }).first()).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${LISTE_FACTURES}(\\?|$)`));
    }, { capture: "ecran" });
    await etape(page, "Enregistrement en base", async () => {
      const avoirs = await avoirsDe(f);
      expect(avoirs, "Un avoir enregistré pour cette facture").toHaveLength(1);
      expect.soft(avoirs[0], "Avoir enregistré").toMatchObject({
        prefix: "AV",
        originalInvoiceNumber: `${f.prefix}-${f.number}`,
        creditType: "CORRECTION",
        refundMethod: "NEXT_INVOICE",
        status: "CREATED",
        finalTotalHT: -1000,
        finalTotalTTC: -1200,
      });
      expect.soft(String(avoirs[0].number), "Numéro").toMatch(/^\d+$/);
      expect.soft((await factureEnBase(f)).status, "La facture garde son statut").toBe("PENDING");
    });
  });

  test("Avoir partiel : geste commercial, remboursé par virement, avec motif", async ({ page }) => {
    const f = F.aCrediterPartiel;
    await etape(page, "Type, remboursement et motif", async () => {
      await nouvelAvoir(page, f);
      await choisirType(page, "Geste commercial");
      await choisirRemboursement(page, "Virement bancaire");
      await page.locator("#reason").fill("Une journée de formation annulée");
    }, { capture: "ecran" });
    await etape(page, "Une seule des deux journées créditée", async () => {
      await suivant(page);
      const quantite = await ouvrirArticle(page, 0, f.items[0].description);
      await expect(quantite).toHaveValue("-2");
      await quantite.fill("-1");
      await creerAvoir(page);
      await expect(notifications(page).filter({ hasText: "Avoir créé avec succès" }).first()).toBeVisible();
    }, { capture: "ecran" });
    const [avoir] = await avoirsDe(f);
    expect(avoir, "Avoir enregistré").toMatchObject({
      creditType: "COMMERCIAL_GESTURE",
      refundMethod: "BANK_TRANSFER",
      reason: "Une journée de formation annulée",
      finalTotalHT: -500,
      finalTotalTTC: -600,
    });
  });

  test("Chaque type d'avoir proposé est accepté (« Autre »)", async ({ page }) => {
    const f = F.aCrediterPartiel;
    const avant = (await avoirsDe(f)).length;
    await nouvelAvoir(page, f);
    await choisirType(page, "Autre");
    await suivant(page);
    const quantite = await ouvrirArticle(page, 0, f.items[0].description);
    await quantite.fill("-0.5");
    await etape(page, "Créer l'avoir de type « Autre »", async () => {
      await creerAvoir(page);
      await expect(
        notifications(page).filter({ hasText: "Avoir créé avec succès" }).first(),
        "Le type « Autre » est proposé : l'avoir doit être créé",
      ).toBeVisible();
    }, { capture: "ecran" });
    expect(await avoirsDe(f), "Avoir enregistré").toHaveLength(avant + 1);
  });
});

test.describe("Avoirs : erreurs", () => {
  test("Avoir supérieur au montant restant : refusé avec une explication", async ({ page }) => {
    const f = F.avecAvoir;
    await nouvelAvoir(page, f);
    await suivant(page);
    await etape(page, "Créer un avoir de la totalité (déjà 600 € crédités)", async () => {
      await creerAvoir(page);
      await expect(notifications(page).filter({ hasText: "dépasse le montant restant disponible" })).toBeVisible();
      await expect(page).toHaveURL(/\/avoir\/nouveau/);
    }, { capture: "ecran" });
    expect(await avoirsDe(f), "Aucun nouvel avoir").toHaveLength(1);
  });

  test("Facture en brouillon : pas d'avoir possible, raison affichée", async ({ page }) => {
    const f = F.brouillon;
    await ouvrirFactures(page);
    await etape(page, "Panneau du brouillon", async () => {
      await panneauFacture(page, f);
      await expect(page.getByText(/Les avoirs ne peuvent être créés que pour les factures/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Créer", exact: true })).toHaveCount(0);
    }, { capture: "ecran" });
  });
});

test.describe("Avoirs : liste", () => {
  test("Onglet « Avoirs » de la liste des factures : avoir, facture liée, montant, date", async ({ page }) => {
    const a = AVOIRS.existant;
    await ouvrirFactures(page);
    await cliquer(page, page.getByRole("tab", { name: /^Avoirs/ }));
    const l = page.getByRole("row", { name: new RegExp(`AV-${a.number}\\b`) });
    await expect(l).toHaveCount(1);
    for (const texte of [a.client.name, a.originalInvoiceNumber, euros(a.finalTotalTTC), date(a.issueDate)]) {
      await expect.soft(l, texte).toContainText(texte);
    }
  });

  test("Panneau de la facture : l'avoir existant est listé avec son montant", async ({ page }) => {
    const f = F.avecAvoir;
    await ouvrirFactures(page);
    await panneauFacture(page, f);
    await expect(page.getByText(AVOIRS.existant.number, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(euros(AVOIRS.existant.finalTotalTTC)).first()).toBeVisible();
  });
});
