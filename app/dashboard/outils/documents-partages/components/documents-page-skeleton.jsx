import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de l'arborescence (sidebar). Reprend exactement les dimensions de
// l'état de chargement interne de la page (lignes h-7) pour que la transition
// loading.jsx → page → chargement des données soit invisible.
export function DocumentsTreeSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}

// Skeleton de la liste de documents (zone de droite). Mêmes dimensions que
// l'état de chargement interne de la page (cartes h-14 arrondies).
export function DocumentsListSkeleton() {
  return (
    <div className="space-y-2 p-2 sm:p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// Skeleton de la page complète (header + sidebar explorateur + toolbar +
// liste). Reprend la même structure que la page réelle pour que la transition
// loading.jsx → page → chargement des données soit invisible.
export function DocumentsPageSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-7 sm:h-8 w-[180px] sm:w-[260px]" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-[60px] sm:w-[110px] rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar explorateur (desktop uniquement, drawer sur mobile) */}
        <div className="hidden md:flex w-64 border-r bg-muted/20 flex-shrink-0 flex-col overflow-hidden min-h-0">
          <div className="px-3 h-14 border-b flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <div className="flex-1 overflow-hidden pt-2">
            <DocumentsTreeSkeleton />
          </div>
          {/* Bouton corbeille */}
          <div className="px-2 py-2 border-t">
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>

        {/* Zone de contenu */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Toolbar : breadcrumb à gauche, recherche et actions à droite */}
          <div className="flex-shrink-0 px-2 sm:px-4 min-h-12 sm:min-h-14 border-b bg-background flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="hidden sm:block h-8 w-32 md:w-48 rounded-md" />
              <Skeleton className="h-8 w-[70px] rounded-md" />
              <Skeleton className="h-8 w-[84px] rounded-md" />
            </div>
          </div>

          {/* Liste des documents */}
          <div className="flex-1 overflow-hidden">
            <DocumentsListSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
