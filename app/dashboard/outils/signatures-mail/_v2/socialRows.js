/**
 * Disposition des icônes de réseaux (style.socialRows) : nombre d'icônes
 * de chaque ligne, de haut en bas, la dernière valeur valant pour les
 * lignes suivantes. Même règle que le générateur de l'API (splitRows).
 */

import { slotOf } from "./slots";

/** Nombre d'icônes de chaque ligne, pour `count` icônes. */
export function distribute(count, plan = []) {
  if (!plan?.length) return count > 0 ? [count] : [];
  const rows = [];
  for (let left = count, r = 0; left > 0; r += 1) {
    const n = Math.min(plan[Math.min(r, plan.length - 1)], left);
    rows.push(n);
    left -= n;
  }
  return rows;
}

function labelOf(plan, rows) {
  if (rows.length === 1) return "Une ligne";
  if (plan.length === 1 && plan[0] === 1) return "En colonne";
  if (rows.length === 2) return rows.join(" + ");
  return `${plan[0]} par ligne`;
}

/**
 * Dispositions proposées pour `count` icônes : une ligne, les
 * répartitions sur deux lignes, 2 ou 3 par ligne, en colonne. Une seule
 * proposition par rendu : « 3 par ligne » et « 3 + 2 » donnent la même
 * chose avec 5 icônes, on garde « 3 par ligne », qui suit l'ajout d'un
 * réseau.
 */
export function socialRowOptions(count) {
  if (count < 2) return [];
  const plans = [[], [1], [3], [2], [4]];
  for (let k = 1; k < count; k += 1) plans.push([k, count - k]);
  const seen = new Set();
  const options = [];
  for (const plan of plans) {
    const rows = distribute(count, plan);
    const key = rows.join("+");
    // Au-delà de 4 icônes, deux lignes dont une d'une seule icône font
    // bancal : on ne les propose pas
    const lonely = count > 4 && rows.length === 2 && Math.min(...rows) === 1;
    if (seen.has(key) || lonely) continue;
    seen.add(key);
    options.push({ key, plan, rows, label: labelOf(plan, rows) });
  }
  // Moins de lignes d'abord, puis les répartitions les plus équilibrées
  const spread = (o) => Math.max(...o.rows) - Math.min(...o.rows);
  return options.sort(
    (a, b) =>
      a.rows.length - b.rows.length ||
      spread(a) - spread(b) ||
      b.rows[0] - a.rows[0],
  );
}

/** Alignement des lignes d'icônes dans la signature (pour les vignettes). */
export function socialAlign(st) {
  const slot = slotOf(st.slots, "social");
  if (slot === "visual") return "center";
  if (slot === "side") return "right";
  if (slot === "header") return st.headerPhoto === "top" ? "center" : "left";
  if (slot === "text" && !(st.slots?.visual || []).length) {
    return st.align === "center" ? "center" : "left";
  }
  return "left";
}
