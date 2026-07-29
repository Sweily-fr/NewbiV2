import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page prévision.
// Reprend la structure réelle de la page (header + filtres inline, 3 cartes
// KPI, bloc graphique + tableau, listes de prévisions) avec les mêmes
// dimensions que les skeletons internes des composants (KpiCard,
// ForecastPaymentsCard, listes) pour que la transition soit invisible.
export default function PrevisionLoading() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header : titre + actions */}
      <div className="pt-4 sm:pt-6 mb-6 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-8 w-[140px]" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-[130px] rounded-md" />
            <Skeleton className="h-9 w-[190px] rounded-md" />
            <Skeleton className="h-9 w-[110px] rounded-md" />
          </div>
        </div>

        {/* Filtres inline (compte + période) */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-[180px] rounded-md" />
          <Skeleton className="h-5 w-[80px] rounded-md" />
        </div>
      </div>

      {/* Cartes KPI (mêmes dimensions que le skeleton de KpiCard) */}
      <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 pb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background px-5 py-4"
          >
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-9 w-40" />
          </div>
        ))}
      </div>

      {/* Graphique + tableau (même structure que le skeleton de ForecastPaymentsCard) */}
      <div className="bg-background px-4 sm:px-6 pb-6 flex-1">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>

      {/* Prévisions manuelles (même skeleton que ManualEntriesList) */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>

      {/* Récurrences détectées (même skeleton que DetectedRecurrencesList) */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
