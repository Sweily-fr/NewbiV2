import { Skeleton } from "@/src/components/ui/skeleton";

// Reprend la même structure que la page réelle (titre + emplacement des onglets
// + grille des cartes d'intégration) avec les mêmes dimensions, pour que la
// transition loading.jsx -> page soit invisible (pas de doublon de loader).
export function AutomationPageSkeleton() {
  return (
    <div className="flex flex-col p-6 md:py-6">
      {/* Titre "Intégrations" (text-2xl, mb-6) */}
      <Skeleton className="h-8 w-40 mb-6" />

      {/* Emplacement des onglets : comme sur la page, la TabsList n'est
          visible qu'en conteneur large (@4xl/main), le mb-10 reste identique */}
      <div className="flex flex-col mb-10 w-full">
        <div className="hidden @4xl/main:flex">
          <Skeleton className="h-9 w-[360px] rounded-lg" />
        </div>
      </div>

      {/* Grille des cartes d'intégration (7 cartes comme la page) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`integration-skeleton-${index}`}
            className="bg-card flex h-full flex-col gap-2 rounded-xl border py-6 shadow-sm"
          >
            {/* Header : icône (p-2 + icône 20px = 36px) + titre */}
            <div className="px-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>

            {/* Description sur deux lignes (text-sm) */}
            <div className="px-6 flex-grow space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Bouton pleine largeur */}
            <div className="flex items-center px-6">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
