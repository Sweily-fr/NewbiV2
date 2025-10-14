"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileCheck, Building, Building2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { DateRangePicker } from "@/src/components/ui/date-range-picker";
import { exportToCSV, exportToExcel, exportToFEC, exportToSage, exportToCegid } from "@/src/utils/invoice-export";
import { toast } from "sonner";

export default function InvoiceExportButton({ invoices, selectedRows = [] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // Déterminer si on exporte les factures sélectionnées ou toutes les factures
  const hasSelection = selectedRows && selectedRows.length > 0;
  
  // Debug: vérifier la structure de selectedRows
  if (hasSelection && selectedRows.length > 0) {
    console.log("🔍 Structure selectedRows:", selectedRows[0]);
  }
  
  const invoicesToExport = hasSelection 
    ? selectedRows.map(row => {
        // TanStack Table peut utiliser row.original OU directement row
        return row.original || row;
      }).filter(Boolean) 
    : (invoices || []);

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    if (!selectedFormat) return;

    try {
      // Debug AVANT transformation
      console.log("🔍 DEBUG AVANT EXPORT:");
      console.log("  - hasSelection:", hasSelection);
      console.log("  - selectedRows:", selectedRows);
      console.log("  - selectedRows.length:", selectedRows?.length);
      console.log("  - invoices:", invoices);
      console.log("  - invoices.length:", invoices?.length);
      console.log("  - invoicesToExport:", invoicesToExport);
      console.log("  - invoicesToExport.length:", invoicesToExport?.length);
      
      // Utiliser les factures sélectionnées ou toutes les factures
      const finalInvoices = invoicesToExport;
      
      // Si des factures sont sélectionnées, ne pas appliquer le filtre de date
      const finalDateRange = hasSelection ? null : dateRange;
      
      // Debug: afficher les informations de filtrage
      console.log("🔍 Export - Informations de debug:");
      console.log("  - Mode:", hasSelection ? "Factures sélectionnées" : "Toutes les factures");
      console.log("  - Nombre de factures à exporter:", finalInvoices.length);
      if (!hasSelection && dateRange?.from && dateRange?.to) {
        console.log("  - Plage de dates:", {
          from: new Date(dateRange.from).toLocaleDateString('fr-FR'),
          to: new Date(dateRange.to).toLocaleDateString('fr-FR')
        });
      }
      console.log("  - Format:", selectedFormat);
      
      // Afficher quelques factures pour debug
      if (finalInvoices.length > 0) {
        console.log("  - Exemples de factures:");
        finalInvoices.slice(0, 2).forEach((inv, idx) => {
          console.log(`    ${idx + 1}. Facture ${inv.number}:`);
          console.log(`       - Total HT: ${inv.finalTotalHT}`);
          console.log(`       - Total TVA: ${inv.finalTotalVAT}`);
          console.log(`       - Total TTC: ${inv.finalTotalTTC}`);
          console.log(`       - Client: ${inv.client?.name || 'N/A'}`);
        });
      }

      if (selectedFormat === "csv") {
        exportToCSV(finalInvoices, finalDateRange);
        toast.success("Export CSV réussi", {
          description: hasSelection 
            ? `${finalInvoices.length} facture(s) sélectionnée(s) exportée(s).`
            : "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "excel") {
        exportToExcel(finalInvoices, finalDateRange);
        toast.success("Export Excel réussi", {
          description: hasSelection 
            ? `${finalInvoices.length} facture(s) sélectionnée(s) exportée(s).`
            : "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "fec") {
        exportToFEC(finalInvoices, finalDateRange);
        toast.success("Export FEC réussi", {
          description: hasSelection 
            ? `${finalInvoices.length} facture(s) sélectionnée(s) exportée(s).`
            : "Fichier des Écritures Comptables généré avec succès.",
        });
      } else if (selectedFormat === "sage") {
        exportToSage(finalInvoices, finalDateRange);
        toast.success("Export Sage Compta réussi", {
          description: hasSelection 
            ? `${finalInvoices.length} facture(s) sélectionnée(s) exportée(s).`
            : "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "cegid") {
        exportToCegid(finalInvoices, finalDateRange);
        toast.success("Export Cegid Expert réussi", {
          description: hasSelection 
            ? `${finalInvoices.length} facture(s) sélectionnée(s) exportée(s).`
            : "Le fichier a été téléchargé avec succès.",
        });
      }
      
      // Réinitialiser et fermer
      setIsDialogOpen(false);
      setDateRange({ from: undefined, to: undefined });
      setSelectedFormat(null);
    } catch (error) {
      console.error("❌ Erreur d'export:", error);
      toast.error("Erreur d'export", {
        description: error.message || "Une erreur est survenue lors de l'export.",
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setDateRange({ from: undefined, to: undefined });
    setSelectedFormat(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-normal">
            <Download className="mr-2 h-4 w-4" />
            Exporter
            {hasSelection && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {selectedRows.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>Formats standards</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFormatSelect("csv")}>
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatSelect("excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Formats comptables</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFormatSelect("fec")}>
            <FileCheck className="mr-2 h-4 w-4" />
            FEC (Format légal)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatSelect("sage")}>
            <Building className="mr-2 h-4 w-4" />
            Sage Compta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatSelect("cegid")}>
            <Building2 className="mr-2 h-4 w-4" />
            Cegid Expert
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Exporter en {
                selectedFormat === "csv" ? "CSV" :
                selectedFormat === "excel" ? "Excel" :
                selectedFormat === "fec" ? "FEC" :
                selectedFormat === "sage" ? "Sage Compta" :
                selectedFormat === "cegid" ? "Cegid Expert" :
                selectedFormat
              }
            </DialogTitle>
            <DialogDescription>
              {hasSelection ? (
                <span className="font-medium text-primary">
                  {invoicesToExport.length} facture(s) sélectionnée(s) sera(ont) exportée(s).
                </span>
              ) : selectedFormat === "fec" ? (
                "Format légal obligatoire pour l'administration fiscale française. Génère les écritures comptables au format normalisé."
              ) : selectedFormat === "sage" ? (
                "Format compatible avec Sage 100 et Sage 1000. Import direct dans votre logiciel comptable."
              ) : selectedFormat === "cegid" ? (
                "Format compatible avec Cegid Expert. Import direct dans votre logiciel comptable."
              ) : (
                "Sélectionnez une plage de dates pour filtrer les factures à exporter. Laissez vide pour exporter toutes les factures."
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!hasSelection && (
            <div className="py-4">
              <DateRangePicker date={dateRange} setDate={setDateRange} />
              
              {dateRange?.from && dateRange?.to && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Les factures entre ces dates seront exportées.
                </p>
              )}
              
              {!dateRange?.from && !dateRange?.to && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Toutes les factures seront exportées.
                </p>
              )}
            </div>
          )}
          
          {hasSelection && invoicesToExport.length > 0 && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Factures sélectionnées :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {invoicesToExport.slice(0, 5).map((inv) => inv && (
                    <li key={inv.id}>
                      • Facture {inv.prefix || ""}{inv.number} - {inv.client?.name || "Client inconnu"}
                    </li>
                  ))}
                  {invoicesToExport.length > 5 && (
                    <li className="text-xs italic">
                      ... et {invoicesToExport.length - 5} autre(s)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
