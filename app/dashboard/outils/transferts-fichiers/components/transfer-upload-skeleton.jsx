import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton de la page "Nouveau transfert" : header + deux colonnes (zone de
// dépôt de fichiers à gauche, options du transfert à droite), partagé entre
// loading.jsx et le fallback du ProRouteGuard pour une transition invisible.
export function TransferUploadSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      {/* Header */}
      <div className="w-full">
        <Skeleton className="h-8 w-[320px] mb-2" />
        <Skeleton className="h-4 w-[420px] max-w-full" />
      </div>

      {/* Deux colonnes : zone de dépôt + options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-10 w-[160px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
