import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_CLIENT_DOCUMENT_FIELDS } from "../graphql/queries/clientCustomFields";
import { useWorkspace } from "./useWorkspace";

/**
 * Aperçu en direct des champs personnalisés du client « Afficher sur mes
 * documents » dans les éditeurs de documents.
 *
 * Un document enregistré porte déjà ses champs (client.documentFields). Mais
 * quand l'utilisateur change de client ou modifie sa fiche pendant l'édition,
 * l'aperçu doit suivre : on interroge l'API, qui reste la seule à savoir
 * mettre les valeurs en forme (dates, choix, cases à cocher).
 *
 * @param {object|null} data - données d'aperçu du document (avec data.client)
 * @param {boolean} enabled - false pour un document finalisé : son instantané
 *   enregistré fait foi et ne doit plus suivre la fiche client
 * @returns {object|null} data, avec client.documentFields à jour quand c'est utile
 */
export function useWithClientDocumentFields(data, enabled = true) {
  const { workspaceId } = useWorkspace();
  const clientId = enabled ? data?.client?.id : null;

  const { data: result } = useQuery(GET_CLIENT_DOCUMENT_FIELDS, {
    variables: { workspaceId, clientId },
    skip: !workspaceId || !clientId,
    fetchPolicy: "cache-and-network",
  });
  const liveFields = clientId ? result?.clientDocumentFields : null;

  return useMemo(() => {
    if (!liveFields || !data?.client) return data;
    return {
      ...data,
      client: {
        ...data.client,
        documentFields: liveFields.map(({ label, value }) => ({
          label,
          value,
        })),
      },
    };
  }, [data, liveFields]);
}
