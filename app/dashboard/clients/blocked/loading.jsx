import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page contacts bloqués.
// Reprend la même structure que la page réelle (header titre + sous-titre,
// recherche, tableau) avec les mêmes largeurs de colonnes que le skeleton
// interne de la page pour une transition invisible.
export default function BlockedLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header : titre + sous-titre */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        <Skeleton className="h-8 w-full sm:w-[300px] rounded-[9px]" />
      </div>

      {/* Tableau (mêmes largeurs de colonnes que le skeleton interne de la page) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="h-10 p-2 pl-4 sm:pl-6 text-left align-middle w-[40px]">
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th className="h-10 p-2 text-left align-middle w-[28%]">
                  <Skeleton className="h-3 w-14" />
                </th>
                <th className="h-10 p-2 text-left align-middle w-[25%]">
                  <Skeleton className="h-3 w-10" />
                </th>
                <th className="h-10 p-2 text-left align-middle w-[18%]">
                  <Skeleton className="h-3 w-16" />
                </th>
                <th className="h-10 p-2 text-left align-middle w-[14%]">
                  <Skeleton className="h-3 w-12" />
                </th>
                <th className="h-10 p-2 pr-4 sm:pr-6 text-right align-middle w-[10%]"></th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 pl-4 sm:pl-6 w-[40px]">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="p-2 w-[28%]">
                    <Skeleton className="h-4 w-[150px] rounded" />
                  </td>
                  <td className="p-2 w-[25%]">
                    <Skeleton className="h-4 w-[180px] rounded" />
                  </td>
                  <td className="p-2 w-[18%]">
                    <Skeleton className="h-4 w-[100px] rounded" />
                  </td>
                  <td className="p-2 w-[14%]">
                    <Skeleton className="h-4 w-[80px] rounded" />
                  </td>
                  <td className="p-2 pr-4 sm:pr-6 w-[10%]">
                    <Skeleton className="h-4 w-[60px] rounded ml-auto" />
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
