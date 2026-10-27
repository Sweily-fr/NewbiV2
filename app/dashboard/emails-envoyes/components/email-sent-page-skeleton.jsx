import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page d'un e-mail envoyé. Reprend la structure de la page
// (en-tête, e-mail à gauche, panneau d'informations à droite ; panneau
// d'abord sur mobile) pour que la transition loading.jsx → page soit
// invisible.
export function EmailSentPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Skeleton className="-ml-2 h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-4 w-[260px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-[140px] rounded-md" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* E-mail */}
        <Skeleton className="h-[640px] min-w-0 flex-1 rounded-xl" />

        {/* Informations de l'envoi */}
        <div className="order-first divide-y rounded-xl border lg:order-none lg:w-[340px] lg:shrink-0">
          {[4, 3, 2].map((rows, section) => (
            <div key={section} className="space-y-3 p-5">
              <Skeleton className="h-3 w-16" />
              {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
