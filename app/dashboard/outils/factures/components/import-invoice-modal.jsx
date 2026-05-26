"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Upload, FileText, X, LoaderCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useMutation, useApolloClient } from "@apollo/client";
import {
  IMPORT_INVOICE_DIRECT,
  GET_IMPORTED_INVOICES,
} from "@/src/graphql/importedInvoiceQueries";
import { toast } from "sonner";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImportInvoiceModal({ open, onOpenChange, onImportSuccess }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { workspaceId } = useRequiredWorkspace();
  const client = useApolloClient();
  const [importInvoiceDirect] = useMutation(IMPORT_INVOICE_DIRECT);

  const handleClose = () => {
    setFiles([]);
    onOpenChange(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name}: PDF uniquement`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Max 10MB`);
        return false;
      }
      return !files.some((f) => f.name === file.name);
    });

    if (files.length + validFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} fichiers`);
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleImport = async () => {
    if (files.length === 0 || !workspaceId) return;

    const totalFiles = files.length;
    const filesToProcess = [...files];

    // Fermer le modal immédiatement
    setFiles([]);
    onOpenChange(false);

    let processedCount = 0;
    let successCount = 0;

    const PARALLEL_STREAMS = 5;
    const DELAY_BETWEEN_STARTS = 300;
    const estimatedSecondsPerFile = 8;
    const estimatedTotalSeconds = Math.ceil(
      (totalFiles / PARALLEL_STREAMS) * estimatedSecondsPerFile,
    );
    const startTime = Date.now();

    const formatInitialEstimate = () => {
      if (estimatedTotalSeconds < 60) return `~${estimatedTotalSeconds}s`;
      const mins = Math.floor(estimatedTotalSeconds / 60);
      const secs = estimatedTotalSeconds % 60;
      return `~${mins}min ${secs}s`;
    };

    const toastId = toast.loading(
      `Import de ${totalFiles} facture(s) • Durée estimée: ${formatInitialEstimate()}`,
      { duration: Infinity },
    );

    const formatTimeRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const avgSecondsPerFile =
        processedCount > 0
          ? elapsedSeconds / processedCount
          : estimatedSecondsPerFile;
      const remainingFiles = totalFiles - processedCount;
      const remainingSeconds = Math.ceil(
        (remainingFiles * avgSecondsPerFile) / PARALLEL_STREAMS,
      );

      if (remainingSeconds < 60) return `~${remainingSeconds}s restantes`;
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      return `~${mins}min ${secs}s restantes`;
    };

    const updateToast = () => {
      toast.loading(
        `Import: ${processedCount}/${totalFiles} traité(s) • ${formatTimeRemaining()}`,
        { id: toastId, duration: Infinity },
      );
    };

    const processFile = async (file) => {
      try {
        const { data: importData, errors } = await importInvoiceDirect({
          variables: { file, workspaceId },
        });

        if (errors?.length) {
          console.error(`Erreur GraphQL pour ${file.name}:`, errors[0].message);
        }

        const payload = importData?.importInvoiceDirect;
        if (payload?.success) {
          successCount++;
        } else if (payload?.error) {
          console.error(`Import échoué pour ${file.name}:`, payload.error);
        }
      } catch (error) {
        console.error(`Erreur réseau pour ${file.name}:`, error.message);
      } finally {
        processedCount++;
        updateToast();
      }
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const processAllFiles = async () => {
      const queue = [...filesToProcess];
      const activePromises = new Set();
      let lastStartTime = 0;

      while (queue.length > 0 || activePromises.size > 0) {
        while (queue.length > 0 && activePromises.size < PARALLEL_STREAMS) {
          const now = Date.now();
          const timeSinceLastStart = now - lastStartTime;
          if (timeSinceLastStart < DELAY_BETWEEN_STARTS && lastStartTime > 0) {
            await delay(DELAY_BETWEEN_STARTS - timeSinceLastStart);
          }

          const file = queue.shift();
          lastStartTime = Date.now();

          const promise = processFile(file).finally(() => {
            activePromises.delete(promise);
          });
          activePromises.add(promise);
        }

        if (activePromises.size > 0) {
          await Promise.race(activePromises);
        }
      }
    };

    try {
      await processAllFiles();

      toast.dismiss(toastId);

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const elapsedSecondsRemainder = elapsedSeconds % 60;
      const timeDisplay =
        elapsedMinutes > 0
          ? `${elapsedMinutes}min ${elapsedSecondsRemainder}s`
          : `${elapsedSeconds}s`;

      if (successCount > 0) {
        toast.success(
          `${successCount} facture(s) importée(s) en ${timeDisplay} !`,
          { duration: 5000 },
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.dismiss(toastId);
      toast.error("Erreur lors de l'import des factures");
    } finally {
      try {
        await client.refetchQueries({ include: [GET_IMPORTED_INVOICES] });
      } catch (e) {
        console.warn("refetchQueries échoué:", e.message);
      }
      onImportSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-1 gap-0 top-[40%] border-0 bg-[#efefef] dark:bg-[#1a1a1a] overflow-hidden rounded-2xl">
        <div className="bg-background rounded-xl overflow-hidden ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="size-4" />
              Importer des factures
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 pt-4 pb-0">
            {/* Drop zone */}
            <div
              className={cn(
                "border border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-[#5b4fff] bg-[#5b4fff]/5"
                  : "border-border hover:border-muted-foreground/50",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="size-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <Upload className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Glissez vos PDF ici</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ou cliquez pour sélectionner • max {MAX_FILES} fichiers,
                    10MB
                  </p>
                </div>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {files.length} fichier{files.length > 1 ? "s" : ""}{" "}
                    sélectionné{files.length > 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tout retirer
                  </button>
                </div>
                <ScrollArea className="max-h-[180px] rounded-lg border border-border/50 overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-muted/50 group"
                      >
                        <FileText className="size-3.5 text-red-500 shrink-0" />
                        <span
                          className="flex-1 min-w-0 text-sm truncate"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="shrink-0 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end border-t border-border/40 mt-3 px-5 py-3 -mx-5">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={files.length === 0}
                className="gap-2"
              >
                {files.length === 0 ? (
                  "Importer"
                ) : (
                  <>
                    Importer {files.length} facture{files.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
