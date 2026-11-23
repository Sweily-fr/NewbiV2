/**
 * Paiement d'un transfert vu par son propriétaire (tableau, détail).
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const TRANSFER_PAYMENT_PROVIDER_LABELS = {
  stripe: "Carte bancaire (Stripe)",
  sumup: "Carte bancaire (SumUp)",
  paypal: "PayPal",
  bank_transfer: "Virement bancaire",
  manual: "Marqué payé à la main",
};

export const TRANSFER_PAYMENT_METHOD_LABELS = {
  stripe: "Carte",
  sumup: "Carte (SumUp)",
  paypal: "PayPal",
  bank_transfer: "Virement",
};

/** Libellé du badge de paiement, par état (voir transferPaymentState). */
export const TRANSFER_PAYMENT_STATE_LABELS = {
  paid: "Payé",
  declared: "Virement annoncé",
  pending: "Paiement en confirmation",
  awaiting: "En attente de paiement",
};

export function formatTransferAmount(amount, currency = "EUR") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || "EUR"}`;
  }
}

/**
 * État du paiement d'un transfert :
 * - null : aucun paiement demandé ;
 * - "paid" : payé (en ligne, virement détecté ou marqué payé) ;
 * - "declared" : le destinataire annonce avoir fait le virement ;
 * - "pending" : paiement reçu par le prestataire, confirmation en attente ;
 * - "awaiting" : en attente du paiement du destinataire.
 */
export function transferPaymentState(transfer) {
  if (!transfer) return null;
  const required =
    transfer.isPaymentRequired === true || Number(transfer.paymentAmount) > 0;
  if (!required) return null;
  if (transfer.isPaid) return "paid";
  if (transfer.bankTransferDeclaredAt) return "declared";
  if (transfer.paymentPending) return "pending";
  return "awaiting";
}

/** Le propriétaire peut débloquer le transfert à la main. */
export function canMarkTransferAsPaid(transfer) {
  const state = transferPaymentState(transfer);
  return (
    (state === "awaiting" || state === "pending" || state === "declared") &&
    transfer.status !== "expired" &&
    transfer.status !== "deleted"
  );
}

/**
 * Adresse à laquelle l'API prévient le client quand le transfert est
 * débloqué : celle laissée en annonçant le virement, sinon celle du
 * destinataire. null : personne n'est prévenu par e-mail.
 */
export function transferUnlockEmail(transfer) {
  return (
    transfer?.bankTransferDeclaredEmail || transfer?.recipientEmail || null
  );
}

/**
 * Virement annoncé par le client, pour le détail du transfert :
 * « Votre client a annoncé un virement le 21 novembre 2026 à 14:32
 * (adresse). Vérifiez votre compte avant de débloquer. »
 * null si aucun virement n'est annoncé (ou transfert déjà payé).
 */
export function formatBankTransferDeclaration(transfer) {
  if (transferPaymentState(transfer) !== "declared") return null;
  // Date ISO, ou horodatage en millisecondes selon la sérialisation
  const raw = transfer.bankTransferDeclaredAt;
  const date = new Date(/^\d+$/.test(String(raw)) ? Number(raw) : raw);
  const email = transfer.bankTransferDeclaredEmail;
  const when = Number.isNaN(date.getTime())
    ? ""
    : ` le ${format(date, "d MMMM yyyy", { locale: fr })} à ${format(date, "HH:mm")}`;
  return `Votre client a annoncé un virement${when}${
    email ? ` (${email})` : ""
  }. Vérifiez votre compte avant de débloquer.`;
}
