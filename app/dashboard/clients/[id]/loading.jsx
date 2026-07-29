import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page détail client.
// Reprend la même structure que la page réelle (header compact + onglets +
// contenu à gauche + sidebar détails à droite) pour que la transition
// loading.jsx -> page -> chargement des données soit invisible.
export default function ClientDetailLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header (mêmes hauteurs que ClientDetailHeader) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-[#eeeff1] dark:border-[#232323] flex-shrink-0">
        {/* Navigation + avatar + nom */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          <Skeleton className="h-6 w-6 rounded-md flex-shrink-0" />
          <Skeleton className="h-4 w-[160px]" />
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="hidden sm:inline-flex h-9 w-[140px] rounded-md" />
          <Skeleton className="hidden sm:inline-flex h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Contenu principal : onglets (gauche) + sidebar (droite) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Barre d'onglets (mêmes espacements que ClientDetailTabs) */}
          <div className="flex-shrink-0 border-b border-[#eeeff1] dark:border-[#232323] pt-2 pb-[9px]">
            <div className="flex items-center gap-1.5 px-4 sm:px-6">
              <Skeleton className="h-8 w-[90px] rounded-md" />
              <Skeleton className="h-8 w-[80px] rounded-md" />
              <Skeleton className="h-8 w-[95px] rounded-md" />
              <Skeleton className="h-8 w-[80px] rounded-md" />
              <Skeleton className="h-8 w-[130px] rounded-md" />
            </div>
          </div>

          {/* Contenu de l'onglet actif (liste d'activités) */}
          <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-[240px]" />
                    <Skeleton className="h-3 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar détails (même largeur que ClientDetailSidebar) */}
        <div className="w-[460px] border-l border-[#eeeff1] dark:border-[#232323] hidden lg:flex flex-col flex-shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-3">
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-9 w-[100px] rounded-md" />
          </div>
          <div className="px-5 pt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                {/* Titre de section */}
                <div className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
                {/* Lignes label / valeur */}
                {Array.from({ length: 4 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-between py-[3px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-3.5 w-3.5 rounded" />
                      <Skeleton className="h-3.5 w-[80px]" />
                    </div>
                    <Skeleton className="h-3.5 w-[120px]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
