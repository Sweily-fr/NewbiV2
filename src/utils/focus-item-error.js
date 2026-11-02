/**
 * Mise en avant du champ d'un article en erreur, une fois son accordéon
 * ouvert (éditeurs de factures, devis et bons de livraison).
 *
 * L'article rouvert par l'erreur est déjà visible : si l'utilisateur est en
 * train d'écrire dans un champ, on ne lui prend pas le focus (sa saisie
 * partirait dans le champ en erreur) et on ne fait pas défiler la page.
 */

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Vrai si l'élément actif est un champ où l'on tape du texte. */
export function isTypingInField(active) {
  if (!active || typeof active.tagName !== "string") return false;
  if (active.isContentEditable) return true;
  const tag = active.tagName.toUpperCase();
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  return !NON_TEXT_INPUTS.has(String(active.type || "text").toLowerCase());
}

/** Fait défiler jusqu'au champ en erreur et le sélectionne, sauf saisie en cours ailleurs. */
export function focusItemErrorField(el, doc = globalThis.document) {
  if (!el) return false;
  const active = doc?.activeElement;
  if (active === el || isTypingInField(active)) return false;
  el.scrollIntoView?.({ behavior: "smooth", block: "center" });
  el.focus?.({ preventScroll: true });
  return true;
}
