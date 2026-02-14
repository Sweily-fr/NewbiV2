"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

const CATEGORY_LABELS = {
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Sous-traitance",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécommunications",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Services publics",
  OTHER: "Autre",
};

const STATUS_LABELS = {
  TO_PROCESS: "À traiter",
  TO_PAY: "À payer",
  PENDING: "En attente",
  PAID: "Payée",
  OVERDUE: "En retard",
  ARCHIVED: "Archivée",
};

export function ExportDialog({ open, onOpenChange, invoices = [] }) {
  const [format, setFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleExport = () => {
    let data = [...invoices];

    // Filter by date
    if (dateFrom) {
      data = data.filter(
        (inv) => new Date(inv.issueDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      data = data.filter(
        (inv) => new Date(inv.issueDate) <= new Date(dateTo)
      );
    }

    if (data.length === 0) {
      toast.error("Aucune facture à exporter");
      return;
    }

    if (format === "csv") {
      exportCSV(data);
    }

    toast.success(`${data.length} facture(s) exportée(s)`);
    onOpenChange(false);
  };

  const exportCSV = (data) => {
    const headers = [
      "Fournisseur",
      "N° Facture",
      "Date d'émission",
      "Échéance",
      "Montant HT",
      "TVA",
      "Montant TTC",
      "Catégorie",
      "Statut",
      "Mode de paiement",
      "Date de paiement",
      "Notes",
    ];

    const rows = data.map((inv) => [
      inv.supplierName || "",
      inv.invoiceNumber || "",
      inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("fr-FR") : "",
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("fr-FR") : "",
      inv.amountHT?.toFixed(2) || "0.00",
      inv.amountTVA?.toFixed(2) || "0.00",
      inv.amountTTC?.toFixed(2) || "0.00",
      CATEGORY_LABELS[inv.category] || inv.category || "",
      STATUS_LABELS[inv.status] || inv.status || "",
      inv.paymentMethod || "",
      inv.paymentDate
        ? new Date(inv.paymentDate).toLocaleDateString("fr-FR")
        : "",
      (inv.notes || "").replace(/"/g, '""'),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.map((c) => `"${c}"`).join(";"))].join(
        "\n"
      );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factures-achat-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter les factures</DialogTitle>
          <DialogDescription>
            Exportez vos factures d&apos;achat au format CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (.csv)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date début</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} à exporter
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
