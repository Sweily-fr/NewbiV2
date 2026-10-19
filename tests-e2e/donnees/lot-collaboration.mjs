/**
 * Données du lot « collaboration » (kanban, calendrier, transferts, documents partagés, signatures).
 * Une donnée par action qui modifie : deux tests ne partagent jamais une donnée
 * qu'ils changent. Identifiants : oid(type, n) avec les types déclarés entre
 * les repères du lot dans base.mjs (préfixes e2e5a à e2e5f, e2e6a à e2e6f).
 */

/** Documents à écrire en base, par collection : { clients: [...], invoices: [...] }. */
export function donneesCollaboration() {
  return {};
}
