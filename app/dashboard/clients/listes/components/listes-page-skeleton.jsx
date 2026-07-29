import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page listes (header titre + sous-titre + bouton, recherche,
// tableau des listes). Partagé entre loading.jsx, le fallback du ProRouteGuard
// et l'état de chargement interne de la page pour une transition invisible.
export function ListesPageSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header : titre + sous-titre + bouton "Nouvelle liste" */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
        <div>
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-9 w-[140px] rounded-md self-start" />
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        <Skeleton className="h-9 w-full sm:w-[300px] rounded-md" />
      </div>

      {/* Tableau des listes (mêmes colonnes que ClientListsView) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th
                  style={{ width: 40 }}
                  className="h-10 p-2 pl-4 sm:pl-6 text-left"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th style={{ width: 300 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-10" />
                </th>
                <th style={{ width: 300 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
                <th style={{ width: 150 }} className="h-10 p-2 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th
                  style={{ width: 100 }}
                  className="h-10 p-2 pr-4 sm:pr-6 text-left"
                >
                  <Skeleton className="h-3 w-14" />
                </th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="flex-1 overflow-hidden">
          <table className="w-full table-fixed">
            <tbody>
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b">
                  <td style={{ width: 40 }} className="p-2 pl-4 sm:pl-6">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td style={{ width: 300 }} className="p-2">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td style={{ width: 300 }} className="p-2">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td style={{ width: 150 }} className="p-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td style={{ width: 100 }} className="p-2 pr-4 sm:pr-6">
                    <Skeleton className="h-8 w-8 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
