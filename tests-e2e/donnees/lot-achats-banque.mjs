/**
 * Données du lot « achats-banque » (catalogue, factures d'achat, transactions, prévision).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e0a à e2e0f, e2eca à e2ecf).
 */

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesAchatsBanque() {
  return {};
}
