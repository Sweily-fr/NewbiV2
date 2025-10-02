import { Skeleton } from "@/src/components/ui/skeleton";

export default function loader() {
  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Header avec navigation et actions */}
      <div className="flex items-center justify-between px-6 pt-6">
        {/* Navigation gauche: Aujourd'hui + flèches + mois/année */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-28 rounded-md" /> {/* Aujourd'hui */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" /> {/* Flèche gauche */}
            <Skeleton className="h-9 w-9 rounded-md" /> {/* Flèche droite */}
          </div>
          <Skeleton className="h-9 w-48 rounded-md" /> {/* octobre 2025 */}
        </div>

        {/* Actions droite: Mois + Nouvel événement */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-md" /> {/* Mois */}
          <Skeleton className="h-9 w-48 rounded-md" /> {/* Nouvel événement */}
        </div>
      </div>

      {/* Calendrier mensuel - pleine largeur */}
      <div className="border-t border-b overflow-hidden bg-card w-full flex-1">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."].map(
            (day, i) => (
              <div key={i} className="p-3 text-center border-r last:border-r-0">
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            )
          )}
        </div>

        {/* Grille du calendrier - 5 semaines */}
        {[...Array(5)].map((_, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {[...Array(7)].map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="min-h-[120px] p-3 border-r last:border-r-0 bg-background"
              >
                {/* Numéro du jour */}
                <Skeleton className="h-5 w-6 rounded mb-2" />

                {/* Événements du jour (aléatoire pour plus de réalisme) */}
                {weekIndex === 1 && dayIndex === 3 && (
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-full rounded" />
                  </div>
                )}
                {weekIndex === 2 && dayIndex === 5 && (
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-full rounded" />
                    <Skeleton className="h-6 w-3/4 rounded" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
