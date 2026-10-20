/**
 * Bons de livraison : modifier un bon existant, vérifié en base
 * (organisation « Ventes »). Un bon créé depuis un devis garde en base,
 * cachés, les prix du devis : la facture du bon les reprend. Modifié dans
 * l'éditeur (qui n'affiche jamais de prix), il doit les garder.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { BL_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { appelApi, id } from "../securite.mjs";
import { ORG } from "../devis/droits.mjs";
import { continuer } from "../editeur.mjs";
import { chercherEnBase, enBase, idDe, notification, relu } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const ouvrirEdition = (page, doc) =>
  ouvrir(page, `/dashboard/outils/bons-de-livraison/${idDe(doc)}/editer`, { pret: page.getByText("Sélection d'un client").first() });

test.describe("Bons de livraison : modifier un bon existant", () => {
  test("Bon à expédier modifié (transporteur) : enregistré, numéro intact", async ({ page }) => {
    const b = B.aModifier;
    await ouvrirEdition(page, b);
    await page.getByPlaceholder(/^Ex\. Chronopost/).fill("Geodis Messagerie");
    await etape(page, "Enregistrer les modifications", async () => {
      await continuer(page);
      await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
      await expect(notification(page, "Bon de livraison mis à jour")).toBeVisible({ timeout: 30_000 });
    }, { capture: "ecran" });
    await relu("bl", b, (x) => x?.carrier, "Transporteur en base").toBe("Geodis Messagerie");
    const apres = await enBase("bl", b);
    expect.soft(`${apres.prefix}-${apres.number}`).toBe(`${b.prefix}-${b.number}`);
    expect.soft(apres.status).toBe("PENDING");
  });

  test("Bon créé depuis un devis, modifié dans l'éditeur : la facture reprend encore les prix du devis", async ({ page }) => {
    const b = B.depuisDevis;
    await ouvrirEdition(page, b);
    await page.getByPlaceholder(/^Ex\. Chronopost/).fill("Transport modifié après le devis");
    await continuer(page);
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(notification(page, "Bon de livraison mis à jour")).toBeVisible({ timeout: 30_000 });
    await relu("bl", b, (x) => x?.carrier, "Modification enregistrée").toBe("Transport modifié après le devis");
    await etape(page, "Prix cachés du devis toujours en base", async () => {
      const apres = await enBase("bl", b);
      expect.soft(apres.items[0]?.unitPrice, "Le prix du devis (40 €) a été effacé par l'enregistrement du bon").toBe(40);
    });
    await etape(page, "Facture du bon", async () => {
      const reponse = await appelApi(
        page,
        `mutation($id: ID!, $w: ID!) { createInvoiceFromDeliveryNote(deliveryNoteId: $id, workspaceId: $w) { id } }`,
        { id: id(b), w: ORG },
        { organisation: ORG },
      );
      expect(reponse.errors, "Facturation du bon").toEqual([]);
      const [facture] = await chercherEnBase("invoices", { _id: new (await import("mongodb")).ObjectId(reponse.data.createInvoiceFromDeliveryNote.id) });
      expect(facture.items.map((a) => [a.description, a.quantity, a.unitPrice]), "La facture doit reprendre le prix du devis").toEqual([["Article du devis livré", 5, 40]]);
    });
  });
});
