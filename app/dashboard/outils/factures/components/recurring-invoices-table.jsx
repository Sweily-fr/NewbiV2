"use client";

import { useMemo } from "react";
import { CalendarSync, CircleAlertIcon, TriangleAlert } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TableEmptyState } from "@/src/components/ui/table-empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  formatRecurrenceDay,
  formatRecurrenceFrequency,
} from "@/src/graphql/invoiceRecurrenceQueries";

const COLUMNS = [
  { id: "client", label: "Client", size: 220 },
  { id: "frequency", label: "Rythme", size: 150 },
  { id: "nextRunDate", label: "Prochaine facture", size: 150 },
  { id: "generated", label: "Factures générées", size: 130 },
  { id: "total", label: "Montant TTC", size: 120 },
  { id: "status", label: "Statut", size: 130 },
  { id: "actions", label: "Actions", size: 90 },
];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    className: "bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20",
  },
  PAUSED: {
    label: "Suspendue",
    className:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
  ENDED: {
    label: "Terminée",
    className:
      "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
  },
};

const STATUS_ORDER = { ACTIVE: 0, PAUSED: 1, ENDED: 2 };

const formatCurrency = (value) =>
  value == null
    ? "-"
    : new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(value);

const reference = (recurrence) =>
  [recurrence.sourceInvoice?.prefix, recurrence.sourceInvoice?.number]
    .filter(Boolean)
    .join("-");

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

function StatusChip({ recurrence }) {
  const config = STATUS_CONFIG[recurrence.status] || STATUS_CONFIG.ENDED;
  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
        config.className,
      )}
    >
      {recurrence.lastError && recurrence.status !== "ENDED" && (
        <TriangleAlert className="size-3" />
      )}
      {config.label}
    </span>
  );
  if (!recurrence.lastError || recurrence.status === "ENDED") return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-[280px]">
        {recurrence.lastError}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Onglet « Récurrentes » de la page Factures : une ligne par facture modèle.
 */
export default function RecurringInvoicesTable({
  recurrences = [],
  loading = false,
  error,
  onRetry,
  globalFilter = "",
  onManage,
}) {
  const rows = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    return [...recurrences]
      .filter((r) => {
        if (!q) return true;
        return (
          reference(r).toLowerCase().includes(q) ||
          (r.sourceInvoice?.clientName || "").toLowerCase().includes(q) ||
          (r.sourceInvoice?.clientEmail || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
          (a.nextRunDate || "9999").localeCompare(b.nextRunDate || "9999"),
      );
  }, [recurrences, globalFilter]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircleAlertIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les factures récurrentes
          </p>
          <Button onClick={() => onRetry?.()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  const emptyState = (size) => (
    <TableEmptyState
      icon={CalendarSync}
      title="Aucune facture récurrente"
      description="Dans le menu d'une facture émise, choisissez « Rendre récurrente » pour qu'elle soit recréée et envoyée automatiquement."
      size={size}
    />
  );

  return (
    <div className="flex flex-col flex-1">
      {/* En-têtes - mêmes classes que la table factures */}
      <div className="hidden md:block bg-background">
        <div className="border-b border-border">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                {COLUMNS.map((col, index) => (
                  <th
                    key={col.id}
                    style={{ width: col.size }}
                    className={cn(
                      "h-10 p-2 text-left align-middle font-normal text-xs text-muted-foreground",
                      index === 0 && "pl-4 sm:pl-6",
                      index === COLUMNS.length - 1 && "pr-4 sm:pr-6",
                      col.id === "actions" && "text-right",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Corps - Desktop */}
      <div className="hidden md:flex md:flex-col flex-1">
        <table className="w-full table-fixed">
          <tbody>
            {loading && recurrences.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b">
                  {COLUMNS.map((col, index) => (
                    <td
                      key={col.id}
                      style={{ width: col.size }}
                      className={cn(
                        "p-2",
                        index === 0 && "pl-4 sm:pl-6",
                        index === COLUMNS.length - 1 && "pr-4 sm:pr-6",
                      )}
                    >
                      <Skeleton className="h-4 w-[80px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length > 0 ? (
              rows.map((recurrence) => {
                const ended = recurrence.status === "ENDED";
                return (
                  <tr
                    key={recurrence.id}
                    onClick={() => onManage?.(recurrence)}
                    className={cn(
                      "border-b hover:bg-muted/50 cursor-pointer transition-colors",
                      ended && "text-muted-foreground",
                    )}
                  >
                    <td
                      className="p-2 pl-4 sm:pl-6 align-middle text-[13px]"
                      style={{ width: 220 }}
                    >
                      <div className="min-h-[40px] flex flex-col justify-center min-w-0">
                        <div className="font-normal truncate">
                          {recurrence.sourceInvoice?.clientName || (
                            <span className="italic">Client inconnu</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Modèle {reference(recurrence) || "supprimé"}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 align-middle text-[13px]">
                      {capitalize(
                        formatRecurrenceFrequency(
                          recurrence.frequency,
                          recurrence.interval,
                        ),
                      )}
                    </td>
                    <td className="p-2 align-middle text-[13px]">
                      {recurrence.status === "ACTIVE" && recurrence.nextRunDate
                        ? formatRecurrenceDay(recurrence.nextRunDate, {
                            month: "short",
                          })
                        : "-"}
                      {recurrence.endDate && !ended && (
                        <div className="text-xs text-muted-foreground">
                          jusqu'au{" "}
                          {formatRecurrenceDay(recurrence.endDate, {
                            month: "short",
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-middle text-[13px]">
                      {recurrence.generatedCount}
                    </td>
                    <td className="p-2 align-middle text-[13px]">
                      {formatCurrency(recurrence.sourceInvoice?.finalTotalTTC)}
                    </td>
                    <td className="p-2 align-middle text-[13px]">
                      <StatusChip recurrence={recurrence} />
                    </td>
                    <td
                      className="p-2 pr-4 sm:pr-6 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => onManage(recurrence)}
                        >
                          {ended ? "Reprogrammer" : "Gérer"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="p-0">
                  {emptyState("default")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex-1 overflow-y-auto pb-20">
        {loading && recurrences.length === 0 ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length > 0 ? (
          rows.map((recurrence) => (
            <button
              key={recurrence.id}
              type="button"
              onClick={() => onManage?.(recurrence)}
              className="w-full flex items-center justify-between gap-3 border-b border-gray-50 dark:border-gray-800 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-normal truncate">
                  {recurrence.sourceInvoice?.clientName || "Client inconnu"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {capitalize(
                    formatRecurrenceFrequency(
                      recurrence.frequency,
                      recurrence.interval,
                    ),
                  )}
                  {recurrence.status === "ACTIVE" && recurrence.nextRunDate
                    ? ` · prochaine le ${formatRecurrenceDay(
                        recurrence.nextRunDate,
                        { month: "short" },
                      )}`
                    : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm">
                  {formatCurrency(recurrence.sourceInvoice?.finalTotalTTC)}
                </span>
                <StatusChip recurrence={recurrence} />
              </div>
            </button>
          ))
        ) : (
          emptyState("compact")
        )}
      </div>
    </div>
  );
}
