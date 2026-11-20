"use client";

import { CircleAlert, ExternalLink } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  formatLinkedAmount,
  linkedItemFilingSite,
} from "@/src/utils/calendar-linked-items";
import { declarationFilingSite } from "@/src/utils/declaration-events";
import { APPOINTMENT_COLOR } from "@/src/utils/booking";
import { normalizeColor } from "@/app/dashboard/calendar/components/utils";
import { LINKED_SOURCE_META } from "@/app/dashboard/calendar/components/linked-sources";

/**
 * Ligne d'un élément de la journée (événement ou échéance d'une autre
 * page), partagée par l'accueil et le volet du jour du calendrier : heure,
 * barre de couleur, titre et détail, lien de dépôt d'une déclaration.
 * Les éléments viennent de buildUpcomingDays.
 */

// « 30 min », « 1 h », « 1 h 30 »
export function formatDuration(start, end) {
  const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
  if (!(minutes > 0) || minutes >= 24 * 60) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

// Couleur d'un élément : celle de sa source ou de son événement
function entryColor(entry) {
  if (entry.type === "linked") {
    return { className: LINKED_SOURCE_META[entry.item.kind]?.accent };
  }
  return {
    style: {
      backgroundColor: entry.isAppointment
        ? APPOINTMENT_COLOR
        : normalizeColor(entry.event.color),
    },
  };
}

// Site où déposer une déclaration (événement Newbi ou échéance fiscale)
function entryFilingSite(entry) {
  if (entry.type === "linked") return linkedItemFilingSite(entry.item);
  return declarationFilingSite(entry.event.declarationKind);
}

function entrySubtitle(entry) {
  if (entry.type === "linked") {
    const meta = LINKED_SOURCE_META[entry.item.kind];
    if (entry.item.kind === "FISCAL") {
      return [entry.item.reference, entry.item.counterparty]
        .filter(Boolean)
        .join(" · ");
    }
    const amount = formatLinkedAmount(
      entry.item.amount,
      entry.item.currency || "EUR",
      { compact: true },
    );
    return [meta?.noun, entry.item.counterparty, amount]
      .filter(Boolean)
      .join(" · ");
  }
  const { event } = entry;
  const filingSite = entryFilingSite(entry);
  if (filingSite) {
    return `À déposer sur ${filingSite.site}`;
  }
  if (!entry.time) return event.location || "Toute la journée";
  return [event.location, formatDuration(event.start, event.end)]
    .filter(Boolean)
    .join(" · ");
}

export function EntryColorBar({ entry, className }) {
  const color = entryColor(entry);
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 rounded-full", className, color.className)}
      style={color.style}
    />
  );
}

// Ligne de la journée : heure, couleur, titre et détail ; lien de dépôt
// pour une déclaration
// compact : volet étroit du calendrier, « Déclarer ↗ » en lien sous le
// titre plutôt qu'en bouton à droite (le titre garde sa place)
export function DayEntryRow({ entry, onOpen, compact = false }) {
  const filingSite = entryFilingSite(entry);
  const subtitle = entrySubtitle(entry);
  const isOverdue = entry.type === "linked" && entry.item.state === "OVERDUE";
  const meta =
    entry.type === "linked" ? LINKED_SOURCE_META[entry.item.kind] : null;
  const Icon = meta?.icon;

  const leading = (
    <span className="text-muted-foreground text-xs tabular-nums">
      {entry.time ? (
        entry.time
      ) : Icon ? (
        <Icon className={cn("size-3.5", meta.iconClass)} aria-hidden="true" />
      ) : (
        "Journée"
      )}
    </span>
  );
  const titleLine = (
    <span className="flex items-center gap-1.5">
      <span className="truncate text-[13px] font-medium">{entry.title}</span>
      {isOverdue && (
        <CircleAlert
          className="size-3.5 shrink-0 text-red-600 dark:text-red-400"
          aria-label="En retard"
        />
      )}
    </span>
  );

  if (compact) {
    // Toute la ligne ouvre l'élément (bouton étiré) ; le lien de dépôt
    // reste cliquable par-dessus
    return (
      <li className="hover:bg-accent focus-within:bg-accent relative grid grid-cols-[2.75rem_3px_minmax(0,1fr)] items-center gap-x-2.5 rounded-lg px-2 py-1.5 transition-colors">
        {leading}
        <EntryColorBar entry={entry} className="h-8 w-[3px]" />
        <span className="min-w-0">
          <button
            type="button"
            onClick={() => onOpen(entry)}
            className="block w-full min-w-0 cursor-pointer text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#5a50ff]/40"
          >
            {titleLine}
            {subtitle && !filingSite && (
              <span className="text-muted-foreground block truncate text-xs">
                {subtitle}
              </span>
            )}
          </button>
          {filingSite && (
            <a
              href={filingSite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 text-xs text-[#5a50ff] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Déclarer
              <ExternalLink className="size-3" aria-hidden="true" />
              <span className="sr-only">
                : {filingSite.label} (nouvel onglet)
              </span>
            </a>
          )}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="hover:bg-accent focus-visible:ring-ring grid min-w-0 flex-1 cursor-pointer grid-cols-[2.75rem_3px_minmax(0,1fr)] items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {leading}
        <EntryColorBar entry={entry} className="h-8 w-[3px]" />
        <span className="min-w-0">
          {titleLine}
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">
              {subtitle}
            </span>
          )}
        </span>
      </button>
      {filingSite && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
        >
          <a href={filingSite.url} target="_blank" rel="noopener noreferrer">
            Déclarer
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">
              : {filingSite.label} (nouvel onglet)
            </span>
          </a>
        </Button>
      )}
    </li>
  );
}
