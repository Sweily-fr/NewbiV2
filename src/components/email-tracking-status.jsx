"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

const BADGE_CLASSES = {
  notSent: "bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400",
  sent: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  delivered:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  opened:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  clicked: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

function TrackingBadge({ variant, label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
            BADGE_CLASSES[variant],
          )}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-[#202020] text-white border-none text-xs">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Composant d'affichage du statut de tracking d'email
 *
 * 6 états :
 * - Non envoyé : badge gris
 * - Envoyé, pas encore remis : badge orange
 * - Remis au serveur du destinataire, non ouvert : badge violet
 * - Ouvert : badge vert
 * - Cliqué : badge bleu
 * - Rejeté par le serveur du destinataire : badge rouge
 *
 * La remise (deliveryStatus) n'existe que pour les envois suivis : un envoi
 * plus ancien passe directement d'« Envoyé » à « Ouvert ».
 */
export function EmailTrackingStatus({ emailTracking }) {
  // Pas de tracking = non envoyé
  if (!emailTracking?.emailSentAt) {
    return (
      <TrackingBadge variant="notSent" label="Non envoyé">
        <p>Non envoyé par email</p>
      </TrackingBadge>
    );
  }

  const sentDate = formatTrackingDate(emailTracking.emailSentAt);
  const deliveredLine = emailTracking.deliveredAt ? (
    <p className="text-violet-300">
      Remis le {formatTrackingDate(emailTracking.deliveredAt)}
    </p>
  ) : null;

  // Rejeté : le client n'a pas reçu l'email, même s'il a été ouvert depuis
  // une adresse en copie
  if (emailTracking.deliveryStatus === "FAILED") {
    return (
      <TrackingBadge variant="failed" label="Rejeté">
        <p>Envoyé le {sentDate}</p>
        <p className="text-red-400">
          Non remis
          {emailTracking.recipientEmail
            ? ` à ${emailTracking.recipientEmail}`
            : ""}
        </p>
        {emailTracking.deliveryFailureReason && (
          <p className="text-red-400">{emailTracking.deliveryFailureReason}</p>
        )}
        <p className="text-gray-400">
          Vérifiez l&apos;adresse puis renvoyez le document
        </p>
      </TrackingBadge>
    );
  }

  // Envoyé mais pas ouvert
  if (!emailTracking.emailOpenedAt) {
    if (emailTracking.deliveryStatus === "DELIVERED") {
      return (
        <TrackingBadge variant="delivered" label="Remis">
          <p>Envoyé le {sentDate}</p>
          {deliveredLine}
          <p className="text-gray-400">Non ouvert</p>
        </TrackingBadge>
      );
    }

    return (
      <TrackingBadge variant="sent" label="Envoyé">
        <p>Envoyé le {sentDate}</p>
        <p className="text-gray-400">
          {emailTracking.deliveryStatus === "DELAYED"
            ? "Remise retardée, nouvel essai en cours"
            : emailTracking.deliveryStatus === "SENT"
              ? "Remise en cours"
              : "Non ouvert"}
        </p>
      </TrackingBadge>
    );
  }

  // Cliqué (lien ouvert)
  if (emailTracking.emailClickedAt) {
    const clickedDate = formatTrackingDate(emailTracking.emailClickedAt);
    const clickCount = emailTracking.emailClickCount || 1;

    return (
      <TrackingBadge variant="clicked" label="Consulté">
        <p>Envoyé le {sentDate}</p>
        {deliveredLine}
        <p className="text-emerald-400">
          Ouvert le {formatTrackingDate(emailTracking.emailOpenedAt)}
        </p>
        <p className="text-blue-400">
          Document consulté le {clickedDate}
          {clickCount > 1 && ` (${clickCount} fois)`}
        </p>
      </TrackingBadge>
    );
  }

  // Ouvert (mais pas cliqué)
  const openedDate = formatTrackingDate(emailTracking.emailOpenedAt);
  const openCount = emailTracking.emailOpenCount || 1;

  return (
    <TrackingBadge variant="opened" label="Ouvert">
      <p>Envoyé le {sentDate}</p>
      {deliveredLine}
      <p className="text-emerald-400">
        Ouvert le {openedDate}
        {openCount > 1 && ` (${openCount} fois)`}
      </p>
    </TrackingBadge>
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
