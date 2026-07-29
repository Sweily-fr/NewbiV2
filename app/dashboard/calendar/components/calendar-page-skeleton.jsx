import { Skeleton } from "@/src/components/ui/skeleton";

// Reprend la même structure que le header réel de EventCalendar (Aujourd'hui,
// flèches, titre, sync, Calendriers, sélecteur de vue Mois/Semaine, Nouvel
// événement) suivi de la ligne Étiquettes et de la grille mensuelle, pour que
// la transition loading.jsx -> page -> chargement des données soit invisible.
export function CalendarPageSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header : navigation à gauche, actions à droite */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:flex-nowrap sm:p-4">
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Bouton Aujourd'hui */}
          <Skeleton className="h-9 w-24 rounded-md" />
          <div className="flex items-center sm:gap-2">
            {/* Flèches précédent / suivant */}
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          {/* Titre mois / année */}
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton synchroniser */}
          <Skeleton className="h-8 w-8 rounded-md" />
          {/* Bouton Calendriers */}
          <Skeleton className="h-8 w-28 rounded-md" />
          {/* Sélecteur de vue (Mois / Semaine / Jour / Agenda) */}
          <Skeleton className="h-9 w-24 rounded-md" />
          {/* Bouton Nouvel événement (icône seule sur mobile) */}
          <Skeleton className="h-9 w-9 rounded-md md:w-44" />
        </div>
      </div>

      {/* Ligne Étiquettes (ColorLegend) */}
      <div className="px-2 sm:px-4">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Calendrier mensuel - pleine largeur */}
      <div className="mt-4 w-full flex-1 overflow-hidden border-t border-b bg-card">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`day-header-${i}`}
              className="p-3 text-center border-r last:border-r-0"
            >
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Grille du calendrier - 5 semaines */}
        {Array.from({ length: 5 }).map((_, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div
                key={`day-${dayIndex}`}
                className="min-h-[120px] p-3 border-r last:border-r-0 bg-background"
              >
                {/* Numéro du jour */}
                <Skeleton className="h-5 w-6 rounded mb-2" />

                {/* Quelques événements pour plus de réalisme */}
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
