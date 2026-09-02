/**
 * Dates de documents (factures, devis, bons de commande, importés) :
 * l'API renvoie tantôt une ISO string, tantôt un timestamp en millisecondes
 * sous forme de chaîne ("1712345678000"). `new Date("1712345678000")` donne
 * Invalid Date, ce qui casse les tris (NaN) et laisse les documents importés
 * en fin de liste. Ces helpers normalisent toutes les formes rencontrées.
 */

export function parseDocumentDate(value) {
  if (!value) return null;
  try {
    let d;
    if (typeof value === "string") {
      d = /^\d+$/.test(value) ? new Date(parseInt(value, 10)) : new Date(value);
    } else if (typeof value === "number") {
      d = new Date(value);
    } else if (value instanceof Date) {
      d = value;
    }
    if (!d || Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/** Timestamp (ms) ou 0 si la date est absente / invalide */
export function toTime(value) {
  const d = parseDocumentDate(value);
  return d ? d.getTime() : 0;
}

/**
 * Tri décroissant (plus récent en premier) sur la première date disponible
 * parmi `fields`, quel que soit le type de document (natif ou importé).
 */
export function sortByDateDesc(list, fields = ["issueDate", "createdAt"]) {
  const time = (doc) => {
    for (const f of fields) {
      const t = toTime(doc?.[f]);
      if (t) return t;
    }
    return 0;
  };
  return [...list].sort((a, b) => time(b) - time(a));
}

/**
 * sortingFn TanStack : dates absentes/invalides = epoch 0, donc en bas en
 * ordre décroissant, sans se battre avec l'inversion de direction.
 */
export const dateSortingFn = (rowA, rowB, columnId) =>
  toTime(rowA.getValue(columnId)) - toTime(rowB.getValue(columnId));
