// Client partagé pour /api/organization/list-with-order.
//
// TeamSwitcher (sidebar) et OrganizationSwitcherHeader (header) sont montés
// en permanence et faisaient chacun leur propre fetch au montage : 2 appels
// (et 6 requêtes Mongo côté API) pour la même donnée. Ce module déduplique
// les appels concurrents et sert un cache court entre deux montages.
//
// Les actions qui modifient la liste (réordonnancement, création, renommage)
// doivent passer force=true pour contourner le cache.

let inflight = null;
let cached = null;
let cachedAt = 0;
const CACHE_TTL = 30_000;

/**
 * @returns {Promise<{ok: boolean, status: number, organizations: Array}>}
 */
export function fetchOrganizationsWithOrder({ force = false } = {}) {
  if (!force && cached && Date.now() - cachedAt < CACHE_TTL) {
    return Promise.resolve(cached);
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = fetch("/api/organization/list-with-order")
    .then(async (response) => {
      const result = {
        ok: response.ok,
        status: response.status,
        organizations: [],
      };
      if (response.ok) {
        const data = await response.json();
        result.organizations = data.organizations || [];
        cached = result;
        cachedAt = Date.now();
      }
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateOrganizationsWithOrder() {
  cached = null;
  cachedAt = 0;
}
