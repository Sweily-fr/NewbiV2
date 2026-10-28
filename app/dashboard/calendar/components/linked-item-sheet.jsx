"use client";

import { useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  ExternalLink,
  Info,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { cn } from "@/src/lib/utils";
import { dayToDate } from "@/src/utils/recurrenceDays";
import {
  formatLinkedAmount,
  linkedItemExternalUrl,
  linkedItemHref,
  relativeDayLabel,
} from "@/src/utils/calendar-linked-items";
import { formatRecurrenceFrequency } from "@/src/graphql/invoiceRecurrenceQueries";
import {
  FISCAL_ACTION_LABELS,
  LINKED_SOURCE_META,
  PRIORITY_LABELS,
  linkedStateLabel,
} from "./linked-sources";

const DATE_LABELS = {
  INVOICE: "Échéance",
  PURCHASE_INVOICE: "Échéance",
  QUOTE: "Fin de validité",
  RECURRING_INVOICE: "Émission",
  TASK: "Échéance",
  FISCAL: "Date limite",
};

const COUNTERPARTY_LABELS = {
  INVOICE: "Client",
  QUOTE: "Client",
  RECURRING_INVOICE: "Client",
  PURCHASE_INVOICE: "Fournisseur",
  FISCAL: "Organisme",
};

// Libellé de la référence quand ce n'est pas un numéro de document
const REFERENCE_LABELS = {
  RECURRING_INVOICE: "Facture modèle",
  FISCAL: "Période",
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Conseil affiché sous les détails selon la source et l'état
function hintFor(item, longDate) {
  // Échéance fiscale : règle appliquée et conditions, venues de l'API
  if (item.kind === "FISCAL") return item.note || null;
  switch (`${item.kind}:${item.state}`) {
    case "INVOICE:OVERDUE":
      return `Le paiement était attendu le ${longDate}. Vous pouvez relancer le client depuis la facture.`;
    case "PURCHASE_INVOICE:OVERDUE":
      return `Cette facture fournisseur devait être réglée le ${longDate}.`;
    case "QUOTE:UPCOMING":
      return "Le devis arrive en fin de validité : c'est le bon moment pour relancer le client.";
    case "QUOTE:OVERDUE":
      return "La validité du devis est dépassée sans réponse du client.";
    case "RECURRING_INVOICE:UPCOMING":
    case "RECURRING_INVOICE:OVERDUE":
      return "La facture sera créée à partir de la facture modèle puis envoyée automatiquement au client.";
    default:
      return null;
  }
}

// Retard d'une échéance de paiement ou d'une tâche : le délai devient le
// libellé (« En retard de 8 jours »), sans le répéter à côté
const OVERDUE_AS_DELAY = new Set(["INVOICE", "PURCHASE_INVOICE", "TASK"]);

function StateBadge({ item, label }) {
  if (!label) return null;
  const meta = LINKED_SOURCE_META[item.kind];
  const isOverdue = item.state === "OVERDUE";
  // Échéance fiscale passée : badge neutre, rien ne dit qu'elle est réglée
  const isDone = item.state === "DONE" && !meta?.neutralDone;
  const PastIcon = item.state === "DONE" && meta?.doneIcon;
  const Icon = isOverdue ? CircleAlert : isDone ? Check : PastIcon || Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        isOverdue &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400",
        isDone &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400",
        !isOverdue && !isDone && "border-border bg-muted/60 text-foreground",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

// Précision sur une échéance fiscale, sans couleur d'état
function MentionBadge({ children }) {
  return (
    <span className="text-muted-foreground inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-28 shrink-0 text-xs leading-5">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-5 break-words">
        {children}
      </span>
    </div>
  );
}

/**
 * Fiche d'une échéance venue d'une autre page : résumé, état à jour et
 * accès direct au document ou à la tâche.
 */
export function LinkedItemSheet({ item, onClose }) {
  // Dernière fiche gardée pendant l'animation de fermeture
  const lastItemRef = useRef(item);
  if (item) lastItemRef.current = item;
  const shown = item || lastItemRef.current;
  const meta = shown ? LINKED_SOURCE_META[shown.kind] : null;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[420px] sm:max-w-[420px]">
        {shown && meta && (
          <LinkedItemSheetBody item={shown} meta={meta} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function LinkedItemSheetBody({ item, meta, onClose }) {
  const Icon = meta.icon;
  const date = dayToDate(item.day);
  const longDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const amount = formatLinkedAmount(item.amount, item.currency || "EUR");
  const href = linkedItemHref(item);
  const externalUrl = linkedItemExternalUrl(item);
  const hint = hintFor(item, longDate);
  const members = item.assignedMembersInfo || [];
  const relative = relativeDayLabel(item.day, item.state);
  const delayInBadge =
    item.state === "OVERDUE" && OVERDUE_AS_DELAY.has(item.kind);

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              meta.tint,
            )}
            aria-hidden="true"
          >
            <Icon className={cn("size-[18px]", meta.iconClass)} />
          </span>
          <div className="min-w-0">
            <SheetTitle className="text-base">{meta.noun}</SheetTitle>
            <SheetDescription className="text-xs">
              {meta.description}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Separator className="mt-4" />

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="space-y-3">
          <div>
            <p className="text-lg leading-snug font-semibold break-words">
              {item.title}
            </p>
            {item.kind === "TASK" && item.boardTitle ? (
              <p className="text-muted-foreground mt-0.5 text-sm">
                {item.boardEmoji ? `${item.boardEmoji} ` : ""}
                {item.boardTitle}
              </p>
            ) : (
              item.reference && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {item.reference}
                </p>
              )
            )}
          </div>

          {amount && (
            <p
              className={cn(
                "text-3xl font-semibold tracking-tight tabular-nums",
                item.state === "DONE" && "text-muted-foreground",
              )}
            >
              {amount}
              <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                TTC
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {delayInBadge ? (
              <StateBadge item={item} label={relative} />
            ) : (
              <>
                <StateBadge item={item} label={linkedStateLabel(item)} />
                <span className="text-muted-foreground text-xs">
                  {relative}
                </span>
              </>
            )}
            {item.isIndicative && <MentionBadge>Date indicative</MentionBadge>}
            {item.isConditional && (
              <MentionBadge>Selon votre situation</MentionBadge>
            )}
          </div>
        </div>

        <div className="bg-muted/30 space-y-3 rounded-xl border p-4">
          <DetailRow label={DATE_LABELS[item.kind]}>
            {capitalize(longDate)}
          </DetailRow>
          {COUNTERPARTY_LABELS[item.kind] &&
            item.counterparty &&
            item.counterparty !== item.title && (
              <DetailRow label={COUNTERPARTY_LABELS[item.kind]}>
                {item.counterparty}
              </DetailRow>
            )}
          {item.kind !== "TASK" && item.reference && (
            <DetailRow label={REFERENCE_LABELS[item.kind] || "Numéro"}>
              {item.reference}
            </DetailRow>
          )}
          {item.kind === "FISCAL" &&
            FISCAL_ACTION_LABELS[item.documentStatus] && (
              <DetailRow label="Démarche">
                {FISCAL_ACTION_LABELS[item.documentStatus]}
              </DetailRow>
            )}
          {item.kind === "RECURRING_INVOICE" && item.frequency && (
            <DetailRow label="Rythme">
              {capitalize(
                formatRecurrenceFrequency(item.frequency, item.interval),
              )}
            </DetailRow>
          )}
          {item.kind === "TASK" && item.columnTitle && (
            <DetailRow label="Colonne">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.columnColor || "#8E8E93" }}
                  aria-hidden="true"
                />
                {item.columnTitle}
              </span>
            </DetailRow>
          )}
          {item.kind === "TASK" && PRIORITY_LABELS[item.priority] && (
            <DetailRow label="Priorité">
              {PRIORITY_LABELS[item.priority]}
            </DetailRow>
          )}
          {members.length > 0 && (
            <DetailRow label={members.length > 1 ? "Assignés" : "Assigné à"}>
              <span className="flex flex-col gap-1.5">
                {members.map((member) => (
                  <span
                    key={member.userId || member.id}
                    className="flex items-center gap-2"
                  >
                    <UserAvatar
                      src={member.image}
                      name={member.name}
                      size="xs"
                    />
                    <span className="truncate">{member.name}</span>
                  </span>
                ))}
              </span>
            </DetailRow>
          )}
        </div>

        {hint && (
          <p className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{hint}</span>
          </p>
        )}
      </div>

      <SheetFooter className="mt-0 px-6 py-0">
        <Separator className="mb-4" />
        <div className="flex w-full items-center justify-end gap-2 pb-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          {href && (
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-[#5a50ff] hover:bg-[#5a50ff]/90"
            >
              <Link href={href}>
                {meta.openLabel}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {externalUrl && (
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-[#5a50ff] hover:bg-[#5a50ff]/90"
            >
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                {meta.openLabel}
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </Button>
          )}
        </div>
      </SheetFooter>
    </>
  );
}
