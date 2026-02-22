"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import {
  exportAnalyticsCSV,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
} from "@/src/utils/analytics-export";

const FORMATS = [
  {
    value: "csv",
    label: "CSV",
    icon: FileText,
    description: "Fichier CSV compatible Excel",
  },
  {
    value: "excel",
    label: "Excel",
    icon: FileSpreadsheet,
    description: "Classeur Excel (.xlsx)",
  },
  {
    value: "pdf",
    label: "PDF",
    icon: FileDown,
    description: "Document PDF",
  },
];

const TAB_OPTIONS = [
  { value: "all", label: "Tous les onglets" },
  { value: "synthese", label: "Synthèse" },
  { value: "rentabilite", label: "Rentabilité" },
  { value: "tresorerie", label: "Trésorerie & Recouvrement" },
  { value: "commercial", label: "Commercial" },
  { value: "detail", label: "Détail & Export" },
];

export function AnalyticsExportDialog({ open, onOpenChange, analyticsData, dateRange }) {
  const [format, setFormat] = useState("excel");
  const [tab, setTab] = useState("all");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!analyticsData) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    setExporting(true);
    try {
      const period = `${dateRange.startDate}_${dateRange.endDate}`;
      switch (format) {
        case "csv":
          exportAnalyticsCSV(analyticsData, tab, period);
          break;
        case "excel":
          exportAnalyticsExcel(analyticsData, tab, period);
          break;
        case "pdf":
          exportAnalyticsPDF(analyticsData, tab, period);
          break;
      }
      toast.success("Export terminé");
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter les analytiques</DialogTitle>
          <DialogDescription>
            Choisissez le format et les données à exporter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors ${
                      format === f.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contenu</Label>
            <div className="space-y-1">
              {TAB_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    tab === t.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Export en cours..." : "Exporter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
