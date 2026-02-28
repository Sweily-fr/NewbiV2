"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { toast } from "@/src/components/ui/sonner";
import { ArrowLeft, ArrowRight, Loader2, Upload, CheckCircle2, XCircle, Download } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { CREATE_PRODUCT } from "@/src/graphql/mutations/products";
import { useProductCustomFields, useCreateProductCustomField } from "@/src/hooks/useProductCustomFields";
import {
  parseCSVRaw,
  parseExcelRaw,
  autoDetectProductMapping,
  transformRowToProduct,
  validateProductRow,
  downloadProductErrorsCSV,
} from "@/src/utils/product-import-v2";

import ImportStepUpload from "./import-steps/import-step-upload";
import ImportStepMapping from "./import-steps/import-step-mapping";

const STEPS = [
  { key: "upload", label: "Fichier", number: 1 },
  { key: "mapping", label: "Mapping", number: 2 },
];

const BATCH_SIZE = 10;

export default function ProductImportDialog({ open, onOpenChange }) {
  const { workspaceId } = useWorkspace();
  const apolloClient = useApolloClient();
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const { fields: allCustomFields } = useProductCustomFields(workspaceId);
  const existingCustomFields = useMemo(() => allCustomFields.filter(f => f.isActive), [allCustomFields]);
  const { createField } = useCreateProductCustomField();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({});
  const [customFieldMappings, setCustomFieldMappings] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState({ successCount: 0, errors: [] });

  // Transformed products
  const transformedProducts = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.rows.map((row) =>
      transformRowToProduct(row, parsedData.headers, mapping, customFieldMappings)
    );
  }, [parsedData, mapping, customFieldMappings]);

  // How many valid rows
  const importableCount = useMemo(() => {
    return transformedProducts.filter((product, idx) => {
      return validateProductRow(product, idx).valid;
    }).length;
  }, [transformedProducts]);

  const importFinished = !isImporting && (importResults.successCount > 0 || importResults.errors.length > 0);

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentStep(0);
    setFile(null);
    setParsing(false);
    setParsedData(null);
    setMapping({});
    setCustomFieldMappings([]);
    setIsImporting(false);
    setImportResults({ successCount: 0, errors: [] });
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) return;
    onOpenChange(false);
    setTimeout(resetState, 300);
  }, [isImporting, onOpenChange, resetState]);

  // ── Step handlers ──

  const handleFileSelected = useCallback((f) => {
    setFile(f);
  }, []);

  const handleFileRemoved = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setMapping({});
    setCustomFieldMappings([]);
  }, []);

  const handleCreateCustomField = useCallback(async (formData) => {
    if (!workspaceId) return null;
    return await createField(workspaceId, formData);
  }, [workspaceId, createField]);

  const handleParseAndGoToMapping = useCallback(async () => {
    if (!file) return;
    setParsing(true);
    try {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      let data;
      if (ext === ".csv") {
        data = await parseCSVRaw(file);
      } else {
        data = await parseExcelRaw(file);
      }

      // Filter out completely empty rows
      data.rows = data.rows.filter((row) => row.some((cell) => cell.trim() !== ""));

      if (data.rows.length === 0) {
        toast.error("Le fichier ne contient aucune ligne de données.");
        setParsing(false);
        return;
      }

      if (data.rows.length > 500) {
        toast.warning(
          `Le fichier contient ${data.rows.length} lignes. L'import sera effectué par lots de ${BATCH_SIZE}.`
        );
      }

      setParsedData(data);
      const autoMapping = autoDetectProductMapping(data.headers);
      setMapping(autoMapping);
      setCurrentStep(1);
    } catch (err) {
      toast.error(err.message || "Erreur lors de la lecture du fichier.");
    } finally {
      setParsing(false);
    }
  }, [file]);

  const handleStartImport = useCallback(async () => {
    if (!parsedData || !workspaceId) return;

    // Check required fields are mapped
    if (mapping.name === null || mapping.name === undefined) {
      toast.error('Le champ "Nom" doit être mappé.');
      return;
    }

    setIsImporting(true);
    setImportResults({ successCount: 0, errors: [] });

    const productsToImport = transformedProducts
      .map((product, idx) => ({ product, idx }))
      .filter(({ product, idx }) => validateProductRow(product, idx).valid);

    let successCount = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
      const batch = productsToImport.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(({ product, idx }) =>
          createProduct({
            variables: {
              input: {
                ...product,
                workspaceId,
              },
            },
          }).then(() => ({ idx }))
        )
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const rowIdx = batch[j].idx;
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          const message = result.reason?.message || "Erreur inconnue";
          errors.push({ row: rowIdx + 1, message });
        }
      }

      setImportResults({ successCount, errors: [...errors] });
    }

    setIsImporting(false);

    if (successCount > 0) {
      try {
        await apolloClient.refetchQueries({
          include: ["GetProducts"],
        });
      } catch {
        // Ignore refetch errors
      }
      toast.success(`${successCount} produit${successCount > 1 ? "s" : ""} importé${successCount > 1 ? "s" : ""}`);
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} erreur${errors.length > 1 ? "s" : ""} lors de l'import`);
    }
  }, [parsedData, workspaceId, transformedProducts, mapping, createProduct, apolloClient]);

  // ── Navigation ──

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!file;
      case 1:
        return mapping.name !== null && mapping.name !== undefined && importableCount > 0;
      default:
        return false;
    }
  }, [currentStep, file, mapping, importableCount]);

  const handleNext = useCallback(() => {
    switch (currentStep) {
      case 0:
        handleParseAndGoToMapping();
        break;
      case 1:
        handleStartImport();
        break;
    }
  }, [currentStep, handleParseAndGoToMapping, handleStartImport]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0 && !isImporting && !importFinished) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, isImporting, importFinished]);

  const step = STEPS[currentStep];
  const progressValue = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[56rem] h-[80vh] flex flex-col p-0 gap-0"
        showCloseButton={!isImporting}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-base">Importer des produits</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {step.label} — Étape {step.number} sur {STEPS.length}
            </DialogDescription>
          </DialogHeader>
          <Progress value={progressValue} className="h-1 mt-4" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {currentStep === 0 && (
            <ImportStepUpload
              file={file}
              onFileSelected={handleFileSelected}
              onFileRemoved={handleFileRemoved}
            />
          )}
          {currentStep === 1 && parsedData && !isImporting && !importFinished && (
            <ImportStepMapping
              headers={parsedData.headers}
              firstRow={parsedData.rows[0]}
              mapping={mapping}
              onMappingChange={setMapping}
              customFieldMappings={customFieldMappings}
              onCustomFieldMappingsChange={setCustomFieldMappings}
              onCreateCustomField={handleCreateCustomField}
              existingCustomFields={existingCustomFields}
            />
          )}

          {/* Import progress */}
          {currentStep === 1 && isImporting && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center space-y-2 w-full max-w-md">
                <p className="text-sm font-medium">
                  Import en cours... {importResults.successCount + importResults.errors.length} / {importableCount}
                </p>
                <Progress
                  value={importableCount > 0 ? Math.round(((importResults.successCount + importResults.errors.length) / importableCount) * 100) : 0}
                  className="h-2"
                />
              </div>
            </div>
          )}

          {/* Import results */}
          {currentStep === 1 && importFinished && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {importResults.successCount} produit{importResults.successCount > 1 ? "s" : ""} importé{importResults.successCount > 1 ? "s" : ""} avec succès
                  </p>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {importResults.errors.length} erreur{importResults.errors.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="border rounded-lg max-h-[200px] overflow-auto">
                      <div className="divide-y">
                        {importResults.errors.map((err, idx) => (
                          <div key={idx} className="px-4 py-2 text-xs">
                            <span className="font-medium text-red-600 dark:text-red-400">
                              Ligne {err.row}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {err.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadProductErrorsCSV(importResults.errors)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger les erreurs (CSV)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 0 && !isImporting && !importFinished && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isImporting && !importFinished && (
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            )}
            {currentStep === 0 && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext || parsing}
                className="gap-2"
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lecture...
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {currentStep === 1 && !isImporting && !importFinished && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer {importableCount} produit{importableCount > 1 ? "s" : ""}
              </Button>
            )}
            {importFinished && (
              <Button onClick={handleClose}>
                Fermer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
