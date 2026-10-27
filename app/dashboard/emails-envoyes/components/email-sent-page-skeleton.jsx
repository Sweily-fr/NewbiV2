import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page d'un e-mail envoyé. Reprend la structure de la page
// (en-tête, détails de l'envoi à gauche, e-mail à droite, hauteur de la
// fenêtre sur écran large) pour que la transition loading.jsx → page soit
// invisible.
export function EmailSentPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 md:h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] md:overflow-hidden">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4 shrink-0">
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

      <div className="flex flex-col gap-4 md:flex-row md:flex-1 md:min-h-0">
        {/* Détails de l'envoi */}
        <div className="grid grid-cols-[96px_minmax(0,1fr)] content-start gap-x-3 gap-y-3 rounded-lg border p-4 md:w-[340px] md:shrink-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="contents">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>

        {/* E-mail */}
        <Skeleton className="h-[640px] w-full rounded-lg md:h-auto md:flex-1 md:min-h-0" />
      </div>
    </div>
  );
}
