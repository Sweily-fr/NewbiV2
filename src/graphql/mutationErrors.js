/**
 * Avec `errorPolicy: "all"` (défaut des mutations dans apolloClient.js), une
 * mutation refusée par l'API ne rejette pas : elle résout avec `errors` et
 * `data` à null. Sans relance, l'éditeur recevait `undefined` et s'arrêtait
 * sans rien afficher (« rien ne se passe » à l'enregistrement).
 *
 * L'erreur relancée garde `graphQLErrors` pour que getErrorMessage retrouve le
 * code (VALIDATION_ERROR…) et affiche le message rédigé par l'API.
 */
export function throwIfMutationErrors(result) {
  if (!result?.errors?.length) return;
  const [firstError] = result.errors;
  const error = new Error(firstError.message);
  error.graphQLErrors = result.errors;
  error.validationDetails = firstError.extensions?.details || null;
  throw error;
}
