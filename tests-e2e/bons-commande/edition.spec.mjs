/**
 * Bons de commande : modifier un bon existant, vérifié en base (organisation
 * « Ventes ») : bon en attente (date d'émission recalée, numéro intact,
 * ancien PDF archivé oublié), conditions générales rechargées puis gardées.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { BC_VENTES as B, CGV_DEVIS } from "../donnees/lot-devis-bc-bl.mjs";
import { continuer } from "../editeur.mjs";
import { enBase, idDe, notification, relu } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const jourParis = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d));
const ouvrirEdition = (page, doc) =>
  ouvrir(page, `/dashboard/outils/bons-commande/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });

test.describe("Bons de commande : modifier un bon existant", () => {
  test("Bon en attente modifié : émis aujourd'hui, même numéro, ancien PDF oublié", async ({ page }) => {
    const b = B.aModifierEnAttente;
    await ouvrirEdition(page, b);
    await etape(page, "Modifier le bon de commande", async () => {
      await continuer(page);
      await page.getByRole("button", { name: "Modifier le bon de commande" }).click();
      await expect(notification(page, /Bon de commande mis à jour/)).toBeVisible({ timeout: 30_000 });
    }, { capture: "ecran" });
    const apres = await enBase("bc", b);
    expect.soft(apres.status, "Toujours en attente").toBe("CONFIRMED");
    expect.soft(`${apres.prefix}-${apres.number}`, "Préfixe et numéro inchangés").toBe(`${b.prefix}-${b.number}`);
    expect.soft(jourParis(apres.issueDate), "Date d'émission recalée à aujourd'hui").toBe(jourParis(new Date()));
    expect.soft(apres.archivedPdfKey ?? null, "L'ancien PDF archivé est encore servi pour le bon modifié").not.toBe(b.archivedPdfKey);
  });

  test("Conditions générales d'un brouillon : rechargées dans les paramètres et gardées à l'enregistrement", async ({ page }) => {
    const b = B.avecCgv;
    await ouvrirEdition(page, b);
    await etape(page, "Paramètres du brouillon", async () => {
      await page.locator("main button:has(svg.lucide-settings)").first().click();
      await expect(page.locator("#terms-conditions"), "Les conditions générales enregistrées sont rechargées").toHaveValue(CGV_DEVIS);
      await page.getByRole("button", { name: "Appliquer à ce bon de commande" }).click();
    }, { capture: "ecran" });
    await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
    await expect(notification(page, "Brouillon sauvegardé")).toBeVisible();
    await relu("bc", b, (x) => x?.termsAndConditions, "Conditions générales en base").toBe(CGV_DEVIS);
  });
});
