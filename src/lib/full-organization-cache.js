import { authClient } from "@/src/lib/auth-client";

// Cache partagé de getFullOrganization.
//
// useWorkspace est monté sur ~255 sites et usePermissions sur ~25 : chaque
// instance gardait son propre état et lançait son propre appel réseau quand
// l'organisation active n'a pas de champ members. Résultat : des dizaines
// d'appels /api/auth/organization/get-full-organization par chargement de
// page (une rafale à chaque navigation).
//
// Ce module garantit :
// - une seule promesse en vol par organisation (N montages simultanés = 1
//   appel réseau partagé) ;
// - un cache court : dans la fenêtre du TTL, aucun nouvel appel ;
// - une invalidation au changement d'utilisateur (appelée par useWorkspace).

const cache = new Map(); // orgId -> { org, fetchedAt }
const inflight = new Map(); // orgId -> Promise<org|null>
const CACHE_TTL = 60_000;

/**
 * Lecture synchrone du cache (fraîche ou périmée), sans appel réseau.
 * @returns {{ org: Object, isFresh: boolean } | null}
 */
export function peekFullOrganization(orgId) {
  if (!orgId) return null;
  const entry = cache.get(orgId);
  if (!entry) return null;
  return { org: entry.org, isFresh: Date.now() - entry.fetchedAt < CACHE_TTL };
}

/**
 * Récupère l'organisation complète (avec membres), dédupliquée et mise en
 * cache. Résout à null en cas d'erreur ou de réponse vide.
 * @returns {Promise<Object|null>}
 */
export function getFullOrganizationCached(orgId, { force = false } = {}) {
  if (!orgId) return Promise.resolve(null);

  const entry = cache.get(orgId);
  if (!force && entry && Date.now() - entry.fetchedAt < CACHE_TTL) {
    return Promise.resolve(entry.org);
  }
  if (!force && inflight.has(orgId)) {
    return inflight.get(orgId);
  }

  const promise = authClient.organization
    .getFullOrganization({ organizationId: orgId })
    .then(({ data }) => {
      if (data) {
        cache.set(orgId, { org: data, fetchedAt: Date.now() });
      }
      return data || null;
    })
    .catch((error) => {
      console.error("Error loading full organization:", error);
      return null;
    })
    .finally(() => {
      inflight.delete(orgId);
    });

  inflight.set(orgId, promise);
  return promise;
}

/**
 * Amorce le cache avec une organisation déjà complète (membres compris), par
 * exemple celle que Better Auth fournit déjà à useWorkspace. Sans ça, le cache
 * restait vide dans ce cas : usePermissions repartait en chargement à chaque
 * montage et les gardes de page (RBAC, rôle, boutons) retardaient l'affichage
 * de la page de deux cycles de rendu.
 */
export function primeFullOrganization(orgId, org) {
  if (!orgId || !org?.members) return;
  const entry = cache.get(orgId);
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL) return;
  cache.set(orgId, { org, fetchedAt: Date.now() });
}

/** Invalide une organisation (ou tout le cache sans argument). */
export function invalidateFullOrganizationCache(orgId) {
  if (orgId) {
    cache.delete(orgId);
  } else {
    cache.clear();
  }
}
