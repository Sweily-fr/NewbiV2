/**
 * Avoirs de l'organisation « Factures » : montant restant exact, avoir
 * existant modifié, onglet « Avoirs » de la liste. Une facture par cas
 * (donnees/lot-factures.mjs).
 */
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { attendreCalme, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES } from "../config.mjs";
import { AVOIRS_FACTURES, F } from "../donnees/lot-factures.mjs";
import { notifications, ouvrirAvoirExistant, ouvrirAvoirNouveau, ouvrirListe, panneau } from "../factures/pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

const avoirsDe = async (f) => (await base()).collection("creditnotes").find({ originalInvoice: f._id }).sort({ createdAt: 1 }).toArray();

async function articleDeLAvoir(page, i, nom) {
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("Articles et produits").first()).toBeVisible();
  const quantite = page.locator(`#item-quantity-${i}`);
  if (!(await quantite.isVisible())) await page.getByRole("button", { name: new RegExp(nom) }).first().click();
  await expect(quantite).toBeVisible();
  return quantite;
}

test.describe("Avoirs : montants", () => {
  test("Avoir du montant restant exact (au centime) : accepté", async ({ page }) => {
    // 144,00 € TTC facturés, 28,80 € déjà crédités : il reste 115,20 €, soit 8 viennoiseries.
    const f = F.avoirRestantExact;
    await ouvrirAvoirNouveau(f)(page);
    const quantite = await articleDeLAvoir(page, 0, f.items[0].description);
    await quantite.fill("8");
    await etape(page, "Créer l'avoir", async () => {
      await page.getByRole("button", { name: "Créer l'avoir" }).click();
      await expect(notifications(page).filter({ hasText: "Avoir créé avec succès" }).first()).toBeVisible();
    }, { capture: "ecran" });
    const avoirs = await avoirsDe(f);
    expect(avoirs, "Deux avoirs sur la facture").toHaveLength(2);
    expect(avoirs[1].finalTotalTTC).toBeCloseTo(-115.2, 2);
  });

  test("Modifier le montant d'un avoir existant : le montant restant ne compte pas l'avoir lui-même", async ({ page }) => {
    // Facture de 1 200 € TTC, un seul avoir de 600 € : il peut passer à 840 € (700 € HT).
    const a = AVOIRS_FACTURES.aModifier;
    const f = F.avecAvoirAModifier;
    await ouvrirAvoirExistant(f, a)(page);
    await articleDeLAvoir(page, 0, a.items[0].description);
    await page.locator("#item-price-0").fill("700");
    await etape(page, "Enregistrer l'avoir modifié", async () => {
      await page.getByRole("button", { name: /Créer l'avoir|Enregistrer|Mettre à jour/ }).last().click();
      await page.waitForTimeout(2_000);
      const erreurs = (await notificationsErreur(page).allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
      expect(erreurs, "L'avoir modifié est refusé : son propre montant est compté deux fois dans le restant").toEqual([]);
    }, { capture: "ecran" });
    await expect.poll(async () => (await base()).collection("creditnotes").findOne({ _id: a._id }).then((d) => d.finalTotalHT)).toBe(-700);
  });

  test("Avoir existant : le bouton d'enregistrement ne s'appelle pas « Créer l'avoir »", async ({ page }) => {
    await ouvrirAvoirExistant(F.avecAvoir, AVOIRS_FACTURES.existant)(page);
    await articleDeLAvoir(page, 0, AVOIRS_FACTURES.existant.items[0].description);
    await expect(page.getByRole("heading", { name: "Modifier l'avoir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer l'avoir" }), "« Créer l'avoir » sur un avoir déjà émis (il est modifié, pas créé)").toHaveCount(0);
  });
});

test.describe("Avoirs : liste", () => {
  test("Onglet « Avoirs » : la facture liée s'ouvre depuis la ligne de l'avoir", async ({ page }) => {
    const a = AVOIRS_FACTURES.existant;
    await ouvrirListe(page);
    await cliquer(page, page.getByRole("tab", { name: /^Avoirs/ }));
    const rangee = page.getByRole("row").filter({ hasText: `AV-${a.number}` });
    await expect(rangee).toHaveCount(1);
    await expect(rangee).toContainText(F.avecAvoir.client.name);
    await cliquer(page, rangee.getByRole("button", { name: "Aperçu" }));
    await attendreCalme(page);
    await expect(panneau(page).getByRole("heading", { name: `Facture ${F.avecAvoir.prefix}-${F.avecAvoir.number}` })).toBeVisible();
  });
});
