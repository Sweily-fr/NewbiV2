import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Composant skeleton pour une tâche en cours de chargement
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-2 sm:p-3 mb-2 sm:mb-3 shadow-xs min-h-[148px] flex flex-col gap-2">
      {/* En-tête avec titre et icônes */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <Skeleton className="h-3.5 w-3.5 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>

      {/* Tags */}
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Pied de carte */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex gap-1">
          <Skeleton className="h-3.5 w-3.5 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}
