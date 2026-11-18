/**
 * Montant prélevé à la fin d'un essai Stripe, tel qu'affiché dans les
 * e-mails d'essai : « 17,99 € par mois », « 194,28 € par an ».
 *
 * @param {{ items?: { data?: Array<{ price?: { unit_amount?: number, currency?: string, recurring?: { interval?: string } } }> } }} subscription
 * @returns {string|null} null si le prix n'est pas lisible
 */
export function formatTrialChargeAmount(subscription) {
  const price = subscription?.items?.data?.[0]?.price;
  if (!price || typeof price.unit_amount !== "number") return null;

  const amount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: (price.currency || "eur").toUpperCase(),
  }).format(price.unit_amount / 100);

  const interval = price.recurring?.interval;
  const period =
    interval === "year" ? " par an" : interval === "month" ? " par mois" : "";
  return `${amount}${period}`;
}
