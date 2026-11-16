import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Squelette de la liste des campagnes (pur markup) : rendu par loading.jsx
 * et pendant le premier chargement de la page, transition invisible.
 */
export function CampagnesEmailPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Skeleton className="h-8 w-56 rounded-[9px]" />
          <Skeleton className="h-8 w-44 rounded-[9px]" />
          <Skeleton className="h-8 w-40 rounded-[9px]" />
        </div>
      </div>
      <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-b px-4 pb-2 sm:px-6">
        <div className="flex gap-2">
          {[64, 88, 104, 76, 80].map((width) => (
            <Skeleton
              key={width}
              className="h-8 rounded-md"
              style={{ width }}
            />
          ))}
        </div>
        <Skeleton className="hidden h-8 w-64 rounded-[9px] md:block" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-10 items-center gap-6 border-b px-6 md:flex">
          {[220, 80, 90, 80, 60, 160].map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width }} />
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="flex items-center gap-6 border-b px-4 py-3.5 sm:px-6"
          >
            <div className="min-w-0 flex-1 space-y-2 md:max-w-[260px]">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-36 max-w-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-4 w-14 md:block" />
            <Skeleton className="hidden h-4 w-12 md:block" />
            <Skeleton className="hidden h-4 w-40 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
