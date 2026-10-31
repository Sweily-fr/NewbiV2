/**
 * Parcours d'une arborescence de dossiers par remontée des parents. Chaque
 * remontée s'arrête sur un identifiant déjà vu : un cycle parent/enfant
 * dans les données ne fait jamais boucler le navigateur.
 */

/**
 * Liste des identifiants rencontrés en remontant depuis `startId` (inclus).
 * @param {string|null} startId
 * @param {(id: string) => (string|null|undefined)} getParentId
 * @returns {string[]}
 */
export function ancestorIds(startId, getParentId) {
  const seen = new Set();
  let cur = startId;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    cur = getParentId(cur) || null;
  }
  return [...seen];
}

/**
 * Vrai si `targetId` est `startId` ou l'un de ses ancêtres : déposer le
 * dossier `targetId` sous `startId` créerait un cycle.
 * @param {Array<{ id: string, parentId?: string|null }>} folders
 * @param {string|null} startId - dossier de destination
 * @param {string} targetId - dossier déplacé
 * @returns {boolean}
 */
export function isFolderInAncestry(folders, startId, targetId) {
  if (!startId || !targetId) return false;
  const byId = new Map((folders || []).map((f) => [f.id, f]));
  return ancestorIds(startId, (id) => byId.get(id)?.parentId).includes(
    targetId,
  );
}
