import { Skeleton } from "@/src/components/ui/skeleton";

// Champ de formulaire : label + input (ou textarea si tall)
function FieldSkeleton({ tall = false }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className={tall ? "h-[80px] w-full" : "h-9 w-full"} />
    </div>
  );
}

// Skeleton de la page mentions légales. Reprend la même structure que la page
// réelle (titre + formulaire en sections à gauche, carte preview à droite)
// pour que la transition loading.jsx → page soit invisible.
export function LegalNoticePageSkeleton() {
  return (
    <div className="flex flex-col p-6 md:py-6">
      {/* Titre */}
      <Skeleton className="h-8 w-[220px] mb-6" />

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Formulaire à gauche */}
        <div className="lg:w-1/2 space-y-6">
          <div className="space-y-6 pt-6 pr-8">
            {/* Informations sur l'entreprise */}
            <Skeleton className="h-6 w-[240px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <FieldSkeleton tall />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            <Skeleton className="h-px w-full" />

            {/* Informations sur le site web */}
            <Skeleton className="h-6 w-[240px]" />
            <FieldSkeleton />

            <Skeleton className="h-px w-full" />

            {/* Informations sur l'hébergeur */}
            <Skeleton className="h-6 w-[240px]" />
            <FieldSkeleton />
            <FieldSkeleton tall />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </div>
        </div>

        {/* Preview à droite */}
        <div className="lg:w-1/2 space-y-6">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-xl p-6 bg-muted/40 space-y-6">
              {/* En-tête : titre + boutons copier / télécharger */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-[90px] rounded-md" />
                  <Skeleton className="h-8 w-[120px] rounded-md" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />

              {/* Document généré */}
              <div className="rounded-xl border bg-background p-6 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="pt-2 space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
                <div className="pt-2 space-y-3">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="pt-2 space-y-3">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
