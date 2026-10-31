/**
 * Devis, bons de commande et de livraison : intégrité des documents émis,
 * vérifiée à l'API comme à l'écran.
 *
 *   - un document numéroté ne se supprime pas (l'écran ne supprime que les
 *     brouillons), même avec un préfixe fait d'espaces insécables ;
 *   - un devis refusé ou un bon de commande annulé ne se modifie plus, comme
 *     un bon de livraison annulé ;
 *   - un brouillon ne part pas par e-mail (numéro provisoire) ;
 *   - préfixes et numéros hostiles : refusés avec un message, ou affichés
 *     tels quels dans la liste.
 *
 * Organisation « Contrôles Ventes » (donnees/lot-devis-bc-bl.mjs).
 */
import { test, expect, etape } from "../outils.mjs";
import { attendreCalme, ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CONTROLE_VENTES } from "../config.mjs";
import { DOCUMENTS_CONTROLE as C } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { article, CLIENT_API } from "./droits.mjs";
import { ouvrirListe } from "./ventes.mjs";
import { appelControle, collection, messages, MUTATIONS, ORG_CONTROLE, ORG_CONTROLE_ID, relire } from "./controle.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });
test.beforeEach(async ({ page }) => {
  await ouvrir(page, "/dashboard");
});

const SUPPRESSIONS = {
  devis: { champ: "deleteQuote", requete: MUTATIONS.supprimerDevis, variables: (doc) => ({ id: id(doc) }), collection: "quotes" },
  bc: {
    champ: "deletePurchaseOrder",
    requete: `mutation($id: ID!, $w: ID!) { deletePurchaseOrder(id: $id, workspaceId: $w) }`,
    variables: (doc) => ({ id: id(doc), w: ORG_CONTROLE }),
    collection: "purchaseorders",
  },
  bl: {
    champ: "deleteDeliveryNote",
    requete: `mutation($id: ID!, $w: ID!) { deleteDeliveryNote(id: $id, workspaceId: $w) }`,
    variables: (doc) => ({ id: id(doc), w: ORG_CONTROLE }),
    collection: "deliverynotes",
  },
};

async function supprimerEtVerifierRefus(page, type, doc) {
  const s = SUPPRESSIONS[type];
  const reponse = await appelControle(page, s.requete, s.variables(doc));
  expect(reponse.data?.[s.champ] ?? null, "Suppression annoncée réussie").not.toBe(true);
  expect(messages(reponse), "Le refus doit être expliqué").toMatch(/brouillon|ne peut pas être supprimé/);
  expect(await relire(s.collection, doc._id), "Le document numéroté a été supprimé").not.toBeNull();
}

test.describe("Devis, bons de commande et de livraison : documents numérotés", () => {
  for (const [titre, type, doc] of [
    ["Devis en attente", "devis", C.devisEnAttente],
    ["Devis refusé", "devis", C.devisRefuse],
    ["Bon de commande confirmé", "bc", C.bcConfirme],
    ["Bon de livraison expédié", "bl", C.blExpedie],
  ]) {
    test(`${titre} : la suppression par l'API est refusée, comme à l'écran (brouillons seulement)`, async ({ page }) => {
      await supprimerEtVerifierRefus(page, type, doc);
    });
  }

  test("Devis créé avec un préfixe d'espaces insécables puis accepté : il ne se supprime pas", async ({ page }) => {
    const nom = "Devis au préfixe d'espaces insécables";
    let devis = null;
    await etape(page, "Créer le devis (préfixe « \\u00a0\\u00a0\\u00a0 ») puis l'accepter", async () => {
      const cree = await appelControle(page, `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id prefix number } }`, {
        w: ORG_CONTROLE,
        input: { prefix: "   ", issueDate: new Date().toISOString(), client: CLIENT_API, items: [article(nom)], status: "PENDING" },
      });
      if (!cree.data?.createQuote) {
        // Préfixe refusé à la création : rien à supprimer.
        expect(messages(cree)).toMatch(/préfixe/i);
        return;
      }
      devis = cree.data.createQuote;
      const accepte = await appelControle(page, MUTATIONS.statutDevis, { id: devis.id, status: "COMPLETED" });
      expect(accepte.errors).toEqual([]);
    });
    if (!devis) return;
    await etape(page, "Supprimer le devis accepté : refusé", async () => {
      await appelControle(page, MUTATIONS.supprimerDevis, { id: devis.id });
      const restant = await (await collection("quotes")).findOne({ workspaceId: ORG_CONTROLE_ID, "items.description": nom });
      expect(restant, "Le devis accepté a été supprimé (préfixe vide pris pour un devis importé)").not.toBeNull();
    });
  });
});

test.describe("Devis et bons de commande : documents annulés", () => {
  test("Devis refusé : la modification est refusée avec un message, comme un bon de livraison annulé", async ({ page }) => {
    const doc = C.devisRefuseAModifier;
    const reponse = await appelControle(page, MUTATIONS.modifierDevis, { id: id(doc), input: { headerNotes: "Notes ajoutées après le refus" } });
    expect(reponse.data?.updateQuote ?? null, "Devis refusé modifié").toBeNull();
    expect(messages(reponse)).toMatch(/refusé ne peut pas être modifié/);
    expect((await relire("quotes", doc._id)).headerNotes).toBe("");
  });

  test("Bon de commande annulé : la modification est refusée avec un message", async ({ page }) => {
    const doc = C.bcAnnuleAModifier;
    const reponse = await appelControle(page, `mutation($id: ID!, $w: ID!, $input: UpdatePurchaseOrderInput!) { updatePurchaseOrder(id: $id, workspaceId: $w, input: $input) { id } }`, {
      id: id(doc),
      w: ORG_CONTROLE,
      input: { headerNotes: "Notes ajoutées après l'annulation" },
    });
    expect(reponse.data?.updatePurchaseOrder ?? null, "Bon de commande annulé modifié").toBeNull();
    expect(messages(reponse)).toMatch(/annulé ne peut pas être modifié/);
    expect((await relire("purchaseorders", doc._id)).headerNotes).toBe("");
  });
});

test.describe("Devis, bons de commande et de livraison : envoi d'un brouillon par e-mail", () => {
  for (const [titre, champ, doc] of [
    ["Devis", "sendQuoteEmail", C.devisBrouillon],
    ["Bon de commande", "sendPurchaseOrderEmail", C.bcBrouillon],
    ["Bon de livraison", "sendDeliveryNoteEmail", C.blBrouillon],
  ]) {
    test(`${titre} en brouillon : l'envoi par l'API est refusé avec un message, aucun envoi journalisé`, async ({ page }) => {
      const reponse = await appelControle(page, `mutation($w: ID!, $input: SendDocumentEmailInput!) { ${champ}(workspaceId: $w, input: $input) { success } }`, {
        w: ORG_CONTROLE,
        input: { documentId: id(doc), emailSubject: "Document en brouillon", emailBody: "Bonjour", recipientEmail: "client-brouillon@e2e.test" },
      });
      expect(reponse.data?.[champ]?.success ?? null, "Brouillon envoyé").not.toBe(true);
      expect(messages(reponse), "Le refus doit dire que le document est un brouillon").toMatch(/brouillon/i);
      expect(await (await collection("documentemaillogs")).countDocuments({ documentId: doc._id }), "Envoi journalisé").toBe(0);
    });
  }
});

test.describe("Devis et bons de livraison : préfixes et numéros", () => {
  const creerDevis = (page, input) =>
    appelControle(page, `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id prefix number } }`, {
      w: ORG_CONTROLE,
      input: { issueDate: new Date().toISOString(), client: CLIENT_API, status: "PENDING", ...input },
    });

  for (const prefixe of ["<b>D</b>", 'D"X', "D/2026", "D é"]) {
    test(`Préfixe « ${prefixe} » : refusé avec un message, ou affiché tel quel dans la liste`, async ({ page }) => {
      const reponse = await creerDevis(page, { prefix: prefixe, items: [article(`Devis au préfixe ${prefixe}`)] });
      const cree = reponse.data?.createQuote;
      if (!cree) {
        expect(messages(reponse), "Refus sans message").toMatch(/préfixe/i);
        return;
      }
      expect(cree.prefix, "Préfixe enregistré").toBe(prefixe);
      await etape(
        page,
        "Liste des devis : la référence s'affiche telle quelle",
        async () => {
          await ouvrirListe(page, "devis");
          await page.getByPlaceholder(/^Recherchez par numéro, client ou montant/).fill(prefixe);
          await attendreCalme(page);
          const ligne = page.getByRole("row").filter({ hasText: `${prefixe}-${cree.number}` });
          await expect(ligne, "Référence absente ou transformée dans la liste").toHaveCount(1);
          await expect(ligne.locator("b"), "Du HTML du préfixe est interprété").toHaveCount(0);
        },
        { capture: "ecran" },
      );
    });
  }

  test("Numéro manuel « 0001a » : refusé avec un message", async ({ page }) => {
    const reponse = await creerDevis(page, { prefix: "D-NUM", number: "0001a", items: [article("Devis au numéro 0001a")] });
    expect(reponse.data?.createQuote ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/numéro/i);
    expect(await (await collection("quotes")).countDocuments({ workspaceId: ORG_CONTROLE_ID, "items.description": "Devis au numéro 0001a" })).toBe(0);
  });

  test("Préfixe de bon de livraison de 11 caractères : refusé, « 10 caractères » au plus", async ({ page }) => {
    const reponse = await appelControle(page, `mutation($w: ID!, $input: CreateDeliveryNoteInput!) { createDeliveryNote(workspaceId: $w, input: $input) { id } }`, {
      w: ORG_CONTROLE,
      input: {
        prefix: "BL-12345678",
        issueDate: new Date().toISOString(),
        client: CLIENT_API,
        items: [{ description: "Livraison au préfixe trop long", quantity: 1, unit: "" }],
        status: "DRAFT",
      },
    });
    expect(reponse.data?.createDeliveryNote ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/10 caractères/);
  });
});
