"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { exportToCSV, exportToExcel } from "@/src/utils/product-export";
import { toast } from "@/src/components/ui/sonner";

export default function ProductExportButton({ products, selectedRows = [] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);

  // Déterminer si on exporte les produits sélectionnés ou tous les produits
  const hasSelection = selectedRows && selectedRows.length > 0;
  
  const productsToExport = hasSelection 
    ? selectedRows.map(row => {
        // TanStack Table peut utiliser row.original OU directement row
        return row.original || row;
      }).filter(Boolean) 
    : (products || []);

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    if (!selectedFormat) return;

    const finalProducts = productsToExport;
    let result;

    if (selectedFormat === "csv") {
      result = exportToCSV(finalProducts);
    } else if (selectedFormat === "excel") {
      result = exportToExcel(finalProducts);
    }

    if (result?.success) {
      toast.success(`Export réussi - ${finalProducts.length} produit${finalProducts.length > 1 ? 's' : ''} exporté${finalProducts.length > 1 ? 's' : ''}`);
      
      // Réinitialiser et fermer
      setIsDialogOpen(false);
      setSelectedFormat(null);
    } else {
      toast.error(result?.error || "Une erreur est survenue lors de l'export");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
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
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuLabel>Format d&apos;export</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFormatSelect("csv")}>
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatSelect("excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Exporter en {selectedFormat === "csv" ? "CSV" : "Excel"}
            </DialogTitle>
            <DialogDescription>
              {hasSelection ? (
                <span className="font-medium text-primary">
                  {productsToExport.length} produit(s) sélectionné(s) sera(ont) exporté(s).
                </span>
              ) : (
                "Tous les produits de votre catalogue seront exportés."
              )}
            </DialogDescription>
          </DialogHeader>
          
          {hasSelection && productsToExport.length > 0 && (
            <div className="py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Produits sélectionnés :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {productsToExport.slice(0, 5).map((product) => product && (
                    <li key={product.id}>
                      • {product.name} {product.reference ? `(${product.reference})` : ""}
                    </li>
                  ))}
                  {productsToExport.length > 5 && (
                    <li className="text-xs italic">
                      ... et {productsToExport.length - 5} autre(s)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {!hasSelection && (
            <div className="py-4">
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Astuce :</strong> Vous pouvez sélectionner des produits spécifiques dans le tableau avant d&apos;exporter.
                </p>
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
