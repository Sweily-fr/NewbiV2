/**
 * Taux d'intérêt légal des créances des professionnels, cité dans le TEXTE
 * des pages outils (exemples chiffrés, FAQ). Le calculateur, lui, ne s'en
 * sert pas : le taux y reste saisi par l'utilisateur.
 *
 * À METTRE À JOUR CHAQUE SEMESTRE (arrêté publié au Journal officiel fin
 * décembre et fin juin, pour le semestre suivant). Valeur du 2e semestre
 * 2026 : 2,75 %, soit un plancher de pénalités de 8,25 % (3 fois ce taux,
 * art. L. 441-10 du Code de commerce).
 */
export const TAUX_LEGAL_PRO = {
  valeur: 2.75,
  periode: "2e semestre 2026",
};

export const PLANCHER_PENALITES =
  Math.round(TAUX_LEGAL_PRO.valeur * 3 * 100) / 100;

// Espace insécable avant le signe %, pour qu'il ne passe pas seul à la ligne
const INSECABLE = String.fromCharCode(160);

/** « 2,75 % », « 8,25 % » */
export function pourcent(n) {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}${INSECABLE}%`;
}
