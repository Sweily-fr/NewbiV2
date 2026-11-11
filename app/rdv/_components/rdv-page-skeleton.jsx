import { Skeleton } from "@/src/components/ui/skeleton";
import { BookingCard, BookingShell } from "./booking-shell";

function CardSkeleton({ variant }) {
  if (variant === "list") {
    return (
      <BookingCard className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-6 py-8">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
          ))}
        </div>
      </BookingCard>
    );
  }
  return (
    <BookingCard>
      <div className="flex flex-col md:flex-row">
        <div className="space-y-4 border-b border-gray-100 p-6 md:w-80 md:border-r md:border-b-0">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Skeleton className="h-5 w-56" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="mx-auto size-10 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
      </div>
    </BookingCard>
  );
}

/**
 * Squelette des pages publiques. `bare` (loading.jsx) : sans fond ni pied,
 * pour ne pas faire clignoter une page intégrée en iframe.
 */
export function RdvPageSkeleton({
  variant = "booking",
  embed = false,
  bare = false,
}) {
  if (bare) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
        <CardSkeleton variant={variant} />
      </div>
    );
  }
  return (
    <BookingShell embed={embed}>
      <CardSkeleton variant={variant} />
    </BookingShell>
  );
}
