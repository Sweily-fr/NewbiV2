"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { CornerDownLeft, LoaderCircle } from "lucide-react";
import { ExportIcon } from "@/src/components/icons";
import { format } from "date-fns";
import { useState } from "react";

const INCOME_ROWS = [
  { category: "SALES", label: "Ventes", type: "INCOME" },
  {
    category: "REFUNDS_RECEIVED",
    label: "Remboursements reçus",
    type: "INCOME",
  },
  { category: "OTHER_INCOME", label: "Autres revenus", type: "INCOME" },
];

const EXPENSE_ROWS = [
  { category: "RENT", label: "Loyer", type: "EXPENSE" },
  { category: "SUBSCRIPTIONS", label: "Abonnements", type: "EXPENSE" },
  { category: "SERVICES", label: "Sous-traitance", type: "EXPENSE" },
  { category: "OFFICE_SUPPLIES", label: "Fournitures", type: "EXPENSE" },
  { category: "TRANSPORT", label: "Transport", type: "EXPENSE" },
  { category: "INSURANCE", label: "Assurance", type: "EXPENSE" },
  { category: "TAXES", label: "Impôts & taxes", type: "EXPENSE" },
  { category: "SALARIES", label: "Salaires", type: "EXPENSE" },
  { category: "SOFTWARE", label: "Logiciels", type: "EXPENSE" },
  { category: "MARKETING", label: "Marketing", type: "EXPENSE" },
  { category: "OTHER_EXPENSE", label: "Autres dépenses", type: "EXPENSE" },
];

const formatMonthHeader = (monthStr) => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
    .toUpperCase();
};

export function ForecastExportDialog({ open, onOpenChange, months }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!months?.length) return;
    setExporting(true);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const getVal = (month, type, category) => {
      const m = months.find((md) => md.month === month);
      if (!m) return 0;
      const isPast = month < currentMonth;
      const cb = m.categoryBreakdown?.find(
        (c) => c.type === type && c.category === category,
      );
      return isPast ? cb?.actualAmount || 0 : cb?.forecastAmount || 0;
    };

    const headers = [
      "Catégorie",
      ...months.map((m) => formatMonthHeader(m.month)),
    ];
    const rows = [];

    rows.push(["ENCAISSEMENTS", ...months.map(() => "")]);
    for (const r of INCOME_ROWS) {
      rows.push([
        r.label,
        ...months.map((m) => getVal(m.month, r.type, r.category)),
      ]);
    }
    rows.push([
      "Sous-total entrées",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        return isPast ? m.actualIncome : m.forecastIncome || 0;
      }),
    ]);

    rows.push(["", ...months.map(() => "")]);

    rows.push(["DECAISSEMENTS", ...months.map(() => "")]);
    for (const r of EXPENSE_ROWS) {
      rows.push([
        r.label,
        ...months.map((m) => getVal(m.month, r.type, r.category)),
      ]);
    }
    rows.push([
      "Sous-total sorties",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        return isPast ? m.actualExpense : m.forecastExpense || 0;
      }),
    ]);

    rows.push(["", ...months.map(() => "")]);

    rows.push([
      "Variation du mois",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        const income = isPast ? m.actualIncome : m.forecastIncome || 0;
        const expense = isPast ? m.actualExpense : m.forecastExpense || 0;
        return income - expense;
      }),
    ]);
    rows.push(["Solde cumulé", ...months.map((m) => m.closingBalance)]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "number")
              return cell.toString().replace(".", ",");
            if (
              typeof cell === "string" &&
              (cell.includes(";") || cell.includes('"'))
            ) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(";"),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prevision-tresorerie_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setExporting(false);
      onOpenChange(false);
    }, 500);
  };

  const monthCount = months?.length || 0;
  const firstMonth = months?.[0]?.month;
  const lastMonth = months?.[months?.length - 1]?.month;

  const formatPeriodLabel = (monthStr) => {
    if (!monthStr) return "";
    const [y, m] = monthStr.split("-");
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <ExportIcon className="size-4" />
              Exporter la prévision
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pt-4 pb-0 space-y-4">
            {/* Period info */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Période exportée
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-sm text-foreground">
                  {formatPeriodLabel(firstMonth)} →{" "}
                  {formatPeriodLabel(lastMonth)}
                </p>
                <span className="text-xs text-muted-foreground ml-auto">
                  {monthCount} mois
                </span>
              </div>
            </div>

            {/* Content info */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Contenu du fichier
              </label>
              <ul className="text-sm text-foreground/80 space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  Encaissements par catégorie
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  Décaissements par catégorie
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  Variation mensuelle et solde cumulé
                </li>
              </ul>
            </div>

            {/* Format info */}
            <p className="text-xs text-muted-foreground/60">
              Format CSV · Séparateur ; · Compatible Excel
            </p>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-border/40 mt-4 px-5 py-3 -mx-5">
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={!months?.length || exporting}
                className="gap-2"
              >
                {exporting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    Télécharger le CSV
                    <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                      <CornerDownLeft className="size-3" />
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
