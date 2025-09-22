import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/src/components/ui/card";

export function KanbanSkeleton() {
  return (
    <div className="w-full max-w-[100vw] mx-auto p-4 sm:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar Skeleton */}
          <div className="relative flex-1 sm:flex-none">
            <Skeleton className="h-10 w-full sm:w-64" />
          </div>
          {/* Button Skeleton */}
          <Skeleton className="h-10 w-full sm:w-auto sm:w-36" />
        </div>
      </div>

      {/* Boards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Responsive grid: Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 3 colonnes */}
        {Array.from({ length: 6 }).map((_, index) => (
          <KanbanBoardCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function KanbanBoardCardSkeleton() {
  return (
    <Card className="min-h-42 hover:shadow-lg transition-all duration-200 cursor-pointer group relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-3/4 mb-2" />
            {/* Description Skeleton - 2 lignes avec largeurs variables */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          {/* Action buttons skeleton - cachés par défaut comme dans le vrai composant */}
          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs">
          {/* Date skeleton avec icône */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded-sm" />
            <Skeleton className="h-3 w-24" />
          </div>
          {/* Badge skeleton */}
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  );
}

// Skeleton compact pour mobile
export function KanbanSkeletonMobile() {
  return (
    <div className="w-full max-w-[100vw] mx-auto p-4">
      {/* Header Skeleton - Version mobile compacte */}
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>

        <div className="flex flex-col gap-3">
          {/* Search bar mobile */}
          <Skeleton className="h-9 w-full" />
          {/* Button mobile */}
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Boards Grid Skeleton - Version mobile (1 colonne) */}
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="min-h-32 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  {/* Description plus courte sur mobile */}
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-0 pb-3">
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour la grille seulement (sans header)
export function KanbanGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Responsive grid: Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 3 colonnes */}
      {Array.from({ length: 6 }).map((_, index) => (
        <KanbanBoardCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Skeleton mobile pour la grille seulement
export function KanbanGridSkeletonMobile() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="min-h-32 hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                {/* Description plus courte sur mobile */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardFooter className="pt-0 pb-3">
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Skeleton adaptatif qui change selon la taille d'écran
export function KanbanSkeletonAdaptive() {
  return (
    <div className="animate-pulse">
      {/* Version desktop/tablet */}
      <div className="hidden sm:block">
        <KanbanGridSkeleton />
      </div>
      
      {/* Version mobile */}
      <div className="block sm:hidden">
        <KanbanGridSkeletonMobile />
      </div>
    </div>
  );
}

// Skeleton complet avec header (pour usage standalone)
export function KanbanSkeletonComplete() {
  return (
    <div className="animate-pulse">
      {/* Version desktop/tablet */}
      <div className="hidden sm:block">
        <KanbanSkeleton />
      </div>
      
      {/* Version mobile */}
      <div className="block sm:hidden">
        <KanbanSkeletonMobile />
      </div>
    </div>
  );
}

// Export par défaut pour faciliter l'import
export default KanbanSkeletonAdaptive;
