import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton générique affiché pendant le chargement du chunk d'une page outil.
// Volontairement neutre (titre + toolbar + lignes) pour rester proche des
// skeletons spécifiques que chaque page affiche ensuite pendant ses requêtes.
export default function OutilsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 py-6 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40 md:w-56" />
          <Skeleton className="h-4 w-24 md:w-36" />
        </div>
        <Skeleton className="h-9 w-28 md:w-36 rounded-md" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-full max-w-xs rounded-md" />
        <div className="hidden md:flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-3">
          <Skeleton className="h-5 w-full" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border p-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
