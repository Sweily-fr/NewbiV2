import { Skeleton } from "@/src/components/ui/skeleton";

export default function loader() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <Skeleton className="h-[40px] w-[100px] rounded-xl" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-[40px] w-[300px] rounded-xl" />
        <Skeleton className="h-[40px] w-[300px] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-6 w-full">
        {/* Première ligne */}
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        
        {/* Deuxième ligne */}
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        
        {/* Troisième ligne */}
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}
