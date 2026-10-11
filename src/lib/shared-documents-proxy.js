import {
  apiError,
  requireOrgMembership,
  requireSession,
} from "@/src/lib/security";

const OBJECT_ID = /^[0-9a-f]{24}$/;

/** Identifiant MongoDB sous forme de chaîne (jamais un objet). */
export function isObjectIdString(value) {
  return typeof value === "string" && OBJECT_ID.test(value);
}

/** Liste facultative d'identifiants : absente, ou tableau de chaînes ObjectId. */
export function isObjectIdList(value, max = 1000) {
  if (value === undefined || value === null) return true;
  return (
    Array.isArray(value) &&
    value.length <= max &&
    value.every((id) => isObjectIdString(id))
  );
}

/**
 * Contrôles communs des routes proxy des documents partagés, avant tout
 * appel à l'API :
 *   - session obligatoire ;
 *   - `workspaceId` (et chaque id passé) en chaîne ObjectId : un objet
 *     (`{"$ne": ...}`) transmis tel quel à l'API y devenait un opérateur
 *     MongoDB et ouvrait les documents d'autres espaces ;
 *   - membre de l'espace.
 *
 * @param {Request} request
 * @param {string} workspaceId
 * @param {string[]} [ids] - autres identifiants à valider (document, dossier)
 * @returns {Promise<{ cookieHeader: string }>}
 */
export async function requireSharedDocumentsAccess(
  request,
  workspaceId,
  ids = [],
) {
  const { user, cookieHeader } = await requireSession(request);

  if (
    !isObjectIdString(workspaceId) ||
    !ids.every((id) => isObjectIdString(id))
  ) {
    throw apiError(400, "Identifiant invalide");
  }

  await requireOrgMembership(user.id, workspaceId);
  return { cookieHeader };
}

/** URL de l'API backend (sans barre finale). */
export function backendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}
