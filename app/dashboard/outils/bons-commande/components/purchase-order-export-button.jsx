"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Building,
  Building2,
  ArrowRightFromLine,
} from "lucide-react";
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
import {
  exportToCSV,
  exportToExcel,
  exportToFEC,
  exportToSage,
  exportToCegid,
} from "@/src/utils/purchase-order-export";
import { toast } from "@/src/components/ui/sonner";
import { usePermissions } from "@/src/hooks/usePermissions";

export default function PurchaseOrderExportButton({
  purchaseOrders,
  selectedRows = [],
  dropdownOpen,
  onDropdownOpenChange,
  iconOnly = false,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [canExportPO, setCanExportPO] = useState(false);
  const { canExport } = usePermissions();

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canExport("purchaseOrders");
      setCanExportPO(allowed);
    };
    checkPermission();
  }, [canExport]);

  const hasSelection = selectedRows && selectedRows.length > 0;

  const poToExport = hasSelection
    ? selectedRows
        .map((row) => row.original || row)
        .filter(Boolean)
    : purchaseOrders || [];

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    if (!selectedFormat) return;

    try {
      const finalPOs = poToExport;
      const finalDateRange = hasSelection ? null : dateRange;

      if (selectedFormat === "csv") {
        exportToCSV(finalPOs, finalDateRange);
        toast.success(`${finalPOs.length} bon(s) de commande exporté(s) en CSV`);
      } else if (selectedFormat === "excel") {
        exportToExcel(finalPOs, finalDateRange);
        toast.success(`${finalPOs.length} bon(s) de commande exporté(s) en Excel`);
      } else if (selectedFormat === "fec") {
        exportToFEC(finalPOs, finalDateRange);
        toast.success(`${finalPOs.length} bon(s) de commande exporté(s) au format FEC`);
      } else if (selectedFormat === "sage") {
        exportToSage(finalPOs, finalDateRange);
        toast.success(`${finalPOs.length} bon(s) de commande exporté(s) pour Sage`);
      } else if (selectedFormat === "cegid") {
        exportToCegid(finalPOs, finalDateRange);
        toast.success(`${finalPOs.length} bon(s) de commande exporté(s) pour Cegid`);
      }

      setIsDialogOpen(false);
      setDateRange({ from: undefined, to: undefined });
      setSelectedFormat(null);
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue lors de l'export");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setDateRange({ from: undefined, to: undefined });
    setSelectedFormat(null);
  };

  if (!canExportPO) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          {iconOnly ? (
            <Button variant="secondary" size="icon">
              <ArrowRightFromLine className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button variant="outline" className="font-normal cursor-pointer">
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
              Exporter
              {hasSelection && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white dark:text-black">
                  {selectedRows.length}
                </span>
              )}
            </Button>
          )}
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
              Exporter en{" "}
              {selectedFormat === "csv"
                ? "CSV"
                : selectedFormat === "excel"
                  ? "Excel"
                  : selectedFormat === "fec"
                    ? "FEC"
                    : selectedFormat === "sage"
                      ? "Sage Compta"
                      : selectedFormat === "cegid"
                        ? "Cegid Expert"
                        : selectedFormat}
            </DialogTitle>
            <DialogDescription>
              {hasSelection ? (
                <span className="font-medium text-primary">
                  {poToExport.length} bon(s) de commande sélectionné(s) sera(ont)
                  exporté(s).
                </span>
              ) : selectedFormat === "fec" ? (
                "Format légal obligatoire pour l'administration fiscale française. Génère les écritures comptables au format normalisé."
              ) : selectedFormat === "sage" ? (
                "Format compatible avec Sage 100 et Sage 1000. Import direct dans votre logiciel comptable."
              ) : selectedFormat === "cegid" ? (
                "Format compatible avec Cegid Expert. Import direct dans votre logiciel comptable."
              ) : (
                "Sélectionnez une plage de dates pour filtrer les bons de commande à exporter. Laissez vide pour exporter tous les bons de commande."
              )}
            </DialogDescription>
          </DialogHeader>

          {!hasSelection && (
            <div className="py-4">
              <DateRangePicker date={dateRange} setDate={setDateRange} />

              {dateRange?.from && dateRange?.to && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Les bons de commande entre ces dates seront exportés.
                </p>
              )}

              {!dateRange?.from && !dateRange?.to && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tous les bons de commande seront exportés.
                </p>
              )}
            </div>
          )}

          {hasSelection && poToExport.length > 0 && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">
                  Bons de commande sélectionnés :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {poToExport.slice(0, 5).map(
                    (po) =>
                      po && (
                        <li key={po.id}>
                          • BC {po.prefix || ""}
                          {po.number} - {po.client?.name || "Client inconnu"}
                        </li>
                      )
                  )}
                  {poToExport.length > 5 && (
                    <li className="text-xs italic">
                      ... et {poToExport.length - 5} autre(s)
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
