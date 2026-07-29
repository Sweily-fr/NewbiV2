import { Skeleton } from "@/src/components/ui/skeleton";
import { PcgTableSkeleton } from "./components/analytics-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page analytique.
// Reprend la même structure que la page réelle (header + onglet Plan
// Comptable + carte d'info + table de correspondance) pour que la transition
// loading.jsx -> page -> chargement des données soit invisible.
export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      {/* Header : titre + sous-titre */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
      </div>

      {/* Barre d'onglets (onglet Plan Comptable) */}
      <div>
        <Skeleton className="h-9 w-[210px] rounded-lg" />
      </div>

      <div className="space-y-4">
        {/* Carte d'info */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[360px] max-w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[80%]" />
            </div>
          </div>
        </div>

        {/* Table de correspondance PCG */}
        <PcgTableSkeleton />
      </div>
    </div>
  );
}
