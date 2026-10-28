"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  BellPlus,
  Check,
  CircleAlert,
  Clock,
  Info,
  Loader2,
  Send,
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
  linkedItemHref,
  relativeDayLabel,
} from "@/src/utils/calendar-linked-items";
import { formatRecurrenceFrequency } from "@/src/graphql/invoiceRecurrenceQueries";
import {
  LINKED_SOURCE_META,
  PRIORITY_LABELS,
  linkedKindDetail,
  linkedStateLabel,
} from "./linked-sources";

const DATE_LABELS = {
  INVOICE: "Échéance",
  PURCHASE_INVOICE: "Échéance",
  QUOTE: "Fin de validité",
  RECURRING_INVOICE: "Émission",
  TASK: "Échéance",
  FORECAST: "Date prévue",
  REMINDER: "Envoi",
  DELIVERY: "Livraison prévue",
  FILE_TRANSFER: "Expiration",
};

const COUNTERPARTY_LABELS = {
  INVOICE: "Client",
  QUOTE: "Client",
  RECURRING_INVOICE: "Client",
  PURCHASE_INVOICE: "Fournisseur",
  REMINDER: "Client",
  DELIVERY: "Client",
  FILE_TRANSFER: "Destinataire",
};

// Montants TTC des documents ; une prévision ou un paiement de transfert
// n'en est pas un
const TTC_KINDS = new Set([
  "INVOICE",
  "PURCHASE_INVOICE",
  "QUOTE",
  "RECURRING_INVOICE",
  "REMINDER",
  "DELIVERY",
]);

const REFERENCE_LABELS = {
  RECURRING_INVOICE: "Facture modèle",
  REMINDER: "Facture",
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Conseil affiché sous les détails selon la source et l'état
function hintFor(item, longDate) {
  switch (`${item.kind}:${item.state}`) {
    case "INVOICE:OVERDUE":
      return `Le paiement était attendu le ${longDate}. Relancez le client, ou marquez la facture payée si le règlement est arrivé.`;
    case "PURCHASE_INVOICE:OVERDUE":
      return `Cette facture fournisseur devait être réglée le ${longDate}.`;
    case "QUOTE:UPCOMING":
      return "Le devis arrive en fin de validité : c'est le bon moment pour relancer le client.";
    case "QUOTE:OVERDUE":
      return "La validité du devis est dépassée sans réponse du client.";
    case "RECURRING_INVOICE:UPCOMING":
    case "RECURRING_INVOICE:OVERDUE":
      return "La facture sera créée à partir de la facture modèle puis envoyée automatiquement au client.";
    case "REMINDER:UPCOMING":
      return item.reminderStatus === "NO_EMAIL"
        ? "Le client n'a pas d'adresse e-mail : ajoutez-en une sur sa fiche pour que la relance parte."
        : "Newbi enverra ce rappel au client si la facture n'est toujours pas payée ce jour-là.";
    case "REMINDER:OVERDUE":
      return "L'envoi de la relance a échoué. Vérifiez l'adresse e-mail du client.";
    case "FORECAST:UPCOMING":
      return "Estimation de la page Prévision : le montant et la date réels peuvent varier.";
    case "DELIVERY:OVERDUE":
      return `La livraison était prévue le ${longDate}.`;
    case "FILE_TRANSFER:UPCOMING":
      return "Passé cette date, le destinataire ne pourra plus télécharger les fichiers.";
    default:
      return null;
  }
}

// Retard d'une échéance de paiement, d'une tâche ou d'une livraison : le
// délai devient le libellé (« En retard de 8 jours »), sans le répéter
const OVERDUE_AS_DELAY = new Set([
  "INVOICE",
  "PURCHASE_INVOICE",
  "TASK",
  "DELIVERY",
]);

function StateBadge({ item, label }) {
  if (!label) return null;
  // Une relance qui ne pourra pas partir est signalée comme un retard
  const isOverdue =
    item.state === "OVERDUE" || item.reminderStatus === "NO_EMAIL";
  const isDone = item.state === "DONE";
  const Icon = isOverdue ? CircleAlert : isDone ? Check : Clock;
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
/**
 * `actions` (facultatif) :
 * - canMarkPaid(item) / onMarkPaid(item) : facture de vente ou d'achat ;
 * - canSendReminder(item) / onSendReminder(item) : rappel immédiat ;
 * - canRemindMe / onRemindMe(item) : nouvel événement pré-rempli.
 */
export function LinkedItemSheet({ item, onClose, actions }) {
  // Dernière fiche gardée pendant l'animation de fermeture
  const lastItemRef = useRef(item);
  if (item) lastItemRef.current = item;
  const shown = item || lastItemRef.current;
  const meta = shown ? LINKED_SOURCE_META[shown.kind] : null;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[420px] sm:max-w-[420px]">
        {shown && meta && (
          <LinkedItemSheetBody
            item={shown}
            meta={meta}
            onClose={onClose}
            actions={actions}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// Facture encore à régler (échéance ou relance d'une facture impayée)
const isUnpaidInvoice = (item) =>
  (item.kind === "INVOICE" && item.state !== "DONE") ||
  (item.kind === "REMINDER" && item.reminderStatus !== "SENT");

function SheetActions({ item, actions }) {
  const [busy, setBusy] = useState(null);
  // Relance : un premier clic arme, un second envoie (3 s pour confirmer)
  const [confirmSend, setConfirmSend] = useState(false);
  useEffect(() => {
    if (!confirmSend) return undefined;
    const timer = setTimeout(() => setConfirmSend(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmSend]);
  useEffect(() => {
    setConfirmSend(false);
  }, [item.id]);

  if (!actions) return null;
  const run = async (key, action) => {
    setBusy(key);
    try {
      await action(item);
    } finally {
      setBusy(null);
    }
  };

  // Une relance à venir : la facture peut être marquée payée d'ici là
  const showMarkPaid =
    (["INVOICE", "PURCHASE_INVOICE"].includes(item.kind)
      ? item.state !== "DONE"
      : item.kind === "REMINDER" && isUnpaidInvoice(item)) &&
    actions.canMarkPaid?.(item);
  const showSend =
    isUnpaidInvoice(item) &&
    item.reminderStatus !== "NO_EMAIL" &&
    actions.canSendReminder?.(item);
  const showRemindMe = actions.canRemindMe && actions.onRemindMe;

  if (!showMarkPaid && !showSend && !showRemindMe) return null;

  // Actions côte à côte, à parts égales
  return (
    <div className="grid w-full auto-cols-fr grid-flow-col gap-2">
      {showMarkPaid && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 px-2 text-xs"
          disabled={!!busy}
          onClick={() => run("paid", actions.onMarkPaid)}
        >
          {busy === "paid" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-3.5" aria-hidden="true" />
          )}
          Marquer payée
        </Button>
      )}
      {showSend && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full gap-1.5 px-2 text-xs",
            confirmSend &&
              "border-[#5a50ff]/50 text-[#5a50ff] hover:text-[#5a50ff]",
          )}
          disabled={!!busy}
          onClick={() => {
            if (!confirmSend) {
              setConfirmSend(true);
              return;
            }
            setConfirmSend(false);
            run("send", actions.onSendReminder);
          }}
        >
          {busy === "send" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-3.5" aria-hidden="true" />
          )}
          {confirmSend ? "Confirmer l'envoi" : "Relancer"}
        </Button>
      )}
      {showRemindMe && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 px-2 text-xs"
          disabled={!!busy}
          onClick={() => actions.onRemindMe(item)}
        >
          <BellPlus className="size-3.5" aria-hidden="true" />
          Me rappeler
        </Button>
      )}
    </div>
  );
}

function LinkedItemSheetBody({ item, meta, onClose, actions }) {
  const Icon = meta.icon;
  const date = dayToDate(item.day);
  const longDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const amount = formatLinkedAmount(item.amount, item.currency || "EUR");
  const amountSign =
    item.kind === "FORECAST" ? (item.flowType === "EXPENSE" ? "- " : "+ ") : "";
  const detail = linkedKindDetail(item);
  const href = linkedItemHref(item);
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
              {detail ? `${detail} · ${meta.description}` : meta.description}
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
              {amountSign}
              {amount}
              <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                {TTC_KINDS.has(item.kind)
                  ? "TTC"
                  : item.kind === "FILE_TRANSFER"
                    ? "à régler pour télécharger"
                    : ""}
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
          {item.kind === "QUOTE" && item.signatureStatus === "PENDING" && (
            <DetailRow label="Signature">
              {item.signatureSentAt
                ? `Envoyée le ${format(new Date(item.signatureSentAt), "d MMMM", { locale: fr })}, en attente`
                : "En attente de signature"}
            </DetailRow>
          )}
          {item.kind === "FORECAST" && (
            <DetailRow label="Mouvement">
              {item.flowType === "INCOME"
                ? "Rentrée d'argent"
                : "Sortie d'argent"}
            </DetailRow>
          )}
          {item.kind === "FILE_TRANSFER" && (
            <DetailRow label="Téléchargements">
              {item.downloadCount || 0}
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
        <div className="flex w-full flex-col gap-2 pb-4">
          <SheetActions item={item} actions={actions} />
          {!actions && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
          )}
          {href && (
            <Button
              asChild
              size="sm"
              className="w-full gap-1.5 bg-[#5a50ff] hover:bg-[#5a50ff]/90"
            >
              <Link href={href}>
                {meta.openLabel}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </SheetFooter>
    </>
  );
}
