/**
 * Calculs purs des générateurs publics, séparés du composant pour être
 * testés sans navigateur.
 */

/** « 007 » donne « 008 », « A12 » donne « A13 » ; sans chiffre final, inchangé. */
export function numeroSuivant(numero) {
  const m = String(numero ?? "").match(/^(.*?)(\d+)$/);
  if (!m) return String(numero ?? "");
  const suivant = String(Number(m[2]) + 1).padStart(m[2].length, "0");
  return `${m[1]}${suivant}`;
}

/** Remise en pourcentage d'une ligne, bornée entre 0 et 100. */
export function remiseBornee(remise) {
  return Math.min(Math.max(Number(remise) || 0, 0), 100);
}

/** Montant HT d'une ligne, remise en pourcentage déduite. */
export function montantLigneHT(ligne) {
  const brut = (Number(ligne.quantity) || 0) * (Number(ligne.unitPrice) || 0);
  return brut * (1 - remiseBornee(ligne.discount) / 100);
}
