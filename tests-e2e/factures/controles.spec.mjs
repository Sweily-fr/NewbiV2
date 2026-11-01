/**
 * Règles des factures tenues par l'API elle-même (appels directs, comme le
 * ferait l'application mobile ou un script), dans des espaces à part
 * (donnees/lot-factures.mjs, ESPACES_FACTURES) pour que montants et
 * numéros ne dépendent d'aucun autre test :
 *   - statuts impossibles à la création et aux changements de statut ;
 *   - droits des rôles Comptable, Administrateur et personnalisés ;
 *   - factures liées à un devis (acompte, solde) et factures de situation ;
 *   - numérotation sans trou et préfixe d'un brouillon validé ;
 *   - saisies refusées de la facture récurrente ;
 *   - soldes, paiement en ligne et relance d'une facture créditée ;
 *   - facture transmise en facturation électronique.
 * Aucune page n'est ouverte : la requête part du navigateur connecté.
 */
import { ObjectId } from "mongodb";
import { test, expect, etape } from "../outils.mjs";
import { base } from "../base.mjs";
import {
  API_URL,
  BASE_URL,
  connecte,
  SESSION_TOKEN_FACTURES_ADMIN,
  SESSION_TOKEN_FACTURES_COMPTABLE,
  SESSION_TOKEN_FACTURES_CONTROLES,
  SESSION_TOKEN_FACTURES_EFACTURATION,
  SESSION_TOKEN_FACTURES_ROLE_AVOIRS,
  SESSION_TOKEN_FACTURES_ROLE_CREATION,
  SESSION_TOKEN_FACTURES_SOLDES,
} from "../config.mjs";
import { AVOIRS_CONTROLES, C, CLIENTS_CONTROLES, DEVIS_CONTROLES, E, ESPACES_FACTURES, IMPORTEE_CONTROLES, S } from "../donnees/lot-factures.mjs";
import { appelApiDirect, id, messages } from "../securite.mjs";

const ORG = id(ESPACES_FACTURES.controles.organisation);
const ORG_ID = ESPACES_FACTURES.controles.organisation._id;
const ORG_SOLDES = id(ESPACES_FACTURES.soldes.organisation);
const ORG_EFACT = id(ESPACES_FACTURES.efacturation.organisation);
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
const article = (description, prix, extra = {}) => ({ description, quantity: 1, unitPrice: prix, vatRate: 20, unit: "", ...extra });

const factures = async () => (await base()).collection("invoices");
const enBase = async (doc) => (await factures()).findOne({ _id: doc._id });
const photo = async (collection, filtre) => {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, __v, ...d }) => d));
};
/** Refus pour une question de droits (pas un refus métier). */
const refusDeDroits = (reponse) =>
  reponse.errors.some((e) => /^(FORBIDDEN|UNAUTHENTICATED)$/.test(e.extensions?.code || "") || /n'avez pas la permission|n'êtes pas membre/i.test(e.message));

const CREER = `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id number prefix status } }`;
const STATUT = `mutation($w: ID!, $id: ID!, $s: InvoiceStatus!) { changeInvoiceStatus(id: $id, workspaceId: $w, status: $s) { id status number prefix } }`;
const PAYER = `mutation($w: ID!, $id: ID!, $d: String!) { markInvoiceAsPaid(id: $id, workspaceId: $w, paymentDate: $d) { id status } }`;
const MODIFIER = `mutation($w: ID!, $id: ID!, $input: UpdateInvoiceInput!) { updateInvoice(id: $id, workspaceId: $w, input: $input) { id prefix number status } }`;
const AVOIR = `mutation($w: ID!, $input: CreateCreditNoteInput!) { createCreditNote(workspaceId: $w, input: $input) { id } }`;
const RECURRENCE = `mutation($w: ID!, $i: ID!, $input: InvoiceRecurrenceInput!) { saveInvoiceRecurrence(workspaceId: $w, invoiceId: $i, input: $input) { id } }`;
const PROCHAIN = `query($w: ID!, $p: String, $d: Boolean) { nextInvoiceNumber(workspaceId: $w, prefix: $p, isDraft: $d) }`;

const nouvelleFacture = (nom, champs = {}) => ({
  client: clientDe(CLIENTS_CONTROLES.chantier),
  items: [article(nom, 100)],
  issueDate: AUJOURDHUI,
  dueDate: jour(30),
  status: "DRAFT",
  ...champs,
});

test.describe("Factures : statuts impossibles refusés par l'API", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });

  for (const statut of ["COMPLETED", "CANCELED", "OVERDUE"]) {
    test(`Créer une facture au statut ${statut} : refusé, rien n'est créé ni numéroté`, async ({ page }) => {
      const nom = `Facture créée au statut ${statut}`;
      const compteurs = await photo("documentcounters", { workspaceId: ORG });
      const prochain = (await appelApiDirect(page, PROCHAIN, { w: ORG, p: "F-CTRL", d: false }, { organisation: ORG })).data?.nextInvoiceNumber;

      const reponse = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture(nom, { status: statut, prefix: "F-CTRL" }) }, { organisation: ORG });

      expect(reponse.data?.createInvoice ?? null, `Facture ${statut} créée (${JSON.stringify(reponse.data)})`).toBeNull();
      expect(messages(reponse), "Refus sans explication").toMatch(/brouillon ou en attente/);
      expect(await (await factures()).countDocuments({ workspaceId: ORG_ID, "items.description": nom }), "Une facture a été enregistrée").toBe(0);
      expect(await photo("documentcounters", { workspaceId: ORG }), "Un numéro a été consommé").toBe(compteurs);
      expect((await appelApiDirect(page, PROCHAIN, { w: ORG, p: "F-CTRL", d: false }, { organisation: ORG })).data?.nextInvoiceNumber, "Prochain numéro changé").toBe(prochain);
    });
  }

  for (const statut of ["COMPLETED", "CANCELED"]) {
    test(`Passer un brouillon à ${statut} : refusé, il reste brouillon sans numéro légal`, async ({ page }) => {
      const reponse = await appelApiDirect(page, STATUT, { w: ORG, id: id(C.brouillonStatuts), s: statut }, { organisation: ORG });
      expect(reponse.data?.changeInvoiceStatus ?? null, `Brouillon passé ${statut}`).toBeNull();
      expect(messages(reponse)).toMatch(/brouillon doit d'abord être validé/);
      const apres = await enBase(C.brouillonStatuts);
      expect(apres.status).toBe("DRAFT");
      expect(apres.number).toBe("DRAFT-0001");
      expect(apres.paymentDate ?? null).toBeNull();
    });
  }

  test("Passer une facture émise à « payée » par le changement de statut : la date de paiement est renseignée", async ({ page }) => {
    const reponse = await appelApiDirect(page, STATUT, { w: ORG, id: id(C.payeeParStatut), s: "COMPLETED" }, { organisation: ORG });
    expect(reponse.errors, messages(reponse)).toEqual([]);
    const apres = await enBase(C.payeeParStatut);
    expect(apres.status).toBe("COMPLETED");
    expect(apres.paymentDate, "Facture payée sans date de paiement").toBeTruthy();
  });
});

test.describe("Factures : droits des rôles Comptable, Administrateur et personnalisés", () => {
  test.describe("Comptable", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_COMPTABLE) });

    test("Marque une facture comme payée", async ({ page }) => {
      const reponse = await appelApiDirect(page, PAYER, { w: ORG, id: id(C.payerComptable), d: AUJOURDHUI }, { organisation: ORG });
      expect(reponse.errors, messages(reponse)).toEqual([]);
      expect((await enBase(C.payerComptable)).status).toBe("COMPLETED");
    });

    test("Ne crée, ne modifie, ne crédite ni ne rend récurrente une facture : refusé, rien ne change", async ({ page }) => {
      const cible = C.refusComptable;
      const avant = await photo("invoices", { workspaceId: ORG_ID });
      const avoirsAvant = await photo("creditnotes", { workspaceId: ORG_ID });
      const operations = [
        ["Créer une facture", CREER, { w: ORG, input: nouvelleFacture("Créée par le Comptable") }, "createInvoice"],
        ["Modifier une facture", MODIFIER, { w: ORG, id: id(cible), input: { footerNotes: "Modifiée par le Comptable" } }, "updateInvoice"],
        [
          "Créer un avoir",
          AVOIR,
          { w: ORG, input: { originalInvoiceId: id(cible), creditType: "COMMERCIAL_GESTURE", client: clientDe(CLIENTS_CONTROLES.chantier), items: [{ ...article("Avoir du Comptable", 1), quantity: -1 }], issueDate: AUJOURDHUI } },
          "createCreditNote",
        ],
        ["Rendre la facture récurrente", RECURRENCE, { w: ORG, i: id(cible), input: { frequency: "MONTHLY", interval: 1, startDate: jour(1) } }, "saveInvoiceRecurrence"],
      ];
      for (const [nom, requete, variables, champ] of operations) {
        const reponse = await appelApiDirect(page, requete, variables, { organisation: ORG });
        expect.soft(reponse.data?.[champ] ?? null, `${nom} : accepté pour le Comptable`).toBeNull();
        expect.soft(refusDeDroits(reponse), `${nom} : pas un refus de droits (${messages(reponse)})`).toBe(true);
      }
      expect(await photo("invoices", { workspaceId: ORG_ID }), "Les factures ont changé").toBe(avant);
      expect(await photo("creditnotes", { workspaceId: ORG_ID }), "Un avoir a été créé").toBe(avoirsAvant);
      expect(await (await base()).collection("invoicerecurrences").countDocuments({ sourceInvoiceId: cible._id }), "Récurrence créée").toBe(0);
    });

    test("Modifie une facture importée", async ({ page }) => {
      const reponse = await appelApiDirect(page, `mutation($id: ID!, $input: UpdateImportedInvoiceInput!) { updateImportedInvoice(id: $id, input: $input) { id notes } }`, { id: id(IMPORTEE_CONTROLES), input: { notes: "Note du Comptable" } }, { organisation: ORG });
      expect(reponse.errors, messages(reponse)).toEqual([]);
      expect((await (await base()).collection("imported_invoices").findOne({ _id: IMPORTEE_CONTROLES._id })).notes).toBe("Note du Comptable");
    });
  });

  test.describe("Administrateur", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_ADMIN) });

    test("Annule une facture émise", async ({ page }) => {
      const reponse = await appelApiDirect(page, STATUT, { w: ORG, id: id(C.annulerAdmin), s: "CANCELED" }, { organisation: ORG });
      expect(reponse.errors, messages(reponse)).toEqual([]);
      expect((await enBase(C.annulerAdmin)).status).toBe("CANCELED");
    });
  });

  test.describe("Rôle « Factures : voir, créer »", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_ROLE_CREATION) });

    test("Crée une facture en attente de paiement", async ({ page }) => {
      const nom = "Émise par le rôle Création";
      const reponse = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture(nom, { status: "PENDING", prefix: "F-ROLE" }) }, { organisation: ORG });
      expect(reponse.errors, messages(reponse)).toEqual([]);
      const creee = await (await factures()).findOne({ workspaceId: ORG_ID, "items.description": nom });
      expect(creee?.status).toBe("PENDING");
    });

    test("Ne marque pas une facture comme payée et ne crée pas de facture déjà payée", async ({ page }) => {
      const nom = "Payée d'office par le rôle Création";
      const avant = await photo("invoices", { _id: C.refusRoleCreation._id });
      const payer = await appelApiDirect(page, PAYER, { w: ORG, id: id(C.refusRoleCreation), d: AUJOURDHUI }, { organisation: ORG });
      expect.soft(payer.data?.markInvoiceAsPaid ?? null, "Facture marquée payée").toBeNull();
      expect.soft(refusDeDroits(payer), `Pas un refus de droits (${messages(payer)})`).toBe(true);
      expect(await photo("invoices", { _id: C.refusRoleCreation._id }), "La facture a changé").toBe(avant);

      const creer = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture(nom, { status: "COMPLETED", prefix: "F-ROLE" }) }, { organisation: ORG });
      expect(creer.data?.createInvoice ?? null, "Facture créée déjà payée").toBeNull();
      expect(await (await factures()).countDocuments({ workspaceId: ORG_ID, "items.description": nom })).toBe(0);
    });
  });

  test.describe("Rôle « Avoirs : voir »", () => {
    test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_ROLE_AVOIRS) });

    test("Ne crée, ne modifie ni n'envoie d'avoir : refusé, rien ne change", async ({ page }) => {
      const avant = await photo("creditnotes", { workspaceId: ORG_ID });
      const cible = AVOIRS_CONTROLES.cibleRole;
      const operations = [
        [
          "Créer un avoir",
          AVOIR,
          { w: ORG, input: { originalInvoiceId: id(C.refusRoleCreation), creditType: "COMMERCIAL_GESTURE", client: clientDe(CLIENTS_CONTROLES.chantier), items: [{ ...article("Avoir du rôle Avoirs", 1), quantity: -1 }], issueDate: AUJOURDHUI } },
          "createCreditNote",
        ],
        ["Modifier un avoir", `mutation($w: ID!, $id: ID!, $input: UpdateCreditNoteInput!) { updateCreditNote(id: $id, workspaceId: $w, input: $input) { id } }`, { w: ORG, id: id(cible), input: { reason: "Modifié par le rôle Avoirs" } }, "updateCreditNote"],
        [
          "Envoyer un avoir",
          `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendCreditNoteEmail(workspaceId: $w, input: $input) { success } }`,
          { w: ORG, input: { documentId: id(cible), emailSubject: "Avoir", emailBody: "Bonjour", recipientEmail: "role-avoirs@e2e.test" } },
          "sendCreditNoteEmail",
        ],
      ];
      for (const [nom, requete, variables, champ] of operations) {
        const reponse = await appelApiDirect(page, requete, variables, { organisation: ORG });
        expect.soft(reponse.data?.[champ] ?? null, `${nom} : accepté`).toBeNull();
        expect.soft(refusDeDroits(reponse), `${nom} : pas un refus de droits (${messages(reponse)})`).toBe(true);
      }
      expect(await photo("creditnotes", { workspaceId: ORG_ID }), "Les avoirs ont changé").toBe(avant);
    });
  });
});

test.describe("Factures : frais de port, remise, retenue de garantie, escompte et champs personnalisés", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });

  test("Totaux enregistrés = données d'impression, et l'avoir total reprend le port", async ({ page }) => {
    const nom = "Pose de bardage (port, remise, retenue, escompte)";
    // 2 × 500 € HT à 20 %, remise de 10 % (pas sur le port), 15 € HT de port à 20 %
    const creee = await appelApiDirect(
      page,
      CREER,
      {
        w: ORG,
        input: nouvelleFacture(nom, {
          status: "PENDING",
          prefix: "F-PORT",
          items: [article(nom, 500, { quantity: 2 })],
          discount: 10,
          discountType: "PERCENTAGE",
          shipping: { billShipping: true, shippingAddress: { fullName: CLIENTS_CONTROLES.chantier.name, ...CLIENTS_CONTROLES.chantier.address }, shippingAmountHT: 15, shippingVatRate: 20 },
          retenueGarantie: 5,
          escompte: 2,
          customFields: [
            { key: "Bon de commande client", value: "BC-2026-117" },
            { key: "Chantier", value: "Résidence Les Érables, bât. B" },
          ],
        }),
      },
      { organisation: ORG },
    );
    expect(creee.errors, messages(creee)).toEqual([]);
    const factureId = creee.data.createInvoice.id;
    const enregistree = await (await factures()).findOne({ _id: new ObjectId(factureId) });
    await etape(page, "Totaux en base : 915 € HT, 183 € de TVA, 1 098 € TTC", async () => {
      expect.soft(enregistree.finalTotalHT, "HT (900 € remisés + 15 € de port)").toBeCloseTo(915, 2);
      expect.soft(enregistree.finalTotalVAT, "TVA").toBeCloseTo(183, 2);
      expect.soft(enregistree.finalTotalTTC, "TTC").toBeCloseTo(1098, 2);
      expect.soft(enregistree.retenueGarantie).toBe(5);
      expect.soft(enregistree.escompte).toBe(2);
      expect.soft(enregistree.customFields?.map((c) => c.value)).toEqual(["BC-2026-117", "Résidence Les Érables, bât. B"]);
    });
    await etape(page, "Données d'impression identiques", async () => {
      const donnees = await page.request.get(`/api/invoices/data/${factureId}`, { failOnStatusCode: false });
      expect(donnees.status()).toBe(200);
      const corps = await donnees.json();
      const d = corps.invoice || corps.data || corps;
      for (const champ of ["finalTotalHT", "finalTotalVAT", "finalTotalTTC", "retenueGarantie", "escompte"]) {
        expect.soft(d[champ], `${champ} des données d'impression`).toBe(enregistree[champ]);
      }
    });
    await etape(page, "Avoir total : frais de port repris, 1 098 € TTC", async () => {
      const avoir = await appelApiDirect(
        page,
        AVOIR,
        { w: ORG, input: { originalInvoiceId: factureId, creditType: "CORRECTION", client: clientDe(CLIENTS_CONTROLES.chantier), items: [{ ...article(nom, 500), quantity: -2 }], discount: 10, discountType: "PERCENTAGE", issueDate: AUJOURDHUI } },
        { organisation: ORG },
      );
      expect(avoir.errors, messages(avoir)).toEqual([]);
      const enregistre = await (await base()).collection("creditnotes").findOne({ originalInvoice: enregistree._id });
      expect(enregistre.finalTotalTTC, "L'avoir total ne reprend pas les frais de port").toBeCloseTo(-1098, 2);
    });
  });
});

test.describe("Factures : facture liée à un devis (acompte puis solde)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });
  test.describe.configure({ mode: "serial" });
  const LIER = `mutation($w: ID!, $q: ID!, $a: Float!, $d: Boolean!) { createLinkedInvoice(quoteId: $q, workspaceId: $w, amount: $a, isDeposit: $d) { invoice { id finalTotalTTC finalTotalHT finalTotalVAT items { description vatRate unitPrice quantity } } } }`;
  const lier = (page, montant, acompte) => appelApiDirect(page, LIER, { w: ORG, q: id(DEVIS_CONTROLES.acompte), a: montant, d: acompte }, { organisation: ORG });
  let solde = null;

  test("Acompte de 360 € sur un devis à deux taux : une ligne par taux, TTC exact, HT + TVA = TTC", async ({ page }) => {
    const reponse = await lier(page, 360, true);
    expect(reponse.errors, messages(reponse)).toEqual([]);
    const facture = reponse.data.createLinkedInvoice.invoice;
    expect.soft(facture.items.map((a) => a.vatRate).sort(), "Une ligne par taux de TVA du devis").toEqual([20, 5.5].sort());
    expect.soft(facture.finalTotalTTC, "TTC de l'acompte").toBeCloseTo(360, 2);
    expect(Math.round((facture.finalTotalHT + facture.finalTotalVAT) * 100) / 100, "HT + TVA différent du TTC").toBeCloseTo(facture.finalTotalTTC, 2);
  });

  test("Second acompte sur le même devis : refusé", async ({ page }) => {
    const reponse = await lier(page, 100, true);
    expect(reponse.data?.createLinkedInvoice ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/Acompte déjà existant|acompte/i);
  });

  test("Solde de 841 € (reste 840 €) : refusé", async ({ page }) => {
    const reponse = await lier(page, 841, false);
    expect(reponse.data?.createLinkedInvoice ?? null).toBeNull();
    expect(JSON.stringify(reponse.errors)).toMatch(/reste à facturer \(840\.00€\)/);
  });

  test("Solde de 840 € : accepté, libellé « Facture de solde »", async ({ page }) => {
    const reponse = await lier(page, 840, false);
    expect(reponse.errors, messages(reponse)).toEqual([]);
    solde = reponse.data.createLinkedInvoice.invoice;
    expect(solde.items[0].description).toMatch(/^Facture de solde du devis D-CTRL-0002/);
  });

  test("Une facture liée annulée ne compte plus dans le reste à facturer", async ({ page }) => {
    test.skip(!solde, "Facture de solde non créée");
    for (const s of ["PENDING", "CANCELED"]) {
      const r = await appelApiDirect(page, STATUT, { w: ORG, id: solde.id, s }, { organisation: ORG });
      expect(r.errors, `Passage ${s} : ${messages(r)}`).toEqual([]);
    }
    const reponse = await lier(page, 840, false);
    expect(reponse.errors, `Le solde annulé compte encore dans le reste à facturer : ${messages(reponse)}`).toEqual([]);
  });
});

test.describe("Factures : factures de situation (avancement et reste disponible)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });
  test.describe.configure({ mode: "serial" });
  const reference = `${DEVIS_CONTROLES.situation.prefix}-${DEVIS_CONTROLES.situation.number}`;
  const situation = (page, avancement, nom) =>
    appelApiDirect(
      page,
      `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id finalTotalTTC status } }`,
      {
        w: ORG,
        input: nouvelleFacture(nom, {
          status: "PENDING",
          prefix: "SIT",
          invoiceType: "situation",
          purchaseOrderNumber: reference,
          items: [article(nom, 8333.33, { progressPercentage: avancement })],
        }),
      },
      { organisation: ORG },
    );
  let premiere = null;

  test("Situation 1 à 30 % puis situation 2 à 50 % d'un devis de 10 000 € : 3 000 € et 5 000 € TTC", async ({ page }) => {
    const s1 = await situation(page, 30, "Situation 1 (30 %)");
    expect(s1.errors, messages(s1)).toEqual([]);
    premiere = s1.data.createInvoice;
    expect.soft(premiere.finalTotalTTC).toBeCloseTo(3000, 0);
    const s2 = await situation(page, 50, "Situation 2 (50 %)");
    expect(s2.errors, messages(s2)).toEqual([]);
    expect.soft(s2.data.createInvoice.finalTotalTTC).toBeCloseTo(5000, 0);
  });

  test("Situation 3 à 30 % (11 000 € cumulés) : refusée avec le reste disponible", async ({ page }) => {
    const s3 = await situation(page, 30, "Situation 3 (30 %) refusée");
    expect(s3.data?.createInvoice ?? null).toBeNull();
    expect(messages(s3)).toMatch(/dépasserait le montant du contrat/);
    expect(JSON.stringify(s3.errors)).toMatch(/Reste disponible: 2000\.0\d€/);
  });

  test("La situation 1 annulée, le reste disponible remonte : la situation 3 à 30 % passe", async ({ page }) => {
    test.skip(!premiere, "Situation 1 non créée");
    const annuler = await appelApiDirect(page, STATUT, { w: ORG, id: premiere.id, s: "CANCELED" }, { organisation: ORG });
    expect(annuler.errors, messages(annuler)).toEqual([]);
    const s3 = await situation(page, 30, "Situation 3 (30 %) après annulation");
    expect(s3.errors, `Une situation annulée compte encore comme facturée : ${messages(s3)}`).toEqual([]);
  });
});

test.describe("Factures : numérotation sans trou", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });
  const emisesDuPrefixe = async (prefixe) =>
    (await (await factures()).find({ workspaceId: ORG_ID, prefix: prefixe, status: { $ne: "DRAFT" } }).toArray()).map((f) => f.number).sort();

  test("Lire le prochain numéro d'un brouillon ne consomme aucun numéro ni ne renomme de brouillon", async ({ page }) => {
    const avant = [await photo("documentcounters", { workspaceId: ORG }), await photo("invoices", { workspaceId: ORG_ID })];
    for (let i = 0; i < 3; i++) {
      const r = await appelApiDirect(page, PROCHAIN, { w: ORG, p: "F-CTRL", d: true }, { organisation: ORG });
      expect(r.errors, messages(r)).toEqual([]);
    }
    expect([await photo("documentcounters", { workspaceId: ORG }), await photo("invoices", { workspaceId: ORG_ID })], "Une simple lecture a modifié les compteurs ou les factures").toEqual(avant);
  });

  test("Deux brouillons puis une facture émise sans numéro : elle prend le premier numéro de la séquence", async ({ page }) => {
    const prefixe = "NUM-B";
    for (const nom of ["Brouillon NUM-B 1", "Brouillon NUM-B 2"]) {
      const r = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture(nom, { prefix: prefixe }) }, { organisation: ORG });
      expect(r.errors, messages(r)).toEqual([]);
    }
    const emise = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture("Émise NUM-B", { prefix: prefixe, status: "PENDING" }) }, { organisation: ORG });
    expect(emise.errors, messages(emise)).toEqual([]);
    expect(emise.data.createInvoice.number, "Les brouillons ont consommé des numéros : la séquence émise commence avec un trou").toBe("0001");
  });

  test("Préfixe neuf : brouillons A puis B, B validé, A supprimé : la séquence émise commence à 0001", async ({ page }) => {
    const prefixe = "NUM-C";
    const ids = [];
    for (const nom of ["Brouillon NUM-C A", "Brouillon NUM-C B"]) {
      const r = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture(nom, { prefix: prefixe }) }, { organisation: ORG });
      expect(r.errors, messages(r)).toEqual([]);
      ids.push(r.data.createInvoice.id);
    }
    const valider = await appelApiDirect(page, STATUT, { w: ORG, id: ids[1], s: "PENDING" }, { organisation: ORG });
    expect(valider.errors, messages(valider)).toEqual([]);
    const supprimer = await appelApiDirect(page, `mutation($w: ID!, $id: ID!) { deleteInvoice(id: $id, workspaceId: $w) }`, { w: ORG, id: ids[0] }, { organisation: ORG });
    expect(supprimer.errors, messages(supprimer)).toEqual([]);
    expect(await emisesDuPrefixe(prefixe), "Le brouillon supprimé emporte un numéro : 0001 n'existera jamais").toEqual(["0001"]);
  });
});

test.describe("Factures : validation d'un brouillon au préfixe personnalisé", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });

  test("Valider depuis le panneau ou depuis l'éditeur : la facture garde le préfixe « ACOMPTE » du brouillon", async ({ page }) => {
    await etape(page, "Depuis le panneau (changement de statut)", async () => {
      const r = await appelApiDirect(page, STATUT, { w: ORG, id: id(C.brouillonAcompte), s: "PENDING" }, { organisation: ORG });
      expect(r.errors, messages(r)).toEqual([]);
      const apres = await enBase(C.brouillonAcompte);
      expect(apres.prefix, "Le préfixe du brouillon est remplacé par celui de la dernière facture").toBe("ACOMPTE");
      expect(apres.number).toMatch(/^\d{4}$/);
    });
    await etape(page, "Depuis l'éditeur (enregistrement en attente)", async () => {
      const brouillon = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture("Acompte validé dans l'éditeur", { prefix: "ACOMPTE" }) }, { organisation: ORG });
      expect(brouillon.errors, messages(brouillon)).toEqual([]);
      const r = await appelApiDirect(page, MODIFIER, { w: ORG, id: brouillon.data.createInvoice.id, input: { status: "PENDING", prefix: "ACOMPTE" } }, { organisation: ORG });
      expect(r.errors, messages(r)).toEqual([]);
      expect(r.data.updateInvoice.prefix).toBe("ACOMPTE");
    });
  });
});

test.describe("Factures : facture récurrente, saisies refusées", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });
  const source = C.refusComptable;

  for (const [cas, champs, motif] of [
    ["intervalle de 0", { interval: 0 }, /entier entre 1 et 365/],
    ["intervalle de 366", { interval: 366 }, /entier entre 1 et 365/],
    // Refusé dès la lecture de la requête (le champ est un entier)
    ["intervalle de 1,5", { interval: 1.5 }, /Int|entier|Données d'entrée invalides/],
    ["première facture dans le passé", { startDate: jour(-3) }, /dans le passé/],
    ["fin avant la première facture", { startDate: jour(10), endDate: jour(5) }, /date de fin doit suivre/],
    ["objet de 301 caractères", { emailSubject: "O".repeat(301) }, /300 caractères/],
  ]) {
    test(`Récurrence avec ${cas} : refusée avec un message, rien n'est enregistré`, async ({ page }) => {
      const r = await appelApiDirect(page, RECURRENCE, { w: ORG, i: id(source), input: { frequency: "MONTHLY", interval: 1, startDate: jour(1), ...champs } }, { organisation: ORG });
      expect(r.data?.saveInvoiceRecurrence ?? null, "Récurrence enregistrée").toBeNull();
      expect(messages(r)).toMatch(motif);
      expect(await (await base()).collection("invoicerecurrences").countDocuments({ sourceInvoiceId: source._id })).toBe(0);
    });
  }
});

test.describe("Factures : facture créditée (soldes, paiement en ligne, relance)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_SOLDES) });
  const LIEN = `query($w: ID!, $id: ID!) { invoice(id: $id, workspaceId: $w) { id paymentLink } }`;

  test("Soldes : 1 000 € HT échus avec un avoir de 400 €, une facture soldée par avoir et 200 € dus : 800 € facturés et en retard, 2 factures en retard", async ({ page }) => {
    const r = await appelApiDirect(page, `query($w: ID!) { invoiceBalances(workspaceId: $w) { totalBilled totalPaid overdueAmount overdueCount } }`, { w: ORG_SOLDES }, { organisation: ORG_SOLDES });
    expect(r.errors, messages(r)).toEqual([]);
    const soldes = r.data.invoiceBalances;
    expect.soft(soldes.overdueAmount, "Montant en retard (les avoirs ne sont pas déduits)").toBeCloseTo(800, 2);
    expect.soft(soldes.totalBilled, "Montant facturé").toBeCloseTo(800, 2);
    expect(soldes.overdueCount, "Factures en retard (la facture soldée par avoir est comptée)").toBe(2);
  });

  test("Facture soldée par avoir : plus de lien de paiement, le lien public répond « Facture soldée par avoir »", async ({ page }) => {
    const r = await appelApiDirect(page, LIEN, { w: ORG_SOLDES, id: id(S.soldee) }, { organisation: ORG_SOLDES });
    expect(r.errors, messages(r)).toEqual([]);
    expect(r.data.invoice.paymentLink, "Lien de paiement proposé pour une facture soldée").toBeNull();
    const lien = await page.request.get(`${API_URL}/pay/invoice/${id(S.soldee)}`, { maxRedirects: 0, failOnStatusCode: false });
    expect(lien.status()).toBe(409);
    expect(await lien.text()).toContain("Facture soldée par avoir");
  });

  test("Avoir partiel : la facture reste payable en ligne", async ({ page }) => {
    const r = await appelApiDirect(page, LIEN, { w: ORG_SOLDES, id: id(S.credit400) }, { organisation: ORG_SOLDES });
    expect(r.errors, messages(r)).toEqual([]);
    expect(r.data.invoice.paymentLink).toContain(`/pay/invoice/${id(S.credit400)}`);
  });

  test("Facture soldée par avoir : la relance immédiate est refusée avec un message, rien n'est envoyé", async ({ page }) => {
    const r = await appelApiDirect(page, `mutation($id: ID!, $w: ID) { sendInvoiceReminderNow(invoiceId: $id, workspaceId: $w) { success message } }`, { id: id(S.soldee), w: ORG_SOLDES }, { organisation: ORG_SOLDES });
    expect(r.errors, messages(r)).toEqual([]);
    expect(r.data.sendInvoiceReminderNow.success).toBe(false);
    expect(r.data.sendInvoiceReminderNow.message).toMatch(/entièrement annulée par un avoir/);
    expect(await (await base()).collection("invoicereminderlogs").countDocuments({ invoiceId: S.soldee._id })).toBe(0);
  });
});

test.describe("Factures : facture transmise en facturation électronique", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EFACTURATION) });

  for (const [cas, facture, motif] of [
    ["déposée sur la plateforme", E.aAnnuler, /transmise en facturation électronique.*Créez un avoir/],
    ["déclarée en e-reporting", E.declaree, /déclarée à l'administration.*Créez un avoir/],
  ]) {
    test(`Annuler une facture ${cas} : refusé, elle s'annule par un avoir`, async ({ page }) => {
      const r = await appelApiDirect(page, STATUT, { w: ORG_EFACT, id: id(facture), s: "CANCELED" }, { organisation: ORG_EFACT });
      expect(r.data?.changeInvoiceStatus ?? null, "Facture transmise annulée dans Newbi").toBeNull();
      expect(messages(r)).toMatch(motif);
      expect((await enBase(facture)).status).toBe("PENDING");
    });
  }

  test("Renvoyer une facture déjà déposée : refusé, le dépôt d'origine ne change pas", async ({ page }) => {
    const avant = await enBase(E.aRenvoyer);
    const r = await appelApiDirect(page, `mutation($w: ID!, $i: ID!) { resendInvoiceToSuperPdp(workspaceId: $w, invoiceId: $i) { success message superPdpInvoiceId } }`, { w: ORG_EFACT, i: id(E.aRenvoyer) }, { organisation: ORG_EFACT });
    expect(r.data?.resendInvoiceToSuperPdp ?? null, "Second dépôt tenté").toBeNull();
    expect(messages(r)).toMatch(/déjà été déposée/);
    const apres = await enBase(E.aRenvoyer);
    expect(apres.superPdpInvoiceId).toBe(avant.superPdpInvoiceId);
    expect(apres.eInvoiceStatus).toBe(avant.eInvoiceStatus);
  });

  test("Avoir d'une facture transmise : déposé sur la plateforme, ou refusé avec un message s'il ne peut pas l'être", async ({ page }) => {
    const r = await appelApiDirect(
      page,
      AVOIR,
      {
        w: ORG_EFACT,
        input: { originalInvoiceId: id(E.aCrediter), creditType: "CORRECTION", reason: "Erreur de quantité", client: clientDe(CLIENTS_CONTROLES.public), items: [{ ...article(E.aCrediter.items[0].description, 1000), quantity: -1 }], issueDate: AUJOURDHUI },
      },
      { organisation: ORG_EFACT },
    );
    const avoir = await (await base()).collection("creditnotes").findOne({ originalInvoice: E.aCrediter._id });
    if (r.errors.length) {
      expect(messages(r), "Refus sans explication").not.toBe("");
      expect(avoir, "Avoir enregistré malgré le refus").toBeNull();
    } else {
      expect(avoir, "Avoir introuvable").not.toBeNull();
      expect(Boolean(avoir.superPdpInvoiceId) || !["NOT_SENT", undefined, null].includes(avoir.eInvoiceStatus), "Avoir d'une facture transmise créé dans Newbi sans être déposé sur la plateforme (type 381)").toBe(true);
    }
  });
});

test.describe("Factures : référence de commande et lien « Voir la facture » des e-mails", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_CONTROLES) });

  test("Référence de commande « BC/2026/014 » : même réponse claire à la création et à la modification", async ({ page }) => {
    const reference = "BC/2026/014";
    const creation = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture("Référence avec barres obliques", { purchaseOrderNumber: reference }) }, { organisation: ORG });
    const brouillon = await appelApiDirect(page, CREER, { w: ORG, input: nouvelleFacture("Référence ajoutée ensuite") }, { organisation: ORG });
    expect(brouillon.errors, messages(brouillon)).toEqual([]);
    const modification = await appelApiDirect(page, MODIFIER, { w: ORG, id: brouillon.data.createInvoice.id, input: { purchaseOrderNumber: reference } }, { organisation: ORG });
    if (creation.errors.length || modification.errors.length) {
      expect(messages(creation), "Refus sans explication à la création").toMatch(/référence/i);
      expect(messages(modification), "Création et modification ne répondent pas pareil").toBe(messages(creation).replace("createInvoice", "updateInvoice"));
    } else {
      const enregistrees = await (await factures()).find({ workspaceId: ORG_ID, purchaseOrderNumber: reference }).toArray();
      expect(enregistrees, "Référence acceptée mais pas enregistrée").toHaveLength(2);
    }
  });

  test("Lien « Voir la facture » d'un e-mail avec un jeton inconnu : renvoie vers le site, sans rien révéler", async ({ page }) => {
    const r = await page.request.get(`${API_URL}/tracking/click/jeton-inconnu-e2e`, { maxRedirects: 0, failOnStatusCode: false });
    expect(r.status()).toBe(302);
    expect(new URL(r.headers().location).origin, "Redirection vers un autre site que Newbi").toBe(new URL(BASE_URL).origin);
  });
});
