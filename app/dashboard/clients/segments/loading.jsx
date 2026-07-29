import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page segments.
// Reprend la même structure que la page réelle (header titre + sous-titre +
// bouton, grille de cartes) avec les mêmes dimensions que le skeleton
// interne de la page pour une transition invisible.
export default function SegmentsLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header : titre + sous-titre + bouton "Nouveau segment" */}
      <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
        <div>
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-4 w-[320px] mt-2" />
        </div>
        <Skeleton className="h-9 w-[160px] rounded-md self-start" />
      </div>

      {/* Grille de cartes (mêmes dimensions que le skeleton interne de la page) */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-[120px] rounded" />
              <Skeleton className="h-3 w-[180px] rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-[80px] rounded-full" />
                <Skeleton className="h-5 w-[60px] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
