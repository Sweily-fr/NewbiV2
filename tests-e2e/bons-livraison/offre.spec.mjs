/**
 * Bons de livraison : ouverts à toutes les offres depuis le 06/10/2026
 * (verrou par e-mail retiré). Le compte de l'offre d'entrée voit la liste,
 * ouvre l'éditeur et crée un bon, à l'écran comme par l'API.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { appelApi } from "../securite.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FREELANCE_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CLIENT_API } from "../devis/droits.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_VENTES) });
const W = COMPTES.freelanceVentes.organisation._id.toHexString();

test.describe("Bons de livraison : ouverts à l'offre d'entrée", () => {
  test("La liste et l'éditeur s'ouvrent, sans proposition de changer d'offre", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/bons-de-livraison", { pret: page.getByRole("heading", { name: "Bons de livraison", exact: true }) });
    await etape(page, "Nouveau bon de livraison", async () => {
      await page.getByRole("button", { name: "Nouveau bon de livraison" }).click();
      await expect(page).toHaveURL(/\/dashboard\/outils\/bons-de-livraison\/new/);
      await expect(page.getByText("Sélection d'un client").first()).toBeVisible();
    }, { capture: "ecran" });
  });

  test("Créer un bon de livraison par l'API : accepté sur l'offre d'entrée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($w: ID!, $input: CreateDeliveryNoteInput!) { createDeliveryNote(workspaceId: $w, input: $input) { id } }`,
      { w: W, input: { issueDate: new Date().toISOString(), client: CLIENT_API, items: [{ description: "Livraison offre d'entrée", quantity: 1, unit: "" }], status: "DRAFT" } },
      { organisation: W },
    );
    expect(reponse.errors, "Création refusée sur l'offre d'entrée").toEqual([]);
    expect(await (await base()).collection("deliverynotes").countDocuments({ workspaceId: COMPTES.freelanceVentes.organisation._id })).toBe(1);
  });
});
