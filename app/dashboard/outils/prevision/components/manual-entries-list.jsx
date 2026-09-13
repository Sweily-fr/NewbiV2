"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import {
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Eye,
  EyeOff,
  GitBranch,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  useManualCashflowEntries,
  useHideManualEntryInScenario,
} from "@/src/hooks/useManualCashflowEntries";
import { useForecastScenario } from "@/src/contexts/forecast-scenario-context";
import { ManualEntryDialog } from "./manual-entry-dialog";

const FREQUENCY_LABELS = {
  ONCE: "Ponctuel",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMIANNUAL: "Semestriel",
  ANNUAL: "Annuel",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (entry) => {
  const start = formatDate(entry.startDate);
  if (entry.frequency === "ONCE") return start;
  if (entry.endDate) return `${start} → ${formatDate(entry.endDate)}`;
  return `${start} → ...`;
};

// En Base : les saisies de Base, modifiables. Dans un scénario : les saisies
// propres au scénario (modifiables) + celles de Base, qu'on peut seulement
// masquer dans ce scénario — les modifier ici toucherait Base.
export function ManualEntriesList() {
  const { isScenario, scenarioName } = useForecastScenario();
  const { entries, loading } = useManualCashflowEntries();
  const { setHidden, loading: hiding } = useHideManualEntryInScenario();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openEdit = (entry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Saisies manuelles
          </h3>
          {isScenario && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#5b4fff]/10 px-2 py-0.5 text-[10px] font-medium text-[#5b4fff]">
              <GitBranch size={10} />
              {scenarioName}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {entries.length} entrée{entries.length > 1 ? "s" : ""}
        </span>
      </div>
      <ul className="divide-y divide-border border border-border rounded-md">
        {entries.map((entry) => {
          const isIncome = entry.type === "INCOME";
          const isBaseEntry = !entry.scenarioId;
          const hidden = isScenario && entry.hiddenInScenario;
          return (
            <li
              key={entry.id}
              className={cn(
                "flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors",
                hidden && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={
                    isIncome
                      ? "h-8 w-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0"
                      : "h-8 w-8 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0"
                  }
                >
                  {isIncome ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {FREQUENCY_LABELS[entry.frequency] || entry.frequency}
                    </Badge>
                    {isScenario && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-normal",
                          !isBaseEntry &&
                            "bg-[#5b4fff]/10 text-[#5b4fff] hover:bg-[#5b4fff]/10",
                        )}
                      >
                        {isBaseEntry ? "Base" : scenarioName}
                      </Badge>
                    )}
                    {hidden && (
                      <span className="text-[10px] text-[#5b4fff]/80">
                        masquée dans ce scénario
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateRange(entry)}
                    {entry.amountDelta
                      ? ` · ${entry.amountDelta > 0 ? "+" : ""}${entry.amountDelta}${
                          entry.amountDeltaType === "PERCENT" ? " %" : " €"
                        } par échéance`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={
                    isIncome
                      ? "text-sm font-medium text-green-600"
                      : "text-sm font-medium text-red-600"
                  }
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </span>
                {isScenario && isBaseEntry ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHidden(entry.id, !hidden)}
                      disabled={hiding}
                      className="h-7 w-7"
                      title={
                        hidden
                          ? "Réafficher dans ce scénario"
                          : "Masquer dans ce scénario"
                      }
                    >
                      {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="h-7 w-7"
                            aria-label="Modification indisponible dans un scénario"
                          >
                            <Pencil size={13} />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        Saisie de Base : revenez au scénario Base pour la
                        modifier. Ici vous pouvez seulement la masquer.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(entry)}
                    className="h-7 w-7"
                    title="Modifier"
                  >
                    <Pencil size={13} />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ManualEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
      />
    </>
  );
}
