import { Skeleton } from "@/src/components/ui/skeleton";

// Reprend la même structure que la page réelle (header + toolbar + tableau +
// pagination, mêmes largeurs de colonnes que TableProduct) pour que la
// transition loading.jsx → page → chargement des données soit invisible.
export function CataloguesPageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header : titre + boutons Champs / Importer / Exporter / Ajouter */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <Skeleton className="h-8 w-[240px]" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[100px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[170px] rounded-md" />
          </div>
        </div>

        {/* Toolbar + tableau + pagination */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <CataloguesTableSkeleton />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header mobile : titre + sous-titre */}
        <div className="px-4 py-6 flex-shrink-0">
          <Skeleton className="h-8 w-[140px] mb-2" />
          <Skeleton className="h-4 w-[190px]" />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <CataloguesTableSkeleton />
        </div>

        {/* Bouton flottant mobile */}
        <Skeleton className="fixed bottom-6 right-6 h-14 w-14 rounded-full z-50" />
      </div>
    </>
  );
}

// Skeleton du tableau de produits : même rendu que TableProduct pendant le
// chargement Apollo (toolbar, en-têtes, lignes, pagination). Contient ses
// propres variantes desktop/mobile, comme TableProduct.
export function CataloguesTableSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col h-full overflow-hidden">
        {/* Recherche + filtres */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-full sm:w-[400px] rounded-[9px]" />
            <Skeleton className="h-8 w-[90px] rounded-md" />
          </div>
        </div>

        {/* Tableau */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full table-fixed">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th
                  style={{ width: 40 }}
                  className="h-10 p-2 pl-4 sm:pl-6 text-left"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th style={{ width: 200 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-24" />
                </th>
                <th style={{ width: 120 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th style={{ width: 130 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
                <th style={{ width: 100 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-14" />
                </th>
                <th style={{ width: 80 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-10" />
                </th>
                <th style={{ width: 120 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th style={{ width: 200 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
                <th style={{ width: 60 }} className="h-10 p-2 pr-4 sm:pr-6" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b">
                  <td style={{ width: 40 }} className="p-2 pl-4 sm:pl-6">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td style={{ width: 200 }} className="p-2">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td style={{ width: 120 }} className="p-2">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td style={{ width: 130 }} className="p-2">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td style={{ width: 100 }} className="p-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </td>
                  <td style={{ width: 80 }} className="p-2">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td style={{ width: 120 }} className="p-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td style={{ width: 200 }} className="p-2">
                    <Skeleton className="h-4 w-40" />
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 bg-background flex-shrink-0">
          <Skeleton className="h-4 w-[150px]" />
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-7 w-[70px]" />
            </div>
            <Skeleton className="h-4 w-[80px]" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {/* Toolbar mobile : recherche + boutons filtre/import/export */}
        <div className="px-3 sm:px-4 py-3 border-b space-y-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex items-center gap-2 pb-1">
            <Skeleton className="h-9 w-[70px] rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>

        {/* Tableau mobile : colonnes select / nom / catégorie / actions */}
        <div className="overflow-x-auto pb-24">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-400">
                <th className="py-3 px-3 sm:px-4 text-left">
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th className="py-3 px-3 sm:px-4 text-left">
                  <Skeleton className="h-3 w-24" />
                </th>
                <th className="py-3 px-3 sm:px-4 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th className="py-3 px-3 sm:px-4 text-left" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, index) => (
                <tr
                  key={`skeleton-mobile-${index}`}
                  className="border-b border-gray-100 dark:border-gray-400"
                >
                  <td className="py-3 px-3 sm:px-4">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    <Skeleton className="h-8 w-8 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
