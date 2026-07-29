import { Skeleton } from "@/src/components/ui/skeleton";

// Skeleton affiché pendant le chargement du chunk de la page favoris.
// Reprend la même structure que la page réelle (titre seul) pour éviter
// de retomber sur le skeleton du dashboard d'accueil.
export default function FavorisLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <Skeleton className="h-8 w-[120px] mb-6" />
    </div>
  );
}
