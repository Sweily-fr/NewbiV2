import { Skeleton } from "@/src/components/ui/skeleton";

// Reprend la même structure que la page réelle (header + KPIs + recherche +
// onglets + tableau + pagination) pour que la transition loading.jsx →
// ProRouteGuard → chargement des données soit invisible : un seul et même
// skeleton est affiché du début à la fin.
export function InvoicePageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <Skeleton className="h-8 w-[240px]" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[160px] rounded-md" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Stats cards */}
            <div className="flex gap-3 px-4 sm:px-6 py-3 flex-shrink-0">
              {/* CA facturé + CA payé */}
              <div className="bg-background border rounded-lg px-4 py-3 flex items-center">
                <div className="pr-4">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="w-px h-10 bg-border mx-4" />
                <div>
                  <Skeleton className="h-3 w-14 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              {/* Factures en retard */}
              <div className="bg-background border rounded-lg px-4 py-3">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Recherche + onglets + tableau + pagination */}
            <InvoiceTableSkeleton />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <Skeleton className="h-8 w-[140px]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-8 w-10 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        {/* Recherche + onglets + tableau */}
        <InvoiceTableSkeleton />
      </div>
    </>
  );
}

// Partie tableau du skeleton (recherche + onglets + en-têtes + lignes +
// pagination). Réutilisée telle quelle par les fallbacks Suspense de la page
// et par InvoiceTable pendant le chargement des données : les dimensions sont
// identiques partout, donc aucun saut visuel entre les loaders successifs.
export function InvoiceTableSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Recherche + filtres */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 flex-shrink-0">
        <Skeleton className="h-8 flex-1 sm:flex-none sm:w-[400px] rounded-[9px]" />
        <Skeleton className="h-8 w-[90px] rounded-md" />
      </div>

      {/* Onglets de filtre rapide */}
      <div className="border-b border-border px-4 sm:px-6 pb-2 flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-[150px] rounded-md" />
          <Skeleton className="h-7 w-[110px] rounded-md" />
          <Skeleton className="h-7 w-[110px] rounded-md" />
          <Skeleton className="h-7 w-[100px] rounded-md" />
          <Skeleton className="h-7 w-[100px] rounded-md" />
          <Skeleton className="h-7 w-[80px] rounded-md" />
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th
                style={{ width: 28 }}
                className="h-10 p-2 pl-4 sm:pl-6 text-left"
              >
                <Skeleton className="h-4 w-4 rounded" />
              </th>
              <th style={{ width: 150 }} className="h-10 p-2 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
              <th style={{ width: 200 }} className="h-10 p-2 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
              <th style={{ width: 100 }} className="h-10 p-2 text-left">
                <Skeleton className="h-3 w-12" />
              </th>
              <th style={{ width: 80 }} className="h-10 p-2 text-left">
                <Skeleton className="h-3 w-14" />
              </th>
              <th style={{ width: 120 }} className="h-10 p-2 text-left">
                <Skeleton className="h-3 w-16" />
              </th>
              <th style={{ width: 60 }} className="h-10 p-2 pr-4 sm:pr-6" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b">
                <td style={{ width: 28 }} className="p-2 pl-4 sm:pl-6">
                  <Skeleton className="h-4 w-4 rounded" />
                </td>
                <td style={{ width: 150 }} className="p-2">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td style={{ width: 200 }} className="p-2">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td style={{ width: 100 }} className="p-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td style={{ width: 80 }} className="p-2">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td style={{ width: 120 }} className="p-2">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td style={{ width: 60 }} className="p-2 pr-4 sm:pr-6">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (desktop uniquement, comme la vraie) */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-2 border-t border-border bg-background flex-shrink-0">
        <Skeleton className="h-3 w-44" />
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-[70px] rounded-md" />
          </div>
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
