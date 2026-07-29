import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";

// Skeleton affiché pendant le chargement du chunk de la page analytique.
// Reprend la structure réelle de l'onglet Synthèse (header + filtre de
// période, barre d'onglets, rangée de cartes KPI, grille de 2 graphiques)
// avec les mêmes dimensions que les skeletons internes des composants
// (AnalyticsKpiRow, charts) pour que la transition soit invisible.
export default function AnalytiquesLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header : titre + filtre de période */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 mb-3 px-4 sm:px-6 gap-3">
        <Skeleton className="h-8 w-[160px]" />
        <Skeleton className="h-9 w-[220px] rounded-md" />
      </div>

      {/* Barre d'onglets */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="mx-4 sm:mx-6 shrink-0">
          <Skeleton className="h-9 w-full max-w-[420px] rounded-lg" />
        </div>

        <div className="space-y-8 flex-1 min-h-0 overflow-y-auto pb-8">
          {/* Rangée de cartes KPI (mêmes dimensions que le skeleton de AnalyticsKpiRow) */}
          <div className="px-4 sm:px-6">
            <div className="bg-background border rounded-lg px-4 py-3 flex items-center">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex-1 min-w-0 flex items-center">
                  {index > 0 && (
                    <div className="w-px h-10 bg-border mx-4 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grille de 2 graphiques (mêmes hauteurs que les skeletons des charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6">
            {/* CA, Dépenses et Marge brute */}
            <Card className="shadow-xs flex flex-col min-h-0 py-4">
              <CardHeader>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
                <Skeleton className="min-h-[200px] w-full" />
              </CardContent>
            </Card>
            {/* Taux de marge brute */}
            <Card className="shadow-xs flex flex-col min-h-0 py-4">
              <CardHeader>
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="px-2 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 overflow-visible flex-1">
                <Skeleton className="min-h-[350px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
