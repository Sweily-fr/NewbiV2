/**
 * Devis : modifier un devis existant, vérifié en base (organisation
 * « Ventes ») : devis en attente (date d'émission recalée, validité décalée
 * d'autant, numéro intact, ancien PDF archivé oublié), conditions générales
 * rechargées puis gardées, brouillon finalisé, refus de l'API affiché, et
 * numérotation continue d'un brouillon rouvert (organisation « Volume »).
 */
import { test, expect, etape, SELECTEUR_NOTIFICATION_SUCCES } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES, SESSION_TOKEN_VOLUME } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CGV_DEVIS, DEVIS_VENTES as D, DEVIS_VOLUME_BROUILLON } from "../donnees/lot-devis-bc-bl.mjs";
import { continuer } from "../editeur.mjs";
import { chercherEnBase, enBase, idDe, notification, relu } from "./ventes.mjs";

const jourParis = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d));
const ecartEnJours = (a, b) => Math.round((Date.parse(jourParis(b)) - Date.parse(jourParis(a))) / 86_400_000);

async function ouvrirEdition(page, doc) {
  await ouvrir(page, `/dashboard/outils/devis/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });
}
async function ouvrirParametres(page) {
  await page.locator("main button:has(svg.lucide-settings)").first().click();
  await expect(page.getByRole("button", { name: "Appliquer à ce devis" })).toBeVisible();
}

test.describe("Devis : modifier un devis existant", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test("Devis en attente modifié : émis aujourd'hui, même durée de validité, même numéro, ancien PDF oublié", async ({ page }) => {
    const d = D.aModifierEnAttente;
    const duree = ecartEnJours(d.issueDate, d.validUntil);
    await ouvrirEdition(page, d);
    await etape(page, "Modifier le devis", async () => {
      await continuer(page);
      await page.getByRole("button", { name: "Modifier le devis" }).click();
      await expect(notification(page, "Devis mis à jour avec succès")).toBeVisible({ timeout: 30_000 });
    }, { capture: "ecran" });
    const apres = await enBase("devis", d);
    expect.soft(apres.status, "Toujours en attente").toBe("PENDING");
    expect.soft(`${apres.prefix}-${apres.number}`, "Préfixe et numéro inchangés").toBe(`${d.prefix}-${d.number}`);
    expect.soft(jourParis(apres.issueDate), "Date d'émission recalée à aujourd'hui").toBe(jourParis(new Date()));
    expect.soft(ecartEnJours(apres.issueDate, apres.validUntil), `Durée de validité conservée (${duree} jours)`).toBe(duree);
    expect.soft(apres.archivedPdfKey ?? null, "L'ancien PDF archivé est encore servi pour le devis modifié").not.toBe(d.archivedPdfKey);
  });

  test("Conditions générales d'un brouillon : rechargées dans les paramètres et gardées à l'enregistrement", async ({ page }) => {
    const d = D.avecCgv;
    await ouvrirEdition(page, d);
    await etape(page, "Paramètres du brouillon", async () => {
      await ouvrirParametres(page);
      await expect(page.locator("#terms-conditions"), "Les conditions générales enregistrées sont rechargées").toHaveValue(CGV_DEVIS);
      await page.getByRole("button", { name: "Appliquer à ce devis" }).click();
    }, { capture: "ecran" });
    await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
    await expect(notification(page, "Brouillon sauvegardé")).toBeVisible();
    await relu("devis", d, (x) => x?.termsAndConditions, "Conditions générales en base").toBe(CGV_DEVIS);
  });

  test("Conditions générales d'un devis en attente : gardées après « Modifier le devis »", async ({ page }) => {
    const d = D.avecCgvEnAttente;
    await ouvrirEdition(page, d);
    await continuer(page);
    await page.getByRole("button", { name: "Modifier le devis" }).click();
    await expect(notification(page, "Devis mis à jour avec succès")).toBeVisible({ timeout: 30_000 });
    await relu("devis", d, (x) => x?.termsAndConditions, "Conditions générales en base").toBe(CGV_DEVIS);
  });

  test("Brouillon finalisé depuis l'éditeur : en attente, numéro suivant de la séquence", async ({ page }) => {
    const d = D.aValiderBrouillon;
    await ouvrirEdition(page, d);
    await continuer(page);
    await page.getByRole("button", { name: "Modifier le devis" }).click();
    await expect(notification(page, /Devis (mis à jour|créé)/)).toBeVisible({ timeout: 30_000 });
    await relu("devis", d, (x) => x?.status, "Statut en base").toBe("PENDING");
    const apres = await enBase("devis", d);
    const autres = (await chercherEnBase("quotes", { workspaceId: COMPTES.ventes.organisation._id, prefix: d.prefix, status: { $ne: "DRAFT" }, _id: { $ne: d._id } })).map((x) => Number(x.number));
    expect(Number(apres.number), "Le numéro suit le plus grand numéro du préfixe").toBe(Math.max(...autres) + 1);
  });

  test("Notes d'en-tête trop longues sur un brouillon : le refus est expliqué, rien n'est enregistré", async ({ page }) => {
    const d = D.aNotesRefusees;
    await ouvrirEdition(page, d);
    await ouvrirParametres(page);
    await page.locator("#header-notes").fill("n".repeat(1001));
    await page.getByRole("button", { name: "Appliquer à ce devis" }).click();
    await page.waitForTimeout(500);
    if (!(await page.getByRole("button", { name: "Appliquer à ce devis" }).isVisible().catch(() => false))) {
      await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
    }
    await etape(page, "Message affiché", async () => {
      await expect(page.getByText(/1000 caractères|1 000 caractères/).first(), "Aucun message n'explique le refus").toBeVisible({ timeout: 10_000 });
    }, { capture: "ecran" });
    const succes = await page.locator(SELECTEUR_NOTIFICATION_SUCCES).allInnerTexts().catch(() => []);
    expect(succes.join(" | "), "Un succès est annoncé alors que l'enregistrement est refusé").not.toMatch(/sauvegardé|enregistré/i);
    expect((await enBase("devis", d)).headerNotes, "Les notes refusées ont été enregistrées").toBe("");
  });
});

test.describe("Devis : numérotation continue", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VOLUME) });

  test("Brouillon rouvert : il annonce le numéro qui suit le plus grand, tous préfixes confondus, et le garde à la finalisation", async ({ page }) => {
    const d = DEVIS_VOLUME_BROUILLON;
    const finalises = await chercherEnBase("quotes", { workspaceId: COMPTES.volume.organisation._id, status: { $ne: "DRAFT" } });
    const attendu = String(Math.max(...finalises.map((x) => Number(x.number))) + 1).padStart(4, "0");
    await ouvrirEdition(page, d);
    await etape(page, "Numéro proposé dans les paramètres", async () => {
      await ouvrirParametres(page);
      await expect(page.locator("#quote-number"), "Numéro proposé pour le brouillon").toHaveValue(attendu);
      await page.getByRole("button", { name: "Appliquer à ce devis" }).click();
    }, { capture: "ecran" });
    await continuer(page);
    await page.getByRole("button", { name: "Modifier le devis" }).click();
    await expect(notification(page, /Devis (mis à jour|créé)/)).toBeVisible({ timeout: 30_000 });
    await relu("devis", d, (x) => x?.status, "Statut en base").toBe("PENDING");
    expect((await enBase("devis", d)).number, "Numéro attribué").toBe(attendu);
  });
});
