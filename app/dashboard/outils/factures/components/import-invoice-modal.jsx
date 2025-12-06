"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useMutation } from "@apollo/client";
import { UPLOAD_DOCUMENT } from "@/src/graphql/mutations/documentUpload";
import { BATCH_IMPORT_INVOICES, GET_IMPORTED_INVOICES } from "@/src/graphql/importedInvoiceQueries";
import { toast } from "sonner";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Phases d'import
const PHASE = {
  SELECT: "select",
  UPLOADING: "uploading",
  SCANNING: "scanning",
  RESULTS: "results",
};

export function ImportInvoiceModal({ open, onOpenChange, onImportSuccess }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef(null);

  // Animation bounce lors du changement de phase
  useEffect(() => {
    if (phase === PHASE.UPLOADING || phase === PHASE.SCANNING || phase === PHASE.RESULTS) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const isImporting = phase === PHASE.UPLOADING || phase === PHASE.SCANNING;

  const { workspaceId } = useRequiredWorkspace();
  const [uploadDocument] = useMutation(UPLOAD_DOCUMENT);
  const [batchImport] = useMutation(BATCH_IMPORT_INVOICES, {
    refetchQueries: [{ query: GET_IMPORTED_INVOICES, variables: { workspaceId } }],
  });

  const handleClose = () => {
    if (!isImporting) {
      setFiles([]);
      setUploadStatus({});
      setPhase(PHASE.SELECT);
      setUploadProgress(0);
      setImportResults(null);
      onOpenChange(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

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

  const handleImport = async () => {
    if (files.length === 0 || !workspaceId) return;

    setPhase(PHASE.UPLOADING);
    setUploadProgress(0);
    const uploadedData = [];

    // Upload files to Cloudflare
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus((prev) => ({ ...prev, [i]: "uploading" }));

      try {
        const { data } = await uploadDocument({
          variables: { file, folderType: "importedInvoice" },
        });

        if (data?.uploadDocument?.success) {
          uploadedData.push({
            cloudflareUrl: data.uploadDocument.url,
            cloudflareKey: data.uploadDocument.key,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          });
          setUploadStatus((prev) => ({ ...prev, [i]: "uploaded" }));
        } else {
          setUploadStatus((prev) => ({ ...prev, [i]: "error" }));
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus((prev) => ({ ...prev, [i]: "error" }));
      }
      
      // Update progress
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    // Process with OCR
    if (uploadedData.length > 0) {
      setPhase(PHASE.SCANNING);
      
      try {
        const { data } = await batchImport({
          variables: { workspaceId, files: uploadedData },
        });

        setImportResults(data?.batchImportInvoices);
        setPhase(PHASE.RESULTS);
        
        if (data?.batchImportInvoices?.successCount > 0) {
          toast.success(`${data.batchImportInvoices.successCount} facture(s) importée(s)`);
          onImportSuccess?.();
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Erreur lors de l'import");
        setPhase(PHASE.SELECT);
      }
    } else {
      setPhase(PHASE.SELECT);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calcul du nombre de fichiers uploadés
  const uploadedCount = Object.values(uploadStatus).filter(s => s === "uploaded").length;
  const errorCount = Object.values(uploadStatus).filter(s => s === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        {/* Animation keyframes */}
        <style jsx global>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
            70% {
              transform: scale(0.9);
              opacity: 0.9;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
        
        <DialogHeader>
          <DialogTitle>Importer des factures</DialogTitle>
          <DialogDescription>
            Importez vos factures PDF pour extraction automatique des données
          </DialogDescription>
        </DialogHeader>

        {/* Phase: Sélection des fichiers */}
        {phase === PHASE.SELECT && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
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
              <Upload className="h-6 w-6 mx-auto mb-3" style={{ color: '#5b50FF' }} />
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
                  <p className="text-sm font-medium">{files.length} fichier(s) sélectionné(s)</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFiles([])}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Tout supprimer
                  </Button>
                </div>
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group"
                      >
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{file.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
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
                Importer {files.length > 0 && `${files.length} facture(s)`}
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Upload en cours */}
        {phase === PHASE.UPLOADING && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div 
                className={cn(
                  "relative transition-transform duration-500 ease-out",
                  isAnimating && "animate-[bounce-in_0.5s_ease-out]"
                )}
                style={{
                  animation: isAnimating ? 'bounce-in 0.5s ease-out' : undefined
                }}
              >
                <div className="h-16 w-16 rounded-full border-4 border-muted flex items-center justify-center">
                  <Upload className="h-7 w-7 animate-pulse" style={{ color: '#5b50FF' }} />
                </div>
                <div 
                  className="absolute inset-0 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '1s', borderWidth: '4px', borderStyle: 'solid', borderColor: '#5b50FF', borderTopColor: 'transparent' }}
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
              <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
            </div>

            {/* Liste compacte des fichiers en cours */}
            <ScrollArea className="h-[120px] rounded-md border">
              <div className="p-2 space-y-1">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 px-2 py-1 text-sm"
                  >
                    {uploadStatus[index] === "uploading" && (
                      <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" style={{ color: '#5b50FF' }} />
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
                    <span className="truncate text-muted-foreground">{file.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Phase: Scan OCR en cours */}
        {phase === PHASE.SCANNING && (
          <div className="py-12 flex flex-col items-center gap-6">
            <div 
              className="relative"
              style={{
                animation: isAnimating ? 'bounce-in 0.5s ease-out' : undefined
              }}
            >
              <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(91, 80, 255, 0.1)' }}>
                <ScanSearch className="h-8 w-8" style={{ color: '#5b50FF' }} />
              </div>
              <div 
                className="absolute inset-0 rounded-full animate-spin"
                style={{ animationDuration: '1.5s', borderWidth: '4px', borderStyle: 'solid', borderColor: 'rgba(91, 80, 255, 0.3)', borderTopColor: '#5b50FF' }}
              />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-lg">Analyse des documents...</p>
              <p className="text-sm text-muted-foreground">
                Extraction des données en cours
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadedCount} document(s) à analyser
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cela peut prendre quelques instants...</span>
            </div>
          </div>
        )}

        {/* Phase: Résultats */}
        {phase === PHASE.RESULTS && importResults && (
          <div className="space-y-4 mt-3">
            {/* Icône de validation avec animation bounce */}
            <div className="flex justify-center">
              <div 
                className="relative"
                style={{
                  animation: isAnimating ? 'bounce-in 0.5s ease-out' : undefined
                }}
              >
                <div 
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(91, 80, 255, 0.1)' }}
                >
                  <Check className="h-8 w-8" style={{ color: '#5b50FF' }} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pb-6 rounded-lg">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold" style={{ color: '#5b50FF' }}>{importResults.successCount}</p>
                <p className="text-xs" style={{ color: '#5b50FF' }}>Factures importée(s)</p>
              </div>
              {importResults.errorCount > 0 && (
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-red-600">{importResults.errorCount}</p>
                  <p className="text-xs text-muted-foreground">Erreur(s)</p>
                </div>
              )}
            </div>

            {importResults.errors?.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Détails des erreurs:</p>
                <ScrollArea className="max-h-[100px]">
                  {importResults.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                  ))}
                </ScrollArea>
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
