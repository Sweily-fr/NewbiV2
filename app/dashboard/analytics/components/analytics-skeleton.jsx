import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la table de correspondance PCG (cartes de stats + filtres +
// tableau). Reprend la même structure que PCGMappingTable pour que la
// transition skeleton -> données soit invisible. Partagé entre loading.jsx
// et l'état de chargement interne de la page.
export function PcgTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Cartes de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-7 w-[60px]" />
            {i > 0 && <Skeleton className="h-3 w-[36px]" />}
          </div>
        ))}
      </div>

      {/* Filtres : recherche + catégorie + confiance */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[150px] rounded-md" />
      </div>

      {/* Tableau */}
      <div className="rounded-lg border overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center gap-4 bg-muted/50 border-b px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-[110px]" />
          <Skeleton className="h-3 w-[90px]" />
          <Skeleton className="h-3 w-[70px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
        {/* Lignes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b last:border-b-0 px-4 py-3"
          >
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-3 w-[110px]" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-5 w-[48px] rounded" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-5 w-[70px] rounded-full" />
            <Skeleton className="h-4 w-[80px]" />
          </div>
        ))}
      </div>

      {/* Compteur de correspondances */}
      <div className="flex justify-end">
        <Skeleton className="h-3 w-[180px]" />
      </div>
    </div>
  );
}
