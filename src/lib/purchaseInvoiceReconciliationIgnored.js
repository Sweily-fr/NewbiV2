/**
 * Persistance des suggestions de rapprochement facture d'achat "ignorées"
 * côté client (masquage du toast). Clé distincte du flux facture client pour
 * garder les deux toasts indépendants. Voir reconciliationIgnored.js.
 */
export const PI_IGNORED_SUGGESTIONS_KEY =
  "purchase_invoice_reconciliation_ignored_suggestions";

// Émis quand une transaction est dissociée d'une facture d'achat : le toast la
// retire de son état "ignoré" en mémoire pour la reproposer sans la rattacher.
export const PI_RECONCILIATION_REPROPOSE_EVENT =
  "purchase-invoice-reconciliation:repropose";

export const getIgnoredSuggestions = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(PI_IGNORED_SUGGESTIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

export const saveIgnoredSuggestion = (transactionId) => {
  if (typeof window === "undefined") return;
  try {
    const ignored = getIgnoredSuggestions();
    ignored.add(transactionId);
    localStorage.setItem(
      PI_IGNORED_SUGGESTIONS_KEY,
      JSON.stringify([...ignored]),
    );
  } catch {
    // Ignorer les erreurs de localStorage
  }
};

export const removeIgnoredSuggestion = (transactionId) => {
  if (typeof window === "undefined") return;
  try {
    const ignored = getIgnoredSuggestions();
    ignored.delete(transactionId);
    localStorage.setItem(
      PI_IGNORED_SUGGESTIONS_KEY,
      JSON.stringify([...ignored]),
    );
  } catch {
    // Ignorer les erreurs de localStorage
  }
};
