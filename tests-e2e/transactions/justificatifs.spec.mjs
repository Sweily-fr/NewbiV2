/**
 * Facture d'achat proposée depuis un justificatif de dépense : l'analyse est
 * déjà faite (proposition enregistrée avec les données de test, l'OCR est
 * coupé en test). Depuis le tiroir de la transaction, « Vérifier et créer »
 * ouvre la confirmation : créer avec un nom corrigé, deux taux de TVA en
 * dollars, rattacher à la facture existante qui lui ressemble, ne pas créer
 * puis créer plus tard, facture ressemblante apparue depuis l'analyse, et
 * deux confirmations simultanées (double clic) : une seule facture.
 */
import { ObjectId } from "mongodb";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { PROPOSITIONS } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { ORG_SAISIE, connecteAchats, simulerApercus } from "../achats-banque.mjs";

const URL = "/dashboard/outils/transactions";
const P = PROPOSITIONS;
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });
const tiroirDe = (page) => page.locator("div.fixed.right-0").filter({ has: page.getByRole("heading", { level: 2 }) }).last();
const confirmation = (page) => page.getByRole("dialog", { name: /Confirmer la facture d'achat/ });
const txEnBase = (t) => base().then((db) => db.collection("transactions").findOne({ _id: t._id }));
const ORG_SAISIE_ID = new ObjectId(ORG_SAISIE);
const facturesNumero = (numero) => base().then((db) => db.collection("purchaseinvoices").find({ workspaceId: ORG_SAISIE_ID, invoiceNumber: numero }).toArray());

/** Champ texte de la confirmation, repéré par son libellé affiché à côté. */
const champ = (dialogue, libelle) => dialogue.locator("label", { hasText: new RegExp(`^${libelle}$`) }).locator("xpath=following-sibling::*[1]");

/** Ouvre la confirmation de la facture proposée depuis le tiroir de la transaction. */
async function ouvrirConfirmation(page, t, bouton = "Vérifier et créer") {
  await simulerApercus(page);
  await ouvrir(page, `${URL}?transactionId=${id(t)}`, { pret: tiroirDe(page) });
  await attendreCalme(page);
  await tiroirDe(page).getByRole("button", { name: bouton }).first().click();
  const dialogue = confirmation(page);
  await expect(dialogue).toBeVisible();
  await expect(champ(dialogue, "Nom")).toBeVisible();
  return dialogue;
}

test.describe("Justificatif : facture d'achat proposée par l'analyse", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Nom du fournisseur corrigé (accents) puis « Créer la facture » : facture payée, rattachée à la dépense, nom corrigé gardé", async ({ page }) => {
    const dialogue = await ouvrirConfirmation(page, P.creer);
    await expect(champ(dialogue, "Nom")).toHaveValue("Electricite Generale du Sud");
    await champ(dialogue, "Nom").fill("Électricité Générale du Sud");
    await dialogue.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notification(page, "Facture d'achat créée")).toBeVisible();
    const [facture] = await facturesNumero("PROP-164");
    expect(facture, "Aucune facture d'achat créée").toBeTruthy();
    expect({ fournisseur: facture.supplierName, ttc: facture.amountTTC, statut: facture.status, transactions: facture.linkedTransactionIds.map(String) }).toEqual({
      fournisseur: "Électricité Générale du Sud",
      ttc: 96.6,
      statut: "PAID",
      transactions: [id(P.creer)],
    });
    const tx = await txEnBase(P.creer);
    expect(tx.linkedPurchaseInvoiceIds.map(String)).toEqual([String(facture._id)]);
    expect(String(tx.receiptFiles[0].purchaseInvoiceId)).toBe(String(facture._id));
  });

  test("Deux taux de TVA et facture en dollars : détail par taux et devise enregistrés", async ({ page }) => {
    const dialogue = await ouvrirConfirmation(page, P.deuxTauxDollars);
    await etape(page, "Deux lignes de TVA affichées", async () => {
      await expect(dialogue).toContainText(/20\s?%/);
      await expect(dialogue).toContainText(/5,5\s?%/);
    }, { capture: "ecran" });
    await dialogue.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notification(page, "Facture d'achat créée")).toBeVisible();
    const [facture] = await facturesNumero("PROP-165");
    expect(facture, "Aucune facture d'achat créée").toBeTruthy();
    expect(facture.currency).toBe("USD");
    expect(facture.amountTTC).toBe(118.75);
    expect(facture.vatBreakdown.map((l) => [l.rate, l.baseHT, l.amountTVA])).toEqual([
      [20, 55, 11],
      [5.5, 50, 2.75],
    ]);
  });

  test("Facture existante qui lui ressemble : « Rattacher à cette facture » y ajoute le justificatif et la dépense, rien n'est créé", async ({ page }) => {
    const dialogue = await ouvrirConfirmation(page, P.rattacher);
    await expect(dialogue).toContainText("Une facture d'achat existante lui ressemble");
    await dialogue.getByRole("button", { name: "Rattacher à cette facture" }).click();
    await expect(notification(page, "Justificatif rattaché à la facture d'achat")).toBeVisible();
    const factures = await facturesNumero("DUP-157");
    expect(factures.length, "Une seconde facture a été créée au lieu de rattacher").toBe(1);
    expect({ fichiers: factures[0].files.length, transactions: factures[0].linkedTransactionIds.map(String), statut: factures[0].status }).toEqual({ fichiers: 1, transactions: [id(P.rattacher)], statut: "PAID" });
    expect((await txEnBase(P.rattacher)).linkedPurchaseInvoiceIds.map(String)).toEqual([id(P.factureDoublon)]);
  });

  test("« Ne pas créer de facture » : rien n'est créé ; plus tard, « Créer la facture d'achat » depuis le tiroir la crée", async ({ page }) => {
    let dialogue = await ouvrirConfirmation(page, P.ignorer);
    await dialogue.getByRole("button", { name: "Ne pas créer de facture" }).click();
    await expect(notification(page, "Aucune facture d'achat créée")).toBeVisible();
    await expect.poll(async () => (await txEnBase(P.ignorer)).receiptFiles[0].ocrProposal?.dismissedAt ?? null).not.toBeNull();
    expect(await facturesNumero("PROP-167")).toEqual([]);

    await etape(page, "Création plus tard depuis le justificatif", async () => {
      dialogue = await ouvrirConfirmation(page, P.ignorer, "Créer la facture d'achat");
      await dialogue.getByRole("button", { name: "Créer la facture" }).click();
      await expect(notification(page, "Facture d'achat créée")).toBeVisible();
      await expect.poll(async () => (await facturesNumero("PROP-167")).length).toBe(1);
    });
  });

  test("Facture ressemblante apparue depuis l'analyse : rien n'est créé sans « Créer quand même », puis une seconde facture", async ({ page }) => {
    const dialogue = await ouvrirConfirmation(page, P.doublonApparu);
    await dialogue.getByRole("button", { name: "Créer la facture" }).click();
    await expect(notification(page, "Une facture d'achat ressemblante existe déjà")).toBeVisible();
    expect((await facturesNumero("APP-168")).length, "Une facture a été créée malgré la facture ressemblante").toBe(1);
    await expect(dialogue).toContainText("Une facture d'achat existante lui ressemble");
    await dialogue.getByRole("button", { name: "Créer quand même" }).click();
    await expect(notification(page, "Facture d'achat créée")).toBeVisible();
    expect((await facturesNumero("APP-168")).length).toBe(2);
  });

  test("Deux confirmations simultanées (double clic) : une seule facture créée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const t = P.doubleClic;
    const confirmer = () =>
      appelApi(
        page,
        `mutation($t: ID!, $w: ID!, $f: ID!) { confirmTransactionReceiptInvoice(transactionId: $t, workspaceId: $w, fileId: $f, action: CREATE) { success message } }`,
        { t: id(t), w: ORG_SAISIE, f: id(t.receiptFiles[0]) },
        { organisation: ORG_SAISIE, delai: 20_000 },
      );
    await Promise.all([confirmer(), confirmer()]);
    await expect.poll(async () => (await facturesNumero("DBL-169")).length).toBeGreaterThan(0);
    await page.waitForTimeout(1_000);
    expect((await facturesNumero("DBL-169")).length, "Deux factures d'achat créées pour un seul justificatif").toBe(1);
    expect((await txEnBase(t)).linkedPurchaseInvoiceIds.length).toBe(1);
  });
});
