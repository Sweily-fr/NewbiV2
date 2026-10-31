/**
 * Statuts d'une demande de signature client encore en cours : le devis ne
 * se modifie plus (le client signe la version envoyée) tant qu'elle n'est
 * pas annulée.
 */
export const ACTIVE_SIGNATURE_STATUSES = [
  "PENDING",
  "WAIT_VALIDATION",
  "WAIT_SIGN",
  "WAIT_SIGNER",
];

export const isQuoteSignatureActive = (signatureStatus) =>
  ACTIVE_SIGNATURE_STATUSES.includes(signatureStatus);
