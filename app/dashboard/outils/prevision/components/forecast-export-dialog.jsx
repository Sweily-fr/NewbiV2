"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";

const INCOME_ROWS = [
  { category: "SALES", label: "Ventes", type: "INCOME" },
  { category: "REFUNDS_RECEIVED", label: "Remboursements reçus", type: "INCOME" },
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
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }).toUpperCase();
};

export function ForecastExportDialog({ open, onOpenChange, months }) {
  const handleExport = () => {
    if (!months?.length) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Build category lookup
    const getVal = (month, type, category) => {
      const m = months.find((md) => md.month === month);
      if (!m) return 0;
      const isPast = month < currentMonth;
      const cb = m.categoryBreakdown?.find(
        (c) => c.type === type && c.category === category
      );
      return isPast ? (cb?.actualAmount || 0) : (cb?.forecastAmount || 0);
    };

    const headers = ["Catégorie", ...months.map((m) => formatMonthHeader(m.month))];

    const rows = [];

    // Income section
    rows.push(["ENCAISSEMENTS", ...months.map(() => "")]);
    for (const r of INCOME_ROWS) {
      rows.push([r.label, ...months.map((m) => getVal(m.month, r.type, r.category))]);
    }
    rows.push([
      "Sous-total entrées",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        return isPast ? m.actualIncome : (m.forecastIncome || 0);
      }),
    ]);

    rows.push(["", ...months.map(() => "")]);

    // Expense section
    rows.push(["DECAISSEMENTS", ...months.map(() => "")]);
    for (const r of EXPENSE_ROWS) {
      rows.push([r.label, ...months.map((m) => getVal(m.month, r.type, r.category))]);
    }
    rows.push([
      "Sous-total sorties",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        return isPast ? m.actualExpense : (m.forecastExpense || 0);
      }),
    ]);

    rows.push(["", ...months.map(() => "")]);

    // Balance section
    rows.push([
      "Variation du mois",
      ...months.map((m) => {
        const isPast = m.month < currentMonth;
        const income = isPast ? m.actualIncome : (m.forecastIncome || 0);
        const expense = isPast ? m.actualExpense : (m.forecastExpense || 0);
        return income - expense;
      }),
    ]);
    rows.push(["Solde cumulé", ...months.map((m) => m.closingBalance)]);

    // Build CSV with BOM + semicolon separator
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "number") return cell.toString().replace(".", ",");
            if (typeof cell === "string" && (cell.includes(";") || cell.includes('"'))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(";")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prevision-tresorerie_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Exporter la prévision</DialogTitle>
          <DialogDescription>
            Export au format CSV du tableau prévisionnel complet ({months?.length || 0} mois)
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground">
            Le fichier CSV utilise le séparateur <code>;</code> et est compatible avec Excel (encodage UTF-8 BOM).
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={!months?.length}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
