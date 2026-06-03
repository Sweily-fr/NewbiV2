/**
 * Règles de suppression des contacts (clients).
 *
 * Un contact lié à des documents (factures, devis ou bons de commande) ne peut
 * pas être supprimé : la suppression est bloquée côté backend
 * (erreur RESOURCE_IN_USE) et doit l'être côté frontend pour éviter d'afficher
 * une erreur à l'utilisateur sur une action qui n'aurait pas dû être proposée.
 *
 * Le champ `hasDocuments` (booléen) est exposé sur le type Client par l'API.
 */

/**
 * Partitionne une sélection de contacts en deux groupes : ceux qui peuvent être
 * supprimés et ceux qui sont bloqués car liés à des documents.
 *
 * @param {Array<string>} selectedIds - Identifiants des contacts sélectionnés.
 * @param {Map<string, object>|object} clientsById - Lookup id -> contact
 *   (Map ou objet simple). Chaque contact doit exposer `hasDocuments`.
 * @returns {{ deletableIds: string[], blockedIds: string[], blockedNames: string[] }}
 */
export function partitionDeletableClients(selectedIds, clientsById) {
  const getClient = (id) =>
    clientsById instanceof Map ? clientsById.get(id) : clientsById?.[id];

  const deletableIds = [];
  const blockedIds = [];
  const blockedNames = [];

  for (const id of selectedIds) {
    const client = getClient(id);
    if (client?.hasDocuments) {
      blockedIds.push(id);
      if (client.name) blockedNames.push(client.name);
    } else {
      deletableIds.push(id);
    }
  }

  return { deletableIds, blockedIds, blockedNames };
}

/**
 * Construit un message d'erreur clair pour les contacts qui n'ont pas pu être
 * supprimés car ils sont liés à des documents.
 *
 * @param {string[]} blockedNames - Noms des contacts bloqués.
 * @returns {string}
 */
export function buildBlockedDeletionMessage(blockedNames) {
  const count = blockedNames.length;
  if (count === 0) return "";

  if (count === 1) {
    return `${blockedNames[0]} ne peut pas être supprimé car il est lié à des factures, devis ou bons de commande.`;
  }

  return `${count} contacts ne peuvent pas être supprimés car ils sont liés à des factures, devis ou bons de commande.`;
}
