"use client";

import { useId } from "react";
import { cn } from "@/src/lib/utils";

/**
 * TableEmptyState — empty state with a decorative dotted grid + corner marks
 * and a faded centered icon. Used for tables and panels when there's no data.
 *
 * Pass icons from `@/src/components/icons` (custom Vuesax) when possible,
 * or any Lucide icon component.
 *
 * Example:
 *   <TableEmptyState
 *     icon={NoteIcon}
 *     title="Aucune facture trouvée"
 *     description="Créez votre première facture pour commencer."
 *     action={<Button>Créer une facture</Button>}
 *   />
 */
export function TableEmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
}) {
  const reactId = useId();
  const dotsId = `tes-dots-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const isCompact = size === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center w-full",
        isCompact ? "py-8 px-4" : "py-16 px-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative mb-6",
          isCompact ? "w-[110px] h-[110px]" : "w-[138px] h-[138px]",
        )}
      >
        <svg
          width="138"
          height="138"
          viewBox="0 0 138 138"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full text-gray-900 dark:text-gray-100"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id={dotsId}
              x="4"
              y="4"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="1"
                height="1"
                fill="currentColor"
                fillOpacity="0.1"
              />
            </pattern>
          </defs>
          <rect x="4" y="4" width="129" height="129" fill={`url(#${dotsId})`} />
          <g stroke="currentColor" strokeOpacity="0.1">
            <path d="M4.5 9V0M9 4.5H0" />
            <path d="M132.5 9V0M137 4.5h-9" />
            <path d="M132.5 137v-9M137 132.5h-9" />
            <path d="M4.5 137v-9M9 132.5H0" />
          </g>
        </svg>
        {Icon && (
          <Icon
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-100",
              isCompact ? "h-14 w-14" : "h-20 w-20",
            )}
            strokeWidth={1.25}
            style={{ opacity: 0.2 }}
            aria-hidden="true"
          />
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
