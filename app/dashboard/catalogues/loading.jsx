import { Skeleton } from "@/src/components/ui/skeleton";

export default function loader() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <Skeleton className="h-[390px] w-full rounded-xl" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-[390px] w-full" />
        <Skeleton className="h-[390px] w-full" />
      </div>
    </div>
  );
}
