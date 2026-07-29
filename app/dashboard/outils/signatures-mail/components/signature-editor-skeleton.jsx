import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de l'éditeur de signature. Reprend le même fond pointillé et la
// même disposition que la page réelle (aperçu email centré + barre d'outils
// flottante en bas) pour éviter la rupture spinner plein écran -> éditeur
// pendant le chargement des données d'une signature en édition.
export function SignatureEditorSkeleton() {
  return (
    <div className="flex gap-0 w-full h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-neutral-950 bg-[radial-gradient(circle,#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#404040_1px,transparent_1px)] bg-[size:20px_20px]">
      <div className="relative flex-1 p-6 flex items-center justify-center overflow-hidden">
        {/* Aperçu email centré */}
        <div className="w-[600px] max-w-[90%] rounded-xl border bg-white dark:bg-[#1a1a1a] shadow-lg overflow-hidden">
          {/* Barre "Nouveau message" */}
          <Skeleton className="h-10 w-full rounded-none" />
          {/* Corps du message + signature */}
          <div className="p-6 space-y-3">
            <Skeleton className="h-4 w-[240px]" />
            <Skeleton className="h-4 w-[180px]" />
            <div className="pt-4 flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-3 w-[120px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils flottante */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <Skeleton className="h-11 w-[320px] rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  );
}
