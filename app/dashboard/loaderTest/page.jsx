import { Skeleton } from "@/src/components/ui/skeleton";

export default function loader() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Title */}
      <Skeleton className="h-[32px] md:h-[40px] w-[80px] md:w-[100px] rounded-xl" />
      
      {/* Header Actions - Stack on mobile */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <Skeleton className="h-[40px] w-full md:w-[300px] rounded-xl" />
        <Skeleton className="h-[40px] w-full md:w-[300px] rounded-xl" />
      </div>
      
      {/* Grid - 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] md:h-[200px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
