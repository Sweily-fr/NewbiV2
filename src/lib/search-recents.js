/**
 * « Récents » de la recherche globale (Ctrl+K), gardés dans le navigateur.
 * Une liste par espace : un autre espace (ou un autre compte qui se connecte
 * dans le même navigateur) ne voit jamais les clients et numéros de
 * documents ouverts ailleurs. Effacés à la déconnexion (clearSessionStorage).
 */
export const RECENTS_KEY_PREFIX = "newbi-search-recents";
const MAX_RECENTS = 5;

const keyFor = (workspaceId) => `${RECENTS_KEY_PREFIX}:${workspaceId}`;

export function getRecents(workspaceId) {
  if (!workspaceId) return [];
  try {
    const recents = JSON.parse(
      localStorage.getItem(keyFor(workspaceId)) || "[]",
    );
    return Array.isArray(recents) ? recents : [];
  } catch {
    return [];
  }
}

export function addRecent(workspaceId, item) {
  if (!workspaceId) return;
  try {
    const recents = getRecents(workspaceId).filter((r) => r.id !== item.id);
    recents.unshift(item);
    localStorage.setItem(
      keyFor(workspaceId),
      JSON.stringify(recents.slice(0, MAX_RECENTS)),
    );
  } catch {}
}

/** Toutes les listes (tous espaces, et l'ancienne liste commune). */
export function clearAllRecents() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (
        key === RECENTS_KEY_PREFIX ||
        key.startsWith(`${RECENTS_KEY_PREFIX}:`)
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}
