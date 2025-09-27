import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

export function SectionCardsSkeleton({ className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full",
        className
      )}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Card 
          key={index} 
          className="border border-gray-200 bg-gray-50 shadow-none relative overflow-hidden"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between h-full min-h-[140px]">
              {/* Partie gauche avec contenu */}
              <div className="flex flex-col justify-end h-full pr-4 flex-1">
                {/* Header avec titre et description */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    {/* Titre */}
                    <Skeleton className="h-6 w-3/4 bg-gray-200" />
                    {/* Description */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-full bg-gray-200" />
                      <Skeleton className="h-4 w-5/6 bg-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Actions en bas */}
                <div className="flex items-center gap-3 pt-4">
                  <Skeleton className="h-8 w-20 bg-gray-200 rounded-md" />
                  <Skeleton className="h-8 w-28 bg-gray-200 rounded-md" />
                </div>
              </div>

              {/* Partie droite avec illustration */}
              <div className="flex-shrink-0 w-36 h-36 flex items-center justify-center">
                <Skeleton className="w-24 h-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
