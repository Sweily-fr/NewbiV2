"use client";

import { Link2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function SyncBadge({ count, className }) {
  if (!count || count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        className
      )}
      title={`Synchronisé sur ${count} calendrier${count > 1 ? "s" : ""}`}
    >
      <Link2 className="h-3 w-3" />
      <span>{count}</span>
    </span>
  );
}
