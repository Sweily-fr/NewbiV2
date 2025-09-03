import { Skeleton } from "@/src/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-7 w-64" />
      </div>

      <div className="space-y-6">
        {/* Section Forfait actif Skeleton */}
        <div className="border border-gray-200 dark:bg-[#252525] dark:border-[#313131]/90 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-3" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>

        {/* Section Tous les forfaits Skeleton */}
        <div>
          <Skeleton className="h-7 w-32 mb-4" />

          {/* Section Comparaison des forfaits Skeleton */}
          <div className="flex justify-between gap-4 mb-6">
            {/* Plan Gratuit Skeleton */}
            <div className="flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4 flex flex-col">
              <div className="mb-3">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="space-y-2 mb-4 flex-grow">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-9 w-full" />
            </div>

            {/* Plan Pro Skeleton */}
            <div className="flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4 flex flex-col relative">
              <Skeleton className="absolute -top-3 right-6 h-6 w-24 rounded-full" />

              <div className="mb-3">
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>

              <div className="space-y-2 mb-4 flex-grow">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
                <Skeleton className="h-3 w-32 ml-5" />
              </div>

              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>

        {/* Section Promotions et Aide Skeleton */}
        <div className="flex justify-between gap-4">
          {/* Promotions et crédits Skeleton */}
          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          {/* Aide & conformité Skeleton */}
          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
