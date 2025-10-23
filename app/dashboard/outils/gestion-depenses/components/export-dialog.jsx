"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/src/lib/utils";
import * as XLSX from "xlsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

export function ExportDialog({ open, onOpenChange, transactions, members }) {
  const [exportType, setExportType] = useState("excel");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // Filtrer les transactions selon les critères
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filtre par type de dépense
    if (expenseTypeFilter !== "all") {
      filtered = filtered.filter((t) => {
        if (expenseTypeFilter === "ORGANIZATION") {
          return t.expenseType === "ORGANIZATION" || !t.expenseType;
        }
        return t.expenseType === expenseTypeFilter;
      });
    }

    // Filtre par membre
    if (memberFilter !== "all" && expenseTypeFilter === "EXPENSE_REPORT") {
      filtered = filtered.filter(
        (t) => t.assignedMember?.userId === memberFilter
      );
    }

    // Filtre par plage de dates
    if (dateRange?.from) {
      filtered = filtered.filter((t) => {
        try {
          // Convertir la date de la transaction en Date
          let transactionDate;
          if (typeof t.date === 'string') {
            // Si c'est un timestamp en millisecondes (string)
            if (t.date.match(/^\d+$/)) {
              transactionDate = new Date(parseInt(t.date));
            } else {
              transactionDate = new Date(t.date);
            }
          } else if (typeof t.date === 'number') {
            transactionDate = new Date(t.date);
          } else {
            transactionDate = new Date(t.date);
          }
          
          // Extraire la date locale (YYYY-MM-DD) de la transaction
          const transactionDateStr = transactionDate.toLocaleDateString('en-CA'); // Format YYYY-MM-DD
          const transactionDateOnly = new Date(transactionDateStr);
          
          // Extraire la date locale du calendrier
          const fromDate = new Date(dateRange.from);
          const fromDateStr = fromDate.toLocaleDateString('en-CA');
          const fromDateOnly = new Date(fromDateStr);
          
          if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            const toDateStr = toDate.toLocaleDateString('en-CA');
            const toDateOnly = new Date(toDateStr);
            
            return transactionDateOnly >= fromDateOnly && transactionDateOnly <= toDateOnly;
          }
          
          return transactionDateOnly >= fromDateOnly;
        } catch (error) {
          console.error('Erreur filtrage date:', error, 'dateRange:', dateRange, 't.date:', t.date);
          return true;
        }
      });
    }

    return filtered;
  };

  // Préparer les données pour l'export
  const prepareExportData = () => {
    const filtered = getFilteredTransactions();

    return filtered.map((transaction) => {
      // Formater la date de manière sécurisée
      let formattedDate = "";
      try {
        let dateObj;
        
        if (typeof transaction.date === 'string') {
          // Si c'est une string au format YYYY-MM-DD, utiliser directement
          if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date.split('-').reverse().join('/');
          } else if (transaction.date.match(/^\d+$/)) {
            // Si c'est un timestamp en millisecondes
            dateObj = new Date(parseInt(transaction.date));
            if (!isNaN(dateObj.getTime())) {
              formattedDate = format(dateObj, "dd/MM/yyyy", { locale: fr });
            }
          } else {
            // Sinon, essayer de parser comme date ISO
            dateObj = new Date(transaction.date);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = format(dateObj, "dd/MM/yyyy", { locale: fr });
            }
          }
        } else if (transaction.date instanceof Date) {
          if (!isNaN(transaction.date.getTime())) {
            formattedDate = format(transaction.date, "dd/MM/yyyy", { locale: fr });
          }
        } else if (typeof transaction.date === 'number') {
          // Timestamp en millisecondes
          dateObj = new Date(transaction.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = format(dateObj, "dd/MM/yyyy", { locale: fr });
          }
        } else if (transaction.date) {
          // Essayer de convertir en Date
          dateObj = new Date(transaction.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = format(dateObj, "dd/MM/yyyy", { locale: fr });
          } else {
            formattedDate = String(transaction.date);
          }
        }
      } catch (error) {
        console.error('Erreur formatage date:', transaction.date, error);
        formattedDate = transaction.date ? String(transaction.date) : "";
      }

      return {
        Date: formattedDate,
        Description: transaction.description || transaction.title || "",
        Catégorie: transaction.category || "",
        Montant: transaction.amount,
        Devise: transaction.currency || "EUR",
        Type: transaction.type === "EXPENSE" ? "Dépense" : "Revenu",
        "Type de dépense":
          transaction.expenseType === "EXPENSE_REPORT"
            ? "Note de frais"
            : transaction.expenseType === "ORGANIZATION"
            ? "Organisation"
            : "",
        "Membre assigné": transaction.assignedMember?.name || "",
        Fournisseur: transaction.vendor || "",
        "Moyen de paiement": transaction.paymentMethod || "",
        Justificatif: transaction.files?.length > 0 ? "Oui" : "Non",
        Statut: transaction.status || "",
      };
    });
  };

  // Export Excel
  const exportToExcel = () => {
    const data = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dépenses");

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 30 }, // Description
      { wch: 15 }, // Catégorie
      { wch: 10 }, // Montant
      { wch: 8 },  // Devise
      { wch: 10 }, // Type
      { wch: 18 }, // Type de dépense
      { wch: 20 }, // Membre assigné
      { wch: 20 }, // Fournisseur
      { wch: 18 }, // Moyen de paiement
      { wch: 12 }, // Justificatif
      { wch: 10 }, // Statut
    ];
    ws["!cols"] = colWidths;

    const fileName = `depenses_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export CSV
  const exportToCSV = () => {
    const data = prepareExportData();
    
    // Créer l'en-tête
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(";"),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          // Échapper les guillemets et entourer de guillemets si nécessaire
          if (typeof value === "string" && (value.includes(";") || value.includes('"') || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(";")
      ),
    ].join("\n");

    // Créer le blob avec BOM pour Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `depenses_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (exportType === "excel") {
      exportToExcel();
    } else {
      exportToCSV();
    }
    onOpenChange(false);
  };

  const filteredCount = getFilteredTransactions().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exporter les dépenses</DialogTitle>
          <DialogDescription>
            Sélectionnez le format et les filtres pour exporter vos dépenses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format d'export */}
          <div className="space-y-2">
            <Label>Format d'export</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Excel (.xlsx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>CSV (.csv)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type de dépense */}
          <div className="space-y-2">
            <Label>Type de dépense</Label>
            <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dépenses</SelectItem>
                <SelectItem value="ORGANIZATION">Dépenses de l'organisation</SelectItem>
                <SelectItem value="EXPENSE_REPORT">Notes de frais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Membre assigné (seulement pour les notes de frais) */}
          {expenseTypeFilter === "EXPENSE_REPORT" && (
            <div className="space-y-2">
              <Label>Membre assigné</Label>
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les membres</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plage de dates */}
          <div className="space-y-2">
            <Label>Plage de dates</Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange?.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: fr })
                      )
                    ) : (
                      <span>Sélectionner une période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="h-8"
                >
                  Réinitialiser les dates
                </Button>
              )}
            </div>
          </div>

          {/* Compteur de transactions filtrées */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredCount}</span>{" "}
              {filteredCount > 1 ? "transactions" : "transaction"} à exporter
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={filteredCount === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
