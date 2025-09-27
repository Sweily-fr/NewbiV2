import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-8 sm:p-6 md:gap-6 md:py-6 p-4 md:p-6">
      {/* Header avec salutation */}
      <div className="flex items-center justify-between w-full mb-4 md:mb-6">
        <Skeleton className="h-8 w-64 bg-gray-200" />
        <Skeleton className="h-10 w-32 bg-gray-200 rounded-md" />
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col gap-3 w-full">
        <Skeleton className="h-11 w-full bg-gray-200 rounded-md" />
        
        {/* Boutons d'actions rapides */}
        <div className="overflow-x-auto md:overflow-x-visible w-full">
          <div className="flex gap-2 md:gap-3 md:flex-wrap w-max md:w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-32 bg-gray-200 rounded-md flex-shrink-0" 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cartes de solde et transactions */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full mt-4">
        <Card className="shadow-xs w-full md:w-1/2">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-24 bg-gray-200" />
            <Skeleton className="h-8 w-32 bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
              <Skeleton className="h-4 w-1/2 bg-gray-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs w-full md:w-1/2">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32 bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de revenus et dépenses */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
        <Card className="shadow-xs w-full md:w-1/2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 bg-gray-200" />
              <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
            </div>
            <Skeleton className="h-8 w-32 bg-gray-200" />
          </CardHeader>
          <CardContent>
            {/* Graphique skeleton */}
            <div className="h-[200px] flex items-end justify-between gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="bg-gray-200 rounded-t-sm flex-1"
                  style={{ 
                    height: `${Math.random() * 80 + 20}%`,
                    minHeight: '20px'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs w-full md:w-1/2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 bg-gray-200" />
              <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
            </div>
            <Skeleton className="h-8 w-32 bg-gray-200" />
          </CardHeader>
          <CardContent>
            {/* Graphique skeleton */}
            <div className="h-[200px] flex items-end justify-between gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="bg-gray-200 rounded-t-sm flex-1"
                  style={{ 
                    height: `${Math.random() * 80 + 20}%`,
                    minHeight: '20px'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
