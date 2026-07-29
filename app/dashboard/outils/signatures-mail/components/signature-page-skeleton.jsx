import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton du tableau des signatures. Reprend exactement la structure et les
// dimensions de l'état de chargement interne de signature-table.jsx (dernier
// skeleton affiché avant les données) pour que la transition soit invisible.
export function SignatureTableSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Barre de recherche */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-shrink-0">
        <Skeleton className="h-9 w-[400px]" />
      </div>

      {/* Tableau */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* En-tête du tableau */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 py-3">
          <div className="flex items-center gap-4 px-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[160px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        </div>

        {/* Lignes du tableau */}
        <div className="flex-1 overflow-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-4 px-4 border-b border-gray-100 dark:border-gray-800"
            >
              <Skeleton className="h-4 w-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-[200px] mb-2" />
                <Skeleton className="h-3 w-[140px]" />
              </div>
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
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
  );
}

// Skeleton de la page complète (header + tableau). Reprend la même structure
// que la page réelle pour que la transition loading.jsx -> guard -> page ->
// chargement des données soit invisible. Partagé entre loading.jsx et le
// loadingComponent du RoleRouteGuard.
export function SignaturePageSkeleton() {
  return (
    <>
      {/* Mobile : la page réelle affiche une carte "Desktop uniquement" centrée */}
      <div className="block lg:hidden">
        <div className="min-h-screen flex items-center justify-center p-6">
          <Skeleton className="w-full max-w-md h-[320px] rounded-xl" />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <Skeleton className="h-8 w-[180px] mb-2" />
          <Skeleton className="h-9 w-[190px] rounded-md" />
        </div>

        {/* Tableau */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <SignatureTableSkeleton />
        </div>
      </div>
    </>
  );
}
