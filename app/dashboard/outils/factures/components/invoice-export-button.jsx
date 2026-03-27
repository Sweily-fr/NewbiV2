"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Building,
  Building2,
  ArrowRightFromLine,
  Info,
  Lock,
} from "lucide-react";
import { BsFiletypeCsv, BsFiletypeXlsx } from "react-icons/bs";
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
} from "@/src/utils/invoice-export";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { toast } from "@/src/components/ui/sonner";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { getPlanLimits } from "@/src/lib/plan-limits";

const FORMAT_CONFIG = {
  csv: {
    label: "CSV",
    icon: ({ className }) => (
      <BsFiletypeCsv className={className} style={{ color: "#22C55E" }} />
    ),
    description:
      "Sélectionnez une plage de dates pour filtrer les factures à exporter.",
  },
  excel: {
    label: "Excel",
    icon: ({ className }) => (
      <BsFiletypeXlsx className={className} style={{ color: "#16A34A" }} />
    ),
    description:
      "Sélectionnez une plage de dates pour filtrer les factures à exporter.",
  },
  fec: {
    label: "FEC (Format légal)",
    icon: ({ className }) => (
      <FileText className={className} style={{ color: "#3B82F6" }} />
    ),
    description:
      "Format légal obligatoire pour l'administration fiscale française.",
  },
  sage: {
    label: "Sage Compta",
    icon: Building,
    description: "Format compatible avec Sage 100 et Sage 1000.",
  },
  cegid: {
    label: "Cegid Expert",
    icon: Building2,
    description: "Format compatible avec Cegid Expert.",
  },
};

export default function InvoiceExportButton({
  invoices,
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
  const [canExportInvoices, setCanExportInvoices] = useState(false);
  const { canExport } = usePermissions();
  const { subscription } = useSubscription();
  const allowedExports = getPlanLimits(subscription?.plan).exports;

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canExport("invoices");
      setCanExportInvoices(allowed);
    };
    checkPermission();
  }, [canExport]);

  const hasSelection = selectedRows && selectedRows.length > 0;

  const invoicesToExport = hasSelection
    ? selectedRows.map((row) => row.original || row).filter(Boolean)
    : invoices || [];

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    if (!selectedFormat) return;

    try {
      const finalInvoices = invoicesToExport;
      const finalDateRange = hasSelection ? null : dateRange;

      if (selectedFormat === "csv") {
        exportToCSV(finalInvoices, finalDateRange);
        toast.success(`${finalInvoices.length} facture(s) exportée(s) en CSV`);
      } else if (selectedFormat === "excel") {
        exportToExcel(finalInvoices, finalDateRange);
        toast.success(
          `${finalInvoices.length} facture(s) exportée(s) en Excel`,
        );
      } else if (selectedFormat === "fec") {
        exportToFEC(finalInvoices, finalDateRange);
        toast.success(
          `${finalInvoices.length} facture(s) exportée(s) au format FEC`,
        );
      } else if (selectedFormat === "sage") {
        exportToSage(finalInvoices, finalDateRange);
        toast.success(
          `${finalInvoices.length} facture(s) exportée(s) pour Sage`,
        );
      } else if (selectedFormat === "cegid") {
        exportToCegid(finalInvoices, finalDateRange);
        toast.success(
          `${finalInvoices.length} facture(s) exportée(s) pour Cegid`,
        );
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

  if (!canExportInvoices) {
    return null;
  }

  const formatConfig = selectedFormat ? FORMAT_CONFIG[selectedFormat] : null;
  const FormatIcon = formatConfig?.icon;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          {iconOnly ? (
            <Button variant="secondary" size="icon">
              <ArrowRightFromLine className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button variant="outline" className="cursor-pointer">
              <ArrowRightFromLine size={14} strokeWidth={1.5} />
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
            <BsFiletypeCsv
              className="mr-2 h-4 w-4"
              style={{ color: "#22C55E" }}
            />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatSelect("excel")}>
            <BsFiletypeXlsx
              className="mr-2 h-4 w-4"
              style={{ color: "#16A34A" }}
            />
            Excel
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Formats comptables</DropdownMenuLabel>
          {allowedExports.includes("fec") ? (
            <DropdownMenuItem onClick={() => handleFormatSelect("fec")}>
              <FileText className="mr-2 h-4 w-4 text-blue-500" />
              FEC (Format légal)
            </DropdownMenuItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem disabled className="opacity-50">
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  FEC (Format légal)
                  <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="left">
                Disponible avec le plan PME ou supérieur
              </TooltipContent>
            </Tooltip>
          )}
          {allowedExports.includes("sage") ? (
            <DropdownMenuItem onClick={() => handleFormatSelect("sage")}>
              <Building className="mr-2 h-4 w-4" />
              Sage Compta
            </DropdownMenuItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem disabled className="opacity-50">
                  <Building className="mr-2 h-4 w-4" />
                  Sage Compta
                  <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="left">
                Disponible avec le plan Entreprise
              </TooltipContent>
            </Tooltip>
          )}
          {allowedExports.includes("cegid") ? (
            <DropdownMenuItem onClick={() => handleFormatSelect("cegid")}>
              <Building2 className="mr-2 h-4 w-4" />
              Cegid Expert
            </DropdownMenuItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem disabled className="opacity-50">
                  <Building2 className="mr-2 h-4 w-4" />
                  Cegid Expert
                  <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="left">
                Disponible avec le plan Entreprise
              </TooltipContent>
            </Tooltip>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
          <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
              <DialogTitle className="text-sm font-medium flex items-center gap-2">
                {FormatIcon && <FormatIcon className="size-4" />}
                Exporter en {formatConfig?.label}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 px-5 pt-4 pb-0">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {hasSelection ? (
                  <>
                    <span className="font-medium text-foreground">
                      {invoicesToExport.length} facture
                      {invoicesToExport.length > 1 ? "s" : ""}
                    </span>{" "}
                    sélectionnée{invoicesToExport.length > 1 ? "s" : ""} sera
                    {invoicesToExport.length > 1 ? "ont" : ""} exportée
                    {invoicesToExport.length > 1 ? "s" : ""}.
                  </>
                ) : (
                  formatConfig?.description
                )}
              </p>

              {/* Date range picker - uniquement si pas de sélection */}
              {!hasSelection && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Période
                  </label>
                  <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                    popoverClassName="z-[101]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {dateRange?.from && dateRange?.to
                      ? "Les factures entre ces dates seront exportées."
                      : "Laissez vide pour exporter toutes les factures."}
                  </p>
                </div>
              )}

              {/* Factures sélectionnées */}
              {hasSelection && invoicesToExport.length > 0 && (
                <div className="rounded-lg bg-muted/40 border border-border/50 p-3">
                  <div className="space-y-1">
                    {invoicesToExport.slice(0, 5).map(
                      (inv) =>
                        inv && (
                          <div
                            key={inv.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <FileText className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {inv._type === "imported"
                                ? inv.originalInvoiceNumber ||
                                  inv.number ||
                                  "Importée"
                                : `${inv.prefix || ""}${inv.number}`}
                            </span>
                            <span className="text-muted-foreground truncate">
                              —{" "}
                              {inv.client?.name ||
                                inv.vendor?.name ||
                                "Client inconnu"}
                            </span>
                          </div>
                        ),
                    )}
                    {invoicesToExport.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-5.5">
                        et {invoicesToExport.length - 5} autre
                        {invoicesToExport.length - 5 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info banner */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                <Info className="size-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Les factures importées sont incluses dans l&apos;export avec
                  la mention &quot;Importée&quot;.
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-border/40 mt-3 px-5 py-3 -mx-5">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-sm"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExport}
                  className="gap-2"
                >
                  <Download className="size-3.5" />
                  Exporter
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
