import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton partagé de l'éditeur de bon de commande.
// Reprend la structure réelle de ModernPurchaseOrderEditor (overlay plein
// écran, grille 2 colonnes : formulaire à gauche, aperçu PDF à droite) pour
// que loading.jsx, les guards et les fallbacks Suspense affichent tous le
// même visuel pendant l'attente.
export function PurchaseOrderEditorSkeleton() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
        {/* Colonne gauche : formulaire */}
        <div className="px-4 pt-6 pb-4 md:px-6 md:pt-6 flex flex-col h-full overflow-hidden">
          <div className="max-w-2xl mx-auto flex flex-col w-full h-full">
            {/* En-tête : titre + actions */}
            <div className="flex items-center justify-between mb-4 pb-4 md:mb-6 md:pb-6 border-b">
              <div className="space-y-2">
                <Skeleton className="h-6 md:h-7 w-32 md:w-40" />
                <Skeleton className="h-4 w-24 md:w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-20 hidden md:block" />
              </div>
            </div>

            {/* Corps du formulaire */}
            <div className="flex-1 overflow-hidden space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2 md:gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-16 md:w-20" />
                    <Skeleton className="h-10 w-16 md:w-20" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>

            {/* Pied : boutons d'action */}
            <div className="pt-4 mt-4 border-t">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : aperçu PDF (masquée sur mobile) */}
        <div className="hidden lg:flex border-l flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden p-6 bg-[#F9F9F9] dark:bg-[#1a1a1a]">
            <div className="bg-white rounded-lg p-8 space-y-6 max-w-3xl mx-auto">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
