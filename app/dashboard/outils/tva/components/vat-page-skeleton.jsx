import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton commun au chargement du chunk et au premier chargement des données
export function VatPageSkeleton() {
  return (
    <div className="flex min-h-full flex-col px-4 pt-4 pb-8 sm:px-6 sm:pt-6">
      <Skeleton className="h-8 w-[220px]" />
      <Skeleton className="mt-3 h-4 w-full max-w-[520px]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-md" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
