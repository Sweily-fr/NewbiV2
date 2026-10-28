import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Squelette de la page Prise de rendez-vous (pur markup) : rendu par
 * loading.jsx et par l'état de chargement de la page, transition invisible.
 */
export function RendezVousPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="hidden gap-2 md:flex">
          <Skeleton className="h-8 w-64 rounded-[9px]" />
          <Skeleton className="h-8 w-28 rounded-[9px]" />
        </div>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 border-b px-4 pb-2 sm:px-6">
        {[96, 150, 110, 80].map((width) => (
          <Skeleton key={width} className="h-8 rounded-md" style={{ width }} />
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-4 sm:px-6">
        <div className="flex gap-2">
          {[72, 72, 80].map((width, i) => (
            <Skeleton key={i} className="h-7 rounded-full" style={{ width }} />
          ))}
        </div>
        <Skeleton className="mt-4 h-4 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border px-4 py-3"
          >
            <Skeleton className="h-10 w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="hidden h-4 w-28 md:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
