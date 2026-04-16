"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

/**
 * Composant d'affichage du statut de tracking d'email
 *
 * 4 états :
 * - Non envoyé : badge gris
 * - Envoyé, non ouvert : badge orange
 * - Ouvert : badge vert
 * - Cliqué : badge bleu
 */
export function EmailTrackingStatus({ emailTracking }) {
  // Pas de tracking = non envoyé
  if (!emailTracking?.emailSentAt) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
              "bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400",
            )}
          >
            Non envoyé
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-[#202020] text-white border-none text-xs">
          <p>Non envoyé par email</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const sentDate = formatTrackingDate(emailTracking.emailSentAt);

  // Envoyé mais pas ouvert
  if (!emailTracking.emailOpenedAt) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
              "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
            )}
          >
            Envoyé
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-[#202020] text-white border-none text-xs">
          <p>Envoyé le {sentDate}</p>
          <p className="text-gray-400">Non ouvert</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Cliqué (lien ouvert)
  if (emailTracking.emailClickedAt) {
    const clickedDate = formatTrackingDate(emailTracking.emailClickedAt);
    const clickCount = emailTracking.emailClickCount || 1;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
              "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            )}
          >
            Consulté
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-[#202020] text-white border-none text-xs">
          <p>Envoyé le {sentDate}</p>
          <p className="text-emerald-400">
            Ouvert le {formatTrackingDate(emailTracking.emailOpenedAt)}
          </p>
          <p className="text-blue-400">
            Document consulté le {clickedDate}
            {clickCount > 1 && ` (${clickCount} fois)`}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Ouvert (mais pas cliqué)
  const openedDate = formatTrackingDate(emailTracking.emailOpenedAt);
  const openCount = emailTracking.emailOpenCount || 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
          )}
        >
          Ouvert
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-[#202020] text-white border-none text-xs">
        <p>Envoyé le {sentDate}</p>
        <p className="text-emerald-400">
          Ouvert le {openedDate}
          {openCount > 1 && ` (${openCount} fois)`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function formatTrackingDate(dateValue) {
  if (!dateValue) return "";

  try {
    let date;
    if (typeof dateValue === "string") {
      if (/^\d+$/.test(dateValue)) {
        date = new Date(parseInt(dateValue, 10));
      } else {
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
