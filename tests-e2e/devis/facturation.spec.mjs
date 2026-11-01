/**
 * Devis : facturation par tous les chemins (bon de livraison, bon de
 * commande, factures liées, conversion directe, situations), vérifiée en
 * base. Un devis n'est jamais facturé au-delà de son montant, et la facture
 * reprend ses conditions (autoliquidation, remise, port).
 *
 * Organisation « Contrôles Ventes » (donnees/lot-devis-bc-bl.mjs) : une
 * donnée par test, appels faits par le propriétaire comme le site les fait.
 */
import { ObjectId } from "mongodb";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CONTROLE_VENTES } from "../config.mjs";
import { FACTURATION_CONTROLE as F, SITUATION_CONTROLE } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { appelControle, collection, facturesDuDevis, messages, MUTATIONS, ORG_CONTROLE, relire, totalTTC } from "./controle.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

const reference = (doc) => `${doc.prefix}-${doc.number}`;
const facturerBl = (page, bl) => appelControle(page, MUTATIONS.facturerBl, { id: id(bl), w: ORG_CONTROLE });
const factureEnBase = async (reponse, champ) => relire("invoices", new ObjectId(reponse.data[champ].id));
/** Factures créées depuis un bon de livraison (référence du bon sur la facture). */
const facturesDuBl = async (bl) => (await collection("invoices")).find({ workspaceId: bl.workspaceId, purchaseOrderNumber: reference(bl) }).toArray();
/** Somme des lignes d'une facture (HT × TVA), sans remise ni port. */
const totalDesLignes = (facture) =>
  Math.round(facture.items.reduce((t, a) => t + a.quantity * a.unitPrice * (1 + (a.vatRate || 0) / 100), 0) * 100) / 100;

test.describe("Devis : facturation par un bon de livraison", () => {
  test("Bon de livraison d'un devis déjà facturé : « Facturer » refusé, aucune seconde facture", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await facturesDuDevis(F.dejaFacture);
    expect(totalTTC(avant), "Donnée de départ : devis facturé 1 200 €").toBe(1200);
    const reponse = await facturerBl(page, F.blDejaFacture);
    expect(reponse.data?.createInvoiceFromDeliveryNote ?? null, "Une seconde facture du devis a été créée").toBeNull();
    expect(messages(reponse), "Le refus doit dire que le devis est déjà facturé").toMatch(/déjà (entièrement )?factur/i);
    expect(await facturesDuDevis(F.dejaFacture), "Factures du devis").toHaveLength(avant.length);
    expect(await facturesDuBl(F.blDejaFacture)).toHaveLength(0);
  });

  test("Deux bons de livraison d'un même devis : la seconde facture, au-delà du devis, est refusée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await etape(page, "Premier bon facturé : 1 200 €", async () => {
      const reponse = await facturerBl(page, F.blPremier);
      expect(reponse.errors).toEqual([]);
      expect(reponse.data.createInvoiceFromDeliveryNote.finalTotalTTC).toBe(1200);
    });
    await etape(page, "Second bon : refusé", async () => {
      const reponse = await facturerBl(page, F.blSecond);
      expect(reponse.data?.createInvoiceFromDeliveryNote ?? null, "Le devis est facturé deux fois").toBeNull();
      expect(messages(reponse)).toMatch(/déjà (entièrement )?factur|reste à facturer/i);
    });
    expect(totalTTC(await facturesDuDevis(F.deuxBl)), "Total facturé du devis de 1 200 €").toBeLessThanOrEqual(1200);
  });

  test("Facture d'un bon de livraison : autoliquidation, remise globale et port du devis repris", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await facturerBl(page, F.blAutoliquide);
    expect(reponse.errors, "Facturation refusée").toEqual([]);
    const facture = await factureEnBase(reponse, "createInvoiceFromDeliveryNote");
    const devis = await relire("quotes", F.autoliquide._id);
    await etape(page, "Conditions du devis sur la facture", async () => {
      expect.soft(facture.isReverseCharge, "Autoliquidation").toBe(true);
      expect.soft(facture.finalTotalVAT, "TVA").toBe(0);
      expect.soft(facture.discount, "Remise globale").toBe(10);
      expect.soft(facture.discountType, "Type de remise").toBe("PERCENTAGE");
      expect.soft(facture.shipping?.billShipping, "Port facturé").toBe(true);
      expect.soft(facture.shipping?.shippingAmountHT, "Montant du port").toBe(50);
    });
    expect(facture.finalTotalTTC, "La facture doit avoir le montant du devis (950 €)").toBe(devis.finalTotalTTC);
  });

  for (const [nom, devis, bl, statut] of [
    ["acceptable", F.attenteAccepter, F.blAttenteAccepter, "COMPLETED"],
    ["refusable", F.attenteRefuser, F.blAttenteRefuser, "CANCELED"],
  ]) {
    test(`Devis en attente facturé par son bon de livraison : il reste ${nom}`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      await etape(page, "Facturer le bon de livraison", async () => {
        const reponse = await facturerBl(page, bl);
        expect(reponse.errors, "Facturation refusée").toEqual([]);
      });
      await etape(page, `Puis passer le devis au statut ${statut}`, async () => {
        const reponse = await appelControle(page, MUTATIONS.statutDevis, { id: id(devis), status: statut });
        expect(messages(reponse), "Le devis est bloqué").not.toMatch(/converti en facture/);
        expect(reponse.errors).toEqual([]);
        expect((await relire("quotes", devis._id)).status).toBe(statut);
      });
    });
  }
});

test.describe("Devis : facturation par un bon de commande", () => {
  test("Devis avec acompte de 30 %, puis bon de commande : sa facture ne dépasse pas le reste à facturer", async ({ page }) => {
    const devis = F.acompteBc;
    await ouvrir(page, "/dashboard");
    await etape(page, "Acompte de 360 € (30 %)", async () => {
      const reponse = await appelControle(page, MUTATIONS.factureLiee, { quoteId: id(devis), amount: 360, isDeposit: true, w: ORG_CONTROLE });
      expect(reponse.errors, "Acompte refusé").toEqual([]);
    });
    let bc = null;
    await etape(page, "Bon de commande du devis", async () => {
      const reponse = await appelControle(page, MUTATIONS.convertirEnBc, { id: id(devis), w: ORG_CONTROLE });
      expect(reponse.errors, "Conversion en bon de commande refusée").toEqual([]);
      bc = reponse.data.convertQuoteToPurchaseOrder;
    });
    await etape(page, "Bon de commande validé puis en cours (facturable)", async () => {
      for (const statut of ["VALIDATED", "IN_PROGRESS"]) {
        const reponse = await appelControle(page, `mutation($id: ID!, $w: ID!, $s: PurchaseOrderStatus!) { changePurchaseOrderStatus(id: $id, workspaceId: $w, status: $s) { id } }`, {
          id: bc.id,
          w: ORG_CONTROLE,
          s: statut,
        });
        expect(reponse.errors, `Passage au statut ${statut} refusé`).toEqual([]);
      }
    });
    await etape(page, "Facturer le bon de commande", async () => {
      const reponse = await appelControle(page, MUTATIONS.facturerBc, { id: bc.id, w: ORG_CONTROLE });
      const facture = reponse.data?.convertPurchaseOrderToInvoice;
      if (facture) expect(facture.finalTotalTTC, "Facture au-delà des 840 € restants").toBeLessThanOrEqual(840);
      else expect(messages(reponse)).toMatch(/reste à facturer|déjà (entièrement )?factur/i);
    });
    expect(totalTTC(await facturesDuDevis(devis)), "Total facturé du devis de 1 200 €").toBeLessThanOrEqual(1200);
  });
});

test.describe("Devis : conversion en factures par répartition", () => {
  for (const [titre, devis, distribution, skip] of [
    ["Répartition 150 % et -50 %", F.repartitionNegative, [150, -50], false],
    ["Répartition 0 %", F.repartitionNulle, [0], false],
    ["Répartition 200 % sans contrôle demandé", F.repartitionDouble, [200], true],
  ]) {
    test(`${titre} : refusée avec un message, aucune facture créée`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelControle(page, MUTATIONS.convertirEnFacture, { id: id(devis), distribution, skip });
      expect(reponse.data?.convertQuoteToInvoice ?? null, "Conversion acceptée").toBeNull();
      expect(reponse.errors.length, "Aucun message d'erreur").toBeGreaterThan(0);
      expect(await facturesDuDevis(devis), "Facture créée (ou laissée) malgré le refus").toEqual([]);
      expect((await relire("quotes", devis._id)).linkedInvoices ?? [], "Factures liées au devis").toEqual([]);
    });
  }

  test("Répartition 50 % et 50 % : chaque facture a les totaux de ses lignes, ou la répartition est refusée", async ({ page }) => {
    const devis = F.repartitionMoitie;
    await ouvrir(page, "/dashboard");
    const reponse = await appelControle(page, MUTATIONS.convertirEnFacture, { id: id(devis), distribution: [50, 50], skip: false });
    const factures = await facturesDuDevis(devis);
    if (!reponse.data?.convertQuoteToInvoice) {
      expect(factures, "Factures laissées malgré le refus").toEqual([]);
      return;
    }
    expect(factures).toHaveLength(2);
    for (const facture of factures) {
      expect.soft(facture.finalTotalTTC, `Facture de ${facture.finalTotalTTC} € dont les lignes font ${totalDesLignes(facture)} €`).toBe(totalDesLignes(facture));
    }
    expect(totalTTC(factures)).toBeLessThanOrEqual(1200);
  });
});

test.describe("Devis : conversions demandées deux fois en même temps", () => {
  test("Deux factures liées pour tout le reste à facturer : une seule créée", async ({ page }) => {
    const devis = F.concurrentLie;
    await ouvrir(page, "/dashboard");
    const appel = () => appelControle(page, MUTATIONS.factureLiee, { quoteId: id(devis), amount: 1200, isDeposit: false, w: ORG_CONTROLE });
    const reponses = await Promise.all([appel(), appel()]);
    expect(reponses.filter((r) => r.data?.createLinkedInvoice).length, "Factures annoncées créées").toBe(1);
    const factures = await facturesDuDevis(devis);
    expect(factures, "Factures du devis en base").toHaveLength(1);
    expect(totalTTC(factures)).toBeLessThanOrEqual(1200);
  });

  test("Deux « Facturer » simultanés sur un bon de livraison : une seule facture", async ({ page }) => {
    const bl = F.blConcurrent;
    await ouvrir(page, "/dashboard");
    const reponses = await Promise.all([facturerBl(page, bl), facturerBl(page, bl)]);
    expect(reponses.filter((r) => r.data?.createInvoiceFromDeliveryNote).length, "Factures annoncées créées").toBe(1);
    expect(await facturesDuBl(bl), "Factures du bon de livraison en base").toHaveLength(1);
    expect((await relire("deliverynotes", bl._id)).linkedInvoices, "Factures liées au bon").toHaveLength(1);
  });

  test("Deux conversions complètes simultanées d'un devis : une seule facture", async ({ page }) => {
    const devis = F.concurrentConversion;
    await ouvrir(page, "/dashboard");
    const appel = () => appelControle(page, MUTATIONS.convertirEnFacture, { id: id(devis), distribution: null, skip: false });
    const reponses = await Promise.all([appel(), appel()]);
    expect(reponses.filter((r) => r.data?.convertQuoteToInvoice).length, "Conversions annoncées réussies").toBe(1);
    const factures = await facturesDuDevis(devis);
    expect(factures, "Factures du devis en base").toHaveLength(1);
    expect(totalTTC(factures)).toBeLessThanOrEqual(1200);
  });
});

test.describe("Devis : facturation de situation", () => {
  test("Déjà facturé en situation : les factures annulées et celles d'une autre organisation ne comptent pas", async ({ page }) => {
    const { devis, annulee, brouillon } = SITUATION_CONTROLE;
    await ouvrir(page, "/dashboard");
    const reponse = await appelControle(page, `query($w: ID!, $id: ID!) { quote(workspaceId: $w, id: $id) { id finalTotalTTC situationInvoicedTotal } }`, {
      w: ORG_CONTROLE,
      id: id(devis),
    });
    expect(reponse.errors).toEqual([]);
    const { finalTotalTTC, situationInvoicedTotal } = reponse.data.quote;
    expect(finalTotalTTC, "Donnée de départ : devis de 10 000 €").toBe(10000);
    expect(situationInvoicedTotal, `Situation annulée (${annulee.finalTotalTTC} €) comptée comme facturée`).toBeLessThanOrEqual(brouillon.finalTotalTTC);
    expect(situationInvoicedTotal, "Le devis n'est plus proposé pour une nouvelle situation").toBeLessThan(finalTotalTTC);
  });
});
