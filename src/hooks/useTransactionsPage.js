import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS_PAGE } from "@/src/graphql/queries/banking";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

// Délai de debounce de la recherche avant d'interroger le serveur
const SEARCH_DEBOUNCE_MS = 350;

// Onglets client → enum GraphQL TransactionListTab
const TAB_TO_ENUM = {
  all: "ALL",
  lastMonth: "LAST_MONTH",
  toReconcile: "TO_RECONCILE",
  missingReceipt: "MISSING_RECEIPT",
};

const EMPTY_TAB_COUNTS = {
  all: 0,
  lastMonth: 0,
  toReconcile: 0,
  missingReceipt: 0,
};

/**
 * Construit le TransactionPageFiltersInput à partir de la recherche, du compte
 * sélectionné et des filtres avancés du tableau. Seuls les filtres exprimables
 * côté serveur sont mappés (category, paymentMethod, source, amount "égal à",
 * plage de dates).
 */
function buildFilters({ search, accountId, advancedFilters }) {
  const filters = {};

  const trimmedSearch = (search || "").trim();
  if (trimmedSearch) filters.search = trimmedSearch;
  if (accountId) filters.accountId = accountId;

  (advancedFilters || []).forEach((filter) => {
    if (filter.field === "date") {
      if (filter.startDate) filters.startDate = filter.startDate;
      if (filter.endDate) filters.endDate = filter.endDate;
      return;
    }
    if (!filter.value) return;

    switch (filter.field) {
      case "category":
        filters.category = filter.value;
        break;
      case "paymentMethod":
        filters.paymentMethod = filter.value;
        break;
      case "source":
        if (filter.value === "MANUAL" || filter.value === "BANK") {
          filters.source = filter.value;
        }
        break;
      case "amount": {
        const value = parseFloat(String(filter.value).replace(",", "."));
        if (!Number.isNaN(value)) {
          filters.minAmount = value;
          filters.maxAmount = value;
        }
        break;
      }
      default:
        break;
    }
  });

  return filters;
}

/**
 * Hook de pagination serveur pour la page Transactions.
 *
 * @param {Object} options
 * @param {string} options.tab - Onglet actif ("all" | "lastMonth" | "toReconcile" | "missingReceipt")
 * @param {string} options.search - Terme de recherche (debouncé en interne, 350 ms)
 * @param {string|null} options.accountId - externalId du compte bancaire sélectionné
 * @param {Array} options.advancedFilters - Filtres avancés du tableau
 * @param {number} options.page - Page serveur (1-based)
 * @param {number} options.pageSize - Taille de page (plafonnée à 100 côté serveur)
 */
export function useTransactionsPage({
  tab = "all",
  search = "",
  accountId = null,
  advancedFilters = [],
  page = 1,
  pageSize = 20,
} = {}) {
  const { workspaceId } = useRequiredWorkspace();
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const filters = useMemo(
    () => buildFilters({ search: debouncedSearch, accountId, advancedFilters }),
    [debouncedSearch, accountId, advancedFilters],
  );

  const { data, previousData, loading, refetch } = useQuery(
    GET_TRANSACTIONS_PAGE,
    {
      variables: {
        workspaceId,
        filters,
        tab: TAB_TO_ENUM[tab] || "ALL",
        page,
        limit: pageSize,
      },
      fetchPolicy: "cache-and-network",
      skip: !workspaceId,
    },
  );

  const current = data?.transactionsPage;
  // Les compteurs/total gardent la valeur précédente pendant un chargement
  // (changement de page/onglet) pour éviter les flashs à 0.
  const stable = current ?? previousData?.transactionsPage;

  return {
    items: current?.items || [],
    totalCount: stable?.totalCount ?? 0,
    hasNextPage: stable?.hasNextPage ?? false,
    tabCounts: stable?.tabCounts ?? EMPTY_TAB_COUNTS,
    loading: loading && !current,
    refetch,
  };
}
