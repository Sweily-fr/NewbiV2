/**
 * Contacts d'un espace chargé (« Contacts Volume », 600 contacts, 61 devis
 * et 61 bons de commande, donnees/lot-clients-catalogue.mjs) : rien ne doit
 * dépendre d'une première page chargée en entier puis filtrée à l'écran.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { id } from "../securite.mjs";
import { COMPTES_CC, VOLUME, DEVIS_VOLUME_ANCIEN, BC_VOLUME_ANCIEN } from "../donnees/lot-clients-catalogue.mjs";

test.use({ storageState: connecte(COMPTES_CC.volume.token) });

test.describe("Contacts : espace de 600 contacts", () => {
  test("Contact bloqué après le 500e : affiché parmi les bloqués et débloquable", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients/blocked");
    await attendreCalme(page);
    const rangee = page.getByRole("row").filter({ hasText: VOLUME.bloque.name });
    await etape(page, "Page des contacts bloqués", async () => {
      await expect(rangee, "« Zoé Zimmermann » (au-delà des 500 premiers contacts) absente de la page des bloqués").toBeVisible();
    }, { capture: "ecran" });
    await rangee.getByRole("button", { name: "Débloquer" }).click();
    const alerte = page.getByRole("alertdialog", { name: "Débloquer ce contact ?" });
    await alerte.getByRole("button", { name: "Débloquer" }).click();
    await expect(alerte).toBeHidden();
    await expect.poll(async () => (await (await base()).collection("clients").findOne({ _id: VOLUME.bloque._id })).isBlocked).toBe(false);
  });

  test("Fiche d'un contact dont le seul devis est le plus ancien de l'espace : onglet Devis rempli", async ({ page }) => {
    await ouvrir(page, `/dashboard/clients/${id(VOLUME.ancien)}?tab=quotes`, { pret: page.getByText(VOLUME.ancien.email).first() });
    await attendreCalme(page);
    await etape(page, "Onglet Devis", async () => {
      await expect(page.getByText(`${DEVIS_VOLUME_ANCIEN.prefix}${DEVIS_VOLUME_ANCIEN.number}`).first(), "Le devis du contact n'est pas affiché").toBeVisible();
    }, { capture: "ecran" });
  });

  test("Fiche d'un contact dont le seul bon de commande est le plus ancien de l'espace : onglet Bons de commande rempli", async ({ page }) => {
    await ouvrir(page, `/dashboard/clients/${id(VOLUME.ancien)}?tab=purchaseorders`, { pret: page.getByText(VOLUME.ancien.email).first() });
    await attendreCalme(page);
    await etape(page, "Onglet Bons de commande", async () => {
      await expect(page.getByText(`${BC_VOLUME_ANCIEN.prefix}${BC_VOLUME_ANCIEN.number}`).first(), "Le bon de commande du contact n'est pas affiché").toBeVisible();
    }, { capture: "ecran" });
  });
});
