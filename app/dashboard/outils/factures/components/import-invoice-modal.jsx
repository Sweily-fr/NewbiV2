"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useMutation } from "@apollo/client";
import { UPLOAD_DOCUMENT } from "@/src/graphql/mutations/documentUpload";
import { IMPORT_INVOICE, GET_IMPORTED_INVOICES } from "@/src/graphql/importedInvoiceQueries";
import { toast } from "sonner";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Phases d'import simplifiées pour UX instantanée
const PHASE = {
  SELECT: "select",
  UPLOADING: "uploading",
};

export function ImportInvoiceModal({ open, onOpenChange, onImportSuccess }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const isImporting = phase === PHASE.UPLOADING;

  const { workspaceId } = useRequiredWorkspace();
  const [uploadDocument] = useMutation(UPLOAD_DOCUMENT);
  const [importInvoice] = useMutation(IMPORT_INVOICE);

  const handleClose = () => {
    if (!isImporting) {
      setFiles([]);
      setUploadStatus({});
      setPhase(PHASE.SELECT);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  // Ferme le modal et reset l'état
  const closeAndReset = () => {
    setFiles([]);
    setUploadStatus({});
    setPhase(PHASE.SELECT);
    setUploadProgress(0);
    onOpenChange(false);
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

  /**
   * Import parallélisé : Upload + OCR lancés simultanément
   * 
   * Architecture:
   * - PARALLEL_UPLOADS: Nombre d'uploads simultanés vers Cloudflare
   * - PARALLEL_OCR: Nombre de traitements OCR simultanés
   * - Dès qu'un upload termine, son OCR démarre immédiatement
   */
  const handleImport = async () => {
    if (files.length === 0 || !workspaceId) return;

    setPhase(PHASE.UPLOADING);
    setUploadProgress(0);
    
    // Fermer le modal immédiatement pour UX instantanée
    const totalFiles = files.length;
    const filesToProcess = [...files];
    closeAndReset();

    // Compteurs de progression
    let processedCount = 0;
    let successCount = 0;

    // Configuration parallélisation - RÉDUIT pour éviter rate limiting Mistral
    const PARALLEL_STREAMS = 3; // 3 streams max pour respecter les limites API Mistral
    const DELAY_BETWEEN_STARTS = 2000; // 2s entre chaque nouveau stream

    // Estimation du temps (~15s par facture avec 3 streams parallèles)
    const estimatedSecondsPerFile = 15;
    const estimatedTotalSeconds = Math.ceil((totalFiles / PARALLEL_STREAMS) * estimatedSecondsPerFile);
    const startTime = Date.now();

    // Formater l'estimation initiale
    const formatInitialEstimate = () => {
      if (estimatedTotalSeconds < 60) {
        return `~${estimatedTotalSeconds}s`;
      }
      const mins = Math.floor(estimatedTotalSeconds / 60);
      const secs = estimatedTotalSeconds % 60;
      return `~${mins}min ${secs}s`;
    };

    // Toast de progression global avec estimation initiale
    const toastId = toast.loading(
      `Import de ${totalFiles} facture(s) • Durée estimée: ${formatInitialEstimate()}`,
      { duration: Infinity }
    );

    // Fonction pour formater le temps restant
    const formatTimeRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const avgSecondsPerFile = processedCount > 0 ? elapsedSeconds / processedCount : estimatedSecondsPerFile;
      const remainingFiles = totalFiles - processedCount;
      const remainingSeconds = Math.ceil(remainingFiles * avgSecondsPerFile / PARALLEL_STREAMS);
      
      if (remainingSeconds < 60) {
        return `~${remainingSeconds}s restantes`;
      }
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      return `~${mins}min ${secs}s restantes`;
    };

    // Fonction pour mettre à jour le toast
    const updateToast = () => {
      const timeRemaining = formatTimeRemaining();
      toast.loading(
        `Import: ${processedCount}/${totalFiles} traité(s) • ${timeRemaining}`,
        { id: toastId, duration: Infinity }
      );
    };

    // Fonction pour traiter un fichier (upload + OCR)
    const processFile = async (file) => {
      try {
        // Étape 1: Upload vers Cloudflare
        const { data: uploadData } = await uploadDocument({
          variables: { file, folderType: "importedInvoice" },
        });

        if (!uploadData?.uploadDocument?.success) {
          throw new Error("Upload échoué");
        }

        // Étape 2: Lancer immédiatement le traitement OCR
        const { data: importData } = await importInvoice({
          variables: {
            workspaceId,
            cloudflareUrl: uploadData.uploadDocument.url,
            cloudflareKey: uploadData.uploadDocument.key,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          },
        });

        if (importData?.importInvoice?.success) {
          successCount++;
        }
      } catch (error) {
        // Silencieux - le retry automatique backend gère les erreurs
        console.warn(`Retry en cours pour ${file.name}...`);
      } finally {
        processedCount++;
        updateToast();
      }
    };

    // Helper pour délai
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Traiter tous les fichiers en parallèle avec limite de concurrence et délai
    const processAllFiles = async () => {
      const queue = [...filesToProcess];
      const activePromises = new Set();
      let lastStartTime = 0;

      while (queue.length > 0 || activePromises.size > 0) {
        // Lancer de nouveaux streams tant qu'on n'a pas atteint la limite
        while (queue.length > 0 && activePromises.size < PARALLEL_STREAMS) {
          // Respecter le délai minimum entre les démarrages
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

        // Attendre qu'au moins un stream se termine
        if (activePromises.size > 0) {
          await Promise.race(activePromises);
        }
      }
    };

    try {
      await processAllFiles();

      // Toast final
      toast.dismiss(toastId);
      
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const elapsedSecondsRemainder = elapsedSeconds % 60;
      const timeDisplay = elapsedMinutes > 0 
        ? `${elapsedMinutes}min ${elapsedSecondsRemainder}s`
        : `${elapsedSeconds}s`;
      
      toast.success(
        `${successCount} facture(s) importée(s) en ${timeDisplay} !`,
        { duration: 5000 }
      );

      // Rafraîchir la liste des factures
      onImportSuccess?.();
      
    } catch (error) {
      console.error("Import error:", error);
      toast.dismiss(toastId);
      toast.error("Erreur lors de l'import des factures");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calcul du nombre de fichiers uploadés
  const uploadedCount = Object.values(uploadStatus).filter(s => s === "uploaded").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Importer des factures</DialogTitle>
          <DialogDescription>
            Importez vos factures PDF pour extraction automatique des données
          </DialogDescription>
        </DialogHeader>

        {/* Phase: Sélection des fichiers */}
        {phase === PHASE.SELECT && (
          <div className="space-y-4 overflow-hidden">
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
                <ScrollArea className="h-[200px] rounded-md border overflow-hidden">
                  <TooltipProvider delayDuration={300}>
                    <div className="p-2 space-y-1 overflow-hidden">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group overflow-hidden"
                        >
                          <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 min-w-0 overflow-hidden cursor-default">
                                <p className="text-sm truncate max-w-full">{file.name}</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[400px] break-all">
                              <p>{file.name}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TooltipProvider>
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

        {/* Phase: Upload en cours (rapide, puis fermeture automatique) */}
        {phase === PHASE.UPLOADING && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
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
            <ScrollArea className="h-[120px] rounded-md border overflow-hidden">
              <div className="p-2 space-y-1 overflow-hidden">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 px-2 py-1 text-sm overflow-hidden"
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
                    <span className="truncate text-muted-foreground flex-1 min-w-0" title={file.name}>{file.name}</span>
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
