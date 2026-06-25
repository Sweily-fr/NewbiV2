/**
 * Persistance des suggestions de rapprochement "ignorées" côté client.
 *
 * Cette liste localStorage sert à masquer une carte du toast après action
 * (rattacher OU ignorer). Lorsqu'on dissocie ensuite la transaction, il faut
 * la retirer de cette liste pour qu'elle soit de nouveau proposée au
 * rapprochement (voir RECONCILIATION_REPROPOSE_EVENT).
 */
export const IGNORED_SUGGESTIONS_KEY = "reconciliation_ignored_suggestions";

// Émis quand une transaction est dissociée : le toast l'enlève de son état
// "ignoré" en mémoire pour la reproposer sans la rattacher.
export const RECONCILIATION_REPROPOSE_EVENT = "reconciliation:repropose";

export const getIgnoredSuggestions = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(IGNORED_SUGGESTIONS_KEY);
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
    localStorage.setItem(IGNORED_SUGGESTIONS_KEY, JSON.stringify([...ignored]));
  } catch {
    // Ignorer les erreurs de localStorage
  }
};

export const removeIgnoredSuggestion = (transactionId) => {
  if (typeof window === "undefined") return;
  try {
    const ignored = getIgnoredSuggestions();
    ignored.delete(transactionId);
    localStorage.setItem(IGNORED_SUGGESTIONS_KEY, JSON.stringify([...ignored]));
  } catch {
    // Ignorer les erreurs de localStorage
  }
};

/**
 * Reproposer une transaction au rapprochement après dissociation :
 * la retire du localStorage et notifie le toast (monté globalement) pour
 * qu'il rafraîchisse son état en mémoire.
 */
export const reproposeReconciliation = (transactionId) => {
  if (typeof window === "undefined" || !transactionId) return;
  removeIgnoredSuggestion(transactionId);
  window.dispatchEvent(
    new CustomEvent(RECONCILIATION_REPROPOSE_EVENT, {
      detail: { transactionId },
    }),
  );
};
