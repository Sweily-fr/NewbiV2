"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Progress } from "@/src/components/ui/progress";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  IMPORT_QUOTE_DIRECT,
  GET_IMPORTED_QUOTES,
  GET_IMPORTED_QUOTE_STATS,
} from "@/src/graphql/importedQuoteQueries";
import { GET_USER_OCR_QUOTA } from "@/src/graphql/importedInvoiceQueries";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const PHASE = {
  SELECT: "select",
  UPLOADING: "uploading",
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportQuoteModal({ open, onOpenChange }) {
  const { workspaceId } = useRequiredWorkspace();
  const [files, setFiles] = useState([]);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [importQuoteDirect] = useMutation(IMPORT_QUOTE_DIRECT, {
    refetchQueries: [
      { query: GET_IMPORTED_QUOTES, variables: { workspaceId, page: 1, limit: 1000 } },
      { query: GET_IMPORTED_QUOTE_STATS, variables: { workspaceId } },
      { query: GET_USER_OCR_QUOTA, variables: { workspaceId } },
    ],
  });

  const addFiles = useCallback(
    (newFiles) => {
      const validFiles = newFiles.filter((file) => {
        if (file.type !== "application/pdf") {
          toast.error(`${file.name}: Seuls les fichiers PDF sont acceptés`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: Fichier trop volumineux (max 10MB)`);
          return false;
        }
        return true;
      });

      setFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > MAX_FILES) {
          toast.error(`Maximum ${MAX_FILES} fichiers`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    },
    []
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  const handleImport = async () => {
    if (files.length === 0) return;

    setPhase(PHASE.UPLOADING);
    setUploadProgress(0);
    setUploadedCount(0);
    setUploadStatus({});

    let completed = 0;
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadStatus((prev) => ({ ...prev, [i]: "uploading" }));

      try {
        const result = await importQuoteDirect({
          variables: {
            file: files[i],
            workspaceId,
          },
        });

        if (result.data?.importQuoteDirect?.success) {
          setUploadStatus((prev) => ({ ...prev, [i]: "uploaded" }));
          successCount++;
        } else {
          setUploadStatus((prev) => ({ ...prev, [i]: "error" }));
          toast.error(
            `${files[i].name}: ${result.data?.importQuoteDirect?.error || "Erreur"}`
          );
        }
      } catch (error) {
        setUploadStatus((prev) => ({ ...prev, [i]: "error" }));
        toast.error(`${files[i].name}: ${error.message}`);
      }

      completed++;
      setUploadedCount(completed);
      setUploadProgress(Math.round((completed / files.length) * 100));
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} devis importé(s) avec succès`
      );
    }

    // Fermer automatiquement après un court délai
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setFiles([]);
    setPhase(PHASE.SELECT);
    setUploadProgress(0);
    setUploadedCount(0);
    setUploadStatus({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={phase === PHASE.UPLOADING ? undefined : handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importer des devis</DialogTitle>
          <DialogDescription>
            Importez vos devis PDF. L'OCR extraira automatiquement les
            informations.
          </DialogDescription>
        </DialogHeader>

        {/* Phase: Sélection des fichiers */}
        {phase === PHASE.SELECT && (
          <div className="space-y-4 overflow-hidden">
            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
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
              <Upload
                className="h-6 w-6 mx-auto mb-3"
                style={{ color: "#5b50FF" }}
              />
              <p className="text-sm font-medium">
                Glissez vos PDF ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum {MAX_FILES} fichiers, 10MB par fichier
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {files.length} fichier(s) sélectionné(s)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles([])}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Tout supprimer
                  </Button>
                </div>
                <ScrollArea className="h-[200px] rounded-md border overflow-hidden">
                  <div className="p-2 space-y-1 overflow-hidden">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group overflow-hidden"
                      >
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div
                          className="flex-1 min-w-0 overflow-hidden cursor-default"
                          title={file.name}
                        >
                          <p className="text-sm truncate max-w-full">
                            {file.name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleImport} disabled={files.length === 0}>
                Importer {files.length > 0 && `${files.length} devis`}
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Upload en cours */}
        {phase === PHASE.UPLOADING && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-muted flex items-center justify-center">
                  <Upload
                    className="h-7 w-7 animate-pulse"
                    style={{ color: "#5b50FF" }}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-t-transparent animate-spin"
                  style={{
                    animationDuration: "1s",
                    borderWidth: "4px",
                    borderStyle: "solid",
                    borderColor: "#5b50FF",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
              <div className="text-center">
                <p className="font-medium">Upload en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadedCount} / {files.length} fichiers
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress}%
              </p>
            </div>

            <ScrollArea className="h-[120px] rounded-md border overflow-hidden">
              <div className="p-2 space-y-1 overflow-hidden">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 px-2 py-1 text-sm overflow-hidden"
                  >
                    {uploadStatus[index] === "uploading" && (
                      <Loader2
                        className="h-3 w-3 animate-spin flex-shrink-0"
                        style={{ color: "#5b50FF" }}
                      />
                    )}
                    {uploadStatus[index] === "uploaded" && (
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    )}
                    {uploadStatus[index] === "error" && (
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                    {!uploadStatus[index] && (
                      <div className="h-3 w-3 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span
                      className="truncate text-muted-foreground flex-1 min-w-0"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <p className="text-xs text-center text-muted-foreground">
              Le modal se fermera automatiquement après l'upload
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
