"use client";

import { memo } from "react";
import { CircleAlert, TrendingDown, TrendingUp } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";
import {
  EVENTS_SOURCE,
  LINKED_KINDS,
  formatLinkedAmount,
} from "@/src/utils/calendar-linked-items";
import { LINKED_SOURCE_META } from "./linked-sources";
import { FiscalSetupHint } from "./fiscal-setup-hint";

const MONEY_KINDS = new Set(["INVOICE", "PURCHASE_INVOICE"]);

const plural = (count, one, many) => (count > 1 ? many : one);
const euros = (amount) => formatLinkedAmount(amount, "EUR", { compact: true });

// Lignes de l'infobulle d'une source (période déjà nommée en titre)
function tooltipLines(kind, stats) {
  const { openCount, overdueCount, doneCount } = stats;
  switch (kind) {
    case "INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture à encaisser", "factures à encaisser")} · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard · ${euros(stats.overdueAmount)}`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "déjà payée", "déjà payées")} · ${euros(stats.doneAmount)}`,
      ];
    case "PURCHASE_INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture à payer", "factures à payer")} · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard · ${euros(stats.overdueAmount)}`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "déjà payée", "déjà payées")} · ${euros(stats.doneAmount)}`,
        stats.foreignCount > 0 &&
          `${stats.foreignCount} en devise étrangère, hors total`,
      ];
    case "QUOTE":
      return [
        `${openCount} ${plural(openCount, "devis arrive", "devis arrivent")} en fin de validité · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} ${plural(overdueCount, "dépassé", "dépassés")} sans réponse`,
        },
      ];
    case "RECURRING_INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture prévue", "factures prévues")} · ${euros(stats.openAmount)}`,
      ];
    case "TASK":
      return [
        `${openCount} ${plural(openCount, "tâche à rendre", "tâches à rendre")}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "terminée", "terminées")}`,
      ];
    case "FISCAL":
      return [
        `${openCount} ${plural(openCount, "échéance à venir", "échéances à venir")}`,
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "date passée", "dates passées")}`,
        "Impôts, TVA et Urssaf, selon vos informations légales",
      ];
    default:
      return [];
  }
}

function SourceChip({
  sourceKey,
  active,
  onToggle,
  value,
  alertCount,
  lines,
  periodTitle,
  loading,
}) {
  const meta = LINKED_SOURCE_META[sourceKey];
  const Icon = meta.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => onToggle(sourceKey)}
          className={cn(
            "focus-visible:ring-ring/50 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border pr-3 pl-1 text-xs transition outline-none focus-visible:ring-[3px]",
            active
              ? "border-border bg-background hover:bg-muted/50 shadow-xs"
              : "border-border/70 text-muted-foreground border-dashed bg-transparent hover:bg-muted/40",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition",
              active ? meta.tint : "bg-muted",
            )}
            aria-hidden="true"
          >
            <Icon
              className={cn(
                "size-3.5",
                active ? meta.iconClass : "text-muted-foreground",
              )}
            />
          </span>
          <span
            className={cn(
              "font-medium",
              !active && "line-through decoration-muted-foreground/60",
            )}
          >
            {meta.label}
          </span>
          {loading ? (
            <span
              className="bg-muted h-3 w-8 animate-pulse rounded"
              aria-hidden="true"
            />
          ) : (
            value !== null && (
              <span className="text-muted-foreground tabular-nums">
                {value}
              </span>
            )
          )}
          {!loading && alertCount > 0 && (
            <span className="inline-flex items-center gap-0.5 font-medium text-red-600 tabular-nums dark:text-red-400">
              <CircleAlert className="size-3" aria-hidden="true" />
              {alertCount}
              <span className="sr-only">{meta.alertLabel || "en retard"}</span>
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-left">
        <p className="font-medium">
          {meta.label} {periodTitle}
        </p>
        {lines.filter(Boolean).map((line, index) => {
          const isAlert = typeof line === "object";
          return (
            <p
              key={index}
              className={cn(
                "mt-0.5",
                isAlert ? "text-red-300" : "text-white/80",
              )}
            >
              {isAlert ? line.text : line}
            </p>
          );
        })}
        <p className="mt-1.5 text-white/50">
          {active ? "Cliquer pour masquer" : "Cliquer pour afficher"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Sources du calendrier : chaque pastille affiche et masque une source et
 * résume la période (montant à encaisser ou à payer, nombre de devis, de
 * factures prévues ou de tâches, retards en rouge avec une icône). À
 * droite, le solde des échéances de la période.
 */
export const CalendarSourcesBar = memo(function CalendarSourcesBar({
  kinds,
  hiddenSources,
  onToggle,
  summary,
  eventsCount,
  period,
  loading,
  fiscalSetup = null,
}) {
  const allowed = LINKED_KINDS.filter((kind) => kinds.includes(kind));
  const showBalance =
    !loading &&
    allowed.includes("INVOICE") &&
    allowed.includes("PURCHASE_INVOICE");
  const balance = summary.balance;

  // Aucune autre page visible (rôle, ou API sans la requête) : le
  // calendrier reste tel qu'avant, sans barre
  if (!loading && allowed.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-2 sm:px-4">
      <div className="-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden">
        <SourceChip
          sourceKey={EVENTS_SOURCE}
          active={!hiddenSources.has(EVENTS_SOURCE)}
          onToggle={onToggle}
          value={String(eventsCount)}
          alertCount={0}
          lines={[
            `${eventsCount} ${plural(eventsCount, "événement", "événements")}, rendez-vous et agendas connectés`,
          ]}
          periodTitle={period.title}
          loading={false}
        />
        {/* Premier chargement : la place des pastilles est réservée */}
        {loading &&
          allowed.length === 0 &&
          [0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className="bg-muted h-8 w-32 shrink-0 animate-pulse rounded-full"
              aria-hidden="true"
            />
          ))}
        {allowed.map((kind) => {
          const stats = summary.byKind[kind];
          return (
            <SourceChip
              key={kind}
              sourceKey={kind}
              active={!hiddenSources.has(kind)}
              onToggle={onToggle}
              value={
                MONEY_KINDS.has(kind)
                  ? euros(stats.openAmount)
                  : String(stats.openCount)
              }
              alertCount={stats.overdueCount}
              lines={tooltipLines(kind, stats)}
              periodTitle={period.title}
              loading={loading}
            />
          );
        })}
      </div>

      {showBalance && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-auto flex shrink-0 items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Solde prévu {period.of}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                  balance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {balance >= 0 ? (
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="size-3.5" aria-hidden="true" />
                )}
                {balance > 0 ? "+" : balance < 0 ? "-" : ""}
                {euros(Math.abs(balance))}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="end"
            className="max-w-64 text-left"
          >
            <p className="font-medium">Solde prévu {period.of}</p>
            <p className="mt-0.5 text-white/80">
              {
                "Factures de vente à encaisser moins factures d'achat à payer, échéances de la période non réglées."
              }
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Ligne à part : l'invitation ne prend pas la place des pastilles */}
      {!loading && allowed.includes("FISCAL") && (
        <FiscalSetupHint setup={fiscalSetup} />
      )}
    </div>
  );
});
