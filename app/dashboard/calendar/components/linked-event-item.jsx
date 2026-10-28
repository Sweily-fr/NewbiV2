"use client";

import { memo } from "react";
import { Check, CircleAlert } from "lucide-react";

import { AvatarGroup } from "@/src/components/ui/user-avatar";
import { cn } from "@/src/lib/utils";
import {
  formatLinkedAmount,
  relativeDayLabel,
} from "@/src/utils/calendar-linked-items";
import { LINKED_SOURCE_META, linkedStateLabel } from "./linked-sources";

/**
 * Échéance venue d'une autre page (facture, devis, achat, tâche,
 * récurrence) dans la grille du calendrier. Lecture seule : un clic ouvre
 * sa fiche. Barre et icône à la couleur de la source, texte à l'encre du
 * thème ; l'état (en retard, réglé) a toujours une icône en plus de la
 * couleur.
 */
export const LinkedEventItem = memo(function LinkedEventItem({
  item,
  view,
  onClick,
  className,
}) {
  const meta = LINKED_SOURCE_META[item.kind];
  if (!meta) return null;
  const Icon = meta.icon;
  // Échéance fiscale passée : horloge plutôt que coche (rien n'est vérifié)
  const DoneIcon = meta.doneIcon || Check;
  const isOverdue = item.state === "OVERDUE";
  const isDone = item.state === "DONE";
  const stateLabel = linkedStateLabel(item);
  const amount = formatLinkedAmount(item.amount, item.currency || "EUR", {
    compact: true,
  });
  const members = item.assignedMembersInfo || [];
  const label = [meta.noun, item.title, amount, stateLabel]
    .filter(Boolean)
    .join(" · ");

  if (view === "agenda") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "group/linked focus-visible:ring-ring/50 relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-border/60 bg-background py-2.5 pr-3 pl-4 text-left transition outline-none hover:bg-muted/40 focus-visible:ring-[3px]",
          isDone && "opacity-70",
          className,
        )}
      >
        <span
          className={cn("absolute inset-y-0 left-0 w-[3px]", meta.accent)}
          aria-hidden="true"
        />
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            meta.tint,
          )}
          aria-hidden="true"
        >
          <Icon className={cn("size-4", meta.iconClass)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="truncate">{item.title}</span>
            {item.reference && (
              <span
                className={cn(
                  "text-muted-foreground truncate text-xs font-normal",
                  // Période d'une échéance fiscale, parfois longue : elle
                  // cède la place au titre au lieu de l'écraser
                  item.kind === "FISCAL" ? "min-w-0" : "shrink-0",
                )}
              >
                {item.reference}
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <span className="truncate">
              {item.kind === "TASK" && item.boardTitle
                ? `${item.boardEmoji ? `${item.boardEmoji} ` : ""}${item.boardTitle}`
                : meta.noun}
            </span>
            <StateText item={item} stateLabel={stateLabel} />
          </span>
        </span>
        {members.length > 0 && (
          <AvatarGroup users={members} max={3} size="xs" className="shrink-0" />
        )}
        {amount && (
          <span
            className={cn(
              "shrink-0 text-sm font-medium tabular-nums",
              isDone && "text-muted-foreground",
            )}
          >
            {item.kind === "PURCHASE_INVOICE" ? `- ${amount}` : amount}
          </span>
        )}
      </button>
    );
  }

  // Mois, et lignes « Toute la journée » des vues semaine et jour
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "group/linked focus-visible:ring-ring/50 relative mt-[var(--event-gap)] flex h-[var(--event-height)] w-full items-center gap-1 overflow-hidden rounded pr-1 pl-2 text-left text-[10px] font-medium transition outline-none select-none hover:brightness-95 focus-visible:ring-[3px] sm:pr-1.5 sm:text-xs dark:hover:brightness-110",
        isOverdue
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : isDone
            ? "bg-muted/70 text-muted-foreground"
            : meta.tint,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          meta.accent,
          isDone && "opacity-50",
        )}
        aria-hidden="true"
      />
      {/* Sur mobile, une seule icône faute de place : l'état (retard,
          réglé) passe avant la source, qui garde sa barre de couleur */}
      <Icon
        className={cn(
          "size-3 shrink-0",
          meta.iconClass,
          isDone && "opacity-60",
          (isOverdue || isDone) && "max-sm:hidden",
        )}
        aria-hidden="true"
      />
      {isOverdue && (
        <CircleAlert className="size-3 shrink-0 sm:hidden" aria-hidden="true" />
      )}
      {isDone && (
        <DoneIcon className="size-3 shrink-0 sm:hidden" aria-hidden="true" />
      )}
      <span className="min-w-0 truncate">{item.title}</span>
      {isOverdue && (
        <CircleAlert
          className="size-3 shrink-0 max-sm:hidden"
          aria-hidden="true"
        />
      )}
      {isDone && (
        <DoneIcon
          className="size-3 shrink-0 max-sm:hidden"
          aria-hidden="true"
        />
      )}
      {(amount || members.length > 0) && (
        <span className="ml-auto flex shrink-0 items-center gap-1 pl-1">
          {amount && (
            <span className="font-normal tabular-nums opacity-80 max-sm:hidden">
              {amount}
            </span>
          )}
          {members.length > 0 && (
            <AvatarGroup
              users={members}
              max={2}
              size="xxs"
              className="max-sm:hidden"
            />
          )}
        </span>
      )}
    </button>
  );
});

const Dot = () => (
  <span className="opacity-40" aria-hidden="true">
    ·
  </span>
);

// « · En retard de 7 jours », « · Payée », « · À encaisser · demain »
function StateText({ item, stateLabel }) {
  const relative = relativeDayLabel(item.day, item.state);
  if (item.state === "OVERDUE") {
    return (
      <>
        <Dot />
        <span className="flex shrink-0 items-center gap-1 text-red-600 dark:text-red-400">
          <CircleAlert className="size-3" aria-hidden="true" />
          {item.kind === "QUOTE" || item.kind === "RECURRING_INVOICE"
            ? stateLabel
            : relative}
        </span>
      </>
    );
  }
  if (item.state === "DONE") {
    const DoneIcon = LINKED_SOURCE_META[item.kind]?.doneIcon || Check;
    return (
      <>
        <Dot />
        <span className="flex shrink-0 items-center gap-1">
          <DoneIcon className="size-3" aria-hidden="true" />
          {stateLabel}
        </span>
      </>
    );
  }
  return (
    <>
      <Dot />
      <span className="shrink-0">{stateLabel}</span>
      <Dot />
      <span className="truncate">{relative.toLowerCase()}</span>
    </>
  );
}
