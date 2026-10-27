import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page d'un e-mail envoyé. Reprend la structure de la page
// (en-tête, puis une carte : enveloppe, parcours de l'envoi, pièces jointes,
// e-mail) pour que la transition loading.jsx → page soit invisible.
export function EmailSentPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:py-8">
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

      <div className="overflow-hidden rounded-xl border">
        {/* Enveloppe */}
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-[240px]" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-[220px]" />
            </div>
          ))}
        </div>

        {/* Parcours de l'envoi */}
        <div className="flex items-center gap-3 border-t px-5 py-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-1 items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* E-mail */}
        <div className="border-t">
          <Skeleton className="h-[640px] w-full rounded-none" />
        </div>
      </div>
    </div>
  );
}
