import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page liste kanban.
// Reprend la même structure que la page réelle (header + KanbanTableSkeleton)
// pour que la transition vers le skeleton de la page soit invisible.
export default function KanbanLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
        <Skeleton className="h-8 w-[240px] mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[110px] rounded-md" />
          <Skeleton className="h-9 w-[130px] rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-4 sm:px-6 pt-1 flex-shrink-0">
        <Skeleton className="h-3 w-[80px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>

      {/* Barre de recherche + actions */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 flex-shrink-0">
        <Skeleton className="h-9 w-full sm:w-[300px] rounded-md" />
        <Skeleton className="h-8 w-[70px] rounded-md" />
      </div>

      {/* Tableau (même structure que KanbanTableSkeleton de la page) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 sm:px-6">
        <div className="flex-shrink-0 border-b border-border py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800"
            >
              <Skeleton className="h-4 w-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-[250px] mb-2" />
                <Skeleton className="h-3 w-[180px]" />
              </div>
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
