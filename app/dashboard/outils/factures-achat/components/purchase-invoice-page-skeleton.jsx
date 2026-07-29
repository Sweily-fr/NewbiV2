import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton fidèle de la page factures d'achat (header + KPIs + toolbar + tabs
// + tableau + pagination). Partagé entre loading.jsx, le fallback du
// ProRouteGuard et les fallbacks Suspense du tableau pour que la transition
// finale soit invisible. Les dimensions reprennent celles des skeletons
// internes de la page (dernier état affiché avant l'arrivée des données).
export function PurchaseInvoicePageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header : titre + actions */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <Skeleton className="h-8 w-[190px] mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[160px] rounded-md" />
          </div>
        </div>

        {/* Zone scrollable : KPIs + tableau */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col min-h-full">
            {/* Stats cards : mêmes dimensions que le skeleton statsLoading */}
            <div className="flex gap-3 px-4 sm:px-6 py-3">
              <Skeleton className="h-[60px] w-[200px] rounded-lg" />
              <Skeleton className="h-[60px] w-[200px] rounded-lg" />
              <Skeleton className="h-[60px] w-[200px] rounded-lg" />
              <Skeleton className="h-[60px] w-[200px] rounded-lg" />
            </div>

            <PurchaseInvoiceTableSkeleton />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header : titre + bouton d'ajout rond */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <Skeleton className="h-8 w-[170px] mb-2" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* Pas de stats mobile : la page réelle ne les affiche qu'une fois
            chargées, on garde donc la même hauteur pendant le chargement */}
        <PurchaseInvoiceTableSkeleton />
      </div>
    </>
  );
}

// Toolbar + tabs + tableau + pagination : mêmes structures et dimensions que
// PurchaseInvoiceTable en état de chargement. Sert aussi de fallback Suspense
// dans page.jsx (le header et les KPIs y sont déjà rendus par la page).
export function PurchaseInvoiceTableSkeleton() {
  return (
    <>
      {/* Desktop : toolbar + tabs + tableau + pagination */}
      <div className="hidden md:flex md:flex-col flex-1 min-h-0 min-w-0">
        {/* Toolbar : recherche + filtres + actions groupées */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[400px] rounded-[9px]" />
            <Skeleton className="h-8 w-[90px] rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[120px] rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        {/* Tabs de statut */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-2 pb-[9px] border-b border-[#eeeff1] dark:border-[#232323] flex-shrink-0">
          <Skeleton className="h-8 w-[80px] rounded-md" />
          <Skeleton className="h-8 w-[90px] rounded-md" />
          <Skeleton className="h-8 w-[100px] rounded-md" />
          <Skeleton className="h-8 w-[85px] rounded-md" />
        </div>

        {/* En-tête du tableau : mêmes largeurs que les colonnes visibles par
            défaut (invoiceNumber, amountHT et amountTVA masquées) */}
        <div className="flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323]">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th
                  style={{ width: 50 }}
                  className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th
                  style={{ width: 140 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-20" />
                </th>
                <th
                  style={{ width: 110 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
                <th
                  style={{ width: 100 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-14" />
                </th>
                <th
                  style={{ width: 100 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-14" />
                </th>
                <th
                  style={{ width: 130 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
                <th
                  style={{ width: 110 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-12" />
                </th>
                <th
                  style={{ width: 100 }}
                  className="h-10 p-2 text-left align-middle"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
                <th style={{ width: 50 }} className="h-10 p-2 pr-4 sm:pr-6" />
              </tr>
            </thead>
          </table>
        </div>

        {/* Corps : mêmes lignes que le skeleton interne du tableau */}
        <div className="flex flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex items-center border-b border-[#eeeff1] dark:border-[#232323] px-4 sm:px-6 py-3 gap-3"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 w-[140px] rounded" />
              <Skeleton className="h-4 w-[90px] rounded" />
              <Skeleton className="h-4 w-[70px] rounded" />
              <Skeleton className="h-4 w-[70px] rounded" />
              <Skeleton className="h-4 w-[70px] rounded" />
              <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
              <Skeleton className="h-5 w-[60px] rounded-full" />
            </div>
          ))}
        </div>

        {/* Pagination fixe en bas */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-[#eeeff1] dark:border-[#232323] bg-background flex-shrink-0 mt-auto">
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

      {/* Mobile : recherche + tabs + liste */}
      <div className="md:hidden flex-1 overflow-hidden flex flex-col">
        {/* Recherche */}
        <div className="px-4 pb-2 flex-shrink-0">
          <Skeleton className="h-9 w-full rounded-[9px]" />
        </div>

        {/* Tabs mobile (pills arrondies) */}
        <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
          <Skeleton className="h-7 w-[70px] rounded-full" />
          <Skeleton className="h-7 w-[80px] rounded-full" />
          <Skeleton className="h-7 w-[90px] rounded-full" />
          <Skeleton className="h-7 w-[75px] rounded-full" />
        </div>

        {/* Liste : mêmes lignes que le skeleton mobile interne du tableau */}
        <div className="flex-1 overflow-hidden px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-mobile-${i}`}
              className="flex items-center justify-between border-b border-[#eeeff1] dark:border-[#232323] py-3 gap-3"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-[120px] rounded" />
                <Skeleton className="h-3 w-[80px] rounded" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-[60px] rounded ml-auto" />
                <Skeleton className="h-4 w-[50px] rounded-full ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
