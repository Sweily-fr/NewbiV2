import { Skeleton } from "@/src/components/ui/skeleton";

// Squelette des pages de l'espace gestionnaire (clients, factures, devis…) :
// même structure que les pages réelles (titre, recherche, tableau), pour
// une transition invisible au lieu du squelette de l'Accueil.
export function GestionnairePageSkeleton() {
  return (
    <div className="flex flex-col md:h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-4 w-[240px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[150px] rounded-md" />
          <Skeleton className="h-9 w-[140px] rounded-md" />
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4">
        <Skeleton className="h-9 w-full sm:w-[320px] rounded-md" />
      </div>
      <div className="flex-1 border-t border-border">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b px-4 sm:px-6 py-3"
          >
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="hidden md:block h-4 w-[80px]" />
            <Skeleton className="hidden md:block h-5 w-[70px] rounded-md" />
            <Skeleton className="ml-auto h-8 w-[90px] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
