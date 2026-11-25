import { Skeleton } from "@/src/components/ui/skeleton";

const SEQUENCE_PATH = /^\/dashboard\/outils\/prospection\/([^/?#]+)/;

/** Identifiant de la prospection d'une adresse de page, sinon null. */
export function getSequenceIdFromPathname(pathname) {
  return SEQUENCE_PATH.exec(String(pathname || ""))?.[1] || null;
}

/**
 * Squelette de la page d'une prospection (brouillon ou rapport, pur
 * markup) : rendu par loading.jsx et pendant le chargement de la
 * prospection.
 */
export function ProspectionDetailPageSkeleton() {
  return (
    <div className="h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] overflow-hidden">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-64 max-w-[60vw]" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="hidden gap-2 md:flex">
              <Skeleton className="h-8 w-40 rounded-[9px]" />
              <Skeleton className="h-8 w-44 rounded-[9px]" />
            </div>
          </div>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border p-5"
              >
                <Skeleton className="size-7 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <Skeleton className="hidden h-8 w-20 rounded-[9px] sm:block" />
              </div>
            ))}
          </div>
          <div className="hidden flex-col gap-4 rounded-xl border p-5 xl:flex">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-16 w-full rounded-xl" />
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
