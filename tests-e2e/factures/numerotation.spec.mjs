/**
 * Numérotation des factures, avec l'organisation « Réglages Factures » en
 * numérotation séquentielle continue (un seul compteur pour tous les
 * préfixes) : la suite du préfixe du mois (0010, 0011) est en retard sur la
 * suite globale (jusqu'à 0057). Un brouillon rouvert doit proposer, et
 * recevoir, le numéro qui suit la séquence globale (défaut connu, corrigé le
 * 30/09/2026 : à surveiller).
 */
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES_REGLAGES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CLIENTS_FACTURES, NUMEROTATION } from "../donnees/lot-factures.mjs";
import { choisirClient, dansJours, etapeArticles, notifications, ouvrirEdition, ouvrirNouvelle } from "./pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_REGLAGES) });

const ORG = COMPTES.facturesReglages.organisation._id;

/** Prochain numéro de la séquence continue : le plus grand numéro émis, tous préfixes confondus, plus un. */
async function prochainNumero() {
  const emises = await (await base()).collection("invoices").find({ workspaceId: ORG, status: { $in: ["PENDING", "COMPLETED", "CANCELED"] } }).toArray();
  const max = Math.max(0, ...emises.map((f) => (/^\d+$/.test(f.number) ? Number(f.number) : 0)));
  return String(max + 1).padStart(4, "0");
}

async function numeroAffiche(page) {
  await page.locator("main button:has(svg.lucide-settings)").first().click();
  const champ = page.getByRole("textbox", { name: "Numéro de facture" });
  await expect(champ).toBeVisible();
  await attendreCalme(page);
  return champ.inputValue();
}

test.describe("Factures : numérotation continue", () => {
  test("Nouvelle facture : le numéro proposé suit la séquence de tous les préfixes", async ({ page }) => {
    await ouvrirNouvelle(page);
    const attendu = await prochainNumero();
    expect(await numeroAffiche(page), "Numéro proposé").toBe(attendu);
  });

  test("Brouillon rouvert : numéro proposé et numéro attribué à la validation suivent la séquence continue", async ({ page }) => {
    const brouillon = NUMEROTATION.brouillonDuMois;
    await ouvrirEdition(brouillon)(page);
    const attendu = await prochainNumero();
    await etape(page, "Numéro proposé dans les paramètres du brouillon", async () => {
      expect.soft(await numeroAffiche(page), "Le brouillon propose le numéro de son préfixe au lieu de la suite continue").toBe(attendu);
    }, { capture: "ecran" });
    // Fermer les paramètres sans rien changer.
    await page.getByRole("button", { name: "Annuler", exact: true }).first().click();
    await expect(page.getByText("Paramètres de la facture")).toHaveCount(0);
    await etape(page, "Valider le brouillon", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await page.getByRole("button", { name: "Créer la facture" }).click();
      await page.waitForTimeout(2_000);
      expect(await notificationsErreur(page).allInnerTexts(), "Validation refusée").toEqual([]);
      await expect(notifications(page).filter({ hasText: "Facture créée avec succès" }).first()).toBeVisible();
    }, { capture: "ecran" });
    const validee = await (await base()).collection("invoices").findOne({ _id: brouillon._id });
    expect(validee.status).toBe("PENDING");
    expect(validee.number, "Numéro attribué").toBe(attendu);
  });

  test("Date d'émission antérieure à la dernière facture émise : l'utilisateur est prévenu si elle change", async ({ page }) => {
    const nom = "Entretien daté d'avant la dernière facture";
    const choisie = dansJours(-45);
    await ouvrirNouvelle(page);
    await choisirClient(page, CLIENTS_FACTURES.volume.name);
    // Date d'émission : bouton de date du jour, puis le jour voulu (deux mois en arrière au plus).
    await page.locator("main button").filter({ hasText: /\d{4}$/ }).first().click();
    const jour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(choisie);
    for (let i = 0; i < 3 && !(await page.getByRole("button", { name: new RegExp(`^${jour}$`) }).isVisible().catch(() => false)); i++) {
      await page.getByRole("button", { name: "Go to the Previous Month" }).click();
    }
    const bouton = page.getByRole("button", { name: new RegExp(`^${jour}$`) });
    if (await bouton.isDisabled({ timeout: 2_000 }).catch(() => false)) {
      // Le calendrier empêche de choisir une date antérieure à la dernière facture : l'utilisateur ne peut pas se tromper.
      return;
    }
    await bouton.click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Continuer/ }).click();
    await page.getByRole("button", { name: "Ajouter un article" }).first().click();
    await page.locator("#item-description-0").fill(nom);
    await page.locator("#item-price-0").fill("95");
    await page.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notifications(page).first()).toBeVisible();
    const textes = (await notifications(page).allInnerTexts()).join(" | ");
    const f = await (await base()).collection("invoices").findOne({ workspaceId: ORG, "items.description": nom });
    expect(f, "Facture créée").not.toBeNull();
    const enregistree = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(f.issueDate);
    const voulue = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(choisie);
    if (enregistree !== voulue) {
      expect(textes, `Date d'émission remplacée sans prévenir (choisie ${voulue}, enregistrée ${enregistree})`).toMatch(/date/i);
    }
  });
});

test.describe("Factures : numérotation d'une facture créée", () => {
  test("Nouvelle facture créée : numéro attribué = numéro proposé", async ({ page }) => {
    const nom = "Entretien numéroté à la suite";
    await etapeArticles(page, CLIENTS_FACTURES.volume.name);
    const attendu = await prochainNumero();
    await page.getByRole("button", { name: "Ajouter un article" }).first().click();
    await page.locator("#item-description-0").fill(nom);
    await page.locator("#item-price-0").fill("60");
    await page.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notifications(page).filter({ hasText: "Facture créée avec succès" }).first()).toBeVisible();
    const f = await (await base()).collection("invoices").findOne({ workspaceId: ORG, "items.description": nom });
    expect(f?.number).toBe(attendu);
  });
});
