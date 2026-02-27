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
import { ArrowLeft, ArrowRight, Loader2, Upload } from "lucide-react";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  useClientCustomFields,
  useCreateClientCustomField,
} from "@/src/hooks/useClientCustomFields";
import { CREATE_CLIENT } from "@/src/graphql/mutations/clients";
import {
  parseCSVRaw,
  parseExcelRaw,
  autoDetectMapping,
  transformRowToClient,
  validateClientRow,
} from "@/src/utils/client-import";

import ImportStepUpload from "./import-steps/import-step-upload";
import ImportStepMapping from "./import-steps/import-step-mapping";
import ImportStepPreview from "./import-steps/import-step-preview";
import ImportStepResults from "./import-steps/import-step-results";

const STEPS = [
  { key: "upload", label: "Fichier", number: 1 },
  { key: "mapping", label: "Mapping", number: 2 },
  { key: "preview", label: "Vérification", number: 3 },
  { key: "results", label: "Résultats", number: 4 },
];

const BATCH_SIZE = 10;

export default function ClientImportDialog({ open, onOpenChange }) {
  const { workspaceId } = useWorkspace();
  const { fields: customFields } = useClientCustomFields(workspaceId);
  const { createField } = useCreateClientCustomField();

  const apolloClient = useApolloClient();
  const [createClient] = useMutation(CREATE_CLIENT);

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({});
  const [customFieldMappings, setCustomFieldMappings] = useState([]);
  const [excludedRows, setExcludedRows] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState({ successCount: 0, errors: [] });

  // Transformed clients for preview
  const transformedClients = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.rows.map((row) =>
      transformRowToClient(row, parsedData.headers, mapping, customFieldMappings)
    );
  }, [parsedData, mapping, customFieldMappings]);

  // How many valid, non-excluded rows
  const importableCount = useMemo(() => {
    return transformedClients.filter((client, idx) => {
      if (excludedRows.has(idx)) return false;
      return validateClientRow(client, idx).valid;
    }).length;
  }, [transformedClients, excludedRows]);

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentStep(0);
    setFile(null);
    setParsing(false);
    setParsedData(null);
    setMapping({});
    setCustomFieldMappings([]);
    setExcludedRows(new Set());
    setIsImporting(false);
    setImportResults({ successCount: 0, errors: [] });
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) return; // Prevent closing during import
    onOpenChange(false);
    // Delay reset to avoid visual glitch
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
      const autoMapping = autoDetectMapping(data.headers);
      setMapping(autoMapping);
      setExcludedRows(new Set());
      setCurrentStep(1);
    } catch (err) {
      toast.error(err.message || "Erreur lors de la lecture du fichier.");
    } finally {
      setParsing(false);
    }
  }, [file]);

  const handleGoToPreview = useCallback(() => {
    // Check that 'name' is mapped (required)
    if (mapping.name === null || mapping.name === undefined) {
      toast.error('Le champ "Nom / Raison sociale" doit être mappé.');
      return;
    }
    setCurrentStep(2);
  }, [mapping]);

  const handleStartImport = useCallback(async () => {
    if (!parsedData || !workspaceId) return;
    setCurrentStep(3);
    setIsImporting(true);
    setImportResults({ successCount: 0, errors: [] });

    const clientsToImport = transformedClients
      .map((client, idx) => ({ client, idx }))
      .filter(({ client, idx }) => {
        if (excludedRows.has(idx)) return false;
        return validateClientRow(client, idx).valid;
      });

    let successCount = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < clientsToImport.length; i += BATCH_SIZE) {
      const batch = clientsToImport.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(({ client, idx }) =>
          createClient({
            variables: {
              workspaceId,
              input: client,
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

    // Force refetch all active GET_CLIENTS queries (any variables combo)
    if (successCount > 0) {
      try {
        await apolloClient.refetchQueries({
          include: ["GetClients"],
        });
      } catch {
        // Ignore refetch errors
      }
      toast.success(`${successCount} contact${successCount > 1 ? "s" : ""} importé${successCount > 1 ? "s" : ""}`);
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} erreur${errors.length > 1 ? "s" : ""} lors de l'import`);
    }
  }, [parsedData, workspaceId, transformedClients, excludedRows, createClient, apolloClient]);

  const handleCreateCustomField = useCallback(
    async (name) => {
      const field = await createField(workspaceId, { name, fieldType: "TEXT" });
      return field;
    },
    [createField, workspaceId]
  );

  // ── Navigation ──

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!file;
      case 1:
        return mapping.name !== null && mapping.name !== undefined;
      case 2:
        return importableCount > 0;
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
        handleGoToPreview();
        break;
      case 2:
        handleStartImport();
        break;
    }
  }, [currentStep, handleParseAndGoToMapping, handleGoToPreview, handleStartImport]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0 && currentStep < 3) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

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
            <DialogTitle className="text-base">Importer des contacts</DialogTitle>
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
          {currentStep === 1 && parsedData && (
            <ImportStepMapping
              headers={parsedData.headers}
              firstRow={parsedData.rows[0]}
              mapping={mapping}
              onMappingChange={setMapping}
              customFieldMappings={customFieldMappings}
              onCustomFieldMappingsChange={setCustomFieldMappings}
              onCreateCustomField={handleCreateCustomField}
              existingCustomFields={customFields}
            />
          )}
          {currentStep === 2 && (
            <ImportStepPreview
              transformedClients={transformedClients}
              excludedRows={excludedRows}
              onExcludedRowsChange={setExcludedRows}
              mapping={mapping}
            />
          )}
          {currentStep === 3 && (
            <ImportStepResults
              results={importResults}
              total={
                transformedClients.filter((_, idx) => {
                  if (excludedRows.has(idx)) return false;
                  return validateClientRow(transformedClients[idx], idx).valid;
                }).length
              }
              isImporting={isImporting}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 0 && currentStep < 3 && (
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
            {currentStep < 3 && (
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
            )}
            {currentStep < 2 && (
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
            {currentStep === 2 && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer {importableCount} contact{importableCount > 1 ? "s" : ""}
              </Button>
            )}
            {currentStep === 3 && !isImporting && (
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
