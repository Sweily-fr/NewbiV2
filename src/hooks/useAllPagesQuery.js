"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";

/** Première page : la liste s'affiche aussitôt, le reste suit. */
export const FIRST_PAGE_SIZE = 50;

/**
 * Taille maximale d'une page servie par l'API (plafond des listes). Au-delà,
 * la liste complète est relue par pages de cette taille.
 */
export const MAX_PAGE_SIZE = 1000;

/** Requêtes complètes restées incomplètes avant d'abandonner (pas de boucle). */
const MAX_INCOMPLETE_FETCHES = 2;

/**
 * Listes de documents (factures, devis, bons, avoirs) : l'API les renvoie
 * par pages, mais le site compte, filtre, cherche, trie et exporte sur la
 * liste chargée. La première page s'affiche aussitôt ; quand le total en
 * annonce davantage, la liste entière est relue d'une requête (limite =
 * total, ou par pages de 1 000 au-delà : plafond de l'API) et remplace la
 * première page. Sans cela, onglets, recherche,
 * exports et chiffres de l'accueil s'arrêtaient aux 50 documents créés en
 * dernier.
 *
 * Après un rafraîchissement (refetch, refetchQueries), la première page
 * revient seule : la liste complète est relue de la même façon.
 *
 * @param {import("@apollo/client").DocumentNode} query - requête paginée
 *   (arguments page et limit, champ totalCount)
 * @param {Object} options - options de useQuery, variables sans page ni limit
 * @param {Object} list
 * @param {string} list.field - champ de la réponse (« invoices »)
 * @param {string} list.listField - liste dans ce champ (« invoices »)
 * @param {number} [list.firstPageSize] - taille de la première page
 * @param {boolean} [list.allPages=true] - false : la première page seule
 */
export function useAllPagesQuery(
  query,
  { variables, ...options },
  { field, listField, firstPageSize = FIRST_PAGE_SIZE, allPages = true },
) {
  const result = useQuery(query, {
    ...options,
    variables: { ...variables, page: 1, limit: firstPageSize },
  });
  const { data, fetchMore } = result;
  const list = data?.[field]?.[listField];
  const loaded = list?.length ?? 0;
  const total = data?.[field]?.totalCount ?? 0;
  const fullFetch = useRef({ inFlight: false, incomplete: 0 });

  useEffect(() => {
    if (!allPages || options.skip || !list) return;
    const state = fullFetch.current;
    if (loaded >= total) {
      state.incomplete = 0;
      return;
    }
    if (state.inFlight || state.incomplete >= MAX_INCOMPLETE_FETCHES) return;
    state.inFlight = true;
    const pageSize = Math.min(total, MAX_PAGE_SIZE);
    const pageCount = Math.ceil(total / pageSize);
    const loadPages = async () => {
      let loadedCount = 0;
      let expected = total;
      for (let page = 1; page <= pageCount; page++) {
        const { data: chunk } = await fetchMore({
          variables: { page, limit: pageSize },
          // Page 1 : remplace la première page ; suivantes : ajoutées
          updateQuery: (previous, { fetchMoreResult }) => {
            const next = fetchMoreResult?.[field];
            if (!next) return previous;
            if (page === 1) return fetchMoreResult;
            const seen = new Set(
              (previous?.[field]?.[listField] || []).map((item) => item?.id),
            );
            return {
              ...fetchMoreResult,
              [field]: {
                ...next,
                [listField]: [
                  ...(previous?.[field]?.[listField] || []),
                  ...(next[listField] || []).filter(
                    (item) => !seen.has(item?.id),
                  ),
                ],
              },
            };
          },
        });
        const received = chunk?.[field]?.[listField]?.length ?? 0;
        loadedCount += received;
        expected = chunk?.[field]?.totalCount ?? expected;
        if (received < pageSize) break;
      }
      if (loadedCount < expected) state.incomplete += 1;
    };
    loadPages()
      .catch(() => {
        state.incomplete += 1;
      })
      .finally(() => {
        state.inFlight = false;
      });
  }, [
    allPages,
    options.skip,
    list,
    loaded,
    total,
    fetchMore,
    field,
    listField,
  ]);

  return result;
}
