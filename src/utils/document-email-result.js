/**
 * Résultat de l'envoi d'un document par e-mail (factures, devis, avoirs,
 * bons de commande et de livraison : SendDocumentModal).
 */
import { throwIfMutationErrors } from "@/src/graphql/mutationErrors";
import { getErrorMessage } from "@/src/utils/errorMessages";

/**
 * Vérifie la réponse d'un envoi : les mutations sont en errorPolicy « all »
 * (une erreur ne lève rien) et l'API peut répondre success: false. Un envoi
 * en échec était annoncé « envoyé avec succès ».
 */
export function assertDocumentEmailSent(result) {
  throwIfMutationErrors(result);
  const response = result?.data ? Object.values(result.data)[0] : null;
  if (!response?.success) {
    throw new Error("L'e-mail n'a pas pu être envoyé.");
  }
}

/**
 * Message d'un envoi en échec : celui de l'API quand c'est un refus rédigé
 * pour l'utilisateur, sinon un message clair (jamais le détail technique).
 */
export function documentEmailErrorMessage(error) {
  const code = error?.graphQLErrors?.[0]?.extensions?.code;
  if (["VALIDATION_ERROR", "RESOURCE_LOCKED"].includes(code)) {
    return getErrorMessage(error, "email");
  }
  return "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants.";
}
