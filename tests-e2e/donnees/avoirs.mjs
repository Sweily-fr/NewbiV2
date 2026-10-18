/**
 * Organisation « Avoirs » : des factures à créditer et un avoir existant,
 * à part de l'organisation « Liste » pour ne pas changer la liste des
 * factures. Un avoir se crée depuis une facture en attente, terminée ou
 * annulée, et la somme des avoirs ne peut pas dépasser la facture.
 */
import { CLIENTS, COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { articles, entreprise, ligne, snapshotClient, totaux } from "./documents.mjs";
import { facture } from "./factures-liste.mjs";

const compte = "avoirs";
const client = CLIENTS.epsilon;

/** Factures du compte « Avoirs », par rôle dans les tests. */
export const FACTURES_AVOIRS = {
  aCrediterTotal: facture({ n: 201, numero: "0001", statut: "PENDING", emiseIlYa: 10, echeanceDans: 20, client, articles: [ligne("Mission à créditer en totalité", 1, 1000)], compte }),
  aCrediterPartiel: facture({ n: 202, numero: "0002", statut: "COMPLETED", emiseIlYa: 20, echeanceDans: 10, client, articles: [ligne("Formation sur deux jours", 2, 500)], payeeLe: DANS(-5), compte }),
  avecAvoir: facture({ n: 203, numero: "0003", statut: "PENDING", emiseIlYa: 15, echeanceDans: 15, client, articles: [ligne("Mission déjà créditée en partie", 1, 1000)], compte }),
  brouillon: facture({ n: 204, numero: "DRAFT-0001", statut: "DRAFT", emiseIlYa: 0, echeanceDans: 30, client, articles: [ligne("Brouillon sans avoir possible", 1, 300)], compte }),
};

/** Avoir déjà émis sur la facture « avecAvoir » : 500 € HT sur 1 000. */
function avoir({ n, numero, facture: f, lignes, type = "COMMERCIAL_GESTURE", motif = "" }) {
  const { utilisateur, organisation } = COMPTES[compte];
  const t = totaux(lignes);
  const negatif = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, -Math.abs(v)]));
  return {
    _id: oid("avoir", n),
    prefix: "AV",
    number: numero,
    originalInvoice: f._id,
    originalInvoiceNumber: `${f.prefix}-${f.number}`,
    creditType: type,
    reason: motif,
    issueDate: DANS(-2),
    issueYear: DANS(-2).getFullYear(),
    items: articles(lignes),
    companyInfo: entreprise(compte),
    client: snapshotClient(client),
    status: "CREATED",
    refundMethod: "NEXT_INVOICE",
    discount: 0,
    discountType: "PERCENTAGE",
    customFields: [],
    showBankDetails: false,
    isReverseCharge: false,
    ...negatif,
    shipping: { billShipping: false, shippingAddress: null, shippingAmountHT: 0, shippingVatRate: 20 },
    clientPositionRight: false,
    operationType: null,
    retenueGarantie: 0,
    escompte: 0,
    workspaceId: organisation._id,
    createdBy: utilisateur._id,
    createdAt: DANS(-2),
    updatedAt: MAINTENANT,
  };
}

export const AVOIRS = {
  existant: avoir({ n: 1, numero: "0001", facture: FACTURES_AVOIRS.avecAvoir, lignes: [ligne("Geste commercial sur la mission", -1, 500)], motif: "Retard de livraison" }),
};
