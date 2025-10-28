"use client";

import { useState, useRef } from "react";
import { Upload, FileText, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { downloadCSVTemplate, downloadExcelTemplate } from "@/src/utils/product-export";
import { parseCSV, parseExcel, validateFile } from "@/src/utils/product-import";
import { useCreateProduct } from "@/src/hooks/useProducts";
import { toast } from "@/src/components/ui/sonner";

export default function ProductImportDialog({ onImportComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);
  
  const { createProduct } = useCreateProduct({ showToast: false });

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Valider le fichier
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setParsedProducts([]);
    setImportResults(null);

    try {
      // Parser le fichier selon son extension
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      let products;

      if (extension === 'csv') {
        products = await parseCSV(selectedFile);
      } else {
        products = await parseExcel(selectedFile);
      }

      setParsedProducts(products);
      toast.success(`Fichier analysé - ${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''} et prêt${products.length > 1 ? 's' : ''} à importer`);
    } catch (error) {
      toast.error(error.message);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;

    setIsProcessing(true);
    const results = {
      success: 0,
      errors: [],
    };

    for (let i = 0; i < parsedProducts.length; i++) {
      const product = parsedProducts[i];
      try {
        const result = await createProduct(product);
        if (result && result.data) {
          results.success++;
        } else {
          results.errors.push(`${product.name}: Échec de la création`);
        }
      } catch (error) {
        results.errors.push(`${product.name}: ${error.message}`);
      }
    }

    setImportResults(results);
    setIsProcessing(false);

    if (results.success > 0) {
      toast.success(`Import terminé - ${results.success} produit${results.success > 1 ? 's' : ''} importé${results.success > 1 ? 's' : ''} avec succès`);
      
      // Appeler le callback pour rafraîchir la liste
      if (onImportComplete) {
        onImportComplete();
      }
    }

    if (results.errors.length > 0) {
      toast.error(`Erreurs d'import - ${results.errors.length} produit${results.errors.length > 1 ? 's' : ''} ${results.errors.length > 1 ? "n'ont" : "n'a"} pas pu être importé${results.errors.length > 1 ? 's' : ''}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedProducts([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    setIsOpen(false);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      handleReset();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-normal">
          <Upload className="mr-2 h-4 w-4" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[600px] max-h-[90vh] flex flex-col p-0 sm:max-w-[600px]">
        <div className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>Importer des produits</DialogTitle>
            <DialogDescription>
              Importez vos produits depuis un fichier CSV ou Excel.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Téléchargement des modèles */}
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Téléchargez le modèle</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSVTemplate}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Modèle CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcelTemplate}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Modèle Excel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le modèle contient des exemples pour vous guider.
            </p>
          </div>

          {/* Upload du fichier */}
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Importez votre fichier</p>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {file ? file.name : "Cliquez pour sélectionner un fichier"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV ou Excel (max 5MB)
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* État du parsing */}
          {isProcessing && !importResults && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Analyse du fichier en cours...
              </AlertDescription>
            </Alert>
          )}

          {/* Produits parsés */}
          {parsedProducts.length > 0 && !importResults && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>{parsedProducts.length} produit{parsedProducts.length > 1 ? 's' : ''}</strong> prêt{parsedProducts.length > 1 ? 's' : ''} à être importé{parsedProducts.length > 1 ? 's' : ''}
                <ul className="mt-2 text-xs space-y-1">
                  {parsedProducts.slice(0, 3).map((p, i) => (
                    <li key={i}>• {p.name} - {p.unitPrice}€ HT</li>
                  ))}
                  {parsedProducts.length > 3 && (
                    <li className="italic">... et {parsedProducts.length - 3} autre{parsedProducts.length - 3 > 1 ? 's' : ''}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Résultats de l'import */}
          {importResults && (
            <div className="space-y-2">
              {importResults.success > 0 && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    <strong>{importResults.success} produit{importResults.success > 1 ? 's' : ''}</strong> importé{importResults.success > 1 ? 's' : ''} avec succès
                  </AlertDescription>
                </Alert>
              )}
              
              {importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{importResults.errors.length} erreur(s) :</strong>
                    <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">📋 Instructions</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Les colonnes <strong>Nom</strong>, <strong>Prix unitaire HT</strong>, <strong>Taux TVA</strong> et <strong>Unité</strong> sont obligatoires</li>
              <li>• Les autres colonnes sont optionnelles</li>
              <li>• Utilisez le point ou la virgule pour les décimales</li>
              <li>• Le fichier ne doit pas dépasser 5MB</li>
            </ul>
          </div>
        </div>

        <div className="flex-shrink-0 border-t p-6 bg-background">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              {importResults ? "Fermer" : "Annuler"}
            </Button>
            {parsedProducts.length > 0 && !importResults && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Réinitialiser
                </Button>
                <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importer {parsedProducts.length} produit(s)
                  </>
                )}
              </Button>
            </>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
