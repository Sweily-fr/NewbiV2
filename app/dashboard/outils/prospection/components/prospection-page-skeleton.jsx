import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Squelette de la page Prospection (pur markup) : rendu par loading.jsx et
 * pendant le premier chargement de la page, transition invisible.
 */
export function ProspectionPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-96 max-w-[80vw]" />
        </div>
        <Skeleton className="h-8 w-9 rounded-full sm:w-44 sm:rounded-[9px]" />
      </div>
      <div className="px-4 pt-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:p-5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-[9px]" />
        </div>
      </div>
      <div className="mt-5 flex shrink-0 gap-2 border-b px-4 pb-2 sm:px-6">
        {[64, 88, 80, 76, 84].map((width) => (
          <Skeleton key={width} className="h-8 rounded-md" style={{ width }} />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-10 items-center gap-6 border-b px-6 md:flex">
          {[220, 80, 140, 90, 160].map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width }} />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-6 border-b px-4 py-3.5 sm:px-6"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-[260px]">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-36 max-w-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="hidden h-2 w-32 rounded-full md:block" />
            <Skeleton className="hidden h-4 w-14 md:block" />
            <Skeleton className="hidden h-4 w-40 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
