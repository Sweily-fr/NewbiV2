/**
 * Bons de commande : facturation par l'API (convertPurchaseOrderToInvoice)
 * avec les mêmes statuts qu'à l'écran, où « Convertir en facture » n'est
 * proposé que pour un bon validé, en cours ou livré.
 *
 * Organisation « Contrôles Ventes » (donnees/lot-devis-bc-bl.mjs).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CONTROLE_VENTES } from "../config.mjs";
import { DOCUMENTS_CONTROLE as C } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { appelControle, collection, messages, MUTATIONS, ORG_CONTROLE, ORG_CONTROLE_ID } from "../devis/controle.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

const facturer = (page, bc) => appelControle(page, MUTATIONS.facturerBc, { id: id(bc), w: ORG_CONTROLE });
const facturesDu = async (bc) => (await collection("invoices")).find({ workspaceId: ORG_CONTROLE_ID, purchaseOrderNumber: `${bc.prefix}-${bc.number}` }).toArray();

test.describe("Bons de commande : facturation, mêmes statuts à l'écran et à l'API", () => {
  test("Bon de commande validé (facturable à l'écran) : facturé par l'API", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await facturer(page, C.bcValide);
    expect(reponse.errors, "Facturation d'un bon validé refusée par l'API").toEqual([]);
    expect(await facturesDu(C.bcValide)).toHaveLength(1);
  });

  test("Bon de commande seulement confirmé (non facturable à l'écran) : refusé par l'API", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await facturer(page, C.bcConfirmeAFacturer);
    expect(reponse.data?.convertPurchaseOrderToInvoice ?? null, "Bon confirmé facturé par l'API").toBeNull();
    expect(messages(reponse)).toMatch(/validés, en cours ou livrés/);
    expect(await facturesDu(C.bcConfirmeAFacturer)).toHaveLength(0);
  });
});
