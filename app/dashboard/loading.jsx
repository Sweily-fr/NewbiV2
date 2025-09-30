import { Skeleton } from "@/src/components/ui/skeleton";

export default function loader() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 md:h-8 w-32 md:w-40" />
        <Skeleton className="h-4 w-48 md:w-64" />
      </div>

      {/* Main Chart Skeleton */}
      <Skeleton className="h-[250px] md:h-[390px] w-full rounded-xl" />
      
      {/* Two Column Charts - Stack on mobile */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Skeleton className="h-[250px] md:h-[390px] w-full rounded-xl" />
        <Skeleton className="h-[250px] md:h-[390px] w-full rounded-xl" />
      </div>
    </div>
  );
}
