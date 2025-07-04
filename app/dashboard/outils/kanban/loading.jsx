import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      {/* En-tête avec barre de recherche et bouton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Colonnes */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 flex-shrink-0 space-y-4">
            {/* En-tête de colonne */}
            <div className="flex items-center justify-between rounded-lg bg-card p-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            
            {/* Cartes de tâches */}
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2 rounded-lg border bg-card p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
