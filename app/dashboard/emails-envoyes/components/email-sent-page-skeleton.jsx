import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page d'un e-mail envoyé. Reprend la structure de la page
// (en-tête, détails de l'envoi à gauche, e-mail à droite) pour que la
// transition loading.jsx → page soit invisible.
export function EmailSentPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 md:py-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-4 w-[260px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-8 w-[150px] rounded-md" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Détails de l'envoi */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>

        {/* E-mail */}
        <Skeleton className="h-[640px] w-full rounded-lg" />
      </div>
    </div>
  );
}
