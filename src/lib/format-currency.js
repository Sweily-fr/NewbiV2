const FALLBACK_CURRENCY = "EUR";

export function normalizeCurrencyCode(currency) {
  if (typeof currency !== "string") return FALLBACK_CURRENCY;
  const code = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : FALLBACK_CURRENCY;
}

/**
 * Formate un montant dans sa devise (fr-FR) : "9,25 €", "10,59 $US".
 * Une facture d'achat n'est pas forcément en euros (justificatif en USD...),
 * le suffixe « € » codé en dur est donc à proscrire.
 */
// Formateurs mis en cache par devise : en construire un coûte ~70 fois plus
// cher que de l'utiliser, et ces fonctions tournent dans chaque cellule de
// montant des tableaux.
const amountFormatters = new Map();
let plainAmountFormatter;

function getAmountFormatter(code) {
  let formatter = amountFormatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    amountFormatters.set(code, formatter);
  }
  return formatter;
}

export function formatCurrencyAmount(amount, currency) {
  const code = normalizeCurrencyCode(currency);
  const value = Number(amount) || 0;
  try {
    return getAmountFormatter(code).format(value);
  } catch {
    plainAmountFormatter ??= new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${plainAmountFormatter.format(value)} ${code}`;
  }
}

/** Symbole seul ("€", "$US", "£GB") pour accoler à un champ de saisie. */
export function currencySymbol(currency) {
  const code = normalizeCurrencyCode(currency);
  try {
    const part = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value || code;
  } catch {
    return code;
  }
}
