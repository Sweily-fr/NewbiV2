import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton fidèle de la page transactions (header + toolbar + tabs + tableau +
// pagination). Partagé entre loading.jsx, le fallback du ProRouteGuard et les
// fallbacks Suspense du tableau pour que la transition finale soit invisible.
// Les dimensions reprennent celles du skeleton interne de TransactionTable
// (dernier état affiché avant l'arrivée des données).
export function TransactionsPageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header : solde + oeil + sélecteur de compte + export */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[170px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
          </div>
        </div>
        <TransactionTableSkeleton />
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header : solde + oeil + sélecteur de compte */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <TransactionTableSkeleton />
      </div>
    </>
  );
}

// Toolbar + tabs + tableau + pagination : mêmes structures et dimensions que
// TransactionTable en état de chargement. Sert aussi de fallback Suspense
// dans page.jsx (le header y est déjà rendu par la page).
export function TransactionTableSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Desktop : toolbar + tabs + tableau + pagination */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-hidden">
        {/* Toolbar : recherche + colonnes visibles + filtres */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-4 flex-shrink-0">
          <Skeleton className="h-8 w-[300px] rounded-[9px]" />
          <Skeleton className="h-8 w-[150px] rounded-md" />
          <Skeleton className="h-8 w-[90px] rounded-md" />
        </div>

        {/* Tabs de filtre rapide */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-2 pb-[9px] border-b border-[#eeeff1] dark:border-[#232323] flex-shrink-0">
          <Skeleton className="h-8 w-[85px] rounded-md" />
          <Skeleton className="h-8 w-[190px] rounded-md" />
          <Skeleton className="h-8 w-[125px] rounded-md" />
          <Skeleton className="h-8 w-[180px] rounded-md" />
        </div>

        {/* En-tête du tableau : mêmes largeurs que les colonnes visibles par
            défaut de transactionColumns (paymentMethod masquée par défaut) */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th
                  style={{ width: 28 }}
                  className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th
                  style={{ width: 250 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-20" />
                </th>
                <th
                  style={{ width: 120 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-14" />
                </th>
                <th
                  style={{ width: 120 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-10" />
                </th>
                <th
                  style={{ width: 180 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
                <th
                  style={{ width: 80 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-12" />
                </th>
                <th
                  style={{ width: 90 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
                <th style={{ width: 60 }} className="h-10 p-2 pr-4 sm:pr-6" />
              </tr>
            </thead>
          </table>
        </div>

        {/* Corps : mêmes lignes que le skeleton interne de TransactionTable */}
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b">
                  <td className="p-2 pl-4 sm:pl-6">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-[140px] rounded" />
                    </div>
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-[70px] rounded" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-[70px] rounded" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-[60px] rounded" />
                    </div>
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-[60px] rounded" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-[50px] rounded" />
                  </td>
                  <td className="p-2">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="p-2 pr-4 sm:pr-6">
                    <Skeleton className="h-7 w-7 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination fixe en bas */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
          <Skeleton className="h-3 w-[180px]" />
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-[90px]" />
              <Skeleton className="h-7 w-[70px] rounded-md" />
            </div>
            <Skeleton className="h-3 w-[70px]" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile : toolbar + tabs + lignes du tableau */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Recherche + bouton filtre */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        {/* Tabs mobile */}
        <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
          <Skeleton className="h-8 w-[70px] rounded-md" />
          <Skeleton className="h-8 w-[110px] rounded-md" />
          <Skeleton className="h-8 w-[130px] rounded-md" />
        </div>

        {/* Lignes (mêmes hauteurs que SkeletonRows de MobileTable) */}
        <div className="flex-1 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-400 px-4 py-3">
            <Skeleton className="h-4 w-2/3" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-mobile-${i}`}
              className="flex items-center gap-4 border-b border-gray-50 dark:border-gray-800 px-4 py-3"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-[70px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
