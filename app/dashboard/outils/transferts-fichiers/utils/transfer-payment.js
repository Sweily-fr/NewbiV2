/**
 * Paiement d'un transfert vu par son propriétaire (tableau, détail).
 */

export const TRANSFER_PAYMENT_PROVIDER_LABELS = {
  stripe: "Carte bancaire (Stripe)",
  paypal: "PayPal",
  bank_transfer: "Virement bancaire",
  manual: "Marqué payé à la main",
};

export const TRANSFER_PAYMENT_METHOD_LABELS = {
  stripe: "Carte",
  paypal: "PayPal",
  bank_transfer: "Virement",
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
 * - "paid" : payé (en ligne ou marqué payé) ;
 * - "pending" : paiement reçu par le prestataire, confirmation en attente ;
 * - "awaiting" : en attente du paiement du destinataire.
 */
export function transferPaymentState(transfer) {
  if (!transfer) return null;
  const required =
    transfer.isPaymentRequired === true || Number(transfer.paymentAmount) > 0;
  if (!required) return null;
  if (transfer.isPaid) return "paid";
  if (transfer.paymentPending) return "pending";
  return "awaiting";
}

/** Le propriétaire peut débloquer le transfert à la main. */
export function canMarkTransferAsPaid(transfer) {
  const state = transferPaymentState(transfer);
  return (
    (state === "awaiting" || state === "pending") &&
    transfer.status !== "expired" &&
    transfer.status !== "deleted"
  );
}
