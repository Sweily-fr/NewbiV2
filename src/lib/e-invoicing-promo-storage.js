// Clés navigateur de la fenêtre de promotion facturation électronique.
// Module à part pour que la barre latérale les lise sans charger la
// fenêtre, importée en dynamique.

// Clé localStorage : l'utilisateur a coché « Ne plus voir ce message »
// (permanent). Masque aussi la pastille « ! » de la barre latérale.
export const E_INVOICING_PROMO_DISMISSED_KEY = "e_invoicing_promo_dismissed";
// Clé sessionStorage : la modal a déjà été ouverte automatiquement durant cette session
// (évite la réouverture à chaque rechargement de page ; remise à zéro à la prochaine connexion)
export const E_INVOICING_PROMO_SESSION_KEY = "e_invoicing_promo_session_shown";

export function isEInvoicingPromoDismissed() {
  try {
    return localStorage.getItem(E_INVOICING_PROMO_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}
