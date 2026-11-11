"use client";

import { memo } from "react";
import {
  Check,
  CircleAlert,
  MailWarning,
  PenLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AvatarGroup } from "@/src/components/ui/user-avatar";
import { cn } from "@/src/lib/utils";
import {
  formatLinkedAmount,
  relativeDayLabel,
} from "@/src/utils/calendar-linked-items";
import {
  LINKED_SOURCE_META,
  linkedKindDetail,
  linkedStateLabel,
} from "./linked-sources";

// Prévisions : dessinées en pointillés à la couleur du sens du mouvement
const FLOW_STYLES = {
  INCOME: {
    icon: TrendingUp,
    iconClass: "text-[#1baf7a] dark:text-[#199e70]",
    border: "border-[#1baf7a]/60 dark:border-[#199e70]/70",
  },
  EXPENSE: {
    icon: TrendingDown,
    iconClass: "text-[#eb6834] dark:text-[#d95926]",
    border: "border-[#eb6834]/60 dark:border-[#d95926]/70",
  },
};

// Sorties d'argent : montant précédé d'un signe moins
const isOutflow = (item) =>
  item.kind === "PURCHASE_INVOICE" ||
  (item.kind === "FORECAST" && item.flowType === "EXPENSE");

function signedAmount(item, options) {
  const amount = formatLinkedAmount(
    item.amount,
    item.currency || "EUR",
    options,
  );
  if (!amount) return null;
  if (isOutflow(item)) return `- ${amount}`;
  if (item.kind === "FORECAST") return `+ ${amount}`;
  return amount;
}

/**
 * Échéance venue d'une autre page (facture, devis, achat, tâche,
 * récurrence, prévision, relance, livraison, transfert) dans la grille du
 * calendrier. Lecture seule : un clic ouvre sa fiche. Barre et icône à la
 * couleur de la source, texte à l'encre du thème ; l'état (en retard,
 * réglé, envoi impossible) a toujours une icône en plus de la couleur.
 */
export const LinkedEventItem = memo(function LinkedEventItem({
  item,
  view,
  onClick,
  className,
}) {
  const meta = LINKED_SOURCE_META[item.kind];
  if (!meta) return null;
  const flow = item.kind === "FORECAST" ? FLOW_STYLES[item.flowType] : null;
  const Icon = flow?.icon || meta.icon;
  const iconClass = flow?.iconClass || meta.iconClass;
  const noEmail = item.reminderStatus === "NO_EMAIL";
  // Retard, envoi en échec ou relance qui ne pourra pas partir
  const isAlert = item.state === "OVERDUE" || noEmail;
  const AlertIcon = noEmail ? MailWarning : CircleAlert;
  const isDone = item.state === "DONE";
  // Échéance fiscale passée : horloge plutôt que coche (rien n'est vérifié)
  const DoneIcon = meta.doneIcon || Check;
  const stateLabel = linkedStateLabel(item);
  const amount = signedAmount(item, { compact: true });
  const members = item.assignedMembersInfo || [];
  const signaturePending = item.signatureStatus === "PENDING";
  const detail = linkedKindDetail(item);
  const label = [
    meta.noun,
    detail,
    item.title,
    amount,
    stateLabel,
    signaturePending && "signature en attente",
  ]
    .filter(Boolean)
    .join(" · ");

  if (view === "agenda") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "group/linked focus-visible:ring-ring/50 border-border/60 bg-background hover:bg-muted/40 relative flex w-full items-center gap-3 overflow-hidden rounded-lg border py-2.5 pr-3 pl-4 text-left transition outline-none focus-visible:ring-[3px]",
          flow && cn("border-dashed", flow.border),
          isDone && "opacity-70",
          className,
        )}
      >
        {!flow && (
          <span
            className={cn("absolute inset-y-0 left-0 w-[3px]", meta.accent)}
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            meta.tint,
          )}
          aria-hidden="true"
        >
          <Icon className={cn("size-4", iconClass)} />
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
            {signaturePending && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#6250d6]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#6250d6] dark:bg-[#9085e9]/15 dark:text-[#9085e9]">
                <PenLine className="size-3" aria-hidden="true" />
                Signature en attente
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <span className="truncate">
              {item.kind === "TASK" && item.boardTitle
                ? `${item.boardEmoji ? `${item.boardEmoji} ` : ""}${item.boardTitle}`
                : detail || meta.noun}
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
            {amount}
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
        flow
          ? cn(
              "border border-dashed pl-1.5",
              flow.border,
              isDone ? "text-muted-foreground" : "bg-background/60",
            )
          : isAlert
            ? "bg-red-500/10 text-red-700 dark:text-red-400"
            : isDone
              ? "bg-muted/70 text-muted-foreground"
              : meta.tint,
        className,
      )}
    >
      {!flow && (
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-[3px]",
            meta.accent,
            isDone && "opacity-50",
          )}
          aria-hidden="true"
        />
      )}
      {/* Sur mobile, une seule icône faute de place : l'état (retard,
          réglé) passe avant la source, qui garde sa barre de couleur */}
      <Icon
        className={cn(
          "size-3 shrink-0",
          iconClass,
          isDone && "opacity-60",
          (isAlert || isDone) && "max-sm:hidden",
        )}
        aria-hidden="true"
      />
      {isAlert && (
        <AlertIcon className="size-3 shrink-0 sm:hidden" aria-hidden="true" />
      )}
      {isDone && (
        <DoneIcon className="size-3 shrink-0 sm:hidden" aria-hidden="true" />
      )}
      <span className="min-w-0 truncate">{item.title}</span>
      {item.kind === "REMINDER" && (
        <span className="shrink-0 rounded-sm bg-current/10 px-0.5 text-[9px] font-semibold tabular-nums max-sm:hidden">
          {item.reminderStep === 0 ? "R+" : `R${item.reminderStep || 1}`}
        </span>
      )}
      {signaturePending && (
        <PenLine
          className="size-3 shrink-0 text-[#6250d6] max-sm:hidden dark:text-[#9085e9]"
          aria-hidden="true"
        />
      )}
      {isAlert && (
        <AlertIcon
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

// Retards dont le libellé dit mieux que le délai : devis expiré, émission
// en attente, envoi de relance en échec
const OVERDUE_AS_LABEL = new Set(["QUOTE", "RECURRING_INVOICE", "REMINDER"]);

// « · En retard de 7 jours », « · Payée », « · À encaisser · demain »
function StateText({ item, stateLabel }) {
  const relative = relativeDayLabel(item.day, item.state);
  if (item.state === "OVERDUE" || item.reminderStatus === "NO_EMAIL") {
    const AlertIcon =
      item.reminderStatus === "NO_EMAIL" ? MailWarning : CircleAlert;
    return (
      <>
        <Dot />
        <span className="flex shrink-0 items-center gap-1 text-red-600 dark:text-red-400">
          <AlertIcon className="size-3" aria-hidden="true" />
          {OVERDUE_AS_LABEL.has(item.kind) || item.state !== "OVERDUE"
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
