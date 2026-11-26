import { Skeleton } from "@/src/components/ui/skeleton";

/** Squelette du contrôle des billets (plein écran sombre, comme le lecteur). */
export function ScannerPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 bg-white/15" />
          <Skeleton className="h-3 w-56 bg-white/10" />
        </div>
        <Skeleton className="size-10 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="aspect-square w-[min(70vw,320px)] rounded-3xl bg-white/10" />
      </div>
      <div className="flex gap-2 px-4 py-3">
        <Skeleton className="h-11 flex-1 rounded-xl bg-white/10" />
        <Skeleton className="h-11 w-24 rounded-xl bg-white/15" />
      </div>
    </div>
  );
}
