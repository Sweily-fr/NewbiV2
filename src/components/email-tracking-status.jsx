"use client";

import { Mail, MailOpen, MousePointerClick } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";

/**
 * Composant d'affichage du statut de tracking d'email
 *
 * 3 états :
 * - Non envoyé : enveloppe fermée grise
 * - Envoyé, non ouvert : enveloppe fermée orange
 * - Ouvert : enveloppe ouverte verte (+ date et nombre d'ouvertures au survol)
 */
export function EmailTrackingStatus({ emailTracking }) {
  // Pas de tracking = non envoyé
  if (!emailTracking?.emailSentAt) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center">
            <Mail className="h-4 w-4 text-gray-300 dark:text-gray-600" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
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
          <span className="inline-flex items-center justify-center">
            <Mail className="h-4 w-4 text-amber-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
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
          <span className="inline-flex items-center justify-center">
            <MousePointerClick className="h-4 w-4 text-blue-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
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
        <span className="inline-flex items-center justify-center">
          <MailOpen className="h-4 w-4 text-emerald-500" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
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
