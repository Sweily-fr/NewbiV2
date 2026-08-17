import { Skeleton } from "@/src/components/ui/skeleton";

// Reprend la même structure que la page réelle (header + toolbar + tableau,
// mêmes dimensions que les lignes skeleton de table.jsx) pour que la
// transition loading.jsx → page → chargement des données soit invisible.
export function ClientsPageSkeleton() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <Skeleton className="h-8 w-[240px]" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-[100px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
            <Skeleton className="h-9 w-[150px] rounded-md" />
          </div>
        </div>

        {/* Recherche + filtres */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[300px] rounded-[9px]" />
            <Skeleton className="h-8 w-[90px] rounded-md" />
          </div>
        </div>

        {/* Tableau */}
        <TableSkeleton rows={10} />
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="px-4 py-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <Skeleton className="h-8 w-[140px]" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    </>
  );
}

// Exporté pour être réutilisé par les vues qui affichent le même tableau
// de contacts (ex : contacts d'une liste dans list-clients-view.jsx).
export function TableSkeleton({ rows }) {
  return (
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
            <th style={{ width: 200 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-16" />
            </th>
            <th style={{ width: 220 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-12" />
            </th>
            <th style={{ width: 120 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-10" />
            </th>
            <th style={{ width: 100 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-14" />
            </th>
            <th style={{ width: 150 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-16" />
            </th>
            <th style={{ width: 140 }} className="h-10 p-2 text-left">
              <Skeleton className="h-3 w-14" />
            </th>
            <th style={{ width: 60 }} className="h-10 p-2 pr-4 sm:pr-6" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={`skeleton-${index}`} className="border-b">
              <td style={{ width: 28 }} className="p-2 pl-4 sm:pl-6">
                <Skeleton className="h-4 w-4 rounded" />
              </td>
              <td style={{ width: 200 }} className="p-2">
                <Skeleton className="h-4 w-32" />
              </td>
              <td style={{ width: 220 }} className="p-2">
                <Skeleton className="h-4 w-40" />
              </td>
              <td style={{ width: 120 }} className="p-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
              <td style={{ width: 100 }} className="p-2">
                <Skeleton className="h-5 w-12 rounded-full" />
              </td>
              <td style={{ width: 150 }} className="p-2">
                <Skeleton className="h-3 w-24" />
              </td>
              <td style={{ width: 140 }} className="p-2">
                <Skeleton className="h-4 w-28" />
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
  );
}
