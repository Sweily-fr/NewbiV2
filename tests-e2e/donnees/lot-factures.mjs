/**
 * Données du lot « factures » (factures et avoirs).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e4a à e2e4f, e2eba à e2ebf).
 */

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesFactures() {
  return {};
}
