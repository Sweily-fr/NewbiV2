/**
 * Avoirs : règles tenues par l'API elle-même (appels directs, comme
 * l'application mobile ou un script), dans l'espace « Contrôles Factures »
 * (donnees/lot-factures.mjs) : une facture par cas.
 *   - deux avoirs créés ou modifiés au même instant ne dépassent jamais la
 *     facture ;
 *   - l'avoir reprend le client et l'émetteur de la facture d'origine ;
 *   - il ne précède pas la facture ;
 *   - avoir total d'une facture avec remise, port et autoliquidation.
 */
import { test, expect, etape } from "../outils.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_FACTURES_CONTROLES } from "../config.mjs";
import { AVOIRS_CONTROLES, C, CLIENTS_CONTROLES, ESPACES_FACTURES } from "../donnees/lot-factures.mjs";
import { appelApiDirect, id, messages } from "../securite.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });

const ORG = id(ESPACES_FACTURES.controles.organisation);
const jour = (decalage = 0) => new Date(Date.now() + decalage * 86_400_000).toISOString().slice(0, 10);
const AUJOURDHUI = jour();

const clientDe = (c) => ({
  id: id(c),
  name: c.name,
  email: c.email,
  type: c.type,
  ...(c.siret ? { siret: c.siret } : {}),
  address: { street: c.address.street, city: c.address.city, postalCode: c.address.postalCode, country: c.address.country },
});
const ligneAvoir = (description, prix, quantite = -1) => ({ description, quantity: quantite, unitPrice: prix, vatRate: 20, unit: "" });

const CREER = `mutation($w: ID!, $input: CreateCreditNoteInput!) { createCreditNote(workspaceId: $w, input: $input) { id } }`;
const MODIFIER = `mutation($w: ID!, $id: ID!, $input: UpdateCreditNoteInput!) { updateCreditNote(id: $id, workspaceId: $w, input: $input) { id } }`;
const avoirsDe = async (facture) => (await base()).collection("creditnotes").find({ originalInvoice: facture._id }).toArray();
const totalCredite = async (facture) => (await avoirsDe(facture)).reduce((t, a) => t + Math.abs(a.finalTotalTTC), 0);
const creer = (page, facture, champs = {}) =>
  appelApiDirect(
    page,
    CREER,
    {
      w: ORG,
      input: {
        originalInvoiceId: id(facture),
        creditType: "CORRECTION",
        client: clientDe(CLIENTS_CONTROLES.chantier),
        items: [ligneAvoir(facture.items[0].description, facture.items[0].unitPrice)],
        issueDate: AUJOURDHUI,
        refundMethod: "NEXT_INVOICE",
        ...champs,
      },
    },
    { organisation: ORG },
  );

test.describe("Avoirs : montant de la facture jamais dépassé", () => {
  test("Deux avoirs de 100 % créés au même instant sur une facture de 1 080 € : un seul est accepté", async ({ page }) => {
    const f = C.avoirsSimultanes;
    const reponses = await Promise.all([creer(page, f), creer(page, f)]);
    const acceptes = reponses.filter((r) => r.data?.createCreditNote);
    const refuses = reponses.filter((r) => !r.data?.createCreditNote);
    expect(await totalCredite(f), "Les avoirs dépassent le montant de la facture (1 080 €)").toBeLessThanOrEqual(1080);
    expect(acceptes, "Un avoir doit passer").toHaveLength(1);
    expect(messages(refuses[0]), "Le second avoir est refusé sans explication").toMatch(/dépasse le montant restant/);
  });

  test("Deux avoirs de 120 € TTC portés à 720 € au même instant sur une facture de 1 080 € : un seul passe", async ({ page }) => {
    // Chacun seul tient (720 + 120 = 840 €), les deux ensemble non (1 440 €).
    const f = C.avoirsModifiesSimultanes;
    const grandir = (avoir) => appelApiDirect(page, MODIFIER, { w: ORG, id: id(avoir), input: { items: [ligneAvoir(avoir.items[0].description, 600)] } }, { organisation: ORG });
    const reponses = await Promise.all([grandir(AVOIRS_CONTROLES.croissantA), grandir(AVOIRS_CONTROLES.croissantB)]);
    expect(await totalCredite(f), `Les avoirs dépassent le montant de la facture (1 080 €) : ${reponses.map(messages).join(" / ")}`).toBeLessThanOrEqual(1080);
    expect(reponses.filter((r) => r.data?.updateCreditNote), "Une des deux modifications doit passer").toHaveLength(1);
  });
});

test.describe("Avoirs : client et émetteur de la facture d'origine", () => {
  test("Un autre client et un autre émetteur saisis : l'avoir garde ceux de la facture, motif enregistré tel quel", async ({ page }) => {
    const f = C.avoirClient;
    const motif = "Remise n° 2 - client d'Île-de-France";
    const autre = clientDe(CLIENTS_CONTROLES.autre);
    let avoirId = null;
    await etape(page, "Créer l'avoir avec un autre client et un autre émetteur", async () => {
      const r = await creer(page, f, {
        reason: motif,
        client: autre,
        companyInfo: { name: "Société fictive", siret: "12345678900011", address: { street: "2 rue Ailleurs", city: "Nantes", postalCode: "44000", country: "France" } },
      });
      if (r.errors.length) {
        expect(messages(r), "Refus sans explication").not.toBe("");
        return;
      }
      avoirId = r.data.createCreditNote.id;
      const [avoir] = await avoirsDe(f);
      expect.soft(avoir.reason, "Motif").toBe(motif);
      expect.soft(avoir.client.name, "Avoir au nom d'un autre client que la facture").toBe(f.client.name);
      expect(avoir.companyInfo.name, "Avoir émis par une autre entreprise que la facture").toBe(ESPACES_FACTURES.controles.organisation.companyName);
    });
    await etape(page, "Modifier son client et son émetteur", async () => {
      if (!avoirId) return;
      await appelApiDirect(page, MODIFIER, { w: ORG, id: avoirId, input: { client: autre, companyInfo: { name: "Société fictive" } } }, { organisation: ORG });
      const [avoir] = await avoirsDe(f);
      expect.soft(avoir.client.name, "Client de l'avoir remplacé après émission").toBe(f.client.name);
      expect(avoir.companyInfo.name, "Émetteur de l'avoir remplacé après émission").toBe(ESPACES_FACTURES.controles.organisation.companyName);
    });
  });

  test("Un avoir daté d'avant sa facture : refusé avec un message, rien n'est enregistré", async ({ page }) => {
    const f = C.avoirDate;
    const r = await creer(page, f, { issueDate: jour(-20) });
    expect(r.data?.createCreditNote ?? null, "Avoir antérieur à la facture accepté").toBeNull();
    expect(messages(r)).toMatch(/ne peut pas précéder celle de la facture d'origine/);
    expect(await avoirsDe(f)).toEqual([]);
  });
});

test.describe("Avoirs : montants d'un avoir total", () => {
  test("Facture avec remise de 10 %, 15 € de port et autoliquidation : l'avoir reprend 915 € HT, sans TVA, articles en négatif", async ({ page }) => {
    const f = C.avoirRemisePort;
    const r = await creer(page, f, { items: [ligneAvoir("Pose de cloisons", 500, -2)], discount: 10, discountType: "PERCENTAGE" });
    expect(r.errors, messages(r)).toEqual([]);
    const [avoir] = await avoirsDe(f);
    expect.soft(avoir.finalTotalHT, "HT de l'avoir").toBeCloseTo(-915, 2);
    expect.soft(avoir.finalTotalVAT, "TVA de l'avoir (autoliquidation)").toBeCloseTo(0, 2);
    expect.soft(avoir.finalTotalTTC, "TTC de l'avoir").toBeCloseTo(-915, 2);
    expect.soft(avoir.isReverseCharge, "Autoliquidation reprise de la facture").toBe(true);
    for (const a of avoir.items) expect.soft(a.quantity * a.unitPrice, `Article « ${a.description} » du même signe que les totaux`).toBeLessThan(0);
  });
});
