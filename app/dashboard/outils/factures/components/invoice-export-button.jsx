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

export default function InvoiceExportButton({ invoices }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    if (!selectedFormat) return;

    try {
      // Debug: afficher les informations de filtrage
      console.log("🔍 Export - Informations de debug:");
      console.log("  - Nombre total de factures:", invoices.length);
      console.log("  - Plage de dates sélectionnée:", {
        from: dateRange?.from ? new Date(dateRange.from).toLocaleDateString('fr-FR') : 'non définie',
        to: dateRange?.to ? new Date(dateRange.to).toLocaleDateString('fr-FR') : 'non définie'
      });
      console.log("  - Format:", selectedFormat);
      
      // Afficher quelques factures pour debug
      if (invoices.length > 0) {
        console.log("  - Exemples de factures (données complètes):");
        invoices.slice(0, 2).forEach((inv, idx) => {
          console.log(`    ${idx + 1}. Facture ${inv.number}:`);
          console.log(`       - Total HT: ${inv.finalTotalHT} (type: ${typeof inv.finalTotalHT})`);
          console.log(`       - Total TVA: ${inv.finalTotalVAT} (type: ${typeof inv.finalTotalVAT})`);
          console.log(`       - Total TTC: ${inv.finalTotalTTC} (type: ${typeof inv.finalTotalTTC})`);
          console.log(`       - Client: ${inv.client?.name || 'N/A'}`);
          console.log(`       - Statut: ${inv.status}`);
        });
      }

      if (selectedFormat === "csv") {
        exportToCSV(invoices, dateRange);
        toast.success("Export CSV réussi", {
          description: "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "excel") {
        exportToExcel(invoices, dateRange);
        toast.success("Export Excel réussi", {
          description: "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "fec") {
        exportToFEC(invoices, dateRange);
        toast.success("Export FEC réussi", {
          description: "Fichier des Écritures Comptables généré avec succès.",
        });
      } else if (selectedFormat === "sage") {
        exportToSage(invoices, dateRange);
        toast.success("Export Sage Compta réussi", {
          description: "Le fichier a été téléchargé avec succès.",
        });
      } else if (selectedFormat === "cegid") {
        exportToCegid(invoices, dateRange);
        toast.success("Export Cegid Expert réussi", {
          description: "Le fichier a été téléchargé avec succès.",
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
              {selectedFormat === "fec" 
                ? "Format légal obligatoire pour l'administration fiscale française. Génère les écritures comptables au format normalisé."
                : selectedFormat === "sage"
                ? "Format compatible avec Sage 100 et Sage 1000. Import direct dans votre logiciel comptable."
                : selectedFormat === "cegid"
                ? "Format compatible avec Cegid Expert. Import direct dans votre logiciel comptable."
                : "Sélectionnez une plage de dates pour filtrer les factures à exporter. Laissez vide pour exporter toutes les factures."
              }
            </DialogDescription>
          </DialogHeader>
          
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
