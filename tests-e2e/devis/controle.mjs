/**
 * Outils des contrôles de l'organisation « Contrôles Ventes » (signatures,
 * facturation, paramètres) : appels GraphQL du propriétaire, webhook du
 * prestataire de signature, relecture de la base.
 *
 * Le webhook (POST /api/esignature/webhook) est appelé comme le ferait le
 * prestataire : l'API de test n'a pas de secret de webhook (NODE_ENV=test),
 * il est donc ouvert, comme en développement.
 */
import { expect } from "@playwright/test";
import { API_URL } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";

export const ORG_CONTROLE = id(COMPTES.controleVentes.organisation);
export const ORG_CONTROLE_ID = COMPTES.controleVentes.organisation._id;

/** Appel GraphQL du propriétaire de « Contrôles Ventes » (page ouverte sur le site). */
export const appelControle = (page, requete, variables = {}) =>
  appelApi(page, requete, variables, { organisation: ORG_CONTROLE, delai: 30_000 });

/** Messages d'erreur d'une réponse GraphQL. */
export const messages = (reponse) => reponse.errors.map((e) => e.message).join(" | ");

/** Collection de la base de test. */
export const collection = async (nom) => (await base()).collection(nom);

/** Document relu en base (null s'il n'existe plus). */
export const relire = async (nom, _id) => (await collection(nom)).findOne({ _id });

/** Valeur relue jusqu'à ce qu'elle soit la bonne (effets asynchrones de l'API). */
export const attendreEnBase = (lire, message, timeout = 15_000) => expect.poll(lire, { message, timeout });

/**
 * Message du prestataire de signature : `id` (identifiant chez lui), état,
 * et notre identifiant de demande dans `custom`.
 */
export async function webhookSignature(demande, etat) {
  const res = await fetch(`${API_URL}/api/esignature/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: demande.externalSignatureId, state: etat, custom: { signatureRequestId: demande._id.toHexString() } }),
  });
  return { statut: res.status, corps: await res.json().catch(() => ({})) };
}

export const MUTATIONS = {
  modifierDevis: `mutation($id: ID!, $input: UpdateQuoteInput!) { updateQuote(id: $id, input: $input) { id finalTotalTTC } }`,
  statutDevis: `mutation($id: ID!, $status: QuoteStatus!) { changeQuoteStatus(id: $id, status: $status) { id status } }`,
  supprimerDevis: `mutation($id: ID!) { deleteQuote(id: $id) }`,
  signer: `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success message } }`,
  annulerSignature: `mutation($id: ID!) { cancelSignature(signatureId: $id) { success message } }`,
  relancerSignature: `mutation($id: ID!) { retrySignature(signatureId: $id) { success message } }`,
  cacheter: `mutation($id: ID!) { sealQuoteDocument(quoteId: $id) { success message } }`,
  factureLiee: `mutation($quoteId: ID!, $amount: Float!, $isDeposit: Boolean!, $w: ID!) { createLinkedInvoice(quoteId: $quoteId, amount: $amount, isDeposit: $isDeposit, workspaceId: $w) { invoice { id finalTotalTTC } } }`,
  convertirEnFacture: `mutation($id: ID!, $distribution: [Float], $skip: Boolean) { convertQuoteToInvoice(id: $id, distribution: $distribution, skipValidation: $skip) { id } }`,
  convertirEnBc: `mutation($id: ID!, $w: ID!) { convertQuoteToPurchaseOrder(quoteId: $id, workspaceId: $w) { id status } }`,
  facturerBc: `mutation($id: ID!, $w: ID!) { convertPurchaseOrderToInvoice(id: $id, workspaceId: $w) { id finalTotalTTC } }`,
  facturerBl: `mutation($id: ID!, $w: ID!) { createInvoiceFromDeliveryNote(deliveryNoteId: $id, workspaceId: $w) { id finalTotalTTC } }`,
};

/** Factures liées à un devis (champ sourceQuote), tous chemins confondus. */
export const facturesDuDevis = async (devis) => (await collection("invoices")).find({ sourceQuote: devis._id }).toArray();

/** Somme des TTC, arrondie au centime. */
export const totalTTC = (factures) => Math.round(factures.reduce((t, f) => t + (f.finalTotalTTC || 0), 0) * 100) / 100;
