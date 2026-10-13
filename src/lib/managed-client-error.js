/** Erreur métier des comptes gestionnaires, avec son statut HTTP. */
export class ManagedClientError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
