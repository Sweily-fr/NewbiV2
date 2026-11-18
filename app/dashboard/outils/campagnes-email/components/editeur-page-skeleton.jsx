import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Squelette de l'éditeur de campagne (pur markup) : barre du haut, blocs à
 * gauche, e-mail au centre, réglages à droite.
 */
export function EditeurPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-3">
        <Skeleton className="size-8 rounded-[9px]" />
        <Skeleton className="h-5 w-56" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="hidden h-8 w-16 rounded-[9px] md:block" />
          <Skeleton className="h-8 w-24 rounded-[9px]" />
          <Skeleton className="h-8 w-36 rounded-[9px]" />
          <Skeleton className="h-8 w-24 rounded-[9px]" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[272px] shrink-0 flex-col gap-4 border-r p-5 md:flex">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Skeleton key={index} className="h-[84px] rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 justify-center bg-[#f4f4f5] px-6 pt-16 dark:bg-neutral-900">
          <div className="flex h-fit w-full max-w-[600px] flex-col gap-4 rounded-lg bg-white p-8 dark:bg-neutral-950">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="mx-auto h-11 w-48 rounded-md" />
          </div>
        </div>
        <div className="hidden w-[300px] shrink-0 flex-col items-center gap-3 border-l px-5 py-10 md:flex">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52" />
          <Skeleton className="mt-6 h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
