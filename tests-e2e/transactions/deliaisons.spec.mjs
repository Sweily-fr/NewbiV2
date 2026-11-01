/**
 * Rapprochement : ce que l'API refuse sans rien modifier, avec la session de
 * l'Éditeur de « Saisie Achats » (droit « Rapprocher »).
 *   - Délier une paire qui n'a jamais été liée : une facture de vente
 *     annulée, un brouillon numéroté, une facture payée par chèque, une
 *     facture d'achat payée en espèces, une facture importée payée hors
 *     banque ; la transaction choisie est ignorée. Statut, date de paiement
 *     et statut de rapprochement restent ceux d'avant.
 *   - Sens du paiement : un débit ne règle pas une facture de vente, un
 *     encaissement ne règle pas une facture d'achat ; une transaction
 *     rattachée ne s'ignore pas.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_EDITEUR_ACHATS } from "../config.mjs";
import { DELIAISONS, IMPORTEES_SAISIE, SENS } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { ORG_SAISIE, photo } from "../achats-banque.mjs";

const D = DELIAISONS;
const parId = (collection, doc) => [collection, { _id: doc._id }];
const messages = (reponse) => reponse.errors.map((e) => e.message).join(" | ");

/** Appel de l'Éditeur dans « Saisie Achats ». */
const appeler = (page, requete, variables) => appelApi(page, requete, variables, { organisation: ORG_SAISIE, delai: 15_000 });

/** Rien n'a bougé dans les documents témoins pendant l'appel. */
async function sansEffet(temoins, appel) {
  const avant = await Promise.all(temoins.map(photo));
  const reponse = await appel();
  const apres = await Promise.all(temoins.map(photo));
  temoins.forEach(([collection], i) => expect.soft(apres[i], `${collection} : le document a changé`).toBe(avant[i]));
  return reponse;
}

/** Refus annoncé : `success: false` avec un message, ou une erreur, jamais un succès. */
function refuse(reponse, champ, motif) {
  expect(reponse.sansReponse, "L'API n'a pas répondu en 15 s").toBeFalsy();
  const valeur = reponse.data?.[champ];
  if (valeur && typeof valeur === "object" && "success" in valeur) {
    expect(valeur.success, `L'API annonce un succès : ${valeur.message}`).toBe(false);
    if (motif) expect(valeur.message).toMatch(motif);
    return;
  }
  expect(valeur ?? null, `L'API renvoie une réponse : ${JSON.stringify(valeur)?.slice(0, 200)}`).toBeNull();
  if (motif) expect(messages(reponse)).toMatch(motif);
}

const DELIER_VENTE = `mutation($t: ID!, $f: ID!) { unlinkTransactionFromInvoice(input: { transactionId: $t, invoiceId: $f }) { success message } }`;
const PAS_RATTACHEE = /pas rattachée|introuvable|aucun lien/i;

test.describe("Rapprochement : délier une paire jamais liée ne modifie rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const [nom, facture, transaction] of [
    ["une facture de vente annulée : elle reste annulée", D.venteAnnulee, D.ignoreeVenteAnnulee],
    ["un brouillon numéroté : il reste un brouillon", D.venteBrouillon, D.ignoreeVenteBrouillon],
    ["une facture payée par chèque : elle reste payée, avec sa date de paiement", D.ventePayeeCheque, D.ignoreeVentePayee],
  ]) {
    test(`Délier une transaction ignorée d'${nom}`, async ({ page }) => {
      const reponse = await sansEffet([parId("invoices", facture), parId("transactions", transaction)], () =>
        appeler(page, DELIER_VENTE, { t: id(transaction), f: id(facture) }),
      );
      refuse(reponse, "unlinkTransactionFromInvoice", PAS_RATTACHEE);
    });
  }

  test("Délier une transaction ignorée d'une facture d'achat payée en espèces : elle reste payée, la transaction reste ignorée", async ({ page }) => {
    const reponse = await sansEffet([parId("purchaseinvoices", D.achatPayeEspeces), parId("transactions", D.ignoreeAchat)], () =>
      appeler(page, `mutation($id: ID!, $t: ID!) { unlinkPurchaseInvoiceFromTransaction(purchaseInvoiceId: $id, transactionId: $t) { id status } }`, { id: id(D.achatPayeEspeces), t: id(D.ignoreeAchat) }),
    );
    refuse(reponse, "unlinkPurchaseInvoiceFromTransaction", PAS_RATTACHEE);
  });

  test("« Délier toutes les transactions » d'une facture d'achat payée en espèces (aucune transaction) : statut et date de paiement gardés", async ({ page }) => {
    const avant = await photo(parId("purchaseinvoices", D.achatPayeEspeces));
    const reponse = await appeler(page, `mutation($id: ID!) { unreconcilePurchaseInvoice(purchaseInvoiceId: $id) { id status } }`, { id: id(D.achatPayeEspeces) });
    expect(reponse.sansReponse).toBeFalsy();
    expect(await photo(parId("purchaseinvoices", D.achatPayeEspeces)), "La facture payée en espèces a perdu son statut ou sa date de paiement").toBe(avant);
  });

  test("Délier une transaction ignorée d'une facture importée payée hors banque : elle reste payée", async ({ page }) => {
    const facture = IMPORTEES_SAISIE.payeeHorsBanque;
    const reponse = await sansEffet([parId("imported_invoices", facture), parId("transactions", D.ignoreeImportee)], () =>
      appeler(page, `mutation($t: ID!, $f: ID!) { unlinkTransactionFromImportedInvoice(input: { transactionId: $t, importedInvoiceId: $f }) { success message } }`, { t: id(D.ignoreeImportee), f: id(facture) }),
    );
    refuse(reponse, "unlinkTransactionFromImportedInvoice", PAS_RATTACHEE);
  });
});

test.describe("Rapprochement : sens du paiement et transaction rattachée", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR_ACHATS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Un débit rapproché d'une facture de vente : refusé, la facture reste à encaisser", async ({ page }) => {
    const reponse = await sansEffet([parId("invoices", SENS.factureVente), parId("transactions", SENS.debitPourVente)], () =>
      appeler(page, `mutation($t: ID!, $f: ID!) { linkTransactionToInvoice(input: { transactionId: $t, invoiceId: $f, origin: TRANSACTION }) { success message } }`, { t: id(SENS.debitPourVente), f: id(SENS.factureVente) }),
    );
    refuse(reponse, "linkTransactionToInvoice", /sortie d'argent|débit/i);
  });

  test("Un encaissement rapproché d'une facture d'achat : refusé, la facture reste à payer", async ({ page }) => {
    const reponse = await sansEffet([parId("purchaseinvoices", SENS.factureAchat), parId("transactions", SENS.creditPourAchat)], () =>
      appeler(page, `mutation($id: ID!, $t: [ID!]!) { reconcilePurchaseInvoice(purchaseInvoiceId: $id, transactionIds: $t, origin: DOCUMENT) { id status } }`, { id: id(SENS.factureAchat), t: [id(SENS.creditPourAchat)] }),
    );
    refuse(reponse, "reconcilePurchaseInvoice", /entrée d'argent|encaissement/i);
  });

  test("Ignorer une transaction rattachée à une facture d'achat : refusé, le rapprochement reste", async ({ page }) => {
    const reponse = await sansEffet([parId("transactions", SENS.transactionLiee), parId("purchaseinvoices", SENS.achatPayeLie)], () =>
      appeler(page, `mutation($t: ID!) { ignoreTransaction(input: { transactionId: $t }) { success message } }`, { t: id(SENS.transactionLiee) }),
    );
    refuse(reponse, "ignoreTransaction", /rattachée|déliez/i);
  });
});
