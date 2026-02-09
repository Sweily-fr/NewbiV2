"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useSyncAllCalendars } from "@/src/hooks/useCalendarConnections";
import { cn } from "@/src/lib/utils";

export function CalendarSyncButton({ className }) {
  const { syncAll, loading } = useSyncAllCalendars();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={syncAll}
      disabled={loading}
      title="Synchroniser les calendriers"
    >
      <RefreshCw
        className={cn("h-4 w-4", loading && "animate-spin")}
        aria-hidden="true"
      />
      <span className="sr-only">Synchroniser</span>
    </Button>
  );
}
