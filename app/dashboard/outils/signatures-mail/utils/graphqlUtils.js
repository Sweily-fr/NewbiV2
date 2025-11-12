/**
 * Utilitaires pour GraphQL
 * Nettoyage et transformation des données GraphQL
 */

/**
 * Nettoie les champs __typename des objets GraphQL
 * @param {*} obj - Objet à nettoyer
 * @returns {*} - Objet nettoyé
 */
export const cleanGraphQLData = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanGraphQLData);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== "__typename") {
      cleaned[key] = cleanGraphQLData(value);
    }
  }
  return cleaned;
};
