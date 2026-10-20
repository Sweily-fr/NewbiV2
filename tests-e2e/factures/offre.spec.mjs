/**
 * Plafonds de l'offre d'entrée (« freelance », src/lib/plan-limits.js) pour
 * les factures, avec l'organisation « Offre Factures » : 10 modèles de
 * documents (atteints), exports comptables limités au CSV et à Excel.
 * L'interface les applique ; l'API doit les
 * appliquer aussi, sinon un appel direct les contourne.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus } from "../securite.mjs";
import { connecte, SESSION_TOKEN_FACTURES_OFFRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { F_OFFRE } from "../donnees/lot-factures.mjs";
import { actionDeLigne, fenetreTitree, ouvrirListe } from "./pages.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_OFFRE) });

const ORG = COMPTES.facturesOffre.organisation._id;
const W = ORG.toHexString();
const compterModeles = async () => (await base()).collection("invoicetemplates").countDocuments({ workspaceId: ORG });

test.describe("Offre d'entrée : plafonds des factures", () => {
  test("Modèles : la limite (10/10) est annoncée et l'enregistrement grisé", async ({ page }) => {
    await ouvrirListe(page);
    await actionDeLigne(page, F_OFFRE.attente, "Sauv. modèle");
    const fenetre = fenetreTitree(page, "Sauvegarder comme modèle");
    await etape(page, "Limite affichée", async () => {
      await expect(fenetre.getByText(/Limite atteinte \(10\/10 modèles\)/)).toBeVisible();
      await expect(fenetre.getByRole("button", { name: "Sauvegarder" })).toBeDisabled();
    }, { capture: "ecran" });
  });

  test("Modèles : un 11e modèle enregistré par l'API est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await compterModeles();
    const reponse = await appelApi(
      page,
      `mutation($w: ID, $input: SaveInvoiceAsTemplateInput!) { saveInvoiceAsTemplate(input: $input, workspaceId: $w) { id } }`,
      { w: W, input: { invoiceId: F_OFFRE.attente._id.toHexString(), name: "Onzième modèle hors offre" } },
      { organisation: W },
    );
    verifierRefus(reponse, "saveInvoiceAsTemplate", "11e modèle sur l'offre d'entrée");
    expect(await compterModeles(), "Un 11e modèle a été créé malgré la limite de l'offre").toBe(avant);
  });

  test("Exports comptables : FEC, Sage et Cegid grisés, CSV et Excel proposés", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: /^Exporter/ }).first().click();
    for (const nom of ["FEC (Format légal)", "Sage Compta", "Cegid Expert"]) {
      await expect.soft(page.getByRole("menuitem", { name: nom }), `« ${nom} » proposé sur l'offre d'entrée`).toHaveAttribute("data-disabled", "");
    }
    for (const nom of ["CSV", "Excel"]) await expect(page.getByRole("menuitem", { name: nom, exact: true })).not.toHaveAttribute("data-disabled", "");
  });

});
