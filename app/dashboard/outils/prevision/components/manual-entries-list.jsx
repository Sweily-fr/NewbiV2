"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Plus, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";
import { useManualCashflowEntries } from "@/src/hooks/useManualCashflowEntries";
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

export function ManualEntriesList() {
  const { entries, loading } = useManualCashflowEntries();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (entry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Saisies manuelles
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Projettez un flux ponctuel ou récurrent dans votre prévisionnel.
            </p>
          </div>
          <Button size="sm" onClick={openCreate} className="cursor-pointer">
            <Plus size={14} className="mr-1.5" />
            Ajouter une entrée
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Aucune saisie manuelle pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-md">
            {entries.map((entry) => {
              const isIncome = entry.type === "INCOME";
              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
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
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateRange(entry)}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(entry)}
                      className="h-7 w-7"
                    >
                      <Pencil size={13} />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <ManualEntryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          entry={editing}
        />
      </CardContent>
    </Card>
  );
}
